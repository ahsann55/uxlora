import { createClient } from "@supabase/supabase-js";
import path from "path";

/**
 * PNG Export — Session 9
 * Generates full screen PNG + individual element PNGs using Playwright + @sparticuz/chromium.
 */

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface ScreenPNGResult {
  screenId: string;
  screenName: string;
  fullScreenUrl: string;
  elementUrls: Array<{ name: string; url: string }>;
}

export interface PNGGenerationResult {
  screenId: string;
  pngUrl: string;
}

const ELEMENT_SELECTORS = [
  { selector: "button, .btn, [class*='btn-']", prefix: "button" },
  { selector: "input, textarea, select", prefix: "input" },
  { selector: "h1, h2, h3, .title, .logo-title, [class*='title']", prefix: "heading" },
  { selector: "nav, .nav, [class*='nav-']", prefix: "nav" },
  { selector: ".card, [class*='card']", prefix: "card" },
  { selector: "img, .icon, [class*='icon']", prefix: "icon" },
  { selector: ".header, header", prefix: "header" },
  { selector: ".footer, footer", prefix: "footer" },
  { selector: ".menu, [class*='menu-']", prefix: "menu" },
  { selector: ".bar, [class*='-bar']", prefix: "bar" },
];

async function launchBrowser() {
  const chromium = await import("@sparticuz/chromium");
  const { chromium: playwrightChromium } = await import("playwright-core");

  const executablePath = await chromium.default.executablePath();

  // Set LD_LIBRARY_PATH so Chromium can find shared libraries on Vercel AL2023
  const execDir = path.dirname(executablePath);
  process.env.LD_LIBRARY_PATH = execDir;

  console.log(`Launching browser: executablePath=${executablePath}`);

  const browser = await playwrightChromium.launch({
    args: [
      ...chromium.default.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
    ],
    executablePath,
    headless: true,
  });

  return browser;
}

