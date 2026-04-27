import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { SubscriptionStatus } from "@/components/billing/SubscriptionStatus";
import { PricingTable } from "@/components/billing/PricingTable";
import { SettingsClient } from "@/components/dashboard/SettingsClient";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile) redirect("/sign-in");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and subscription</p>
      </div>

      {/* Profile — editable via client component */}
      <div className="mb-6">
        <h2 className="section-title mb-4">Profile</h2>
        <SettingsClient
          initialDisplayName={profile.display_name ?? ""}
          email={user.email ?? ""}
        />
      </div>

      {/* Subscription */}
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

      {/* Upgrade prompt for free users */}
      {profile.subscription_tier === "free" && (
        <div className="mb-6">
          <h2 className="section-title mb-4">Upgrade your plan</h2>
          <PricingTable
            currentTier={profile.subscription_tier}
            isFoundingMember={profile.is_founding_member}
          />
        </div>
      )}

      {/* Account */}
      <div className="card mb-6">
        <h2 className="section-title mb-4">Account</h2>
        <p className="text-white/50 text-sm">
          Member since{" "}
          {new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Danger zone */}
      <div className="card border-red-500/20">
        <h2 className="text-base font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-white/40 text-sm mb-4">
          Permanently delete your account and all generated kits. This cannot be undone.
        </p>
        <a
          href={`mailto:support@uxlora.app?subject=Delete my account&body=Please delete my account. My email is ${user.email}.`}
          className="btn-secondary text-sm text-red-400 border-red-500/30 hover:border-red-500/60"
        >
          Request account deletion →
        </a>
      </div>
    </div>
  );
}