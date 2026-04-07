import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// ANTHROPIC CLIENT
// Singleton client for Claude API calls.
// ============================================================

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

// ============================================================
// TYPES
// ============================================================

export interface GenerationContext {
  kitId: string;
  category: "game" | "mobile" | "web";
  checklistData: Record<string, unknown>;
  isDemo: boolean;
}

export interface DesignSystem {
  typography: {
    fonts: string[];
    sizes: Record<string, string>;
    weights: Record<string, number>;
    lineHeights: Record<string, string>;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
    semantic: Record<string, string>;
  };
  spacing: {
    base: number;
    scale: number[];
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  components: Record<string, unknown>;
}

export interface GeneratedScreen {
  name: string;
  html_css: string;
  order_index: number;
}

// ============================================================
// PROMPT HELPERS
// ============================================================

/**
 * Build a checklist summary string from checklist data.
 * Used to inject into prompts.
 */
export function buildChecklistSummary(
  data: Record<string, unknown>
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;

    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (Array.isArray(value)) {
      lines.push(`${label}: ${value.join(", ")}`);
    } else {
      lines.push(`${label}: ${value}`);
    }
  }

  return lines.join("\n");
}

/**
 * Extract JSON from a Claude response that may contain markdown.
 */
export function extractJSON(text: string): unknown {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Get screen list from checklist data.
 */
export function getScreenList(
  data: Record<string, unknown>
): string[] {
  const screens = data.key_screens;
  if (Array.isArray(screens) && screens.length > 0) {
    return screens as string[];
  }
  // Default screens if none specified
  return [
    "Main Screen",
    "Secondary Screen",
    "Settings Screen",
    "Profile Screen",
    "Detail Screen",
  ];
}