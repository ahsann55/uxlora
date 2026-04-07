import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================
// TAILWIND CLASS MERGING
// ============================================================

/**
 * Merge Tailwind classes safely, resolving conflicts.
 * Use this everywhere instead of template literals for class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Convert a string to a URL-safe slug.
 * "MonsterWar UI Kit" → "monsterwar-ui-kit"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalise(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a category key to a display label.
 */
export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    game:   "Game UI",
    mobile: "Mobile App UI",
    web:    "Web / SaaS UI",
  };
  return labels[category] ?? capitalise(category);
}

/**
 * Generate a kit name from a product name.
 * "MonsterWar" → "MonsterWar UI Kit"
 */
export function generateKitName(productName: string): string {
  const trimmed = productName.trim();
  if (!trimmed) return "Untitled UI Kit";
  if (trimmed.toLowerCase().endsWith("ui kit")) return trimmed;
  return `${trimmed} UI Kit`;
}

// ============================================================
// NUMBER UTILITIES
// ============================================================

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a number as a compact string.
 * 1200 → "1.2K"
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// ============================================================
// DATE UTILITIES
// ============================================================

/**
 * Get the number of days until the first of next month.
 * Used for the usage widget reset countdown.
 */
export function daysUntilMonthReset(): number {
  const now = new Date();
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diff = firstOfNextMonth.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format a date as a relative string.
 * "2 hours ago", "3 days ago", etc.
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60)   return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a date as a short readable string.
 * "Mar 27, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

// ============================================================
// GENERATION UTILITIES
// ============================================================

/**
 * Estimate remaining generation time in human-readable format.
 * Used for the progress ETA widget (UX-09).
 */
export function formatETA(
  remainingScreens: number,
  avgSecondsPerScreen: number = 18
): string {
  const totalSeconds = remainingScreens * avgSecondsPerScreen;

  if (totalSeconds <= 0) return "Almost done...";

  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes === 1) return "About 1 minute remaining";
  return `About ${minutes} minutes remaining`;
}

/**
 * Calculate generation usage percentage.
 */
export function usagePercent(used: number, limit: number): number {
  if (limit === 0) return 100;
  return clamp(Math.round((used / limit) * 100), 0, 100);
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Check if a string is a valid email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if a file type is an allowed document type for GDD upload.
 */
export function isAllowedDocumentType(mimeType: string): boolean {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return allowed.includes(mimeType);
}

/**
 * Format file size in human-readable form.
 * 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
}