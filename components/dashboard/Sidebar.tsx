"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UsageWidget } from "./UsageWidget";
import { FoundingBadge } from "./FoundingBadge";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "New Kit",
    href: "/new",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "Refer & Earn",
    href: "/dashboard/referrals",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M16 8h-4M8 16h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-3a2 2 0 01-2-2V2M4 7h3a2 2 0 002-2V2" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar bg-surface-50 border-r border-surface-300 flex flex-col z-40">

      {/* Logo */}
      <div className="p-6 border-b border-surface-300">
        <Link href="/dashboard" className="block">
          <h1 className="text-xl font-bold text-white">
            UX<span className="text-brand-500">Lora</span>
          </h1>
          <p className="text-xs text-white/40 mt-0.5">AI UI Kit Generator</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${isActive ? "nav-item-active" : "nav-item"} nav-item-transition`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Admin link — only for admins */}
        {profile.is_admin && (
          <Link
            href="/admin"
            className={pathname.startsWith("/admin") ? "nav-item-active" : "nav-item"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin
          </Link>
        )}
      </nav>

      {/* Usage widget — UX-02 */}
      <div className="p-4 border-t border-surface-300">
        <UsageWidget
          used={profile.generations_used_this_month}
          limit={profile.generations_limit}
        />
      </div>

      {/* User section */}
      <div className="p-4 border-t border-surface-300">
        <div className="flex items-center gap-3 mb-3 -mx-1 px-1 rounded-lg">
          {/* Avatar + name — clicking opens settings */}
        <Link href="/dashboard/settings" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-300 text-sm font-semibold">
              {(profile.display_name ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile.display_name ?? "User"}
            </p>
            {profile.is_founding_member && <FoundingBadge />}
          </div>
        </Link>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="nav-item w-full text-left text-white/40 hover:text-red-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>

    </aside>
  );
}