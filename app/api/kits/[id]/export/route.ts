import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateKitPNGs } from "@/lib/export/png-generator";
import { convertToUXML } from "@/lib/export/uxml-converter";
import { createKitZip, createUXMLZip } from "@/lib/export/zip-generator";
import type { Database } from "@/lib/supabase/types";

type Kit = Database["public"]["Tables"]["kits"]["Row"];
type Screen = Database["public"]["Tables"]["screens"]["Row"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kitId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse export type
    const body = await request.json() as { type: "png" | "uxml" | "all" };
    const { type } = body;

    if (!type || !["png", "uxml", "figma", "all"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid export type. Use: png, uxml, figma, or all" },
        { status: 400 }
      );
    }

    // Fetch kit — verify ownership
    const { data: kitData } = await supabase
      .from("kits")
      .select("*")
      .eq("id", kitId)
      .eq("user_id", user.id)
      .single();

    const kit = kitData as Kit | null;

    if (!kit) {
      return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    // Demo kits cannot export
    if (kit.is_demo) {
      return NextResponse.json(
        { error: "Upgrade your plan to export UI kits." },
        { status: 402 }
      );
    }

    // Kit must be complete
    if (kit.status !== "complete") {
      return NextResponse.json(
        { error: "Kit generation must be complete before exporting." },
        { status: 422 }
      );
    }

    // Fetch screens
    const { data: screensData } = await supabase
      .from("screens")
      .select("*")
      .eq("kit_id", kitId)
      .order("order_index", { ascending: true });

    const screens = (screensData ?? []) as Screen[];

    if (screens.length === 0) {
      return NextResponse.json(
        { error: "No screens found for this kit." },
        { status: 422 }
      );
    }

    const designSystem = kit.design_system as Record<string, unknown> | null;
    const urls: Record<string, string> = {};

    // --------------------------------------------------------
    // PNG Export
    // --------------------------------------------------------
   // --------------------------------------------------------
    // PNG Export — skipped locally, runs on Vercel
    // --------------------------------------------------------
    if (type === "png" || type === "all") {
      try {
        const screensForPNG = screens
          .filter((s) => s.html_css)
          .map((s) => ({
            id: s.id,
            name: s.name,
            html_css: s.html_css,
            order_index: s.order_index,
          }));

        const pngResults = await generateKitPNGs(
          kitId,
          kit.category,
          screensForPNG
        );

        const screensForZip = screens.map((s) => ({
          name: s.name,
          html_css: s.html_css,
          order_index: s.order_index,
        }));

        const zipUrl = await createKitZip(
          kitId,
          kit.name,
          pngResults,
          screensForZip,
          designSystem
        );

        urls.png_zip = zipUrl;
      } catch (pngError) {
        console.error("PNG export failed (may need Vercel deployment):", pngError);
        // Don't fail entire export if PNG fails
        urls.png_error = "PNG export requires deployment to Vercel. UXML export is available.";
      }
    }
    // --------------------------------------------------------
    // UXML Export (game category only)
    // --------------------------------------------------------
    if ((type === "uxml" || type === "all") && kit.category === "game") {
      const uxmlFiles: Array<{
        screenName: string;
        uxml: string;
        uss: string;
        svgCaptures?: Array<{ className: string; buffer: Buffer }>;
      }> = [];

      for (const screen of screens) {
        if (!screen.html_css) continue;

      try {
          const paddedIndex = String(screen.order_index + 1).padStart(2, "0");
          const sanitizedName = screen.name.replace(/[^a-zA-Z0-9]/g, "_");
          const filePrefix = `${paddedIndex}_${sanitizedName}`;
          const result = await convertToUXML(screen.html_css, screen.name, filePrefix);

          // Capture SVG elements as PNGs (works on Vercel, skipped locally)
          let svgCaptures: Array<{ className: string; buffer: Buffer }> = [];
          try {
            const { captureSVGElements } = await import("@/lib/export/png-generator");
            svgCaptures = await captureSVGElements(screen.html_css, kit.category);
          } catch {
            // Skip SVG capture if Puppeteer not available (local dev)
            console.log("SVG capture skipped — Puppeteer not available locally");
          }

          // Patch USS with SVG image references if captures available
          let finalUss = result.uss;
          if (svgCaptures.length > 0) {
            const { patchUSSWithSVGImages } = await import("@/lib/export/uxml-converter");
            finalUss = patchUSSWithSVGImages(result.uss, svgCaptures, filePrefix);
          }

          uxmlFiles.push({
            screenName: screen.name,
            uxml: result.uxml,
            uss: finalUss,
            svgCaptures,
          });
        } catch (error) {
          console.error(`UXML conversion failed for ${screen.name}:`, error);
        }
      }

      if (uxmlFiles.length > 0) {
        const uxmlZipUrl = await createUXMLZip(kitId, kit.name, uxmlFiles);
        urls.uxml_zip = uxmlZipUrl;
      }
    }

    return NextResponse.json({
      success: true,
      urls,
      message: "Export complete. Download links are valid for 24 hours.",
    });

  } catch (error) {
    console.error("POST /api/kits/[id]/export error:", error);
    return NextResponse.json(
      { error: "Export failed. Please try again." },
      { status: 500 }
    );
  }
}