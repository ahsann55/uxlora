"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/new": "New UI Kit",
  "/settings": "Settings",
  "/admin": "Admin Panel",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/kit/")) return "UI Kit";
  if (pathname.startsWith("/new/")) return "New UI Kit";
  if (pathname.startsWith("/admin/")) return "Admin Panel";
  return "UXLora";
}

export function Header({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-16 bg-surface-50 border-b border-surface-300 flex items-center justify-between px-6 flex-shrink-0">

      {/* Page title */}
      <h2 className="text-lg font-semibold text-white">{title}</h2>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* New kit button */}
        <Link href="/new" className="btn-primary py-1.5 px-4 text-sm">
          + New Kit
        </Link>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center">
            <span className="text-brand-300 text-sm font-semibold">
              {(profile.display_name ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-white/70 hidden md:block">
            {profile.display_name ?? "User"}
          </span>
        </div>

      </div>
    </header>
  );
}