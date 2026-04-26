import { createAdminClient } from "@/lib/supabase/server";

const HOLDBACK_DAYS = 14;
const REFERRALS_PER_REWARD = 3;

export type ReferralTier = "free" | "starter" | "pro" | "studio";

export async function recordReferralOnSubscription(
  userId: string,
  tier: string
): Promise<void> {
  const adminSupabase = await createAdminClient() as any;

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("referred_by_code, id")
    .eq("id", userId)
    .single();

  if (!profile?.referred_by_code) return;

  const { data: referrer } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("referral_code", profile.referred_by_code)
    .single();

  if (!referrer || referrer.id === userId) return;

  const qualifiesAt = new Date();
  qualifiesAt.setDate(qualifiesAt.getDate() + HOLDBACK_DAYS);

  await adminSupabase
    .from("referrals")
    .upsert({
      referrer_id: referrer.id,
      referred_user_id: userId,
      referral_code: profile.referred_by_code,
      status: "subscribed",
      referred_subscribed_at: new Date().toISOString(),
      referred_tier: tier,
      qualifies_at: qualifiesAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "referred_user_id",
    });
}

export async function markReferralCancelled(userId: string): Promise<void> {
  const adminSupabase = await createAdminClient() as any;

  await adminSupabase
    .from("referrals")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("referred_user_id", userId)
    .in("status", ["subscribed", "pending"]);
}

export async function processQualifiedReferrals(): Promise<{
  qualified: number;
  rewarded: number;
}> {
  const adminSupabase = await createAdminClient() as any;
  const now = new Date().toISOString();

  const { data: newlyQualified } = await adminSupabase
    .from("referrals")
    .select("id, referrer_id, referred_user_id")
    .eq("status", "subscribed")
    .lte("qualifies_at", now);

  let qualified = 0;
  let rewarded = 0;

  if (!newlyQualified || newlyQualified.length === 0) {
    return { qualified, rewarded };
  }

  for (const ref of newlyQualified) {
    const { data: referredProfile } = await adminSupabase
      .from("profiles")
      .select("subscription_status, subscription_tier")
      .eq("id", ref.referred_user_id)
      .single();

    if (!referredProfile || referredProfile.subscription_status !== "active" || referredProfile.subscription_tier === "free") {
      await adminSupabase
        .from("referrals")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", ref.id);
      continue;
    }

    await adminSupabase
      .from("referrals")
      .update({ status: "qualified", updated_at: now })
      .eq("id", ref.id);
    qualified++;
  }

  const { data: referrersWithQualified } = await adminSupabase
    .from("referrals")
    .select("referrer_id")
    .eq("status", "qualified");

  if (!referrersWithQualified) return { qualified, rewarded };

  const referrerCounts = new Map<string, number>();
  for (const r of referrersWithQualified) {
    referrerCounts.set(r.referrer_id, (referrerCounts.get(r.referrer_id) ?? 0) + 1);
  }

  for (const [referrerId, count] of referrerCounts.entries()) {
    const monthsToAward = Math.floor(count / REFERRALS_PER_REWARD);
    if (monthsToAward < 1) continue;

    const refsToReward = monthsToAward * REFERRALS_PER_REWARD;

    const { data: refIds } = await adminSupabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrerId)
      .eq("status", "qualified")
      .order("created_at", { ascending: true })
      .limit(refsToReward);

    if (!refIds || refIds.length < refsToReward) continue;

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("referral_credits_months")
      .eq("id", referrerId)
      .single();

    const currentCredits = profile?.referral_credits_months ?? 0;

    await adminSupabase
      .from("profiles")
      .update({
        referral_credits_months: currentCredits + monthsToAward,
        updated_at: now,
      })
      .eq("id", referrerId);

    await adminSupabase
      .from("referrals")
      .update({ status: "rewarded", rewarded_at: now, updated_at: now })
      .in("id", refIds.map((r: any) => r.id));

    rewarded += monthsToAward;
  }

  return { qualified, rewarded };
}

export async function applyReferralCredit(userId: string): Promise<boolean> {
  const adminSupabase = await createAdminClient() as any;

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("referral_credits_months, subscription_tier, referral_credit_active_until")
    .eq("id", userId)
    .single();

  if (!profile || profile.referral_credits_months < 1) return false;

  const tierToActivate = profile.subscription_tier === "free" ? "starter" : profile.subscription_tier;

  const activeUntil = new Date();
  activeUntil.setMonth(activeUntil.getMonth() + 1);

  await adminSupabase
    .from("profiles")
    .update({
      referral_credits_months: profile.referral_credits_months - 1,
      referral_credit_active_until: activeUntil.toISOString(),
      subscription_tier: tierToActivate,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return true;
}