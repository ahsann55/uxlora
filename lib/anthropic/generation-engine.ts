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
    // STEP 1: Log suggestion tokens if present
    // --------------------------------------------------------
    const { data: kitMeta } = await adminSupabase
      .from("kits")
      .select("suggestion_tokens, gdd_summary, kit_decisions")
      .eq("id", context.kitId)
      .single();

    // Pass gdd_summary to context for document upload flow
    if (kitMeta?.gdd_summary) {
      context.gddSummary = kitMeta.gdd_summary as string;
    }
    if (kitMeta?.kit_decisions) {
      context.kitDecisions = kitMeta.kit_decisions as string;
    }

    const suggTokens = kitMeta?.suggestion_tokens as { input: number; output: number } | null;
    console.log("Suggestion tokens from DB:", suggTokens);
    if (suggTokens && suggTokens.input > 0) {
      const { error: suggLogError } = await adminSupabase.from("generation_logs").insert({
        kit_id: context.kitId,
        step: "suggestion",
        model_used: "claude-sonnet-4-6",
        input_tokens: suggTokens.input,
        output_tokens: suggTokens.output,
        duration_ms: 0,
        status: "success",
        error_message: null,
        prompt_template_id: null,
      });
      console.log("Suggestion log insert error:", suggLogError);
    }

    // --------------------------------------------------------
    // STEP 2: Generate design system
    // --------------------------------------------------------
    await updateKitStatus("generating", {
      current_step: "Generating design system",
      current_screen_index: 0,
    });

    const step2Start = Date.now();
    let designSystem!: import("./index").DesignSystem;
    let designSystemPrompt = "";

    const runDesignSystem = async () => {
      const dsResult = await generateDesignSystem(context);
      designSystem = dsResult.designSystem;
      designSystemPrompt = dsResult.userPrompt;
      context.compressedSummary = dsResult.compressedSummary;
      context.kitDecisions = dsResult.kitDecisions;

      await adminSupabase
        .from("kits")
        .update({
          design_system: designSystem as unknown as Record<string, unknown>,
          design_system_prompt: designSystemPrompt,
          compressed_summary: dsResult.compressedSummary,
          kit_decisions: dsResult.kitDecisions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", context.kitId);

      return dsResult;
    };

    try {
      const dsResult = await runDesignSystem();
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
      console.error("Design system failed, retrying once:", error);
      await updateKitStatus("generating", {
        current_step: "Taking longer than usual, please be patient...",
      });
      try {
        const dsResult = await runDesignSystem();
        await updateKitStatus("generating", {
          current_step: "Generating design system",
        });
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
      } catch (retryError) {
        await logGeneration(
          "design_system",
          "claude-sonnet-4-6",
          0,
          0,
          Date.now() - step2Start,
          "failed",
          String(retryError)
        );
        throw new Error(`Design system generation failed: ${retryError}`);
      }
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
      const runIconSelection = async () => {
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

        return iconResult;
      };

      try {
        const iconResult = await runIconSelection();
        await logGeneration(
          "icon_selection",
          "claude-haiku-4-5-20251001",
          iconResult.inputTokens,
          iconResult.outputTokens,
          Date.now() - iconStart,
          "success"
        );
      } catch (error) {
        console.error("Icon selection failed, retrying once:", error);
        await updateKitStatus("generating", {
          current_step: "Taking longer than usual, please be patient...",
        });
        try {
          const iconResult = await runIconSelection();
          await updateKitStatus("generating", {
            current_step: "Crafting your game's visual style",
          });
          await logGeneration(
            "icon_selection",
            "claude-haiku-4-5-20251001",
            iconResult.inputTokens,
            iconResult.outputTokens,
            Date.now() - iconStart,
            "success"
          );
        } catch (retryError) {
          console.error("Icon selection failed on retry, continuing without icons:", retryError);
          await logGeneration(
            "icon_selection",
            "claude-haiku-4-5-20251001",
            0,
            0,
            Date.now() - iconStart,
            "failed",
            String(retryError)
          );
        }
      }
    }

    // --------------------------------------------------------
    // STEP 3: Generate each screen
    // --------------------------------------------------------
    const allScreens = getScreenList(context.checklistData);

    // Delete existing screens before regenerating — prevents duplicates
    await adminSupabase
      .from("screens")
      .delete()
      .eq("kit_id", context.kitId);

    const allScreensToGenerate = context.isDemo
      ? allScreens.slice(0, 2)
      : allScreens;

    const screens = allScreensToGenerate;

    const finalTotalScreens = allScreensToGenerate.length;
    const alreadyGeneratedCount = 0;

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
        error_message: null,
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
        console.error(`Screen generation failed for ${screenName}, retrying once:`, error);
        await updateKitStatus("generating", {
          current_step: `Taking longer than usual, please be patient...`,
        });

        try {
          const retryStart = Date.now();
          const retryResult = await generateScreen(
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
              html_css: retryResult.htmlCss,
              system_prompt: retryResult.systemPrompt,
              user_prompt: retryResult.userPrompt,
            });

          if (insertError) {
            console.error(`Screen insert error on retry for ${screenName}:`, insertError);
          }

          await updateKitStatus("generating", {
            current_step: `Generating: ${screenName}`,
          });

          await logGeneration(
            `screen_${globalIndex}_${screenName}`,
            "claude-sonnet-4-6",
            retryResult.inputTokens,
            retryResult.outputTokens,
            Date.now() - retryStart,
            "success",
            undefined,
            retryResult.promptTemplateId ?? undefined
          );
        } catch (retryError) {
          await logGeneration(
            `screen_${globalIndex}_${screenName}`,
            "claude-sonnet-4-6",
            0,
            0,
            Date.now() - screenStart,
            "failed",
            String(retryError)
          );
          console.error(`Screen generation failed on retry for ${screenName}:`, retryError);
        }
      }
    }

    // --------------------------------------------------------
    // STEP 4.5: Verify screens were actually generated
    // --------------------------------------------------------
    const { count: generatedCount } = await adminSupabase
      .from("screens")
      .select("*", { count: "exact", head: true })
      .eq("kit_id", context.kitId);

    if (!generatedCount || generatedCount === 0) {
      await updateKitStatus("failed", {
        error_message: "Screen generation failed. Please try again.",
        current_step: "Failed",
      });
      try {
        await adminSupabase.rpc("refund_generation", { p_user_id: context.userId });
      } catch { /* ignore */ }
      return;
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
    const errorStr = String(error);
    const userMessage = errorStr.includes("timeout") || errorStr.includes("Timeout")
      ? "Generation took too long. Please try again."
      : errorStr.includes("Design system generation failed")
      ? "Failed to generate design system. Please try again."
      : "Something went wrong. Please try again.";
    await updateKitStatus("failed", {
      error_message: userMessage,
      current_step: "Failed",
    });
    // Refund credit on failure
    try {
      await adminSupabase.rpc("refund_generation", { p_user_id: context.userId });
    } catch { /* ignore */ }
    throw error;
  }
}