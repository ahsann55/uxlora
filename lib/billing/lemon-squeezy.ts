import { lemonSqueezySetup, createCheckout, getSubscription, cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize Lemon Squeezy SDK
export function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error("Lemon Squeezy error:", error),
  });
}

// Variant ID map — pulled from env
export const VARIANT_IDS = {
  starter: {
    monthly: parseInt(process.env.LMS_VARIANT_STARTER_MONTHLY!),
    yearly: parseInt(process.env.LMS_VARIANT_STARTER_YEARLY!),
  },
  pro: {
    monthly: parseInt(process.env.LMS_VARIANT_PRO_MONTHLY!),
    yearly: parseInt(process.env.LMS_VARIANT_PRO_YEARLY!),
  },
  studio: {
    monthly: parseInt(process.env.LMS_VARIANT_STUDIO_MONTHLY!),
    yearly: parseInt(process.env.LMS_VARIANT_STUDIO_YEARLY!),
  },
  starter_founding: {
    monthly: parseInt(process.env.LMS_VARIANT_STARTER_FOUNDING_MONTHLY!),
    yearly: parseInt(process.env.LMS_VARIANT_STARTER_FOUNDING_YEARLY!),
  },
  pro_founding: {
    monthly: parseInt(process.env.LMS_VARIANT_PRO_FOUNDING_MONTHLY!),
    yearly: parseInt(process.env.LMS_VARIANT_PRO_FOUNDING_YEARLY!),
  },
  studio_founding: {
    monthly: parseInt(process.env.LMS_VARIANT_STUDIO_FOUNDING_MONTHLY!),
    yearly: parseInt(process.env.LMS_VARIANT_STUDIO_FOUNDING_YEARLY!),
  },
} as const;

export type PlanTier = "starter" | "pro" | "studio";
export type BillingInterval = "monthly" | "yearly";

// Tier limits
export const TIER_LIMITS = {
  free: { generations: 1, revisions: 0, exports: ["none"] },
  starter: { generations: 3, revisions: 1, exports: ["png"] },
  pro: { generations: 5, revisions: 2, exports: ["png", "figma"] },
  studio: { generations: 10, revisions: 3, exports: ["png", "figma", "uxml"] },
} as const;

// Generate a checkout URL for a given tier + interval
export async function createCheckoutUrl(
  variantId: number,
  userEmail: string,
  userId: string,
  redirectUrl: string
): Promise<string> {
  initLemonSqueezy();

  const storeId = parseInt(process.env.LEMONSQUEEZY_STORE_ID!);

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