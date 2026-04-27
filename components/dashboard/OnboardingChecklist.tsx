"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STORAGE_KEY = "uxlora_onboarding_dismissed";

interface OnboardingChecklistProps {
  hasKits: boolean;
  hasSubscription: boolean;
  emailVerified: boolean;
}

export function OnboardingChecklist({
  hasKits,
  hasSubscription,
  emailVerified,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setDismissed(isDismissed);
  }, []);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  // Don't render until mounted (avoids localStorage SSR mismatch)
  if (!mounted) return null;
  if (dismissed) return null;

  // Auto-dismiss if everything is done and user has kits
  if (emailVerified && hasKits && hasSubscription) return null;

  const steps = [
    {
      id: "verify",
      label: "Verify your email",
      description: "Confirm your email address to secure your account",
      completed: emailVerified,
      href: null,
      cta: null,
    },
    {
      id: "generate",
      label: "Generate your first UI kit",
      description: "Choose a category and describe your product",
      completed: hasKits,
      href: "/new",
      cta: "Get started →",
    },
    {
      id: "upgrade",
      label: "Upgrade your plan",
      description: "Unlock more generations and export your kits",
      completed: hasSubscription,
      href: "/dashboard/settings",
      cta: "View plans →",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount;

  return (
    <div className="card mb-8 border-brand-500/20 bg-brand-500/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title">Get started with UXLora</h3>
          <p className="text-white/40 text-sm mt-0.5">
            {completedCount} of {totalCount} steps completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/20 hover:text-white/50 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="usage-bar-track mb-5">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
          style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
              step.completed ? "opacity-50" : "hover:bg-surface-100"
            }`}
          >
            {/* Check circle */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                step.completed
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-surface-200 text-white/40 border border-surface-300"
              }`}
            >
              {step.completed ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.completed ? "line-through text-white/30" : "text-white"}`}>
                {step.label}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{step.description}</p>
            </div>

            {/* CTA */}
            {!step.completed && step.href && (
              <Link
                href={step.href}
                className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap"
              >
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* All done */}
      {allDone && (
        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg text-center">
          <p className="text-success text-sm font-medium">🎉 You&apos;re all set!</p>
          <button
            onClick={handleDismiss}
            className="text-xs text-white/30 hover:text-white/60 mt-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}