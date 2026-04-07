import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New UI Kit",
  description: "Choose a category to generate your UI kit",
};

const categories = [
  {
    id: "game",
    title: "Game UI",
    description:
      "HUD, inventory, upgrade trees, shop, leaderboard, menus and more. Exports to Unity UXML + USS.",
    icon: "🎮",
    screens: "8–15 screens",
    exports: "PNG + UXML + Figma",
    highlight: "Unity UXML export",
  },
  {
    id: "mobile",
    title: "Mobile App UI",
    description:
      "Onboarding, feeds, profiles, settings, checkout and more. iOS and Android ready.",
    icon: "📱",
    screens: "8–12 screens",
    exports: "PNG + Figma",
    highlight: "iOS & Android",
  },
  {
    id: "web",
    title: "Web / SaaS UI",
    description:
      "Dashboards, data tables, settings, forms, admin panels and more.",
    icon: "🖥️",
    screens: "8–12 screens",
    exports: "PNG + Figma",
    highlight: "SaaS ready",
  },
];

export default async function NewKitPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check email verification — UX-03
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-warning"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Verify your email first
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Please check your inbox and click the verification link before
            generating UI kits.
          </p>
          <Link href="/dashboard" className="btn-secondary w-full">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-3">
            What are you building?
          </h1>
          <p className="text-white/50">
            Choose a category to generate your complete UI kit
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/dashboard/new/${category.id}`}
              className="card-hover group flex flex-col"
            >
              {/* Icon */}
              <div className="text-4xl mb-4">{category.icon}</div>

              {/* Title + highlight */}
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-white">
                  {category.title}
                </h2>
              </div>

              {/* Highlight badge */}
              <span className="badge-brand self-start mb-3">
                {category.highlight}
              </span>

              {/* Description */}
              <p className="text-white/50 text-sm flex-1 mb-4">
                {category.description}
              </p>

              {/* Meta */}
              <div className="border-t border-surface-300 pt-4 mt-auto space-y-1">
                <p className="text-xs text-white/40">
                  📐 {category.screens}
                </p>
                <p className="text-xs text-white/40">
                  📦 {category.exports}
                </p>
              </div>

              {/* Arrow */}
              <div className="mt-4 flex items-center gap-2 text-brand-400 text-sm font-medium group-hover:gap-3 transition-all">
                Get started
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}