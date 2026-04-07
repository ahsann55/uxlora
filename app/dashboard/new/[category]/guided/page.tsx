"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getChecklist } from "@/lib/checklist";
import { generateKitName } from "@/lib/utils";
import { GuidedStep } from "@/components/input/guided/GuidedStep";
import { GuidedReview } from "@/components/input/guided/GuidedReview";

type Step = "questions" | "review";

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

  // If adding screens to existing kit, fetch existing kit data
  useEffect(() => {
    if ((!addScreensMode && !regenerateMode) || !kitId) return;

    async function fetchKit() {
      try {
        const response = await fetch(`/api/kits/${kitId}`);
        if (!response.ok) return;
        const kit = await response.json();

        // Pre-populate form data from existing kit
        setFormData(kit.checklist_data ?? {});
        setKitName(kit.name ?? "");
        // Block demo kits from adding screens or regenerating
        if (kit.is_demo && !regenerateMode) {
          router.push(`/kit/${kitId}`);
          return;
        }
        // Get existing screen names
        const screenNames = (kit.screens ?? []).map(
          (s: { name: string }) => s.name
        );
        setExistingScreens(screenNames);

        // Pre-select existing screens in key_screens
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

  // Jump directly to screens section if adding screens
  // For regenerate mode — start from beginning with pre-filled data
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
      setCurrentSectionIndex(0); // Start from beginning
    }
  }, [addScreensMode, regenerateMode, initialLoading, sections]);

  const currentSection = sections[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  function updateField(id: string, value: unknown) {
    setFormData((prev) => {
      const updated = { ...prev, [id]: value };
      if (id === "product_name" && typeof value === "string" && value.trim()) {
        setKitName(generateKitName(value));
      }
      return updated;
    });
  }

  function handleNext() {
    if (isLastSection) {
      setStep("review");
    } else {
      setCurrentSectionIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (isFirstSection) return;
    setCurrentSectionIndex((i) => i - 1);
  }

  async function handleSubmit(finalData: Record<string, unknown>) {
    setLoading(true);
    setError(null);

    try {
      if ((addScreensMode || regenerateMode) && kitId) {
        // Update existing kit checklist data and trigger generation
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

        // Trigger generation
        const genResponse = await fetch(`/api/kits/${kitId}/generate`, {
          method: "POST",
        });

        if (!genResponse.ok) {
          const data = await genResponse.json();
          setError(data.error ?? "Failed to start generation.");
          return;
        }

        router.push(`/kit/${kitId}`);
      } else {
        // Create new kit
        const response = await fetch("/api/kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: kitName || "Untitled UI Kit",
            category,
            input_method: "guided",
            checklist_data: finalData,
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
        <p className="text-white/50">Loading kit data...</p>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setStep("questions")}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
          >
            ← Back to questions
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

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          href={addScreensMode && kitId ? `/kit/${kitId}` : `/dashboard/new/${category}`}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </Link>

        {/* Header */}
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

        {/* Progress — only show for new kit flow */}
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

        {/* Fields */}
        <GuidedStep
          section={currentSection}
          data={formData}
          onUpdate={updateField}
          isDemo={false}
          existingScreens={existingScreens}
          addScreensMode={addScreensMode}
        />

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {!isFirstSection && !addScreensMode && (
            <button onClick={handleBack} className="btn-secondary flex-1">
              ← Back
            </button>
          )}
          <button onClick={handleNext} className="btn-primary flex-1">
            {isLastSection || addScreensMode
              ? "Review & Generate →"
              : "Next →"}
          </button>
        </div>

      </div>
    </div>
  );
}