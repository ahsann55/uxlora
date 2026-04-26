"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  onClose: () => void;
  trigger?: "download" | "generate" | "export" | "revision";
}

const PLANS = [
  {
    tier: "starter" as const,
    name: "Starter",
    monthlyPrice: 60,
    yearlyPrice: 600,
    yearlyMonthly: 50,
    kits: 5,
    bonusKits: 0,
    revisions: 1,
    exports: ["PNG"],
    comingSoon: [],
    color: "border-white/20",
    badge: null,
  },
  {
    tier: "pro" as const,
    name: "Pro",
    monthlyPrice: 150,
    yearlyPrice: 1500,
    yearlyMonthly: 125,
    kits: 8,
    bonusKits: 3,
    revisions: 2,
    exports: ["PNG"],
    comingSoon: ["Figma export"],
    color: "border-brand-500",
    badge: "Most Popular",
  },
  {
    tier: "studio" as const,
    name: "Studio",
    monthlyPrice: 350,
    yearlyPrice: 3500,
    yearlyMonthly: 291,
    kits: 15,
    bonusKits: 5,
    revisions: 3,
    exports: ["PNG"],
    comingSoon: ["Figma export", "Unity UXML export"],
    color: "border-white/20",
    badge: null,
  },
];

const TRIGGER_MESSAGES = {
  download: "Upgrade to download your UI kit",
  generate: "You've reached your generation limit",
  export: "Upgrade to access this export format",
  revision: "Upgrade to access more revisions",
};

export function UpgradeModal({ onClose, trigger = "download" }: UpgradeModalProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpgrade(tier: "starter" | "pro" | "studio") {
    setLoading(tier);
    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Failed to create checkout");
      }

      // Redirect to Lemon Squeezy checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl bg-surface-50 border border-surface-300 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {TRIGGER_MESSAGES[trigger]}
            </h2>
            <p className="text-white/50 mt-1">
              Choose a plan to unlock the full power of UXLora
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors ml-4"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              interval === "monthly"
                ? "bg-brand-500 text-white"
                : "bg-surface-100 text-white/50 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              interval === "yearly"
                ? "bg-brand-500 text-white"
                : "bg-surface-100 text-white/50 hover:text-white"
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              2 months free
            </span>
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`relative border-2 ${plan.color} rounded-xl p-5 flex flex-col`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>

              {/* Price */}
              <div className="mb-4">
                {interval === "monthly" ? (
                  <div>
                    <span className="text-3xl font-bold text-white">${plan.monthlyPrice}</span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-white">${plan.yearlyMonthly}</span>
                    <span className="text-white/40 text-sm">/mo</span>
                    <p className="text-xs text-green-400 mt-0.5">
                      ${plan.yearlyPrice}/year
                    </p>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-4">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400">✓</span>
                  {plan.kits} UI kits/month
                  {plan.bonusKits > 0 && (
                    <span className="text-xs text-yellow-300 font-semibold ml-1">
                      +{plan.bonusKits}
                    </span>
                  )}
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400">✓</span>
                  {plan.revisions} revision{plan.revisions > 1 ? "s" : ""}/kit
                </li>
                {plan.exports.map((exp) => (
                  <li key={exp} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-green-400">✓</span>
                    {exp} export
                  </li>
                ))}
                {plan.comingSoon.map((exp) => (
                  <li key={exp} className="flex items-center gap-2 text-xs text-white/40">
                    <span className="text-yellow-400/60">◷</span>
                    <span>{exp}</span>
                    <span className="bg-yellow-500/10 text-yellow-300/80 px-1.5 py-0.5 rounded ml-auto text-[10px]">
                      Soon
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan.tier)}
                disabled={loading !== null}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  plan.badge
                    ? "btn-primary"
                    : "btn-secondary"
                } disabled:opacity-50`}
              >
                {loading === plan.tier ? "Redirecting..." : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-yellow-300/80 text-xs">
            🎁 Subscribe now → get bonus kits + Figma/UXML exports free when they launch
          </p>
          <p className="text-white/30 text-xs">
            Founding member? Your discount is applied automatically at checkout.
            Cancel anytime. Powered by Lemon Squeezy.
          </p>
        </div>
      </div>
    </div>
  );
}