import { generateDesignSystem } from "./generate-design-system";
import { generateScreen } from "./generate-screen";
import { getScreenList } from "./index";
import type { GenerationContext } from "./index";
import type { GeneratedScreen } from "./generate-screen";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function runGenerationEngine(
  context: GenerationContext
): Promise<void> {
  const adminSupabase = getAdminClient();

  async function updateKitStatus(
    status: string,
    extra: Record<string, unknown> = {}
  ) {
    const { error } = await adminSupabase
      .from("kits")
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq("id", context.kitId);

    if (error) {
      console.error("updateKitStatus error:", error);
    }
  }

  async function logGeneration(
    step: string,
    modelUsed: string,
    inputTokens: number,
    outputTokens: number,
    durationMs: number,
    status: "success" | "failed",
    errorMessage?: string,
    promptTemplateId?: string
  ) {
    await adminSupabase.from("generation_logs").insert({
      kit_id: context.kitId,
      step,
      model_used: modelUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      duration_ms: durationMs,
      status,
      error_message: errorMessage ?? null,
      prompt_template_id: promptTemplateId ?? null,
    });
  }

  try {
    // --------------------------------------------------------
    // STEP 2: Generate design system
    // --------------------------------------------------------
    await updateKitStatus("generating", {
      current_step: "Generating design system",
      current_screen_index: 0,
    });

    const step2Start = Date.now();
    let designSystem;
    let designSystemPrompt = "";

    try {
      const dsResult = await generateDesignSystem(context);
      designSystem = dsResult.designSystem;
      designSystemPrompt = dsResult.userPrompt;

      await adminSupabase
        .from("kits")
        .update({
          design_system: designSystem as unknown as Record<string, unknown>,
          design_system_prompt: designSystemPrompt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", context.kitId);

      await logGeneration(
        "design_system",
        "claude-sonnet-4-6",
        dsResult.inputTokens,
        dsResult.outputTokens,
        Date.now() - step2Start,
        "success",
        undefined,
        dsResult.promptTemplateId ?? undefined
      );
    } catch (error) {
      await logGeneration(
        "design_system",
        "claude-sonnet-4-6",
        0,
        0,
        Date.now() - step2Start,
        "failed",
        String(error)
      );
      throw new Error(`Design system generation failed: ${error}`);
    }

    // --------------------------------------------------------
    // STEP 2.5: Select icons (game category only)
    // --------------------------------------------------------
    let selectedIcons = null;
    let iconAuthorMap: Record<string, string> = {};

    if (context.category === "game") {
      await updateKitStatus("generating", {
        current_step: "Crafting your game's visual style",
      });

      const iconStart = Date.now();
      try {
        const { selectIcons } = await import("./icon-selection");
        const iconResult = await selectIcons(context, designSystem as unknown as Record<string, unknown>);
        selectedIcons = iconResult.selectedIcons;
        iconAuthorMap = iconResult.authorMap;

        await adminSupabase
          .from("kits")
          .update({
            selected_icons: selectedIcons as unknown as Record<string, unknown>,
            icon_selection_prompt: iconResult.userPrompt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", context.kitId);

        await logGeneration(
          "icon_selection",
          "claude-haiku-4-5-20251001",
          iconResult.inputTokens,
          iconResult.outputTokens,
          Date.now() - iconStart,
          "success"
        );
      } catch (error) {
        console.error("Icon selection failed, continuing without icons:", error);
        await logGeneration(
          "icon_selection",
          "claude-haiku-4-5-20251001",
          0,
          0,
          Date.now() - iconStart,
          "failed",
          String(error)
        );
      }
    }

    // --------------------------------------------------------
    // STEP 3: Generate each screen
    // --------------------------------------------------------
    const allScreens = getScreenList(context.checklistData);

    const { data: existingScreensData } = await adminSupabase
      .from("screens")
      .select("name")
      .eq("kit_id", context.kitId);

    const existingNames = new Set(
      (existingScreensData ?? []).map((s: { name: string }) => s.name)
    );

    const allScreensToGenerate = context.isDemo
      ? allScreens.slice(0, 2)
      : allScreens;

    const screens = allScreensToGenerate.filter(
      (name) => !existingNames.has(name)
    );

    const finalTotalScreens = allScreensToGenerate.length;
    const alreadyGeneratedCount = existingNames.size;

    if (screens.length === 0) {
      await updateKitStatus("complete", {
        current_step: "Complete",
        current_screen_index: finalTotalScreens,
        total_screens: finalTotalScreens,
      });
      return;
    }

    await updateKitStatus("generating", {
      current_step: "Generating screens",
      total_screens: finalTotalScreens,
      current_screen_index: alreadyGeneratedCount,
    });

    for (let i = 0; i < screens.length; i++) {
      const screenName = screens[i];
      const globalIndex = alreadyGeneratedCount + i;

      await updateKitStatus("generating", {
        current_step: `Generating: ${screenName}`,
        current_screen_index: globalIndex,
      });

      const screenStart = Date.now();

      try {
        const result = await generateScreen(
          context,
          designSystem,
          screenName,
          globalIndex,
          finalTotalScreens,
          selectedIcons,
          iconAuthorMap
        );

        const { error: insertError } = await adminSupabase
          .from("screens")
          .insert({
            kit_id: context.kitId,
            name: screenName,
            order_index: globalIndex,
            html_css: result.htmlCss,
            system_prompt: result.systemPrompt,
            user_prompt: result.userPrompt,
          });

        if (insertError) {
          console.error(`Screen insert error for ${screenName}:`, insertError);
        }

        await logGeneration(
          `screen_${globalIndex}_${screenName}`,
          "claude-sonnet-4-6",
          result.inputTokens,
          result.outputTokens,
          Date.now() - screenStart,
          "success",
          undefined,
          result.promptTemplateId ?? undefined
        );
      } catch (error) {
        await logGeneration(
          `screen_${globalIndex}_${screenName}`,
          "claude-sonnet-4-6",
          0,
          0,
          Date.now() - screenStart,
          "failed",
          String(error)
        );
        console.error(`Screen generation failed for ${screenName}:`, error);
      }
    }

    // --------------------------------------------------------
    // STEP 5: Export pipeline (paid kits only)
    // --------------------------------------------------------
    if (!context.isDemo) {
      await updateKitStatus("generating", {
        current_step: "Generating PNG exports",
        current_screen_index: finalTotalScreens,
      });

      try {
        const { data: screensForExport } = await adminSupabase
          .from("screens")
          .select("id, name, html_css, order_index")
          .eq("kit_id", context.kitId)
          .order("order_index", { ascending: true });

        if (screensForExport && screensForExport.length > 0) {
          const { generateKitPNGs } = await import("@/lib/export/png-generator");
          await generateKitPNGs(
            context.kitId,
            context.category,
            screensForExport as Array<{ id: string; name: string; html_css: string | null }>
          );
        }
      } catch (error) {
        console.error("Export pipeline error:", error);
      } finally {
        await updateKitStatus("complete", {
          current_step: "Complete",
          current_screen_index: finalTotalScreens,
          total_screens: finalTotalScreens,
        });
      }
    } else {
      await updateKitStatus("complete", {
        current_step: "Complete",
        current_screen_index: finalTotalScreens,
        total_screens: finalTotalScreens,
      });
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kits/${context.kitId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Failed to trigger notification:", error);
    }

  } catch (error) {
    console.error("Generation engine error:", error);
    await updateKitStatus("failed", {
      error_message: String(error),
      current_step: "Failed",
    });
    throw error;
  }
}