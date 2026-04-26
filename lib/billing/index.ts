export type Tier = "free" | "starter" | "pro" | "studio";

export interface TierLimits {
  baseKits: number;
  bonusKits: number;
  totalKits: number;
  revisions: number;
  exports: string[];
  comingSoonExports: string[];
  extraKitPrice: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    baseKits: 1,
    bonusKits: 0,
    totalKits: 1,
    revisions: 0,
    exports: [],
    comingSoonExports: [],
    extraKitPrice: 0,
  },
  starter: {
    baseKits: 5,
    bonusKits: 0,
    totalKits: 5,
    revisions: 1,
    exports: ["png"],
    comingSoonExports: [],
    extraKitPrice: 10,
  },
  pro: {
    baseKits: 8,
    bonusKits: 3,
    totalKits: 11,
    revisions: 2,
    exports: ["png"],
    comingSoonExports: ["figma"],
    extraKitPrice: 18,
  },
  studio: {
    baseKits: 15,
    bonusKits: 5,
    totalKits: 20,
    revisions: 3,
    exports: ["png"],
    comingSoonExports: ["figma", "uxml"],
    extraKitPrice: 25,
  },
};

export function getTierLimit(tier: string): TierLimits {
  return TIER_LIMITS[tier as Tier] ?? TIER_LIMITS.free;
}