import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Check if an email is on the founding member waitlist.
 * Uses timingSafeEqual to prevent timing attacks (SEC-14).
 */
export async function isFoundingMember(email: string): Promise<boolean> {
  try {
    const adminSupabase = await createAdminClient();

    const { data } = await adminSupabase
      .from("waitlist")
      .select("email")
      .limit(500);

    if (!data || data.length === 0) return false;

    const normalizedInput = email.toLowerCase().trim();

    for (const row of data as Array<{ email: string }>) {
      const normalizedWaitlist = row.email.toLowerCase().trim();

      // Use timingSafeEqual to prevent timing attacks
      try {
        const a = Buffer.from(normalizedInput.padEnd(255, "\0"));
        const b = Buffer.from(normalizedWaitlist.padEnd(255, "\0"));
        if (a.length === b.length && timingSafeEqual(a, b)) {
          return true;
        }
      } catch {
        // Length mismatch after padding shouldn't happen but handle gracefully
        if (normalizedInput === normalizedWaitlist) return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Founding member check error:", error);
    return false;
  }
}

/**
 * Mark a user as a founding member in their profile.
 */
export async function markAsFoundingMember(userId: string): Promise<void> {
  const adminSupabase = await createAdminClient() as any;
  await adminSupabase
    .from("profiles")
    .update({ is_founding_member: true })
    .eq("id", userId);
}

/**
 * Get the correct variant ID for a user based on founding member status.
 * Founding members get the founding price variants.
 */
export function getVariantForUser(
  tier: "starter" | "pro" | "studio",
  interval: "monthly" | "yearly",
  isFoundingMember: boolean
): number {
  const { VARIANT_IDS } = require("@/lib/billing/lemon-squeezy");

  if (isFoundingMember) {
    return VARIANT_IDS[`${tier}_founding`][interval];
  }
  return VARIANT_IDS[tier][interval];
}