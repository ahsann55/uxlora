import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ReferralProfile {
  referral_code: string;
  referral_credits_months: number;
  referral_credit_active_until: string | null;
  subscription_tier: string;
}

interface ReferralRow {
  id: string;
  status: string;
  referred_subscribed_at: string | null;
  qualifies_at: string | null;
  rewarded_at: string | null;
  created_at: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("referral_code, referral_credits_months, referral_credit_active_until, subscription_tier")
    .eq("id", user.id)
    .single();

  const profile = profileData as ReferralProfile | null;

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: referralsData } = await supabase
    .from("referrals")
    .select("id, status, referred_subscribed_at, qualifies_at, rewarded_at, created_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const referrals = (referralsData as ReferralRow[] | null) ?? [];

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === "subscribed").length,
    qualified: referrals.filter(r => r.status === "qualified" || r.status === "rewarded").length,
    cancelled: referrals.filter(r => r.status === "cancelled").length,
    rewardsEarned: Math.floor(referrals.filter(r => r.status === "rewarded").length / 3),
  };

  return NextResponse.json({
    referralCode: profile.referral_code,
    referralUrl: `https://uxlora.app/sign-up?ref=${profile.referral_code}`,
    creditsAvailable: profile.referral_credits_months,
    creditActiveUntil: profile.referral_credit_active_until,
    subscriptionTier: profile.subscription_tier,
    stats,
    referrals,
  });
}