"use client";

import { useState } from "react";
import { UpgradeModal } from "./UpgradeModal";

interface PricingTableProps {
  currentTier?: string;
  isFoundingMember?: boolean;
}

const PLANS = [
  {
    tier: "starter" as const,
    name: "Starter",
    monthlyPrice: 60,
    yearlyPrice: 600,
    yearlyMonthly: 50,
    foundingMonthly: 30,
    foundingYearly: 300,
    foundingYearlyMonthly: 25,
    kits: 3,
    revisions: 1,
    exports: ["PNG"],
    extraKit: 10,
    badge: null,
    color: "border-white/20",
    description: "Perfect for indie developers and freelancers.",
  },
  {
    tier: "pro" as const,
    name: "Pro",
    monthlyPrice: 150,
    yearlyPrice: 1500,
    yearlyMonthly: 125,
    foundingMonthly: 75,
    foundingYearly: 750,
    foundingYearlyMonthly: 62,
    kits: 5,
    revisions: 2,
    exports: ["PNG", "Figma"],
    extraKit: 18,
    badge: "Most Popular",
    color: "border-brand-500",
    description: "For studios shipping multiple games or apps.",
  },
  {
    tier: "studio" as const,
    name: "Studio",
    monthlyPrice: 350,
    yearlyPrice: 3500,
    yearlyMonthly: 291,
    foundingMonthly: 175,
    foundingYearly: 1750,
    foundingYearlyMonthly: 145,
    kits: 10,
    revisions: 3,
    exports: ["PNG", "Figma", "Unity UXML"],
    extraKit: 25,
    badge: null,
    color: "border-white/20",
    description: "For teams with high-volume UI kit needs.",
  },
];

export function PricingTable({ currentTier, isFoundingMember }: PricingTableProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<"starter" | "pro" | "studio" | null>(null);

  function getPrice(plan: typeof PLANS[0]) {
    if (isFoundingMember) {
      return interval === "monthly"
        ? plan.foundingMonthly
        : plan.foundingYearlyMonthly;
    }
    return interval === "monthly" ? plan.monthlyPrice : plan.yearlyMonthly;
  }

  function getYearlyTotal(plan: typeof PLANS[0]) {
    if (isFoundingMember) return plan.foundingYearly;
    return plan.yearlyPrice;
  }

  return (
    <>
      <div className="w-full">
        {/* Founding member banner */}
        {isFoundingMember && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-yellow-300 text-sm font-semibold">
              ⭐ Founding Member Prices Applied — 50% off forever
            </p>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
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

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            return (
              <div
                key={plan.tier}
                className={`relative border-2 ${plan.color} rounded-2xl p-6 flex flex-col ${
                  plan.badge ? "shadow-lg shadow-brand-500/10" : ""
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-white/40 text-sm mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-white/40 text-sm mb-1">/mo</span>
                  </div>
                  {interval === "yearly" && (
                    <p className="text-xs text-green-400 mt-1">
                      ${getYearlyTotal(plan)}/year — 2 months free
                    </p>
                  )}
                  {isFoundingMember && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Founding member price
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-green-400 font-bold">✓</span>
                    <strong className="text-white">{plan.kits} UI kits</strong>/month
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-green-400 font-bold">✓</span>
                    {plan.revisions} revision{plan.revisions > 1 ? "s" : ""} per kit
                  </li>
                  {plan.exports.map((exp) => (
                    <li key={exp} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-green-400 font-bold">✓</span>
                      {exp} export
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-green-400 font-bold">✓</span>
                    Extra kit: ${plan.extraKit}
                  </li>
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-lg font-semibold text-sm text-center bg-surface-200 text-white/40">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedTier(plan.tier)}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      plan.badge ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    Get {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Free tier note */}
        <p className="text-center text-white/30 text-xs mt-8">
          All plans include a free demo kit. Cancel anytime. 
          Founding member spots are limited — 50 Starter, 30 Pro, 20 Studio.
        </p>
      </div>

      {/* Upgrade modal */}
      {selectedTier && (
        <UpgradeModal
          onClose={() => setSelectedTier(null)}
          trigger="download"
        />
      )}
    </>
  );
}