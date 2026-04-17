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
      timeout: 120000, // 2 minutes
      maxRetries: 2,
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
 * Build a minimal one-line summary for screen generator calls.
 * Full summary is only needed for design system generation.
 * Saves 500-1000 input tokens per screen call.
 */
export function buildScreenSummary(
  data: Record<string, unknown>,
  category: string
): string {
  const name =
    (data.product_name as string) ||
    (data.game_name as string) ||
    (data.app_name as string) ||
    (data.gameName as string) ||
    (data.appName as string) ||
    "Untitled";

  const genre =
    (data.genre as string) ||
    (data.app_type as string) ||
    (data.appType as string) ||
    (data.saas_type as string) ||
    (data.saasType as string) ||
    "";

  const style =
    (data.visual_style as string) ||
    (data.visualStyle as string) ||
    "";

  const colors =
    (data.color_preferences as string) ||
    (data.colorPreferences as string) ||
    "";

  const orientation =
    (data.orientation as string) ||
    "";

  const parts = [name, genre, style, colors, orientation].filter(Boolean);
  return `${category} UI kit — ${parts.join(", ")}`;
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
  const screens = Array.isArray(data.key_screens) ? (data.key_screens as string[]) : [];
  const custom = Array.isArray(data.custom_screens) ? (data.custom_screens as string[]) : [];
  const merged = [...new Set([...screens, ...custom])];

  if (merged.length > 0) return merged;

  return [
    "Main Screen",
    "Secondary Screen",
    "Settings Screen",
    "Profile Screen",
    "Detail Screen",
  ];
}

// ============================================================
// PROMPT TEMPLATE LOADER
// Fetches active prompt template from DB.
// Falls back to hardcoded if not found.
// ============================================================

export interface PromptTemplate {
  id: string;
  step: string;
  category: string;
  system_prompt: string;
  user_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

/**
 * Fetch the active prompt template from the database.
 * Tries category-specific first, then falls back to universal.
 * Returns null if neither found.
 */
export async function getPromptTemplate(
  step: string,
  category: string
): Promise<PromptTemplate | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // First try category-specific
    const { data: specific } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("step", step)
      .eq("category", category)
      .eq("is_active", true)
      .single();

    if (specific) return specific as PromptTemplate;

    // Fall back to universal
    const { data: universal } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("step", step)
      .eq("category", "universal")
      .eq("is_active", true)
      .single();

    if (universal) return universal as PromptTemplate;

    return null;
  } catch (error) {
    console.error(`Failed to fetch prompt template: ${step}/${category}`, error);
    return null;
  }
}

/**
 * Replace {{variable}} placeholders in a template string.
 */
export function resolvTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

/**
 * Strip platform-specific keys from design system before injecting
 * into screen generator context. Reduces input tokens per screen call.
 */
export function stripDesignSystemForScreen(
  designSystem: Record<string, unknown>,
  category: string
): Record<string, unknown> {
  const stripped = { ...designSystem };
  const colors = stripped.c ? { ...(stripped.c as Record<string, unknown>) } : null;

  if (category === "game") {
    // Game doesn't need sidebar, table, or tab bar configs
    delete stripped.side;
    delete stripped.tbl;
    delete stripped.tab;
  } else if (category === "mobile") {
    // Mobile doesn't need sidebar, table, or rarity colors
    delete stripped.side;
    delete stripped.tbl;
    if (colors) {
      delete colors.rC;
      delete colors.rU;
      delete colors.rR;
      delete colors.rE;
      delete colors.rL;
      stripped.c = colors;
    }
  } else if (category === "web") {
    // Web doesn't need tab bar or rarity colors
    delete stripped.tab;
    if (colors) {
      delete colors.rC;
      delete colors.rU;
      delete colors.rR;
      delete colors.rE;
      delete colors.rL;
      stripped.c = colors;
    }
  }

  return stripped;
}

// ============================================================
// SUGGESTION GENERATOR
// ============================================================

export interface SuggestionQuestion {
  id: string;
  question: string;
  type: "select" | "multiselect" | "text" | "color";
  options?: string[];
  default?: string;
}

/**
 * Generate dynamic follow-up questions based on current checklist data.
 * Returns 0-8 questions depending on how much info is already provided.
 */
export async function generateSuggestions(
  category: string,
  checklistData: Record<string, unknown>
): Promise<{ questions: SuggestionQuestion[]; inputTokens: number; outputTokens: number; promptTemplateId: string | null }> {
  const client = getAnthropicClient();
  const filteredData = Object.fromEntries(
    Object.entries(checklistData).filter(([key]) => !key.match(/^q\d+$/))
    );
const summary = buildChecklistSummary(filteredData);
  const template = await getPromptTemplate("suggestion", category);

  const variables = { category, summary };

  const systemPrompt = template
    ? resolvTemplate(template.system_prompt, variables)
    : "You are a UI/UX product consultant. Return ONLY valid JSON array. No markdown, no code fences.";

  const userPrompt = template
    ? resolvTemplate(template.user_template, variables)
    : `User is building a ${category} UI kit. Provided: ${summary}\nReturn up to 8 questions as JSON array or [] if nothing critical is missing.`;

  const model = template?.model ?? "claude-sonnet-4-6";
  const maxTokens = template?.max_tokens ?? 500;
  const temperature = template?.temperature ?? 0.9;

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  
  try {
    const parsed = extractJSON(text);
    const questions = Array.isArray(parsed) ? parsed as SuggestionQuestion[] : [];
    return {
      questions,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      promptTemplateId: template?.id ?? null,
    };
  } catch {
    return { questions: [], inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens, promptTemplateId: null };
  }
}