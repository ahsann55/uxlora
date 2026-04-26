import { lemonSqueezySetup, createCheckout, getSubscription, cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";

// Detect test mode based on Vercel environment
const isTestMode = process.env.VERCEL_ENV !== "production";

function getEnv(prodKey: string, testKey: string): string {
  const val = isTestMode ? process.env[testKey] : process.env[prodKey];
  if (!val) throw new Error(`Missing env var: ${isTestMode ? testKey : prodKey}`);
  return val;
}

function getEnvInt(prodKey: string, testKey: string): number {
  return parseInt(getEnv(prodKey, testKey));
}

// Initialize Lemon Squeezy SDK
export function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: getEnv("LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_API_KEY_TEST"),
    onError: (error) => console.error("Lemon Squeezy error:", error),
  });
}
// Variant ID map — pulls from test or prod env vars based on environment
export const VARIANT_IDS = {
  starter: {
    monthly: getEnvInt("LMS_VARIANT_STARTER_MONTHLY", "LMS_VARIANT_STARTER_MONTHLY_TEST"),
    yearly: getEnvInt("LMS_VARIANT_STARTER_YEARLY", "LMS_VARIANT_STARTER_YEARLY_TEST"),
  },
  pro: {
    monthly: getEnvInt("LMS_VARIANT_PRO_MONTHLY", "LMS_VARIANT_PRO_MONTHLY_TEST"),
    yearly: getEnvInt("LMS_VARIANT_PRO_YEARLY", "LMS_VARIANT_PRO_YEARLY_TEST"),
  },
  studio: {
    monthly: getEnvInt("LMS_VARIANT_STUDIO_MONTHLY", "LMS_VARIANT_STUDIO_MONTHLY_TEST"),
    yearly: getEnvInt("LMS_VARIANT_STUDIO_YEARLY", "LMS_VARIANT_STUDIO_YEARLY_TEST"),
  },
  starter_founding: {
    monthly: getEnvInt("LMS_VARIANT_STARTER_FOUNDING_MONTHLY", "LMS_VARIANT_STARTER_FOUNDING_MONTHLY_TEST"),
    yearly: getEnvInt("LMS_VARIANT_STARTER_FOUNDING_YEARLY", "LMS_VARIANT_STARTER_FOUNDING_YEARLY_TEST"),
  },
  pro_founding: {
    monthly: getEnvInt("LMS_VARIANT_PRO_FOUNDING_MONTHLY", "LMS_VARIANT_PRO_FOUNDING_MONTHLY_TEST"),
    yearly: getEnvInt("LMS_VARIANT_PRO_FOUNDING_YEARLY", "LMS_VARIANT_PRO_FOUNDING_YEARLY_TEST"),
  },
  studio_founding: {
    monthly: getEnvInt("LMS_VARIANT_STUDIO_FOUNDING_MONTHLY", "LMS_VARIANT_STUDIO_FOUNDING_MONTHLY_TEST"),
    yearly: getEnvInt("LMS_VARIANT_STUDIO_FOUNDING_YEARLY", "LMS_VARIANT_STUDIO_FOUNDING_YEARLY_TEST"),
  },
} as const;

export type PlanTier = "starter" | "pro" | "studio";
export type BillingInterval = "monthly" | "yearly";

// Tier limits
export const TIER_LIMITS = {
  free: { generations: 1, revisions: 0, exports: ["none"] },
  starter: { generations: 5, revisions: 1, exports: ["png"] },
  pro: { generations: 11, revisions: 2, exports: ["png"] },
  studio: { generations: 20, revisions: 3, exports: ["png"] },
} as const;

// Generate a checkout URL for a given tier + interval
export async function createCheckoutUrl(
  variantId: number,
  userEmail: string,
  userId: string,
  redirectUrl: string
): Promise<string> {
  initLemonSqueezy();

  const storeId = getEnvInt("LEMONSQUEEZY_STORE_ID", "LEMONSQUEEZY_STORE_ID_TEST");

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutOptions: {
      embed: false,
      media: false,
      logo: true,
    },
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
      },
    },
    productOptions: {
      redirectUrl,
      receiptButtonText: "Go to Dashboard",
      receiptThankYouNote: "Thank you for subscribing to UXLora!",
    },
  });

  if (error || !data?.data?.attributes?.url) {
    throw new Error("Failed to create checkout URL");
  }

  return data.data.attributes.url;
}

// Get subscription details
export async function getSubscriptionDetails(subscriptionId: string) {
  initLemonSqueezy();
  const { data, error } = await getSubscription(subscriptionId);
  if (error) throw new Error("Failed to get subscription");
  return data?.data;
}

// Cancel a subscription
export async function cancelUserSubscription(subscriptionId: string) {
  initLemonSqueezy();
  const { data, error } = await cancelSubscription(subscriptionId);
  if (error) throw new Error("Failed to cancel subscription");
  return data?.data;
}

// Map variant ID to tier name
export function variantIdToTier(variantId: number): PlanTier | null {
  const entries = Object.entries(VARIANT_IDS);
  for (const [key, variants] of entries) {
    if (variants.monthly === variantId || variants.yearly === variantId) {
      if (key.includes("starter")) return "starter";
      if (key.includes("pro")) return "pro";
      if (key.includes("studio")) return "studio";
    }
  }
  return null;
}

// Check if variant is founding member
export function isFoundingVariant(variantId: number): boolean {
  return (
    variantId === VARIANT_IDS.starter_founding.monthly ||
    variantId === VARIANT_IDS.starter_founding.yearly ||
    variantId === VARIANT_IDS.pro_founding.monthly ||
    variantId === VARIANT_IDS.pro_founding.yearly ||
    variantId === VARIANT_IDS.studio_founding.monthly ||
    variantId === VARIANT_IDS.studio_founding.yearly
  );
}