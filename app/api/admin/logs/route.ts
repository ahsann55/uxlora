import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

    const { data: kitsData } = await adminSupabase
      .from("kits")
      .select("id, name, category, created_at")
      .order("created_at", { ascending: false });

    const kits = (kitsData ?? []) as Array<{
      id: string;
      name: string;
      category: string;
      created_at: string;
    }>;

    const { data: logsData } = await adminSupabase
      .from("generation_logs")
      .select("*")
      .order("created_at", { ascending: true });

    const logs = (logsData ?? []) as Array<{
      id: string;
      kit_id: string;
      step: string;
      model_used: string;
      input_tokens: number;
      output_tokens: number;
      duration_ms: number;
      status: string;
      error_message: string | null;
      created_at: string;
    }>;

    const { data: screensData } = await adminSupabase
      .from("screens")
      .select("id, kit_id, name, system_prompt, user_prompt, order_index");

    const screens = (screensData ?? []) as Array<{
      id: string;
      kit_id: string;
      name: string;
      system_prompt: string | null;
      user_prompt: string | null;
      order_index: number;
    }>;

    const { data: kitsPromptData } = await adminSupabase
      .from("kits")
      .select("id, design_system_prompt, icon_selection_prompt");

    const kitsPromptMap = ((kitsPromptData ?? []) as Array<{
      id: string;
      design_system_prompt: string | null;
      icon_selection_prompt: string | null;
    }>).reduce((acc, k) => {
      acc[k.id] = {
        design: k.design_system_prompt,
        icons: k.icon_selection_prompt,
      };
      return acc;
    }, {} as Record<string, { design: string | null; icons: string | null }>);

    // Separate parser logs (no kit_id) from kit logs
    const parserLogs = logs.filter((l) => !l.kit_id);
    const kitLogs = logs.filter((l) => !!l.kit_id);

    const logsByKit = kitLogs.reduce((acc, log) => {
      if (!acc[log.kit_id]) acc[log.kit_id] = [];
      acc[log.kit_id].push(log);
      return acc;
    }, {} as Record<string, typeof logs>);

    const grouped = kits
      .filter((kit) => logsByKit[kit.id])
      .map((kit) => {
        const kitLogs = logsByKit[kit.id] ?? [];
        const kitScreens = screens.filter((s) => s.kit_id === kit.id);

        const enrichedLogs = kitLogs.map((log) => {
          let systemPrompt: string | null = null;
          let userPrompt: string | null = null;

          if (log.step === "design_system") {
            systemPrompt = kitsPromptMap[kit.id]?.design ?? null;
            userPrompt = null;
          } else if (log.step === "icon_selection") {
            systemPrompt = kitsPromptMap[kit.id]?.icons ?? null;
            userPrompt = null;
          } else {
            const match = log.step.match(/^screen_(\d+)_/);
            if (match) {
              const idx = parseInt(match[1]);
              const screen = kitScreens.find((s) => s.order_index === idx);
              systemPrompt = screen?.system_prompt ?? null;
              userPrompt = screen?.user_prompt ?? null;
            }
          }

          return { ...log, systemPrompt, userPrompt };
        });

        const totalInputTokens = kitLogs.reduce((s, l) => s + (l.input_tokens ?? 0), 0);
        const totalOutputTokens = kitLogs.reduce((s, l) => s + (l.output_tokens ?? 0), 0);
        const failed = kitLogs.filter((l) => l.status === "failed").length;

        return {
          kitId: kit.id,
          kitName: kit.name,
          category: kit.category,
          createdAt: kit.created_at,
          totalInputTokens,
          totalOutputTokens,
          failedSteps: failed,
          logs: enrichedLogs,
        };
      });

    return NextResponse.json({ kits: grouped, parserLogs });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}