import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// ANTHROPIC CLIENT
// Singleton client for Claude API calls.
// ============================================================

export function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    timeout: 300000, // 5 min fallback — AbortController handles per-call timeout
    maxRetries: 0,
  });
}

// ============================================================
// TYPES
// ============================================================

export interface GenerationContext {
  kitId: string;
  userId: string;
  category: "game" | "mobile" | "web";
  checklistData: Record<string, unknown>;
  isDemo: boolean;
  compressedSummary?: string;
  kitDecisions?: string;
  gddSummary?: string;
  forceRegenerate?: boolean;
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
 * Format a single value for prompt injection.
 * Handles primitives, objects, and nested arrays without producing
 * "[object Object]". Keeps output compact for LLM consumption.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value.map(formatValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const name = (obj.name ?? obj.label ?? obj.title) as string | undefined;
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (k === "name" || k === "label" || k === "title") continue;
      if (v === null || v === undefined || v === "") continue;
      const formatted = formatValue(v);
      if (formatted) pairs.push(`${k}: ${formatted}`);
    }
    if (name && pairs.length) return `${name} (${pairs.join("; ")})`;
    if (name) return name;
    if (pairs.length) return pairs.join("; ");
    return "";
  }

  return String(value);
}

/**
 * Format a field whose value may be a primitive, string array, or
 * array of objects. Always returns a single clean string for prompts.
 */
function formatListField(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) {
    return value
      .map(formatValue)
      .filter(v => v && v !== "Other")
      .join(", ");
  }
  return formatValue(value);
}

/**
 * Build a checklist summary string from checklist data.
 * Used to inject into the design system prompt.
 * Handles arrays of objects (currencies, monetization, game_systems)
 * without producing "[object Object]" artifacts.
 */
export function buildChecklistSummary(
  data: Record<string, unknown>
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;

    const formatted = Array.isArray(value) ? formatListField(value) : formatValue(value);
    if (!formatted) continue;

    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    lines.push(`${label}: ${formatted}`);
  }

  return lines.join("\n");
}

/**
 * Build a compact one-line summary for screen generator calls.
 * Fallback when compressedSummary is unavailable from design system output.
 * Supports all three categories via naming variant fallbacks
 * (product_name / appName / gameName, etc) and mobile/web parser fields.
 */
