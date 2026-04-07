"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  action: string;
  actionLabel: string;
  completed: boolean;
}

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
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("onboarding_dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  function handleDismiss() {
    localStorage.setItem("onboarding_dismissed", "true");
    setDismissed(true);
  }

  const items: ChecklistItem[] = [
    {
      id: "verify_email",
      label: "Verify your email",
      description: "Confirm your email address to secure your account.",
      action: "/dashboard",
      actionLabel: "Check email",
      completed: emailVerified,
    },
    {
      id: "generate_kit",
      label: "Generate your first UI kit",
      description: "Try UXLora free — generate a demo UI kit in minutes.",
      action: "/dashboard/new",
      actionLabel: "Generate kit",
      completed: hasKits,
    },
    {
      id: "upgrade",
      label: "Upgrade your plan",
      description: "Unlock downloads, revisions, and more screens.",
      action: "/dashboard/settings",
      actionLabel: "View plans",
      completed: hasSubscription,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const allComplete = completedCount === items.length;

  // Don't show if dismissed or all complete
  if (dismissed || allComplete) return null;

  return (
    <div className="card mb-6 border border-brand-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Getting started
          </h3>
          <p className="text-xs text-white/40 mt-0.5">
            {completedCount} of {items.length} completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/30 hover:text-white/60 transition-colors text-xs"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-200 rounded-full h-1 mb-4">
        <div
          className="h-1 bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              item.completed
                ? "opacity-50"
                : "bg-surface-100"
            }`}
          >
            {/* Checkbox */}
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
              item.completed
                ? "bg-brand-500 border-brand-500"
                : "border-surface-300"
            }`}>
              {item.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                item.completed ? "text-white/40 line-through" : "text-white"
              }`}>
                {item.label}
              </p>
              {!item.completed && (
                <p className="text-xs text-white/40 mt-0.5">{item.description}</p>
              )}
            </div>

            {/* Action */}
            {!item.completed && (
              <button
                onClick={() => router.push(item.action)}
                className="btn-secondary text-xs py-1 px-3 flex-shrink-0"
              >
                {item.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}