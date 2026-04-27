import Link from "next/link";
import { KitCard } from "./KitCard";
import type { Database } from "@/lib/supabase/types";

type Kit = Database["public"]["Tables"]["kits"]["Row"];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">

      {/* Animated icon cluster */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-brand-500/10 rounded-3xl border border-brand-500/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">🎨</span>
        </div>
        {/* Floating decoration dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-brand-400/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        <div className="absolute top-1/2 -right-3 w-2 h-2 bg-brand-600/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">
        Your first kit is one prompt away
      </h3>
      <p className="text-white/50 text-sm max-w-sm mb-3">
        Describe your game, app, or product — UXLora generates every screen
        with a consistent design system in minutes.
      </p>

      {/* Social proof nudge */}
      <p className="text-white/25 text-xs mb-8">
        Game UI · Mobile App UI · Web / SaaS UI
      </p>

      <Link href="/new" className="btn-primary px-8 py-3 text-base">
        + Generate your first kit
      </Link>

      {/* What you get */}
      <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg w-full">
        {[
          { icon: "🖼️", label: "Every screen", sub: "Full kit, not just one screen" },
          { icon: "🎯", label: "Consistent style", sub: "One design system throughout" },
          { icon: "📦", label: "Export ready", sub: "PNG package, download instantly" },
        ].map((item) => (
          <div key={item.label} className="bg-surface-50 border border-surface-300 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-xs font-semibold text-white mb-1">{item.label}</p>
            <p className="text-xs text-white/40">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KitList({ kits }: { kits: Kit[] }) {
  if (kits.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {kits.map((kit) => (
        <KitCard key={kit.id} kit={kit} />
      ))}
    </div>
  );
}