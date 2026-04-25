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
  uxmlNameCounter = {};
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
  const styleMatches = decodedHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const cssContent = Array.from(styleMatches).map(m => m[1]).join("\n");

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
  cleanCss = cleanCss.replace(/[^{]*:(?:hover|focus|before|after|nth-child|first-child|last-child)\b[^{]*\{[^}]*\}/g, "");
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
    "background-image", "display", "gap", "row-gap", "column-gap",
  ]);

  function mapFontWeight(val: string): string {
    const w = parseInt(val);
    if (w >= 600) return "bold";
    return "normal";
  }
  function mapTextAlign(val: string): string {
    const map: Record<string, string> = {
      left: "upper-left", center: "upper-center", right: "upper-right", justify: "upper-left",
    };
    return map[val.trim()] ?? "upper-left";
  }
  function pxFromGap(val: string): number {
    const m = val.match(/(\d+(?:\.\d+)?)px/);
    return m ? parseFloat(m[1]) : 0;
  }

  let uss = `/* Unity USS for ${screenName} */\n/* Generated by UXLora — Unity 6 compatible */\n\n`;

  // Track gap values per selector so we can emit margin compensation rules later
  const selectorGaps: Array<{ selector: string; gap: number; isRow: boolean; isColumn: boolean }> = [];

  const ruleRegex = /([^{}@]+)\{([^}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    let selector = match[1].trim();
    const declarations = match[2].trim();
    if (!selector || selector.includes("@")) continue;

    if (/\b(svg|path|circle|rect|polygon|polyline|line|defs|pattern)\b/i.test(selector)) continue;
    if (/[>+~\[]/.test(selector)) continue;
    if (selector === "*" || selector.includes("*")) continue;
    if (selector.includes(":not(") || selector.includes(":hover") || selector.includes(":focus") || selector.includes(":active") || selector.includes("::")) continue;
    if (!selector.includes(".") && !selector.includes("#")) continue;

    const selectors = selector.split(",").map(s => s.trim()).filter(Boolean);
    const validSelectors: string[] = [];

    for (const sel of selectors) {
      const parts = sel.split(/\s+/).filter(Boolean);
      const transformedParts: string[] = [];
      let valid = true;
      for (const part of parts) {
        if (!part.startsWith(".") && !part.startsWith("#")) {
          valid = false;
          break;
        }
        transformedParts.push(part);
      }
      if (valid && transformedParts.length > 0) {
        validSelectors.push(transformedParts.join(" "));
      }
    }

    if (validSelectors.length === 0) continue;
    const finalSelector = validSelectors.join(", ");

    const ussDeclarations: string[] = [];
    let detectedFlexDirection: "row" | "column" | null = null;
    let detectedGap = 0;

    // Use regex that matches last property even without trailing semicolon
    const declarationRegex = /([\w-]+)\s*:\s*([^;}]+)\s*(?:;|(?=}))/g;
    let dm;
    while ((dm = declarationRegex.exec(declarations)) !== null) {
      const prop = dm[1].trim().toLowerCase();
      let val = dm[2].trim();

      // Detect flex-direction for gap compensation later
      if (prop === "flex-direction") {
        if (val === "row" || val === "row-reverse") detectedFlexDirection = "row";
        else if (val === "column" || val === "column-reverse") detectedFlexDirection = "column";
      }

      // Detect gap — record for margin compensation, don't emit (USS doesn't support gap)
      if (prop === "gap" || prop === "row-gap" || prop === "column-gap") {
        detectedGap = pxFromGap(val);
        continue;
      }

      // Skip USS-incompatible properties silently
      if (prop === "z-index") continue;
      if (prop === "outline" || prop === "outline-offset" || prop === "outline-width" || prop === "outline-color" || prop === "outline-style") continue;
      if (prop === "box-shadow" || prop === "text-shadow") continue;
      if (prop === "cursor") continue;
      if (prop === "pointer-events") continue;
      if (prop === "line-height") continue;
      if (prop === "font-family") continue;
      // Skip default/redundant values
      if (prop === "position" && val.trim() === "relative") continue;
      if (prop === "overflow" && val.trim() === "visible") continue;
      if ((prop === "min-width" || prop === "min-height") && (val.trim() === "0" || val.trim() === "0px")) continue;
      // Expand `flex` shorthand into flex-grow/flex-shrink/flex-basis
      if (prop === "flex") {
        const flexParts = val.trim().split(/\s+/);
        if (flexParts.length === 1 && /^\d+$/.test(flexParts[0])) {
          ussDeclarations.push(`    flex-grow: ${flexParts[0]};`);
          ussDeclarations.push(`    flex-shrink: 1;`);
          ussDeclarations.push(`    flex-basis: 0;`);
          continue;
        }
        if (flexParts.length === 3) {
          ussDeclarations.push(`    flex-grow: ${flexParts[0]};`);
          ussDeclarations.push(`    flex-shrink: ${flexParts[1]};`);
          ussDeclarations.push(`    flex-basis: ${flexParts[2]};`);
          continue;
        }
        continue;
      }

      if (prop === "border" || prop === "border-top" || prop === "border-right" || prop === "border-bottom" || prop === "border-left") {
        if (val.includes("gradient") || val.includes("calc(")) continue;
        const fullMatch = val.match(/(\d+(?:\.\d+)?)px\s+\w+\s+(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
        const widthOnlyMatch = !fullMatch ? val.match(/(\d+(?:\.\d+)?)px\s+\w+/) : null;
        const bw = fullMatch?.[1] ?? widthOnlyMatch?.[1];
        const bc = fullMatch?.[2];
        if (bw) {
          if (prop === "border") {
            ussDeclarations.push(`    border-width: ${bw}px;`);
          } else {
            const side = prop.replace("border-", "");
            ussDeclarations.push(`    border-${side}-width: ${bw}px;`);
          }
          if (bc && !ussDeclarations.some(d => d.includes("border-color"))) {
            ussDeclarations.push(`    border-color: ${bc};`);
          }
        }
        continue;
      }

      let ussProp = propertyRemap[prop] ?? prop;

      // background shorthand → background-color
      if (prop === "background") {
        if (val.includes("gradient")) continue;
        if (val.includes("url(") && !val.includes(".png") && !val.includes(".jpg")) continue;
        ussProp = "background-color";
        const colorMatch = val.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
        if (colorMatch) val = colorMatch[0];
        else continue;
      }

      if (!allowedProperties.has(ussProp)) continue;

      val = val.replace(/(\d*\.?\d+)vh/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)vw/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)em/g, (_, n) => `${Math.round(parseFloat(n) * 16)}px`);
      val = val.replace(/(\d*\.?\d+)rem/g, (_, n) => `${Math.round(parseFloat(n) * 16)}px`);

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

      // display: block/inline/inline-block → flex (USS only supports flex/none)
      if (ussProp === "display") {
        if (val === "block" || val === "inline-block" || val === "inline") val = "flex";
        if (val !== "flex" && val !== "none") continue;
      }
      if (prop === "font-weight") val = mapFontWeight(val);
      if (prop === "text-align") val = mapTextAlign(val);

      ussDeclarations.push(`    ${ussProp}: ${val};`);
    }

    if (ussDeclarations.length > 0) {
      uss += `${finalSelector} {\n${ussDeclarations.join("\n")}\n}\n\n`;

      // Track gap per selector for margin compensation
      if (detectedGap > 0) {
        // If flex-direction not detected here, default to column (USS default for VisualElement)
        const isRow = detectedFlexDirection === "row";
        const isColumn = detectedFlexDirection === "column" || detectedFlexDirection === null;
        for (const sel of validSelectors) {
          selectorGaps.push({ selector: sel, gap: detectedGap, isRow, isColumn });
        }
      }
    }
  }

  // gap is silently dropped — Unity 6 USS supports 'gap' natively on flex
  // containers. Re-emit each tracked gap as a real `gap` declaration on the
  // selector itself.
  if (selectorGaps.length > 0) {
    uss += `\n/* Gap rules (Unity 6 USS supports gap on flex) */\n`;
    const seen = new Set<string>();
    for (const { selector, gap } of selectorGaps) {
      const key = `${selector}|${gap}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uss += `${selector} {\n    gap: ${gap}px;\n}\n\n`;
    }
  }

  // SVG image rules
  if (svgDimensions.length > 0) {
    uss += `\n/* SVG captures — paths relative to this .uss file */\n`;
    for (const dim of svgDimensions) {
      const hasDims = dim.width > 0 && dim.height > 0;
      let rule = `.uxlora-svg-${dim.index} {\n`;
      if (hasDims) {
        rule += `    width: ${dim.width}px;\n    height: ${dim.height}px;\n`;
      }
      rule += `    background-image: url("./assets/svg_${dim.index}.png");\n    -unity-background-scale-mode: scale-to-fit;\n}\n\n`;
      uss += rule;
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

let uxmlNameCounter: Record<string, number> = {};

function convertElementToUXML(
  element: ReturnType<ReturnType<typeof import("cheerio").load>>,
  $: ReturnType<typeof import("cheerio").load>,
  indentLevel: number
): string {
  const spaces = "  ".repeat(indentLevel);
  const tag = (element.prop("tagName") as string | undefined)?.toLowerCase() ?? "div";

  if (tag === "script" || tag === "style" || tag === "head") return "";

  if (tag === "svg") {
    const cls = element.attr("class") ?? "";
    return `${spaces}<VisualElement class="${cls.trim()}" />\n`;
  }

  let className = element.attr("class") ?? "";
  const id = element.attr("id") ?? "";
  const dataUxlora = element.attr("data-uxlora") ?? "";

  // Strip duplicate "screen" class on nested elements (only top-level root has it)
  if (className.includes("screen") && indentLevel > 2) {
    className = className.replace(/\bscreen\b/g, "").replace(/\s+/g, " ").trim();
  }

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
    button: "VisualElement",  // changed: button has children, use VisualElement
    a: "VisualElement",       // changed: a has children, use VisualElement
    input: "TextField", textarea: "TextField",
    select: "DropdownField",
    img: "VisualElement",
    ul: "VisualElement", ol: "VisualElement", li: "VisualElement",
    strong: "Label", em: "Label", small: "Label",
  };

  const uxmlTag = tagMap[tag] ?? "VisualElement";

  const attrs: string[] = [];
  if (className) {
    const classes = className.split(" ").filter(Boolean).join(" ");
    if (classes) attrs.push(`class="${classes}"`);
  }
  if (id) {
    attrs.push(`name="${id}"`);
  } else if (dataUxlora) {
    const baseName = dataUxlora.replace(/:/g, "_");
    uxmlNameCounter[baseName] = (uxmlNameCounter[baseName] ?? 0) + 1;
    const suffix = uxmlNameCounter[baseName] > 1 ? `_${uxmlNameCounter[baseName]}` : "";
    attrs.push(`name="${baseName}${suffix}"`);
  }

  const isTextElement = uxmlTag === "Label" || uxmlTag === "Button";
  if (isTextElement && directText) {
    // Decode then re-encode to avoid double-escaping
    const decoded = directText
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
    const safeText = decoded
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