import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runGenerationEngine } from "@/lib/anthropic/generation-engine";
import type { GenerationContext } from "@/lib/anthropic";
import type { Database } from "@/lib/supabase/types";


type Kit = Database["public"]["Tables"]["kits"]["Row"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check email verification
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email first." },
        { status: 403 }
      );
    }

    // Fetch kit
    const { data: kitData } = await supabase
      .from("kits")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    const kit = kitData as Kit | null;

    if (!kit) {
      return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    // Prevent double generation — SEC-03
    if (kit.status === "generating" || kit.status === "queued") {
      return NextResponse.json(
        { error: "Kit is already generating." },
        { status: 409 }
      );
    }

// Consume generation credit — SEC-02
    // Skip credit consumption for retries (failed kits)
    if (kit.status !== "failed") {
      const { data: consumed } = await (supabase as any).rpc(
        "try_consume_generation",
        { p_user_id: user.id }
      );

      if (!consumed) {
        return NextResponse.json(
          { error: "Generation limit reached. Please upgrade your plan." },
          { status: 402 }
        );
      }
    }

// Check if user has upgraded — if so, unlock the demo kit
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = profileData as Database["public"]["Tables"]["profiles"]["Row"] | null;
    const isPaidUser = profile && profile.subscription_tier !== "free";

    // If paid user is generating a demo kit, unlock it
    if (isPaidUser && kit.is_demo) {
      await (supabase as any)
        .from("kits")
        .update({ is_demo: false })
        .eq("id", id);
    }

    const isDemo = isPaidUser ? false : kit.is_demo;

    // Build generation context
    const context: GenerationContext = {
      kitId: id,
      userId: user.id,
      category: kit.category,
      checklistData: kit.checklist_data as Record<string, unknown>,
      isDemo,
    };
    // Mark kit as generating immediately before starting background engine
    await (supabase as any)
      .from("kits")
      .update({ status: "generating", current_step: "Starting...", updated_at: new Date().toISOString() })
      .eq("id", id);

    // Reset revision counts on all existing screens so user gets fresh revisions
    await (supabase as any)
      .from("screens")
      .update({ revision_count: 0, revision_notes: null })
      .eq("kit_id", id);

    // Run generation in background — don't await
    // Client polls /api/kits/[id]/status every 3 seconds
    runGenerationEngine(context).catch((error) => {
      console.error("Background generation error:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Generation started.",
      kitId: id,
    });

  } catch (error) {
    console.error("POST /api/kits/[id]/generate error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}