import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type KitInsert = Database["public"]["Tables"]["kits"]["Insert"];

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check email verification
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email before creating kits." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json() as {
      name?: string;
      category?: string;
      input_method?: string;
      checklist_data?: Record<string, unknown>;
      suggestion_tokens?: { input: number; output: number };
    };

    const { name, category, input_method, checklist_data, suggestion_tokens } = body;

    // Validate
    if (!category || !["game", "mobile", "web"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category." },
        { status: 400 }
      );
    }

    if (!input_method || !["upload", "guided"].includes(input_method)) {
      return NextResponse.json(
        { error: "Invalid input method." },
        { status: 400 }
      );
    }

    // Fetch profile to check tier
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = profileData as Profile | null;

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    // Determine if demo
    const is_demo = profile.subscription_tier === "free";

    // Create kit using admin client (bypasses RLS for insert)
    const adminSupabase = await createAdminClient();

    const kitInsert: KitInsert = {
      user_id: user.id,
      name: name || "Untitled UI Kit",
      category: category as "game" | "mobile" | "web",
      input_method: input_method as "upload" | "guided",
      checklist_data: (checklist_data ?? {}) as import("@/lib/supabase/types").Json,
      status: "collecting_input",
      is_demo,
      suggestion_tokens: (suggestion_tokens ?? null) as import("@/lib/supabase/types").Json,
    };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = adminSupabase as any;
    const { data: kit, error: kitError } = await adminDb
      .from("kits")
      .insert(kitInsert)
      .select()
      .single();

    if (kitError) {
      console.error("Kit creation error:", kitError);
      return NextResponse.json(
        { error: "Failed to create kit." },
        { status: 500 }
      );
    }

    return NextResponse.json(kit, { status: 201 });

  } catch (error) {
    console.error("POST /api/kits error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("kits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: kits, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch kits." },
        { status: 500 }
      );
    }

    return NextResponse.json(kits ?? []);

  } catch (error) {
    console.error("GET /api/kits error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}