import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KitList } from "@/components/dashboard/KitList";
import { OnboardingChecklist } from "@/components/ui/OnboardingChecklist";
import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — UXLora",
  description: "Your UI kits dashboard",
};

// Force dynamic so page never serves stale cached data
export const dynamic = "force-dynamic";

async function KitListSection({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: kits } = await supabase
    .from("kits")
    .select("id, name, category, status, input_method, created_at, updated_at, is_demo, current_step, total_screens, current_screen_index")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const kitList = kits ?? [];
  return <KitList kits={kitList} />;
}

async function OnboardingSection({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [
    { data: profileData },
    { data: { user } }
  ] = await Promise.all([
    supabase.from("profiles").select("subscription_tier").eq("id", userId).single() as unknown as Promise<{ data: { subscription_tier: string } | null }>,
    supabase.auth.getUser(),
  ]);

  return (
    <OnboardingChecklist
      hasKits={false}
      hasSubscription={(profileData?.subscription_tier ?? "free") !== "free"}
      emailVerified={!!user?.email_confirmed_at}
    />
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Count kits cheaply for header subtitle — no need to fetch full list twice
  const { count } = await supabase
    .from("kits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const kitCount = count ?? 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Your UI Kits</h1>
        <p className="page-subtitle">
          {kitCount === 0
            ? "Generate your first UI kit to get started"
            : `${kitCount} kit${kitCount === 1 ? "" : "s"} generated`}
        </p>
      </div>

      {/* Stream onboarding checklist independently */}
      <Suspense fallback={null}>
        <OnboardingSection userId={user.id} />
      </Suspense>

      {/* Stream kit list — shows skeleton instantly, populates when ready */}
      <Suspense fallback={<DashboardSkeleton />}>
        <KitListSection userId={user.id} />
      </Suspense>
    </div>
  );
}