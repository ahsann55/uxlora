/**
 * UXML + USS Converter
 * Converts HTML/CSS screens to Unity 6 UXML + USS format.
 *
 * SVG handling: every <svg> element is replaced with a <VisualElement>
 * referencing a PNG capture (svg_N.png) via background-image in USS.
 * Paths are relative to the .uss file so users only drop the screen folder
 * into Assets/UI/ — no manual path adjustments.
 */

export interface UXMLResult {
  uxml: string;
  uss: string;
  svgCount: number; // how many <svg> elements were replaced — caller captures this many PNGs
}

export async function convertToUXML(
  htmlCss: string,
  screenName: string,
  filePrefix: string
): Promise<UXMLResult> {
  const cheerio = await import("cheerio");

  const decodedHtml = htmlCss
    .replace(/\\u003C/gi, "<")
    .replace(/\\u003E/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u0022/gi, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");

  const bodyMatch = decodedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : decodedHtml;

  // Extract <style> from full html before stripping body
  const styleMatch = decodedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const cssContent = styleMatch ? styleMatch[1] : "";

  // Tag every SVG with a stable class so UXML and USS reference the same name.
  // We do this BEFORE cheerio parsing so we don't depend on cheerio's SVG handling.
  let svgIndex = 0;
  const svgDimensions: Array<{ index: number; width: number; height: number }> = [];

  const taggedBody = bodyContent.replace(
    /<svg\b([^>]*)>/gi,
    (_match, attrs: string) => {
      svgIndex++;
      const idx = svgIndex;

      // Extract dimensions for USS
      const widthMatch = attrs.match(/\bwidth\s*=\s*["']?(\d+)/i);
      const heightMatch = attrs.match(/\bheight\s*=\s*["']?(\d+)/i);
      const w = widthMatch ? parseInt(widthMatch[1]) : 0;
      const h = heightMatch ? parseInt(heightMatch[1]) : 0;
      svgDimensions.push({ index: idx, width: w, height: h });

      // Inject uxlora-svg-N class alongside any existing class
      const classMatch = attrs.match(/\bclass\s*=\s*"([^"]*)"/i);
      const tag = `uxlora-svg-${idx}`;
      let newAttrs: string;
      if (classMatch) {
        newAttrs = attrs.replace(
          /\bclass\s*=\s*"([^"]*)"/i,
          `class="$1 ${tag}"`
        );
      } else {
        newAttrs = attrs + ` class="${tag}"`;
      }
      return `<svg${newAttrs}>`;
    }
  );

  const $ = cheerio.load(taggedBody, { xmlMode: false });

  const uss = generateUSS(cssContent, screenName, svgDimensions);
  const uxml = generateUXML($, screenName, filePrefix);

  return { uxml, uss, svgCount: svgIndex };
}

function generateUSS(
  css: string,
  screenName: string,
  svgDimensions: Array<{ index: number; width: number; height: number }>
): string {
  let cleanCss = css;

  cleanCss = cleanCss.replace(/@import[^;]+;/g, "");
  cleanCss = cleanCss.replace(/@font-face\s*\{[^}]*\}/g, "");
  cleanCss = cleanCss.replace(/@keyframes[\s\S]*?\{[\s\S]*?\}\s*\}/g, "");
  cleanCss = cleanCss.replace(/:root\s*\{[^}]*\}/g, "");
  cleanCss = cleanCss.replace(/\/\*[\s\S]*?\*\//g, "");
  cleanCss = cleanCss.replace(/\s*animation[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*transition[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*-webkit-[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*-moz-[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*-ms-[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*filter[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*backdrop-filter[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*box-shadow:\s*[^;]*inset[^;]*;/g, "");
  cleanCss = cleanCss.replace(/var\(--[^,)]+,?\s*([^)]*)\)/g, (_, fb) => fb.trim() || "transparent");
  cleanCss = cleanCss.replace(/var\(--[^)]+\)/g, "transparent");
  cleanCss = cleanCss.replace(/[^{]*:(?:hover|focus|active|before|after|nth-child|first-child|last-child)[^{]*\{[^}]*\}/g, "");
  cleanCss = cleanCss.replace(/[^{]*::(?:before|after)[^{]*\{[^}]*\}/g, "");

  const propertyRemap: Record<string, string> = {
    "font-weight": "-unity-font-style",
    "text-align": "-unity-text-align",
    "font-style": "-unity-font-style",
  };

  const allowedProperties = new Set([
    "background-color", "color", "font-size",
    "-unity-font-style", "-unity-text-align", "-unity-background-scale-mode",
    "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
    "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
    "width", "height", "min-width", "min-height", "max-width", "max-height",
    "border-radius",
    "border-top-left-radius", "border-top-right-radius",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "border-width", "border-color",
    "border-top-width", "border-bottom-width", "border-left-width", "border-right-width",
    "flex-direction", "flex-wrap", "flex", "flex-grow", "flex-shrink", "flex-basis",
    "align-items", "align-self", "align-content", "justify-content",
    "position", "top", "bottom", "left", "right",
    "overflow", "opacity", "white-space", "letter-spacing",
    "background-image",
  ]);

  function mapFontWeight(val: string): string {
    const w = parseInt(val);
    if (w >= 700) return "bold";
    if (w >= 600) return "bold";
    return "normal";
  }
  function mapTextAlign(val: string): string {
    const map: Record<string, string> = {
      left: "upper-left", center: "upper-center", right: "upper-right", justify: "upper-left",
    };
    return map[val.trim()] ?? "upper-left";
  }

  let uss = `/* Unity USS for ${screenName} */\n/* Generated by UXLora — Unity 6 compatible */\n\n`;

  const ruleRegex = /([^{}@]+)\{([^}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    let selector = match[1].trim();
    const declarations = match[2].trim();
    if (!selector || selector.includes("@")) continue;

    // Skip selectors targeting raw SVG primitives — they're rendered as PNGs
    if (/\b(svg|path|circle|rect|polygon|polyline|line|defs|pattern)\b/i.test(selector)) continue;
    if (/[>+~\[]/.test(selector)) continue;
    // Skip universal/wildcard selectors
    if (selector === "*" || selector.includes("*")) continue;
    // Skip pseudo-classes USS doesn't support
    if (selector.includes(":not(") || selector.includes(":hover") || selector.includes(":focus") || selector.includes(":active") || selector.includes("::")) continue;
    // Element selectors without classes — skip (USS needs class selectors)
    if (!selector.includes(".") && !selector.includes("#")) continue;

    // Split on commas first — handle each selector in a comma list independently
    const selectors = selector.split(",").map(s => s.trim()).filter(Boolean);
    const validSelectors: string[] = [];

    for (const sel of selectors) {
      // Reject anything with descendant combinators we can't safely transform
      // (e.g. ".nav-tab.active .nav-indicator" — Unity USS supports descendant
      // selectors but our naive transformer was mangling them)
      const parts = sel.split(/\s+/).filter(Boolean);
      const transformedParts: string[] = [];
      let valid = true;
      for (const part of parts) {
        // Each space-separated segment must already start with . or # to be a class/id selector
        if (!part.startsWith(".") && !part.startsWith("#")) {
          // Bare element selector inside a descendant chain — USS needs a class
          valid = false;
          break;
        }
        // Multi-class selectors like ".nav-tab.active" are valid USS — keep as-is
        transformedParts.push(part);
      }
      if (valid && transformedParts.length > 0) {
        validSelectors.push(transformedParts.join(" "));
      }
    }

    if (validSelectors.length === 0) continue;
    const finalSelector = validSelectors.join(", ");

    const ussDeclarations: string[] = [];
    const declarationRegex = /([\w-]+)\s*:\s*([^;]+);/g;
    let dm;
    while ((dm = declarationRegex.exec(declarations)) !== null) {
      const prop = dm[1].trim().toLowerCase();
      let val = dm[2].trim();
      let ussProp = propertyRemap[prop] ?? prop;
      if (!allowedProperties.has(ussProp)) continue;

      val = val.replace(/(\d*\.?\d+)vh/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)vw/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)em/g, (_, n) => `${Math.round(parseFloat(n) * 16)}px`);
      val = val.replace(/(\d*\.?\d+)rem/g, (_, n) => `${Math.round(parseFloat(n) * 16)}px`);

      if (prop === "background" && !val.includes("gradient") && !val.includes("url(")) {
        ussProp = "background-color";
      }
      if (val.includes("gradient")) continue;
      if (val.includes("url(") && !val.includes(".png") && !val.includes(".jpg")) continue;
      if (val.includes("calc(")) continue;

      val = val.replace(
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g,
        (_, r, g, b, a) => {
          const alpha = Math.round(parseFloat(a) * 255);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      );

      if (ussProp === "display") {
        if (val === "block" || val === "inline-block" || val === "inline") val = "flex";
        if (val !== "flex" && val !== "none") continue;
      }
      if (ussProp === "cursor" && val === "pointer") val = "link";
      if (prop === "font-weight") val = mapFontWeight(val);
      if (prop === "text-align") val = mapTextAlign(val);
      if (prop === "line-height") continue;

      ussDeclarations.push(`    ${ussProp}: ${val};`);
    }

    if (ussDeclarations.length > 0) {
      uss += `${finalSelector} {\n${ussDeclarations.join("\n")}\n}\n\n`;
    }
  }

  // Append SVG image rules — relative to the .uss file
  if (svgDimensions.length > 0) {
    uss += `\n/* SVG captures — paths relative to this .uss file */\n`;
    for (const dim of svgDimensions) {
      // Fall back to non-zero defaults so Unity's asset path resolver doesn't warn
      const w = dim.width > 0 ? dim.width : 24;
      const h = dim.height > 0 ? dim.height : 24;
      uss += `.uxlora-svg-${dim.index} {\n    width: ${w}px;\n    height: ${h}px;\n    background-image: url("./assets/svg_${dim.index}.png");\n    -unity-background-scale-mode: scale-to-fit;\n}\n\n`;
    }
  }

  return uss;
}

function generateUXML(
  $: ReturnType<typeof import("cheerio").load>,
  screenName: string,
  filePrefix: string
): string {
  const sanitizedName = screenName.replace(/[^a-zA-Z0-9]/g, "_");
  const rootChildren = $.root().children().toArray();
  let childrenUXML = "";

  for (const el of rootChildren) {
    childrenUXML += convertElementToUXML($(el), $, 2);
  }

  if (!childrenUXML.trim()) {
    childrenUXML = `    <VisualElement name="content" />\n`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<UXML
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="UnityEngine.UIElements"
  xmlns:editor="UnityEditor.UIElements"
  xsi:noNamespaceSchemaLocation="../UIElementsSchema/UIElements.xsd"
>
  <Style src="${filePrefix}.uss" />
  <VisualElement name="${sanitizedName}-root" class="screen">
${childrenUXML}  </VisualElement>
</UXML>`;
}

function convertElementToUXML(
  element: ReturnType<ReturnType<typeof import("cheerio").load>>,
  $: ReturnType<typeof import("cheerio").load>,
  indentLevel: number
): string {
  const spaces = "  ".repeat(indentLevel);
  const tag = (element.prop("tagName") as string | undefined)?.toLowerCase() ?? "div";

  if (tag === "script" || tag === "style" || tag === "head") return "";

  // SVG → VisualElement carrying the uxlora-svg-N class injected during pre-processing.
  // We don't recurse into SVG children — they're captured as a single PNG.
  if (tag === "svg") {
    const cls = element.attr("class") ?? "";
    return `${spaces}<VisualElement class="${cls.trim()}" />\n`;
  }

  const className = element.attr("class") ?? "";
  const id = element.attr("id") ?? "";
  const dataUxlora = element.attr("data-uxlora") ?? "";

  const directText = element
    .clone()
    .children()
    .remove()
    .end()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  const tagMap: Record<string, string> = {
    div: "VisualElement", section: "VisualElement", article: "VisualElement",
    header: "VisualElement", footer: "VisualElement", nav: "VisualElement",
    main: "VisualElement", aside: "VisualElement", form: "VisualElement",
    span: "Label", p: "Label",
    h1: "Label", h2: "Label", h3: "Label", h4: "Label", h5: "Label", h6: "Label",
    label: "Label",
    button: "Button",
    input: "TextField", textarea: "TextField",
    select: "DropdownField",
    img: "VisualElement",
    ul: "VisualElement", ol: "VisualElement", li: "VisualElement",
    a: "Button",
    strong: "Label", em: "Label", small: "Label",
  };

  const uxmlTag = tagMap[tag] ?? "VisualElement";

  const attrs: string[] = [];
  if (className) {
    const classes = className.split(" ").filter(Boolean).join(" ");
    attrs.push(`class="${classes}"`);
  }
  if (id) {
    attrs.push(`name="${id}"`);
  } else if (dataUxlora) {
    // Use data-uxlora as the inspector name when no id is set
    attrs.push(`name="${dataUxlora.replace(/:/g, "_")}"`);
  }

  const isTextElement = uxmlTag === "Label" || uxmlTag === "Button";
  if (isTextElement && directText) {
    const safeText = directText
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .slice(0, 100);
    attrs.push(`text="${safeText}"`);
  }

  const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : "";

  const children = element.children().toArray();
  const childrenUXML = children
    .map((child) => convertElementToUXML($(child), $, indentLevel + 1))
    .join("");

  if (!childrenUXML.trim() || isTextElement || uxmlTag === "TextField") {
    return `${spaces}<${uxmlTag}${attrStr} />\n`;
  }

  return `${spaces}<${uxmlTag}${attrStr}>\n${childrenUXML}${spaces}</${uxmlTag}>\n`;
}

// Kept for backward compatibility with the old export route — no-op now.
export function patchUSSWithSVGImages(uss: string): string {
  return uss;
}