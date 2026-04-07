import Link from "next/link";
import { KitCard } from "./KitCard";
import type { Database } from "@/lib/supabase/types";

type Kit = Database["public"]["Tables"]["kits"]["Row"];

export function KitList({ kits }: { kits: Kit[] }) {
  if (kits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon text-6xl mb-4">🎨</div>
        <h3 className="empty-state-title">No UI kits yet</h3>
        <p className="empty-state-description">
          Generate your first UI kit to see it here. It only takes a few
          minutes.
        </p>
        <Link href="/new" className="btn-primary mt-6">
          + Generate your first kit
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {kits.map((kit) => (
        <KitCard key={kit.id} kit={kit} />
      ))}
    </div>
  );
}