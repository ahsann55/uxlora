import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KitList } from "@/components/dashboard/KitList";
import { OnboardingChecklist } from "@/components/ui/OnboardingChecklist";
import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your UI kits dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

// Fetch kits
const { data: kits } = await supabase
  .from("kits")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

const kitList = kits ?? [];

// Fetch profile for onboarding checklist
const { data: profileData } = await supabase
  .from("profiles")
  .select("subscription_tier")
  .eq("id", user.id)
  .single();

const profile = profileData as { subscription_tier: string } | null;

  return (
    <div className="max-w-7xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="page-title">Your UI Kits</h1>
        <p className="page-subtitle">
          {kitList.length === 0
            ? "Generate your first UI kit to get started"
            : `${kitList.length} kit${kitList.length === 1 ? "" : "s"} generated`}
        </p>
      </div>

      {/* Onboarding checklist — UX-14 */}
      <OnboardingChecklist
        hasKits={kitList.length > 0}
        hasSubscription={(profile?.subscription_tier ?? "free") !== "free"}
        emailVerified={!!user.email_confirmed_at}
      />

      {/* Kit list */}
      <Suspense fallback={<DashboardSkeleton />}>
        <KitList kits={kitList} />
      </Suspense>

    </div>
  );
}