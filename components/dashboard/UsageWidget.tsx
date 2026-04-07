"use client";

import { usagePercent, daysUntilMonthReset } from "@/lib/utils";

interface UsageWidgetProps {
  used: number;
  limit: number;
}

export function UsageWidget({ used, limit }: UsageWidgetProps) {
  const percent = usagePercent(used, limit);
  const daysLeft = daysUntilMonthReset();

  const barColor =
    percent >= 90
      ? "bg-error"
      : percent >= 70
      ? "bg-warning"
      : "bg-gradient-to-r from-brand-500 to-brand-400";

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-white/60">Generations</p>
        <p className="text-xs text-white/40">
          Resets in {daysLeft}d
        </p>
      </div>

      {/* Bar */}
      <div className="usage-bar-track">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Count */}
      <p className="text-xs text-white/50">
        <span className="text-white font-semibold">{used}</span> of{" "}
        <span className="text-white font-semibold">{limit}</span> used
      </p>
    </div>
  );
}