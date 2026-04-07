import Link from "next/link";
import { timeAgo, categoryLabel } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Kit = Database["public"]["Tables"]["kits"]["Row"];

type StatusConfig = {
  label: string;
  className: string;
};

const statusConfig: Record<string, StatusConfig> = {
  collecting_input: { label: "Draft",      className: "badge-warning" },
  queued:           { label: "Queued",     className: "badge-brand" },
  generating:       { label: "Generating", className: "badge-brand" },
  complete:         { label: "Complete",   className: "badge-success" },
  failed:           { label: "Failed",     className: "badge-error" },
  cancelled:        { label: "Cancelled",  className: "badge-error" },
};

const categoryIcons: Record<string, string> = {
  game:   "🎮",
  mobile: "📱",
  web:    "🖥️",
};

export function KitCard({ kit }: { kit: Kit }) {
  const status = statusConfig[kit.status] ?? {
    label: kit.status,
    className: "badge",
  };

  return (
    <Link href={`/kit/${kit.id}`} className="card-hover block">
      {/* Thumbnail placeholder */}
      <div className="w-full h-36 bg-surface-200 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-4xl">
          {categoryIcons[kit.category] ?? "🎨"}
        </span>
      </div>

      {/* Kit info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white truncate flex-1">
            {kit.name}
          </h3>
          <span className={`${status.className} flex-shrink-0`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>{categoryLabel(kit.category)}</span>
          <span>·</span>
          <span>{timeAgo(kit.created_at)}</span>
        </div>

        {/* Screen count */}
        {kit.total_screens > 0 && (
          <p className="text-xs text-white/40">
            {kit.total_screens} screen{kit.total_screens === 1 ? "" : "s"}
          </p>
        )}

        {/* Generating progress */}
        {kit.status === "generating" && kit.total_screens > 0 && (
          <div className="usage-bar-track mt-2">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(
                  (kit.current_screen_index / kit.total_screens) * 100
                )}%`,
              }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}