export function buildScreenSummary(
  data: Record<string, unknown>,
  category: string
): string {
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const v = data[k];
      if (v !== null && v !== undefined && v !== "") return formatValue(v);
    }
    return "";
  };

  const getList = (...keys: string[]): string => {
    for (const k of keys) {
      if (data[k] !== null && data[k] !== undefined && data[k] !== "") {
        const formatted = formatListField(data[k]);
        if (formatted) return formatted;
      }
    }
    return "";
  };

  const name = get("product_name", "game_name", "app_name", "appName", "gameName") || "Untitled";
  const desc = get("product_description", "game_description", "app_description");
  const genre = get("genre_or_category", "app_type", "appType", "saas_type", "saasType");
  const customGenre = get("custom_genre");
  const style = get("visual_style", "visualStyle");
  const customStyle = get("custom_visual_style");
  const colors = get("color_preferences", "colorPreferences");
  const orientation = get("orientation");
  const resolution = get("screen_resolution", "custom_resolution");
  const typo = get("typography_preferences", "fontStyle");
  const customTypo = get("custom_typography");
  const theme = get("theme", "color_scheme", "colorScheme");
  const platform = getList("platform");
  const audience = get("target_audience", "audience");
  const homeFocus = get("home_focus_element");
  const customHomeFocus = get("custom_home_focus");
  const navPattern = get("nav_pattern");
  const hasSidebar = get("has_sidebar");
  const dataDensity = get("data_density");
  const special = get("special_requirements");

  const currenciesBase = getList("currencies");
  const customCurrencies = get("custom_currencies");
  const currencies = [currenciesBase, customCurrencies].filter(Boolean).join(", ");

  const monetizationBase = getList("monetization");
  const customMonetization = get("custom_monetization");
  const monetization = [monetizationBase, customMonetization].filter(Boolean).join(", ");

  const gameSystemsBase = getList("game_systems");
  const customGameSystems = get("custom_game_systems");
  const gameSystems = [gameSystemsBase, customGameSystems].filter(Boolean).join(", ");

  const coreActions = getList("coreActions", "core_actions");
  const contentType = get("contentType", "content_type");
  const features = getList("features");
  const userRoles = getList("userRoles", "user_roles");
  const tabBarItems = getList("tabBarItems", "tab_bar_items");
  const sidebarItems = getList("sidebarItems", "sidebar_items");
  const dashboardWidgets = getList("dashboardWidgets", "dashboard_widgets");

  const parts = [
    name,
    desc,
    genre === "Other" && customGenre ? customGenre : (genre || customGenre),
    style === "Other" && customStyle ? customStyle : (style || customStyle),
    colors,
    orientation,
    resolution,
    typo && `Typography: ${customTypo || typo}`,
    theme && `Theme: ${theme}`,
    platform && `Platform: ${platform}`,
    audience && `Audience: ${audience}`,
    currencies && `Currencies: ${currencies}`,
    monetization && `Monetization: ${monetization}`,
    gameSystems && `Game Systems: ${gameSystems}`,
    coreActions && `Core Actions: ${coreActions}`,
    contentType && `Content: ${contentType}`,
    features && `Features: ${features}`,
    userRoles && `User Roles: ${userRoles}`,
    tabBarItems && `Tab Bar: ${tabBarItems}`,
    sidebarItems && `Sidebar: ${sidebarItems}`,
    dashboardWidgets && `Dashboard Widgets: ${dashboardWidgets}`,
    homeFocus && `Home Focus: ${customHomeFocus || homeFocus}`,
    navPattern && `Nav: ${navPattern}`,
    hasSidebar && `Sidebar Layout: ${hasSidebar}`,
    dataDensity && `Density: ${dataDensity}`,
    special && `Requirements: ${special}`,
  ].filter(Boolean);

  return `${category} UI kit — ${parts.join(" | ")}`;
}

// ============================================================
// ICON PARSING FROM KIT_DECISIONS
// ============================================================

export interface ParsedKitIcons {
  nav: string[];
  hud: string[];
  buttons: string[];
  decoratives: string[];
}

/**
 * Parse icon assignments out of a KIT_DECISIONS prose block.
 * Expected formats (from design system prompt):
 *   nav_icons=[play:zap|shop:shopping-bag|settings:sliders]
 *   hud_icons=[coins:circle|gems:triangle]
 *   btn_icons=[play:chevron-right|retry:rotate-ccw]
 *   dec_icons=[shield|target|star]
 *
 * Tolerates whitespace, case variance, comma separators, missing role
 * prefixes. Returns raw icon names only (roles stripped) — screen
 * generator takes a flat list. Deduplicates across all roles.
 */
export function parseIconsFromKitDecisions(
  kitDecisions: string,
  validIconNames?: Set<string>
): ParsedKitIcons {
  const result: ParsedKitIcons = { nav: [], hud: [], buttons: [], decoratives: [] };

  const extract = (key: string): string[] => {
    const re = new RegExp(`${key}\\s*=\\s*\\[([^\\]]+)\\]`, "i");
    const m = kitDecisions.match(re);
    if (!m) return [];
    return m[1]
      .split(/[|,]/)
      .map(entry => {
        const parts = entry.split(":");
        const name = (parts[parts.length - 1] ?? "").trim();
        return name.toLowerCase().replace(/\s+/g, "-");
      })
      .filter(Boolean)
      .filter(name => !validIconNames || validIconNames.has(name));
  };

  result.nav = extract("nav_icons");
  result.hud = extract("hud_icons");
  result.buttons = extract("btn_icons");
  result.decoratives = extract("dec_icons");

  const seen = new Set<string>();
  for (const role of ["nav", "hud", "buttons", "decoratives"] as const) {
    result[role] = result[role].filter(n => {
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }

  return result;
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