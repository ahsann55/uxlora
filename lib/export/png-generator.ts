import { createClient } from "@supabase/supabase-js";

/**
 * PNG Export — handled client-side via html-to-image.
 * These stubs maintain API compatibility with the export route.
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

export async function generateScreenPNGs(
  screenId: string,
  _kitId: string,
  screenName: string,
  _htmlCss: string,
  _category: string
): Promise<ScreenPNGResult> {
  return {
    screenId,
    screenName,
    fullScreenUrl: "",
    elementUrls: [],
  };
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
): Promise<Array<{ className: string; buffer: Buffer }>> {
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