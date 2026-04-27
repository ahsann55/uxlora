"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getChecklist } from "@/lib/checklist";
import { generateKitName } from "@/lib/utils";
import { GuidedStep } from "@/components/input/guided/GuidedStep";
import { GuidedReview } from "@/components/input/guided/GuidedReview";
import { SuggestionStep } from "@/components/input/SuggestionStep";
import type { SuggestionQuestion } from "@/lib/anthropic/index";

type Step = "questions" | "suggestions" | "review";

export default function GuidedPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = params.category as "game" | "mobile" | "web";

  const kitId = searchParams.get("kitId");
  const addScreensMode = searchParams.get("addScreens") === "true";
  const regenerateMode = searchParams.get("regenerate") === "true";
  const checklist = getChecklist(category);
  const sections = checklist.sections;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [step, setStep] = useState<Step>("questions");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [kitName, setKitName] = useState("");
  const [existingScreens, setExistingScreens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(addScreensMode || regenerateMode);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Suggestion state
  const [suggestionQuestions, setSuggestionQuestions] = useState<SuggestionQuestion[]>([]);
  const [suggestionAnswers, setSuggestionAnswers] = useState<Record<string, unknown>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionTokens, setSuggestionTokens] = useState<{ input: number; output: number } | null>(null);

  // If adding screens to existing kit, fetch existing kit data
  useEffect(() => {
    if ((!addScreensMode && !regenerateMode) || !kitId) return;

    async function fetchKit() {
      try {
        const response = await fetch(`/api/kits/${kitId}`);
        if (!response.ok) return;
        const kit = await response.json();

        setFormData(kit.checklist_data ?? {});
        setKitName(kit.name ?? "");
        if (kit.is_demo && !regenerateMode) {
          router.push(`/kit/${kitId}`);
          return;
        }
        const screenNames = (kit.screens ?? []).map(
          (s: { name: string }) => s.name
        );
        setExistingScreens(screenNames);

        if (kit.checklist_data?.key_screens) {
          setFormData((prev) => ({
            ...prev,
            key_screens: kit.checklist_data.key_screens,
          }));
        }
      } catch {
        // ignore
      } finally {
        setInitialLoading(false);
      }
    }

    fetchKit();
  }, [addScreensMode, kitId]);

  useEffect(() => {
    if (initialLoading) return;
    if (addScreensMode) {
      const screensIndex = sections.findIndex((s) =>
        s.fields.some((f) => f.id === "key_screens")
      );
      if (screensIndex !== -1) {
        setCurrentSectionIndex(screensIndex);
      }
    } else if (regenerateMode) {
      setCurrentSectionIndex(0);
    }
  }, [addScreensMode, regenerateMode, initialLoading, sections]);

  const currentSection = sections[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  function updateField(id: string, value: unknown) {
    setError(null);
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFormData((prev) => {
      const updated = { ...prev, [id]: value };
      if (id === "product_name" && typeof value === "string" && value.trim()) {
        setKitName(generateKitName(value));
      }
      // Clear screen_resolution when orientation changes — options differ per orientation
      if (id === "orientation") {
        updated.screen_resolution = "";
      }
      return updated;
    });
  }

  function handleBack() {
    if (isFirstSection) return;
    setCurrentSectionIndex((i) => i - 1);
  }

  async function handleNext() {
    // Validate required fields in current section
    const newFieldErrors: Record<string, string> = {};
    currentSection.fields.forEach(field => {
      if (!field.required) return;
      // Skip conditional fields if their parent isn't set to "Other"/"Custom"
      if (field.id === "custom_resolution" && formData.screen_resolution !== "Custom") return;
      if (field.id === "custom_genre" && formData.genre_or_category !== "Other") return;
      if (field.id === "custom_visual_style" && formData.visual_style !== "Other") return;
      if (field.id === "custom_typography" && formData.typography_preferences !== "Other") return;
      if (field.id === "custom_home_focus" && formData.home_focus_element !== "Other") return;
      const value = formData[field.id];
      if (value === undefined || value === null || value === "") {
        newFieldErrors[field.id] = `${field.label} is required`;
      } else if (Array.isArray(value) && value.length === 0) {
        newFieldErrors[field.id] = `Please select at least one ${field.label.toLowerCase()}`;
      }
    });

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setFieldErrors({});

    if (isLastSection) {
      setStep("review");
    } else {
      setCurrentSectionIndex((i) => i + 1);
    }
  }

  function handleSuggestionAnswer(id: string, value: unknown) {
    setSuggestionAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSuggestionContinue() {
    // Merge suggestion answers into formData
    setFormData((prev) => ({ ...prev, ...suggestionAnswers }));
    setStep("review");
  }

  function handleSuggestionSkip() {
    setStep("review");
  }

  async function handleSubmit(finalData: Record<string, unknown>) {
    setLoading(true);
    setError(null);

    try {
      if ((addScreensMode || regenerateMode) && kitId) {
        const updateResponse = await fetch(`/api/kits/${kitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checklist_data: finalData,
            status: "collecting_input",
          }),
        });

        if (!updateResponse.ok) {
          const data = await updateResponse.json();
          setError(data.error ?? "Failed to update kit.");
          return;
        }

        // Regenerate mode = user explicitly asked for a fresh design system.
        // Add-screens mode = keep existing design system for consistency.
        const genResponse = await fetch(`/api/kits/${kitId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRegenerate: regenerateMode }),
        });

        if (!genResponse.ok) {
          const data = await genResponse.json();
          setError(data.error ?? "Failed to start generation.");
          return;
        }

        router.push(`/kit/${kitId}`);
      } else {
        const response = await fetch("/api/kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: kitName || "Untitled UI Kit",
            category,
            input_method: "guided",
            checklist_data: finalData,
            suggestion_tokens: suggestionTokens ?? undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? "Failed to create kit.");
          return;
        }

        const data = await response.json();
        router.push(`/kit/${data.id}`);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-white/50 text-sm">Loading kit data...</p>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="min-h-screen bg-surface p-6 page-enter">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setStep(suggestionQuestions.length > 0 ? "suggestions" : "questions")}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
          >
            ← Back
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              {addScreensMode ? "Review new screens" : "Review your answers"}
            </h1>
            <p className="text-white/50">
              Check everything looks right before generating.
            </p>
          </div>

          {!addScreensMode && (
            <div className="card mb-6">
              <label className="label">Kit name</label>
              <input
                type="text"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                placeholder="My UI Kit"
                className="input"
              />
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <GuidedReview
            data={formData}
            category={category}
            onSubmit={handleSubmit}
            onEdit={() => setStep("questions")}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  if (step === "suggestions") {
    return (
      <div className="min-h-screen bg-surface p-6 page-enter">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setStep("questions")}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
          >
            ← Back to questions
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">
              Tell us more
            </h1>
            <p className="text-white/40 text-sm">
              These answers help generate a more accurate UI kit.
            </p>
          </div>

          <SuggestionStep
            questions={suggestionQuestions}
            answers={suggestionAnswers}
            onAnswer={handleSuggestionAnswer}
            onContinue={handleSuggestionContinue}
            onSkip={handleSuggestionSkip}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 page-enter">
      <div className="max-w-2xl mx-auto">

        <Link
          href={addScreensMode && kitId ? `/kit/${kitId}` : `/dashboard/new/${category}`}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {addScreensMode ? "Add more screens" : regenerateMode ? "Regenerate UI Kit" : currentSection.label}
          </h1>
          <p className="text-white/50 text-sm">
            {addScreensMode
              ? "Select additional screens to generate. Already generated screens are locked."
              : regenerateMode
              ? "Your previous inputs are pre-filled. Adjust anything you want before regenerating."
              : "Fill in the details below"}
          </p>
        </div>

        {!addScreensMode && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/50">
                Step {currentSectionIndex + 1} of {sections.length}
              </p>
              <p className="text-sm text-white/50">
                {Math.round(progress)}% complete
              </p>
            </div>
            <div className="usage-bar-track">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <GuidedStep
          section={currentSection}
          data={formData}
          onUpdate={updateField}
          isDemo={false}
          existingScreens={existingScreens}
          addScreensMode={addScreensMode}
          errors={fieldErrors}
        />

        {/* AI suggestions disabled — checklist is comprehensive */}

        <div className="flex gap-3 mt-8">
          {!isFirstSection && !addScreensMode && (
            <button onClick={handleBack} className="btn-secondary flex-1">
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={false}
            className="btn-primary flex-1"
          >
            {isLastSection || addScreensMode ? "Review & Generate →" : "Next →"}
          </button>
        </div>

      </div>
    </div>
  );
}