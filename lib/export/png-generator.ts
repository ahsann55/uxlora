import { createClient } from "@supabase/supabase-js";

/**
 * PNG Export — handled client-side via html-to-image.
 * SVG capture also handled client-side, then uploaded to Supabase storage
 * for UXML export to reference.
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

export interface SVGCapture {
  className: string;
  width: number;
  height: number;
  buffer: Buffer;
}

export async function generateScreenPNGs(
  screenId: string,
  _kitId: string,
  screenName: string,
  _htmlCss: string,
  _category: string
): Promise<ScreenPNGResult> {
  return { screenId, screenName, fullScreenUrl: "", elementUrls: [] };
}

export async function generateKitPNGs(
  _kitId: string,
  _category: string,
  _screens: Array<{ id: string; name: string; html_css: string | null }>
): Promise<ScreenPNGResult[]> {
  return [];
}

export async function captureSVGElements(
  _htmlCss: string,
  _category: string
): Promise<SVGCapture[]> {
  return [];
}

export async function generatePNG(
  screenId: string,
  _kitId: string,
  screenName: string,
  _htmlCss: string,
  _category: string
): Promise<string> {
  return "";
}

/**
 * Upload an array of SVG capture PNGs (client-captured) to Supabase storage
 * under the kit's UXML asset folder. Returns the storage paths keyed by index.
 */
export async function uploadSVGCapturesToStorage(
  kitId: string,
  screenPrefix: string,
  captures: Array<{ index: number; base64: string }>
): Promise<Array<{ index: number; path: string }>> {
  const admin = getAdminClient();
  const results: Array<{ index: number; path: string }> = [];

  for (const cap of captures) {
    const buffer = Buffer.from(cap.base64.replace(/^data:image\/png;base64,/, ""), "base64");
    const path = `kits/${kitId}/uxml/${screenPrefix}/svg_${cap.index}.png`;
    const { error } = await admin.storage
      .from("exports")
      .upload(path, buffer, { contentType: "image/png", upsert: true });
    if (!error) results.push({ index: cap.index, path });
  }

  return results;
}