"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "./UpgradeModal";

interface SubscriptionStatusProps {
  tier: string;
  status: string;
  isFoundingMember: boolean;
  generationsUsed: number;
  generationsLimit: number;
}

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-white/10 text-white/50",
  starter: "bg-blue-500/20 text-blue-300",
  pro: "bg-brand-500/20 text-brand-300",
  studio: "bg-purple-500/20 text-purple-300",
};

export function SubscriptionStatus({
  tier,
  status,
  isFoundingMember,
  generationsUsed,
  generationsLimit,
}: SubscriptionStatusProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  async function handleManage() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/billing/portal");
      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Failed to get portal URL");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const isFree = tier === "free";
  const isActive = status === "active";
  const isPastDue = status === "past_due";
  const isCancelled = status === "cancelled";

  return (
    <>
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-1">
              Current Plan
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_COLORS[tier] ?? TIER_COLORS.free}`}>
                {TIER_LABELS[tier] ?? tier}
              </span>
              {isFoundingMember && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                  ⭐ Founding Member
                </span>
              )}
              {isPastDue && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                  Past Due
                </span>
              )}
              {isCancelled && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                  Cancelled
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          {isFree ? (
            <button
              onClick={() => setShowUpgrade(true)}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Upgrade
            </button>
          ) : (
            <button
              onClick={handleManage}
              disabled={portalLoading}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50"
            >
              {portalLoading ? "Loading..." : "Manage"}
            </button>
          )}
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/50">Kits this month</span>
            <span className="text-xs text-white/70 font-medium">
              {generationsUsed} / {generationsLimit}
            </span>
          </div>
          <div className="w-full bg-surface-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                generationsUsed >= generationsLimit
                  ? "bg-red-500"
                  : generationsUsed >= generationsLimit * 0.8
                  ? "bg-yellow-500"
                  : "bg-brand-500"
              }`}
              style={{
                width: `${Math.min(
                  (generationsUsed / generationsLimit) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Past due warning */}
        {isPastDue && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-300">
              Payment failed. Please update your billing info to keep access.
            </p>
            <button
              onClick={handleManage}
              className="text-xs text-red-300 underline mt-1"
            >
              Update payment method →
            </button>
          </div>
        )}

        {/* Cancelled warning */}
        {isCancelled && (
          <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-xs text-orange-300">
              Your subscription is cancelled. You'll lose access at the end of your billing period.
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-xs text-orange-300 underline mt-1"
            >
              Resubscribe →
            </button>
          </div>
        )}
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          trigger="generate"
        />
      )}
    </>
  );
}