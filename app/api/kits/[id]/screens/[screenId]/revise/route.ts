import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateScreen } from "@/lib/anthropic/generate-screen";
import { getAnthropicClient } from "@/lib/anthropic";
import type { Database } from "@/lib/supabase/types";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Kit = Database["public"]["Tables"]["kits"]["Row"];
type Screen = Database["public"]["Tables"]["screens"]["Row"];

const MAX_REVISIONS = 2;

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; screenId: string }> }
) {
  try {
    const { id: kitId, screenId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json() as { feedback: string };
    const { feedback } = body;

    if (!feedback || feedback.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide revision feedback." },
        { status: 400 }
      );
    }

    // Fetch kit — verify ownership
    const { data: kitData } = await supabase
      .from("kits")
      .select("*")
      .eq("id", kitId)
      .eq("user_id", user.id)
      .single();

    const kit = kitData as Kit | null;

    if (!kit) {
      return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    // Fetch screen
    const { data: screenData } = await supabase
      .from("screens")
      .select("*")
      .eq("id", screenId)
      .eq("kit_id", kitId)
      .single();

    const screen = screenData as Screen | null;

    if (!screen) {
      return NextResponse.json(
        { error: "Screen not found." },
        { status: 404 }
      );
    }

    // Check revision limit
    if (screen.revision_count >= MAX_REVISIONS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_REVISIONS} revisions reached for this screen.` },
        { status: 402 }
      );
    }

    // Get design system from kit
    const designSystem = kit.design_system as Record<string, unknown>;

    if (!designSystem) {
      return NextResponse.json(
        { error: "Design system not found. Please regenerate the kit." },
        { status: 422 }
      );
    }

    // Build generation context
    const context = {
      kitId,
      category: kit.category as "game" | "mobile" | "web",
      checklistData: kit.checklist_data as Record<string, unknown>,
      isDemo: kit.is_demo,
    };

    // Get screen index from order_index
    const screenIndex = screen.order_index;

    // Get total screens count
    const { data: allScreens } = await supabase
      .from("screens")
      .select("id")
      .eq("kit_id", kitId);

    const totalScreens = allScreens?.length ?? 1;

    // Generate revised screen
    const result = await generateScreen(
      context,
      designSystem as any,
      screen.name,
      screenIndex,
      totalScreens,
      null,
      undefined,
      feedback.trim()
    );

    // Update screen with new HTML and increment revision count
    const adminSupabase = getAdminClient();
    const { data: updatedScreen, error: updateError } = await adminSupabase
      .from("screens")
      .update({
        html_css: result.htmlCss,
        system_prompt: result.systemPrompt,
        user_prompt: result.userPrompt,
        revision_count: screen.revision_count + 1,
        revision_notes: feedback.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", screenId)
      .select()
      .single();

    if (updateError) {
      console.error("Screen update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save revised screen." },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedScreen);

  } catch (error) {
    console.error("POST /revise error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}