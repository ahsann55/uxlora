import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New UI Kit",
};

const validCategories = ["game", "mobile", "web"];

const categoryInfo: Record<string, { title: string; icon: string; description: string }> = {
  game: {
    title: "Game UI",
    icon: "🎮",
    description: "Generate a complete game UI kit with HUD, menus, inventory, and more.",
  },
  mobile: {
    title: "Mobile App UI",
    icon: "📱",
    description: "Generate a complete mobile UI kit with onboarding, feeds, profiles, and more.",
  },
  web: {
    title: "Web / SaaS UI",
    icon: "🖥️",
    description: "Generate a complete web UI kit with dashboards, tables, settings, and more.",
  },
};

export default async function CategoryInputPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!validCategories.includes(category)) {
    redirect("/new");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const info = categoryInfo[category];

  return (
    <div className="min-h-screen bg-surface p-6 page-enter">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          href="/new"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">{info.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-3">{info.title}</h1>
          <p className="text-white/50">{info.description}</p>
        </div>

        {/* Input method selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Upload GDD */}
          <Link
            href={`/dashboard/new/${category}/upload`}
            className="card-hover flex flex-col"
          >
            <div className="text-3xl mb-4">📄</div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Upload a document
            </h2>
            <p className="text-white/50 text-sm flex-1">
              Upload your Game Design Document, App Design Document, or any
              product spec. We&apos;ll extract the details automatically.
            </p>
            <div className="mt-4 text-xs text-white/30">
              Supports PDF and DOCX
            </div>
            <div className="mt-4 flex items-center gap-2 text-brand-400 text-sm font-medium">
              Upload document →
            </div>
          </Link>

          {/* Guided questionnaire */}
          <Link
            href={`/dashboard/new/${category}/guided`}
            className="card-hover flex flex-col"
          >
            <div className="text-3xl mb-4">✍️</div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Answer questions
            </h2>
            <p className="text-white/50 text-sm flex-1">
              Answer a few guided questions about your product. Takes about
              10 minutes and gives the best results.
            </p>
            <div className="mt-4 text-xs text-white/30">
              15 steps · ~10 minutes
            </div>
            <div className="mt-4 flex items-center gap-2 text-brand-400 text-sm font-medium">
              Start questionnaire →
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}