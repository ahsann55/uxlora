import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

type PromptInsert = Database["public"]["Tables"]["prompt_templates"]["Insert"];

async function verifyAdmin(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profile = data as { is_admin: boolean } | null;
  if (!profile?.is_admin) return null;

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from("prompt_templates")
      .select("*")
      .order("step", { ascending: true })
      .order("category", { ascending: true })
      .order("version", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("GET /api/admin/prompts error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as PromptInsert;

    if (!body.step || !body.category || !body.system_prompt || !body.user_template) {
      return NextResponse.json(
        { error: "Missing required fields: step, category, system_prompt, user_template" },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Get next version number
    const { data: existing } = await adminSupabase
      .from("prompt_templates")
      .select("version")
      .eq("step", body.step)
      .eq("category", body.category)
      .order("version", { ascending: false })
      .limit(1);

    const existingPrompts = existing as Array<{ version: number }> | null;
    const nextVersion = existingPrompts && existingPrompts.length > 0
      ? (existingPrompts[0].version + 1)
      : 1;

    // Deactivate previous versions
    await (adminSupabase as any)
      .from("prompt_templates")
      .update({ is_active: false })
      .eq("step", body.step)
      .eq("category", body.category);

    // Create new version
    const { data, error } = await (adminSupabase as any)
      .from("prompt_templates")
      .insert({
        ...body,
        version: nextVersion,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/prompts error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}