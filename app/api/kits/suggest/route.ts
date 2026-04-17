import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateSuggestions } from "@/lib/anthropic/index";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      category?: string;
      checklist_data?: Record<string, unknown>;
      kit_id?: string;
    };

    const { category, checklist_data, kit_id } = body;

    if (!category || !["game", "mobile", "web"].includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const start = Date.now();
    const result = await generateSuggestions(
      category,
      checklist_data ?? {}
    );
    const { questions, inputTokens, outputTokens, promptTemplateId } = result;
    console.log("Suggestion result:", { inputTokens, outputTokens, questionsCount: questions.length });
    const duration = Date.now() - start;

    // Log suggestion call if kit_id provided
    if (kit_id) {
      try {
        const adminSupabase = getAdminClient();
        await adminSupabase.from("generation_logs").insert({
          kit_id,
          step: "suggestion",
          model_used: "claude-sonnet-4-6",
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          duration_ms: duration,
          status: "success",
          error_message: null,
          prompt_template_id: promptTemplateId ?? null,
        });
      } catch {
        // ignore logging errors
      }
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error("POST /api/kits/suggest error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions." },
      { status: 500 }
    );
  }
}