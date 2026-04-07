/**
 * UXML + USS Converter — Session 9
 * Converts HTML/CSS screens to Unity UXML + USS format.
 */

export interface UXMLResult {
  uxml: string;
  uss: string;
}

/**
 * Convert an HTML/CSS screen to Unity UXML + USS.
 */
export async function convertToUXML(
  htmlCss: string,
  screenName: string,
  filePrefix: string
): Promise<UXMLResult> {
  const cheerio = await import("cheerio");
  // Decode Unicode escapes that may be present from JSON storage
  const decodedHtml = htmlCss
    .replace(/\\u003C/gi, "<")
    .replace(/\\u003E/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u0022/gi, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
    // Extract body content directly via regex — cheerio drops body children
  // when HTML contains complex CSS with special characters
  const bodyMatch = decodedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : decodedHtml;
  const $ = cheerio.load(bodyContent, {
    xmlMode: false,
  });

  // Extract CSS from style tags
  const cssContent = $("style").text();

  // Generate USS
  const uss = generateUSS(cssContent, screenName);

  // Generate UXML — reference the numbered USS file
  const uxml = generateUXML($, screenName, filePrefix);

  return { uxml, uss };
}

/**
 * Generate Unity USS from CSS.
 * Strips all web-only CSS that Unity doesn't support.
 */
function generateUSS(css: string, screenName: string): string {
  let cleanCss = css;

  // Strip @import statements (Google Fonts etc) — Unity doesn't support
  cleanCss = cleanCss.replace(/@import[^;]+;/g, "");

  // Strip @font-face blocks
  cleanCss = cleanCss.replace(/@font-face\s*\{[^}]*\}/g, "");

  // Strip @keyframes blocks
  cleanCss = cleanCss.replace(/@keyframes[\s\S]*?\{[\s\S]*?\}\s*\}/g, "");

  // Strip :root variables block
  cleanCss = cleanCss.replace(/:root\s*\{[^}]*\}/g, "");

  // Strip CSS comments
  cleanCss = cleanCss.replace(/\/\*[\s\S]*?\*\//g, "");

  // Strip animation and transition properties (not supported in USS)
  cleanCss = cleanCss.replace(/\s*animation[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*transition[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*-webkit-[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*-moz-[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*-ms-[^;]*;/g, "");

  // Strip filter and backdrop-filter (not supported)
  cleanCss = cleanCss.replace(/\s*filter[^;]*;/g, "");
  cleanCss = cleanCss.replace(/\s*backdrop-filter[^;]*;/g, "");

  // Strip box-shadow with complex values (Unity has limited support)
  // Keep only simple box-shadows
  cleanCss = cleanCss.replace(/\s*box-shadow:\s*[^;]*inset[^;]*;/g, "");

  // Convert CSS variables to their fallback values or remove
  cleanCss = cleanCss.replace(/var\(--[^,)]+,?\s*([^)]*)\)/g, (_, fallback) => {
    return fallback.trim() || "transparent";
  });
  cleanCss = cleanCss.replace(/var\(--[^)]+\)/g, "transparent");

  // Strip pseudo-selectors that USS doesn't support
  cleanCss = cleanCss.replace(/[^{]*:(?:hover|focus|active|before|after|nth-child|first-child|last-child)[^{]*\{[^}]*\}/g, "");
  cleanCss = cleanCss.replace(/[^{]*::(?:before|after)[^{]*\{[^}]*\}/g, "");

  // USS-compatible properties only
  // CSS to USS property name mapping
  const propertyRemap: Record<string, string> = {
    "font-weight": "-unity-font-style",
    "text-align": "-unity-text-align",
    "font-style": "-unity-font-style",
  };

  // USS-compatible properties only
  const allowedProperties = new Set([
    "background-color",
    "color",
    "font-size",
    "-unity-font-style",
    "-unity-text-align",
    "-unity-background-scale-mode",
    "padding",
    "padding-top",
    "padding-bottom",
    "padding-left",
    "padding-right",
    "margin",
    "margin-top",
    "margin-bottom",
    "margin-left",
    "margin-right",
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-width",
    "border-color",
    "border-top-width",
    "border-bottom-width",
    "border-left-width",
    "border-right-width",
    "flex-direction",
    "flex-wrap",
    "flex",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "align-items",
    "align-self",
    "align-content",
    "justify-content",
    "position",
    "top",
    "bottom",
    "left",
    "right",
    "overflow",
    "opacity",
    "white-space",
    "letter-spacing",
  ]);

  // font-weight values mapping for -unity-font-style
  function mapFontWeight(val: string): string {
    const w = parseInt(val);
    if (w >= 700) return "bold";
    if (w >= 600) return "semi-bold";
    return "normal";
  }

  // text-align values mapping for -unity-text-align
  function mapTextAlign(val: string): string {
    const map: Record<string, string> = {
      "left": "upper-left",
      "center": "upper-center",
      "right": "upper-right",
      "justify": "upper-left",
    };
    return map[val.trim()] ?? "upper-left";
  }

  let uss = `/* Unity USS for ${screenName} */\n/* Generated by UXLora — web-only CSS has been removed */\n\n`;

  // Extract and filter CSS rules
  const ruleRegex = /([^{}@]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    let selector = match[1].trim();
    const declarations = match[2].trim();

    if (!selector || selector.includes("@")) continue;

    // Skip SVG selectors — Unity doesn't support SVG in USS
    if (selector.includes("svg") || selector.includes("path") ||
        selector.includes("circle") || selector.includes("rect") ||
        selector.includes("polygon") || selector.includes("polyline")) continue;

    // Skip complex selectors Unity doesn't support
    if (
      selector.includes(":") ||
      selector.includes(">") ||
      selector.includes("+") ||
      selector.includes("~") ||
      selector.includes("[")
    ) continue;

    // Fix multi-class selectors — ".side-deco left" → ".side-deco.left"
    // CSS uses spaces between classes but USS requires dots
    selector = selector.replace(/\.([\w-]+)\s+([\w-]+)/g, ".$1.$2");

    // Fix descendant selectors — "parent child" → "parent .child"  
    selector = selector.replace(/\s+([a-zA-Z][\w-]*)/g, " .$1");

    // Clean up double dots
    selector = selector.replace(/\.{2,}/g, ".");

    // Filter declarations to USS-compatible only
    const ussDeclarations: string[] = [];
    const declarationRegex = /([\w-]+)\s*:\s*([^;]+);/g;
    let declMatch;

   while ((declMatch = declarationRegex.exec(declarations)) !== null) {
      const prop = declMatch[1].trim().toLowerCase();
      let val = declMatch[2].trim();

      // Remap CSS properties to USS equivalents
      let ussProp = propertyRemap[prop] ?? prop;

      // Only include USS-compatible properties
      if (!allowedProperties.has(ussProp)) continue;

      // Convert viewport units to % (Unity doesn't support vh/vw)
      val = val.replace(/(\d*\.?\d+)vh/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)vw/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)vmin/g, (_, n) => `${n}%`);
      val = val.replace(/(\d*\.?\d+)vmax/g, (_, n) => `${n}%`);

      // Convert em/rem to px
      val = val.replace(/(\d*\.?\d+)em/g, (_, n) => `${Math.round(parseFloat(n) * 16)}px`);
      val = val.replace(/(\d*\.?\d+)rem/g, (_, n) => `${Math.round(parseFloat(n) * 16)}px`);
      // In USS, background-color is correct — but many CSS rules use
      // shorthand 'background' which we should map to background-color
      if (prop === "background" && !val.includes("gradient") && !val.includes("url(")) {
        ussProp = "background-color";
      }
      // Skip gradient values
      if (val.includes("gradient")) continue;

      // Skip url() values except for assets
      if (val.includes("url(") && !val.includes(".png") && !val.includes(".jpg")) continue;

      // Skip calc()
      if (val.includes("calc(")) continue;

      // Convert rgba to Unity format
      val = val.replace(
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g,
        (_, r, g, b, a) => {
          const alpha = Math.round(parseFloat(a) * 255);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      );

      // Convert display: block to display: flex (Unity only supports flex/none)
      if (ussProp === "display") {
        if (val === "block" || val === "inline-block" || val === "inline") {
          val = "flex";
        }
        if (val !== "flex" && val !== "none") continue;
      }

      // Convert cursor: pointer to cursor: link
      if (ussProp === "cursor" && val === "pointer") {
        val = "link";
      }

      // Convert font-weight to -unity-font-style value
      if (prop === "font-weight") {
        val = mapFontWeight(val);
      }

      // Convert text-align to -unity-text-align value
      if (prop === "text-align") {
        val = mapTextAlign(val);
      }

      // Skip line-height (not supported in USS)
      if (prop === "line-height") continue;

      ussDeclarations.push(`    ${ussProp}: ${val};`);
    }

    if (ussDeclarations.length > 0) {
      uss += `.${selector.replace(/\./g, "").trim()} {\n${ussDeclarations.join("\n")}\n}\n\n`;
    }
  }

  return uss;
}

/**
 * Generate Unity UXML from parsed HTML.
 * filePrefix is the numbered name e.g. "03_Pause_Menu"
 */
function generateUXML(
  $: ReturnType<typeof import("cheerio").load>,
  screenName: string,
  filePrefix: string
): string {
  const sanitizedName = screenName.replace(/[^a-zA-Z0-9]/g, "_");
    // DEBUG — remove after fixing
  // Build UXML elements from body
 // We load body content directly so use root children
  const rootChildren = $.root().children().toArray();
  let childrenUXML = "";

  for (const el of rootChildren) {
    childrenUXML += convertElementToUXML($(el), $, 2);
  }

  // If still empty, create a placeholder
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
  <!-- Generated by UXLora for screen: ${screenName} -->
  <Style src="${filePrefix}.uss" />
  <VisualElement name="${sanitizedName}-root" class="screen">
${childrenUXML}  </VisualElement>
</UXML>`;
}

/**
 * Recursively convert HTML element to UXML.
 */
function convertElementToUXML(
  element: ReturnType<ReturnType<typeof import("cheerio").load>>,
  $: ReturnType<typeof import("cheerio").load>,
  indentLevel: number
): string {
  const spaces = "  ".repeat(indentLevel);
  const tag = (element.prop("tagName") as string | undefined)?.toLowerCase() ?? "div";

  // Skip script and style tags
  if (tag === "script" || tag === "style" || tag === "head") return "";

  const className = element.attr("class") ?? "";
  const id = element.attr("id") ?? "";

  // Get direct text content only (not children text)
  const directText = element
    .clone()
    .children()
    .remove()
    .end()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  // Map HTML tags to UXML
  const tagMap: Record<string, string> = {
    div: "VisualElement",
    section: "VisualElement",
    article: "VisualElement",
    header: "VisualElement",
    footer: "VisualElement",
    nav: "VisualElement",
    main: "VisualElement",
    aside: "VisualElement",
    form: "VisualElement",
    span: "Label",
    p: "Label",
    h1: "Label",
    h2: "Label",
    h3: "Label",
    h4: "Label",
    h5: "Label",
    h6: "Label",
    label: "Label",
    button: "Button",
    input: "TextField",
    textarea: "TextField",
    select: "DropdownField",
    img: "VisualElement",
    ul: "VisualElement",
    ol: "VisualElement",
    li: "VisualElement",
    a: "Button",
    strong: "Label",
    em: "Label",
    small: "Label",
    svg: "VisualElement",
  };

  const uxmlTag = tagMap[tag] ?? "VisualElement";

  // Build attributes
  const attrs: string[] = [];
  if (className) {
    const classes = className.split(" ").filter(Boolean).slice(0, 3).join(" ");
    attrs.push(`class="${classes}"`);
  }
  if (id) attrs.push(`name="${id}"`);

  // Add text for label/button elements
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

  // Get children
  const children = element.children().toArray();
  const childrenUXML = children
    .map((child) => convertElementToUXML($(child), $, indentLevel + 1))
    .join("");

  // Self-closing if no children or is a text/input element
  if (!childrenUXML.trim() || isTextElement || uxmlTag === "TextField") {
    return `${spaces}<${uxmlTag}${attrStr} />\n`;
  }

  return `${spaces}<${uxmlTag}${attrStr}>\n${childrenUXML}${spaces}</${uxmlTag}>\n`;
}

/**
 * Patch USS to add background-image references for captured SVG elements.
 * Called after SVG capture to wire up the PNG assets.
 */
export function patchUSSWithSVGImages(
  uss: string,
  svgCaptures: Array<{ className: string }>,
  screenPrefix: string
): string {
  if (!svgCaptures || svgCaptures.length === 0) return uss;

  let patched = uss;

  for (const capture of svgCaptures) {
    const className = capture.className;
    const imagePath = `project://database/Assets/UI/Screens/${screenPrefix}/assets/${className}.png`;

    // Check if class already exists in USS
    const classRegex = new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`, "g");

    if (classRegex.test(patched)) {
      // Add background-image to existing class
      patched = patched.replace(
        new RegExp(`(\\.${className}\\s*\\{)([^}]*)(\\})`, "g"),
        `$1$2    background-image: url("${imagePath}");\n$3`
      );
    } else {
      // Add new class with background-image
      patched += `\n.${className} {\n    background-image: url("${imagePath}");\n    -unity-background-scale-mode: scale-to-fit;\n}\n`;
    }
  }

  return patched;
}