"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STORAGE_KEY = "uxlora_onboarding_dismissed";

const steps = [
  {
    id: "generate",
    label: "Generate your first UI kit",
    description: "Choose a category and describe your product",
    href: "/new",
    cta: "Get started →",
  },
  {
    id: "preview",
    label: "Preview your screens",
    description: "View every screen in your generated kit",
    href: "/dashboard",
    cta: "View kits →",
  },
  {
    id: "download",
    label: "Download your kit",
    description: "Export as PNG, Figma file, or Unity UXML",
    href: "/dashboard",
    cta: "View kits →",
  },
];

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setDismissed(isDismissed);
  }, []);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  function toggleStep(id: string) {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  if (dismissed) return null;

  const completedCount = completed.length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount;

  return (
    <div className="card mb-8 border-brand-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title">Get started with UXLora</h3>
          <p className="text-white/50 text-sm mt-0.5">
            {completedCount}/{totalCount} steps completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dismiss onboarding"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="usage-bar-track mb-6">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
          style={{
            width: `${Math.round((completedCount / totalCount) * 100)}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completed.includes(step.id);
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                isCompleted ? "opacity-60" : "hover:bg-surface-100"
              }`}
            >
              {/* Step number / check */}
              <button
                onClick={() => toggleStep(step.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isCompleted
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-surface-200 text-white/40 border border-surface-300 hover:border-brand-500"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isCompleted ? "line-through text-white/40" : "text-white"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {step.description}
                </p>
              </div>

              {/* CTA */}
              {!isCompleted && (
                <Link
                  href={step.href}
                  className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors flex-shrink-0"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* All done state */}
      {allDone && (
        <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg text-center">
          <p className="text-success text-sm font-medium">
            🎉 You&apos;re all set! Start generating UI kits.
          </p>
          <button
            onClick={handleDismiss}
            className="text-xs text-white/40 hover:text-white/60 mt-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}