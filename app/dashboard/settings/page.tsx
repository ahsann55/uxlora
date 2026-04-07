import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { SubscriptionStatus } from "@/components/billing/SubscriptionStatus";
import { PricingTable } from "@/components/billing/PricingTable";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and subscription</p>
      </div>

      {/* Profile section */}
      <div className="card mb-6">
        <h2 className="section-title mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Display name</label>
            <p className="text-white font-medium">
              {profile.display_name ?? "—"}
            </p>
          </div>
          <div>
            <label className="label">Email address</label>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Subscription section */}
      <div className="mb-6">
        <h2 className="section-title mb-4">Subscription</h2>
        <SubscriptionStatus
          tier={profile.subscription_tier}
          status={profile.subscription_status}
          isFoundingMember={profile.is_founding_member}
          generationsUsed={profile.generations_used_this_month}
          generationsLimit={profile.generations_limit}
        />
      </div>
      {/* Pricing table — show for free users */}
        {profile.subscription_tier === "free" && (
          <div className="mb-6">
            <h2 className="section-title mb-4">Upgrade your plan</h2>
            <PricingTable
              currentTier={profile.subscription_tier}
              isFoundingMember={profile.is_founding_member}
            />
        </div>
      )}
      {/* Account section */}
      <div className="card">
        <h2 className="section-title mb-4">Account</h2>
        <div className="space-y-3">
          <p className="text-white/50 text-sm">
            Member since{" "}
            {new Date(profile.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

    </div>
  );
}