export async function generateScreenPNGs(
  screenId: string,
  kitId: string,
  screenName: string,
  htmlCss: string,
  category: string
): Promise<ScreenPNGResult> {
  const isMobile = category === "mobile" || category === "game";
  const viewport = isMobile
    ? { width: 390, height: 844 }
    : { width: 1440, height: 900 };

  const browser = await launchBrowser();
  const adminSupabase = getAdminClient();
  const sanitizedScreenName = screenName.replace(/[^a-zA-Z0-9]/g, "_");
  const basePath = `kits/${kitId}/screens/${sanitizedScreenName}`;

  const elementUrls: Array<{ name: string; url: string }> = [];
  let fullScreenUrl = "";

  try {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: isMobile ? 2 : 1,
    });
    const page = await context.newPage();

    await page.setContent(htmlCss, { waitUntil: "networkidle" });

    // Wait for fonts and animations to settle
    await page.waitForTimeout(1500);

    // --------------------------------------------------------
    // 1. Full screen screenshot
    // --------------------------------------------------------
    const fullScreenBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    const fullScreenPath = `${basePath}/full_screen.png`;
    await adminSupabase.storage
      .from("exports")
      .upload(fullScreenPath, fullScreenBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    const { data: fullScreenSigned } = await adminSupabase.storage
      .from("exports")
      .createSignedUrl(fullScreenPath, 60 * 60 * 24 * 365);

    fullScreenUrl = fullScreenSigned?.signedUrl ?? "";

    // Update screen png_url
    await adminSupabase
      .from("screens")
      .update({
        png_url: fullScreenUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", screenId);

    // --------------------------------------------------------
    // 2. Individual element screenshots
    // --------------------------------------------------------
    const elementCounters: Record<string, number> = {};

    for (const { selector, prefix } of ELEMENT_SELECTORS) {
      try {
        const elements = await page.$$(selector);

        for (const element of elements.slice(0, 5)) {
          try {
            const box = await element.boundingBox();
            if (!box || box.width < 10 || box.height < 10) continue;
            if (box.x < 0 || box.y < 0) continue;
            if (
              box.x + box.width > viewport.width * 2 ||
              box.y + box.height > viewport.height * 2
            ) continue;

            const elementBuffer = await element.screenshot({ type: "png" });

            elementCounters[prefix] = (elementCounters[prefix] ?? 0) + 1;
            const count = elementCounters[prefix];
            const elementName = `${prefix}_${count}`;
            const elementPath = `${basePath}/${elementName}.png`;

            await adminSupabase.storage
              .from("exports")
              .upload(elementPath, elementBuffer, {
                contentType: "image/png",
                upsert: true,
              });

            const { data: elementSigned } = await adminSupabase.storage
              .from("exports")
              .createSignedUrl(elementPath, 60 * 60 * 24 * 365);

            if (elementSigned?.signedUrl) {
              elementUrls.push({ name: elementName, url: elementSigned.signedUrl });
            }
          } catch {
            // Skip elements that can't be captured
          }
        }
      } catch {
        // Skip selectors that don't match
      }
    }

    await context.close();
  } finally {
    await browser.close();
  }

  return { screenId, screenName, fullScreenUrl, elementUrls };
}

export async function generateKitPNGs(
  kitId: string,
  category: string,
  screens: Array<{ id: string; name: string; html_css: string | null }>
): Promise<ScreenPNGResult[]> {
  const results: ScreenPNGResult[] = [];

  console.log(`generateKitPNGs called: kitId=${kitId}, category=${category}, screens=${screens.length}`);

  for (const screen of screens) {
    if (!screen.html_css) {
      console.log(`Skipping screen ${screen.name} — no html_css`);
      continue;
    }

    console.log(`Starting PNG generation for screen: ${screen.name}`);

    try {
      const result = await generateScreenPNGs(
        screen.id,
        kitId,
        screen.name,
        screen.html_css,
        category
      );
      results.push(result);
      console.log(`PNG generated for ${screen.name}: fullScreenUrl=${result.fullScreenUrl}, elements=${result.elementUrls.length}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : "";
      console.error(`PNG generation failed for ${screen.name}: ${msg}`);
      console.error(`Stack: ${stack}`);
    }
  }

  console.log(`generateKitPNGs complete: ${results.length} screens processed`);
  return results;
}

export async function captureSVGElements(
  htmlCss: string,
  category: string
): Promise<Array<{ className: string; buffer: Buffer }>> {
  const isMobile = category === "mobile" || category === "game";
  const viewport = isMobile
    ? { width: 390, height: 844 }
    : { width: 1440, height: 900 };

  const browser = await launchBrowser();
  const results: Array<{ className: string; buffer: Buffer }> = [];

  try {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: isMobile ? 2 : 1,
    });
    const page = await context.newPage();

    await page.setContent(htmlCss, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const svgContainers = await page.evaluate(() => {
      const containers: Array<{ className: string; selector: string }> = [];
      const elements = document.querySelectorAll("*");

      elements.forEach((el) => {
        if (el.querySelector("svg")) {
          const className = el.className;
          if (className && typeof className === "string" && className.trim()) {
            const firstClass = className.trim().split(" ")[0];
            if (firstClass && !containers.find((c) => c.className === firstClass)) {
              containers.push({ className: firstClass, selector: `.${firstClass}` });
            }
          }
        }
      });

      return containers.slice(0, 20);
    });

    for (const container of svgContainers) {
      try {
        const element = await page.$(container.selector);
        if (!element) continue;

        const box = await element.boundingBox();
        if (!box || box.width < 5 || box.height < 5) continue;

        const buffer = Buffer.from(await element.screenshot({ type: "png" }));
        results.push({ className: container.className, buffer });
      } catch {
        // Skip elements that can't be captured
      }
    }

    await context.close();
  } finally {
    await browser.close();
  }

  return results;
}

export async function generatePNG(
  screenId: string,
  kitId: string,
  screenName: string,
  htmlCss: string,
  category: string
): Promise<string> {
  const result = await generateScreenPNGs(screenId, kitId, screenName, htmlCss, category);
  return result.fullScreenUrl;
}