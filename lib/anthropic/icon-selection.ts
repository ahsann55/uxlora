import { getAnthropicClient, getPromptTemplate, buildChecklistSummary } from "./index";
import type { GenerationContext } from "./index";
import { createClient } from "@supabase/supabase-js";

export interface SelectedIcons {
  nav: string[];
  hud: string[];
  buttons: string[];
  decoratives: string[];
}

export interface IconSelectionResult {
  selectedIcons: SelectedIcons;
  authorMap: Record<string, string>;
  inputTokens: number;
  outputTokens: number;
}

export interface IconLibraryEntry {
  name: string;
  author: string;
  tags: string[];
}

async function fetchIconLibrary(category: string): Promise<IconLibraryEntry[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("icon_libraries")
    .select("name, author, tags")
    .eq("category", category)
    .eq("is_active", true);
  if (error || !data) return [];
  return data as IconLibraryEntry[];
}

export function buildIconUrl(name: string, author: string, fgColor: string): string {
  const fg = fgColor.replace("#", "");
  return `https://game-icons.net/icons/${fg}/transparent/1x1/${author}/${name}.svg`;
}

export function buildIconImgTag(name: string, author: string, fgColor: string, size: number = 24): string {
  const url = buildIconUrl(name, author, fgColor);
  return `<img src="${url}" width="${size}" height="${size}" style="display:block;" alt="${name}">`;
}

const FALLBACK_ICONS: SelectedIcons = {
  nav: ["broadsword", "scroll-unfurled", "chest", "compass", "swordman"],
  hud: ["coins", "crystal-ball", "medal"],
  buttons: ["crossed-swords", "treasure-map", "campfire"],
  decoratives: ["fireball", "crystal-cluster", "crowned-heart"],
};

export async function selectIcons(
  context: GenerationContext,
  designSystem: Record<string, unknown>
): Promise<IconSelectionResult> {
  const client = getAnthropicClient();
  const icons = await fetchIconLibrary("game");

  if (!icons.length) {
    return { selectedIcons: FALLBACK_ICONS, authorMap: {}, inputTokens: 0, outputTokens: 0 };
  }

  const iconList = icons.map(i => i.name).join(", ");
  const summary = buildChecklistSummary(context.checklistData);
  const template = await getPromptTemplate("icon_selection", context.category);

  const systemPrompt = template?.system_prompt ??
    `You are a game UI designer selecting icons for a game UI kit. Return ONLY valid JSON, no markdown, no explanation.`;

  const userPrompt = template?.user_template ??
    `Select icons from this list for a ${context.category} UI kit.

GAME: ${summary}

AVAILABLE ICONS: ${iconList}

Return JSON with exactly these keys. Pick the most thematic icons for this specific game:
{
  "nav": ["4-5 icon names for bottom nav tabs — game screens like home, inventory, quests, map, character"],
  "hud": ["2-3 icon names for HUD elements — currency and level/xp indicators"],
  "buttons": ["2-3 icon names for primary action buttons"],
  "decoratives": ["2-3 icon names for decorative background elements"]
}

Rules:
- Only use icon names exactly as they appear in AVAILABLE ICONS
- Match icons to the game genre and visual style
- Return only the JSON object`;

  const message = await client.messages.create({
    model: template?.model ?? "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  const iconNames = new Set(icons.map(i => i.name));
  const authorMap = Object.fromEntries(icons.map(i => [i.name, i.author]));

  let selectedIcons: SelectedIcons;
  try {
    const cleaned = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as SelectedIcons;
    const validIcon = (name: string) => iconNames.has(name);
    selectedIcons = {
      nav: (parsed.nav ?? []).filter(validIcon).slice(0, 5),
      hud: (parsed.hud ?? []).filter(validIcon).slice(0, 3),
      buttons: (parsed.buttons ?? []).filter(validIcon).slice(0, 3),
      decoratives: (parsed.decoratives ?? []).filter(validIcon).slice(0, 3),
    };
    // Fallback if any category is empty
    if (!selectedIcons.nav.length) selectedIcons.nav = FALLBACK_ICONS.nav.filter(validIcon);
    if (!selectedIcons.hud.length) selectedIcons.hud = FALLBACK_ICONS.hud.filter(validIcon);
    if (!selectedIcons.buttons.length) selectedIcons.buttons = FALLBACK_ICONS.buttons.filter(validIcon);
    if (!selectedIcons.decoratives.length) selectedIcons.decoratives = FALLBACK_ICONS.decoratives.filter(validIcon);
  } catch {
    selectedIcons = FALLBACK_ICONS;
  }
  
  return {
    selectedIcons,
    authorMap,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

export { type IconLibraryEntry as IconEntry };