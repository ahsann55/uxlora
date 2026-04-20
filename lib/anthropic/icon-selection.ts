import { getAnthropicClient, getPromptTemplate, buildChecklistSummary, resolvTemplate } from "./index";
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
  systemPrompt: string;
  userPrompt: string;
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
    return { selectedIcons: FALLBACK_ICONS, authorMap: {}, inputTokens: 0, outputTokens: 0, systemPrompt: "", userPrompt: "" };
  }

  const iconList = icons.map(i => i.name).join(", ");
  const summary = buildChecklistSummary(context.checklistData);
  const template = await getPromptTemplate("icon_selection", context.category);

  const variables = {
    category: context.category,
    summary,
    icon_list: iconList,
  };

  const systemPrompt = template
    ? resolvTemplate(template.system_prompt, variables)
    : `You are a game UI designer selecting icons for a game UI kit. Return ONLY valid JSON, no markdown, no explanation.`;

  const userPrompt = template
    ? resolvTemplate(template.user_template, variables)
    : `Select icons for a ${context.category} UI kit.

GAME: ${summary}

ICONS: ${iconList}

Return ONLY this JSON:
{
  "nav": ["4-5 icon names for bottom nav tabs"],
  "hud": ["2-3 icon names for currency and level indicators"],
  "buttons": ["2-3 icon names for action buttons"],
  "decoratives": ["2-3 icon names for decorative elements"]
}

Rules: Use ONLY names from ICONS list. Match game genre. Return JSON only.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let message;
  try {
    message = await client.messages.create({
      model: template?.model ?? "claude-haiku-4-5-20251001",
      max_tokens: template?.max_tokens ?? 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

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
    systemPrompt,
    userPrompt,
  };
}

export { type IconLibraryEntry as IconEntry };