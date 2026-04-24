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
    // STEP 1: Load existing kit metadata
    // --------------------------------------------------------
    const { data: kitMeta } = await adminSupabase
      .from("kits")
      .select("suggestion_tokens, gdd_summary, kit_decisions, design_system, compressed_summary, selected_icons")
      .eq("id", context.kitId)
      .single();

    if (kitMeta?.gdd_summary) {
      context.gddSummary = kitMeta.gdd_summary as string;
    }
    if (kitMeta?.kit_decisions) {
      context.kitDecisions = kitMeta.kit_decisions as string;
    }
    if (kitMeta?.compressed_summary) {
      context.compressedSummary = kitMeta.compressed_summary as string;
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
    // STEP 2: Design system — reuse existing if available,
    // regenerate only on first run or explicit regeneration request.
    // --------------------------------------------------------
    const hasExistingDesignSystem = Boolean(
      kitMeta?.design_system && kitMeta?.kit_decisions
    );
    const shouldRegenerateDesignSystem = !hasExistingDesignSystem || context.forceRegenerate === true;

    let designSystem!: import("./index").DesignSystem;
    let designSystemPrompt = "";

    // Fetch icon list for design system (game category only)
    let iconList = "";
    let iconLibrary: Array<{ name: string; author: string }> = [];
    if (context.category === "game") {
      try {
        const { data: icons, error: iconsError } = await adminSupabase
          .from("icon_libraries")
          .select("name, author")
          .eq("category", "game")
          .eq("is_active", true);
        if (iconsError) {
          console.error("icon_libraries query error:", iconsError);
        }
        if (icons && icons.length > 0) {
          iconLibrary = icons as Array<{ name: string; author: string }>;
          iconList = iconLibrary.map(i => i.name).join(", ");
        }
      } catch (error) {
        console.error("icon_libraries fetch failed:", error);
      }
    }

    const runDesignSystem = async () => {
      const dsResult = await generateDesignSystem(context, iconList);
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

    if (shouldRegenerateDesignSystem) {
      await updateKitStatus("generating", {
        current_step: "Generating design system",
        current_screen_index: 0,
      });

      const step2Start = Date.now();

      try {
        const dsResult = await runDesignSystem();
        await logGeneration(
          "design_system",
          dsResult.modelUsed,
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
            dsResult.modelUsed,
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
    } else {
      // Reuse existing design system — guarantees screen consistency
      // when user clicks "+ Add screens" rather than "Regenerate".
      await updateKitStatus("generating", {
        current_step: "Using existing design system",
        current_screen_index: 0,
      });

      designSystem = kitMeta!.design_system as unknown as import("./index").DesignSystem;
      // context.kitDecisions and context.compressedSummary already set from kitMeta load above

      await logGeneration(
        "design_system_reused",
        "none",
        0,
        0,
        0,
        "success",
        undefined,
        undefined
      );
    }

    // Icon selection now embedded in the design system call.
    // Parse KIT_DECISIONS for icon assignments, build author map from DB,
    // and persist selected_icons so the admin panel can inspect them.
    let selectedIcons: { nav: string[]; hud: string[]; buttons: string[]; decoratives: string[] } | null = null;
    let iconAuthorMap: Record<string, string> = {};

    if (context.category === "game" && iconLibrary.length > 0 && context.kitDecisions) {
      const { parseIconsFromKitDecisions } = await import("./index");
      const validNames = new Set(iconLibrary.map(i => i.name));
      const parsed = parseIconsFromKitDecisions(context.kitDecisions, validNames);

      const totalPicked = parsed.nav.length + parsed.hud.length + parsed.buttons.length + parsed.decoratives.length;
      if (totalPicked > 0) {
        selectedIcons = parsed;
        iconAuthorMap = Object.fromEntries(iconLibrary.map(i => [i.name, i.author]));

        await adminSupabase
          .from("kits")
          .update({
            selected_icons: parsed as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", context.kitId);
      } else {
        console.warn(`Kit ${context.kitId}: KIT_DECISIONS had no parseable icon assignments`);
      }
    }

    // --------------------------------------------------------
    // STEP 3: Generate screens
    //
    // Three modes of behaviour, all unified by the forceRegenerate flag:
    //
    // 1. Force regenerate (user clicked "Regenerate" from kit page):
    //    delete all existing screens, generate every screen from scratch
    //    under the freshly-regenerated design system.
    //
    // 2. Normal regeneration (first-time generation or retry after failure):
    //    delete all existing screens, generate every screen fresh.
    //
    // 3. Add-screens (user added new screens to an existing kit):
    //    preserve all existing screens (including any manual revisions),
    //    only generate screens whose names don't already exist for this kit.
    //    Reuses the existing design system for guaranteed consistency.
    // --------------------------------------------------------
    const allScreens = getScreenList(context.checklistData);

    const { data: existingScreensData } = await adminSupabase
      .from("screens")
      .select("name, order_index")
      .eq("kit_id", context.kitId)
      .order("order_index", { ascending: true });

    const existingScreenNames = new Set(
      (existingScreensData ?? []).map((s: { name: string }) => s.name)
    );

    // Add-screens mode: design system is being reused AND screens already exist.
    // This is the only signal we have that the user is adding rather than regenerating.
    const isAddingScreens =
      !shouldRegenerateDesignSystem && existingScreensData && existingScreensData.length > 0;

    if (isAddingScreens) {
      // Preserve existing, only generate genuinely new screens.
      console.log(`Kit ${context.kitId}: add-screens mode, preserving ${existingScreensData.length} existing screens`);
    } else {
      // Fresh generation or explicit regeneration — clear everything.
      await adminSupabase
        .from("screens")
        .delete()
        .eq("kit_id", context.kitId);
    }

    const screensToGenerate = isAddingScreens
      ? allScreens.filter(name => !existingScreenNames.has(name))
      : allScreens;

    const allScreensToGenerate = context.isDemo
      ? screensToGenerate.slice(0, 2)
      : screensToGenerate;

    const screens = allScreensToGenerate;

    const finalTotalScreens = isAddingScreens
      ? existingScreensData!.length + allScreensToGenerate.length
      : allScreensToGenerate.length;

    const alreadyGeneratedCount = isAddingScreens ? existingScreensData!.length : 0;

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

    // Starting order_index for new screens — continues after existing ones
    const maxExistingOrderIndex = existingScreensData && existingScreensData.length > 0
      ? Math.max(...existingScreensData.map((s: { order_index: number }) => s.order_index))
      : -1;

    for (let i = 0; i < screens.length; i++) {
      const screenName = screens[i];
      const globalIndex = alreadyGeneratedCount + i;
      const screenOrderIndex = isAddingScreens
        ? maxExistingOrderIndex + 1 + i
        : globalIndex;

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
            order_index: screenOrderIndex,
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
              order_index: screenOrderIndex,
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
    // STEP 5: Mark complete. PNG export runs client-side on download.
    // --------------------------------------------------------
    await updateKitStatus("complete", {
      current_step: "Complete",
      current_screen_index: finalTotalScreens,
      total_screens: finalTotalScreens,
    });

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