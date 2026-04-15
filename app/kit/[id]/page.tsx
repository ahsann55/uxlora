"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScreenCard } from "@/components/kit/ScreenCard";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { KitPageSkeleton } from "@/components/ui/LoadingSkeleton";
import * as htmlToImage from "html-to-image";
import JSZip from "jszip";

type Kit = Database["public"]["Tables"]["kits"]["Row"];
type Screen = Database["public"]["Tables"]["screens"]["Row"];
type KitWithScreens = Kit & { screens: Screen[] };

export default function KitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [kit, setKit] = useState<KitWithScreens | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportUrls, setExportUrls] = useState<Record<string, string>>({});
  const [exportError, setExportError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<"download" | "generate" | "export" | "revision">("download");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/me");
      if (!response.ok) return;
      const data = await response.json() as {
        subscription_status: string;
        subscription_tier: string;
      };
      setSubscriptionStatus(data.subscription_status);
      setSubscriptionTier(data.subscription_tier);
    } catch {
      // ignore
    }
  }, []);
  const fetchKit = useCallback(async () => {
    try {
      const response = await fetch(`/api/kits/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch kit");
      }
      const data = await response.json() as KitWithScreens;
      setKit(data);
    } catch {
      setError("Failed to load kit.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);
  const sortedScreens = (kit?.screens ?? []).sort(
    (a, b) => a.order_index - b.order_index
  );

  useEffect(() => {
    fetchKit();
    fetchProfile();
  }, [fetchKit, fetchProfile]);

  useEffect(() => {
    if (!kit) return;
    if (kit.status !== "generating" && kit.status !== "queued") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/kits/${id}/status`);
        if (!response.ok) return;
        const status = await response.json();
        setKit((prev) => prev ? { ...prev, ...status } : prev);
        if (status.status === "complete" || status.status === "failed") {
          clearInterval(interval);
          fetchKit();
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [kit?.status, id, fetchKit]);
  async function handleCancel() {
      try {
        const response = await fetch(`/api/kits/${id}/cancel`, {
          method: "POST",
        });
        if (response.ok) {
          setKit((prev) =>
            prev ? { ...prev, status: "cancelled", current_step: "Cancelled by user" } : prev
          );
        }
      } catch {
        // ignore
      }
    }
  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/kits/${id}/generate`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to start generation.");
        return;
      }
      setKit((prev) =>
        prev ? { ...prev, status: "generating", current_step: "Starting..." } : prev
      );
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  }
async function handleExport(type: "png" | "uxml" | "figma" | "all") {
    if (type === "png") {
      await handleClientSidePNGExport();
      return;
    }

    setExporting(true);
    setExportError(null);
    try {
      const response = await fetch(`/api/kits/${id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await response.json();
      if (!response.ok) {
        setExportError(data.error ?? "Export failed.");
        return;
      }
      setExportUrls(data.urls);
      if (data.urls.uxml_zip) {
        window.open(data.urls.uxml_zip, "_blank");
      }
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

async function handleClientSidePNGExport() {
    if (!kit || sortedScreens.length === 0) return;
    setExporting(true);
    setExportError(null);

    try {
      const zip = new JSZip();
      const isMobile = kit.category === "mobile" || kit.category === "game";
      const width = isMobile ? 390 : 1440;
      const height = isMobile ? 844 : 900;

      for (let i = 0; i < sortedScreens.length; i++) {
        const screen = sortedScreens[i];
        if (!screen.html_css) continue;

        const paddedIndex = String(i + 1).padStart(2, "0");
        const sanitizedName = screen.name.replace(/[^a-zA-Z0-9]/g, "_");
        const folderName = `${paddedIndex}_${sanitizedName}`;

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.left = "-9999px";
        iframe.style.top = "0px";
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;
        iframe.style.border = "none";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        document.body.appendChild(iframe);

        try {
          const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
          if (!iframeDoc) continue;

          iframeDoc.open();
          iframeDoc.write(screen.html_css);
          iframeDoc.close();

          await new Promise((resolve) => setTimeout(resolve, 2000));
          // Capture full screen once — reused for all element crops
        
          if (iframe.contentWindow) {
            iframe.contentWindow.scrollTo(0, 0);
            // Force iframe to correct dimensions for absolute positioned elements
            iframe.contentDocument!.documentElement.style.width = `${width}px`;
            iframe.contentDocument!.documentElement.style.height = `${height}px`;
            iframe.contentDocument!.documentElement.style.overflow = "hidden";
          }

          const htmlEl = iframeDoc.documentElement as HTMLElement;
          const captureOpts = {
            pixelRatio: isMobile ? 3 : 2,
            skipFonts: true,
          };
          
          const capturedDataUrls = new Set<string>();
          // Capture full screen once — reused for all element crops
          const fullScreenDataUrl = await htmlToImage.toPng(htmlEl, {
            ...captureOpts,
            width,
            height,
          });
          const fullScreenImg = new Image();
          await new Promise<void>((res) => { fullScreenImg.onload = () => res(); fullScreenImg.src = fullScreenDataUrl; });
          // Helper — capture element safely, skip duplicates and blanks
          async function captureEl(el: HTMLElement): Promise<string | null> {
            try {
              const rect = el.getBoundingClientRect();
              if (!rect || rect.width < 20 || rect.height < 20) return null;
              if (rect.left < -width || rect.top < -height) return null;
              if (rect.top > height || rect.left > width) return null;
              // Skip elements that are children of already-captured containers
              const skipIfInsideAny = [
                '[data-uxlora="ui:nav:bar"]',
                '[data-uxlora="media:image:hero"]',
                '[data-uxlora^="ui:button"]',
                '[data-uxlora^="ui:game:hud"]',
              ].join(', ');
              const capturedParent = el.closest(skipIfInsideAny);
              if (capturedParent && capturedParent !== el) return null;
              const canvas = document.createElement("canvas");
              const scale = captureOpts.pixelRatio ?? 1;
              canvas.width = rect.width * scale;
              canvas.height = rect.height * scale;
              const ctx = canvas.getContext("2d");
              if (!ctx) return null;
              ctx.drawImage(fullScreenImg, rect.left * scale, rect.top * scale, rect.width * scale, rect.height * scale, 0, 0, canvas.width, canvas.height);
              const croppedUrl = canvas.toDataURL("image/png");
              if (!croppedUrl || croppedUrl.length < 3000) return null;
              if (capturedDataUrls.has(croppedUrl)) return null;
              capturedDataUrls.add(croppedUrl);
              return croppedUrl;
            } catch {
              return null;
            }
          }

          async function addToZip(dataUrl: string, filename: string) {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            zip.file(`${folderName}/${filename}`, await blob.arrayBuffer());
          }

          // ── 1. FULL SCREEN ──────────────────────────────────────────
          const fullUrl = await htmlToImage.toPng(htmlEl, {
            ...captureOpts, width, height,
          });
          if (fullUrl && fullUrl.length > 2000) {
            await addToZip(fullUrl, "full_screen.png");
          }

          // ── 2. ALL BUTTONS (primary, secondary, ghost, tab, back) ───
          const buttons = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:button"]:not([data-uxlora="ui:button:icon"])')
          ) as HTMLElement[];
          let btnCount = 0;
          for (const el of buttons) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { btnCount++; await addToZip(dataUrl, `button_${btnCount}.png`); }
          }

          // ── 3. ICON/ROUND BUTTONS ───────────────────────────────────
          const iconBtns = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora="ui:button:icon"]')
          ) as HTMLElement[];
          let iconBtnCount = 0;
          for (const el of iconBtns) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { iconBtnCount++; await addToZip(dataUrl, `icon_button_${iconBtnCount}.png`); }
          }

          // ── 4. TEXT ELEMENTS ────────────────────────────────────────
          const textEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:text"]')
          ) as HTMLElement[];
          let textCount = 0;
          for (const el of textEls.slice(0, 15)) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { textCount++; await addToZip(dataUrl, `text_${textCount}.png`); }
          }

          // ── 5. VECTORS & DECORATIVES ────────────────────────────────
          const vectors = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="vec"]')
          ) as HTMLElement[];
          let vecCount = 0;
          for (const el of vectors) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { vecCount++; await addToZip(dataUrl, `vector_${vecCount}.png`); }
          }

          // ── 6. NAVIGATION ───────────────────────────────────────────
          const navEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:nav"]')
          ) as HTMLElement[];
          let navCount = 0;
          for (const el of navEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { navCount++; await addToZip(dataUrl, `nav_${navCount}.png`); }
          }

          // ── 7. LAYOUT COMPONENTS (cards, modals, panels) ────────────
          const layoutEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:layout"]')
          ) as HTMLElement[];
          let layoutCount = 0;
          for (const el of layoutEls.slice(0, 5)) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { layoutCount++; await addToZip(dataUrl, `component_${layoutCount}.png`); }
          }

          // ── 8. FORM ELEMENTS ────────────────────────────────────────
          const formEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:form"]')
          ) as HTMLElement[];
          let formCount = 0;
          for (const el of formEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { formCount++; await addToZip(dataUrl, `form_${formCount}.png`); }
          }

          // ── 9. STATUS ELEMENTS ──────────────────────────────────────
          const statusEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:status"]')
          ) as HTMLElement[];
          let statusCount = 0;
          for (const el of statusEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { statusCount++; await addToZip(dataUrl, `status_${statusCount}.png`); }
          }

          // ── 10. GAME SPECIFIC ───────────────────────────────────────
          // ── 10. GAME SPECIFIC ───────────────────────────────────────
          const gameEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:game"]')
          ) as HTMLElement[];
          let gameCount = 0;
          for (const el of gameEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { gameCount++; await addToZip(dataUrl, `game_ui_${gameCount}.png`); }
          }

          // ── 11. MOBILE SPECIFIC ─────────────────────────────────────
          const mobileEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:mobile"]')
          ) as HTMLElement[];
          let mobileCount = 0;
          for (const el of mobileEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { mobileCount++; await addToZip(dataUrl, `mobile_ui_${mobileCount}.png`); }
          }

          // ── 12. WEB SPECIFIC ────────────────────────────────────────
          const webEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:web"]')
          ) as HTMLElement[];
          let webCount = 0;
          for (const el of webEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { webCount++; await addToZip(dataUrl, `web_ui_${webCount}.png`); }
          }

          // ── 13. MEDIA ELEMENTS ──────────────────────────────────────
          const mediaEls = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="media"]')
          ) as HTMLElement[];
          let mediaCount = 0;
          for (const el of mediaEls) {
            const dataUrl = await captureEl(el);
            if (dataUrl) { mediaCount++; await addToZip(dataUrl, `media_${mediaCount}.png`); }
          }

          // ── 14. BACKGROUND PLAIN ────────────────────────────────────
          try {
            // Hide everything except bg elements
            const hideForPlain = Array.from(
              iframeDoc.querySelectorAll(
                '[data-uxlora^="ui:"], [data-uxlora^="vec"], [data-uxlora^="media"]'
              )
            ) as HTMLElement[];
            hideForPlain.forEach(el => { el.style.visibility = "hidden"; });
            await new Promise(r => setTimeout(r, 150));

            const plainUrl = await htmlToImage.toPng(htmlEl, { ...captureOpts, width, height });
            hideForPlain.forEach(el => { el.style.visibility = ""; });

            if (plainUrl && plainUrl.length > 2000) {
              await addToZip(plainUrl, "background_plain.png");
            }
          } catch { /* skip */ }

          // ── 15. BACKGROUND WITH DECORATIVES ────────────────────────
          try {
            // Hide buttons, text, form, nav, game/mobile/web UI — keep bg + vec
            const hideForDecor = Array.from(
              iframeDoc.querySelectorAll(
                '[data-uxlora^="ui:button"], [data-uxlora^="ui:text"], ' +
                '[data-uxlora^="ui:form"], [data-uxlora^="ui:nav"], ' +
                '[data-uxlora^="ui:layout"], [data-uxlora^="ui:status"], ' +
                '[data-uxlora^="ui:game"], [data-uxlora^="ui:mobile"], ' +
                '[data-uxlora^="ui:web"], [data-uxlora^="media:image:thumbnail"], ' +
                '[data-uxlora^="media:image:item"], [data-uxlora^="media:image:avatar"]'
              )
            ) as HTMLElement[];
            hideForDecor.forEach(el => { el.style.visibility = "hidden"; });
            await new Promise(r => setTimeout(r, 150));

            const decorUrl = await htmlToImage.toPng(htmlEl, { ...captureOpts, width, height });
            hideForDecor.forEach(el => { el.style.visibility = ""; });

            if (decorUrl && decorUrl.length > 2000) {
              await addToZip(decorUrl, "background_with_decoratives.png");
            }
          } catch { /* skip */ }

        } finally {
          document.body.removeChild(iframe);
        }
      }

      // Add design system JSON
      if (kit.design_system) {
        zip.file("design_system.json", JSON.stringify(kit.design_system, null, 2));
      }

      // Add README
      zip.file("README.md", `# ${kit.name} UI Kit\nGenerated by UXLora (uxlora.app)\n\nEach screen folder contains:\n- full_screen.png — complete screen\n- button_*.png — all buttons\n- icon_button_*.png — round/icon buttons\n- text_*.png — text elements\n- vector_*.png — icons and decoratives\n- background_plain.png — clean background\n- background_with_decoratives.png — background with all decorative elements\n- Additional platform-specific elements\n\ndesign_system.json — complete design tokens\n`);

      // Download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kit.name.replace(/[^a-zA-Z0-9]/g, "_")}_UI_Kit.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed.";
      setExportError(`PNG export failed: ${msg}`);
    } finally {
      setExporting(false);
    }
  }
  function handleScreenUpdated(updatedScreen: Screen) {
    setKit((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        screens: prev.screens.map((s) =>
          s.id === updatedScreen.id ? updatedScreen : s
        ),
      };
    });
  }

  function isSubscriptionActive(): boolean {
  return subscriptionTier !== "free" && subscriptionStatus === "active";
}

  function handleGatedAction(action: () => void, trigger: "download" | "generate" | "export" | "revision") {
    if (!isSubscriptionActive()) {
      setUpgradeModalTrigger(trigger);
      setShowUpgradeModal(true);
      return;
    }
    action();
  }
  if (loading) {
    return <KitPageSkeleton />;
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-white/50">Kit not found.</div>
      </div>
    );
  }

  const isGenerating = kit.status === "generating" || kit.status === "queued";
  const isComplete = kit.status === "complete";
  const isFailed = kit.status === "failed";


  const progressPercent =
    kit.total_screens > 0
      ? Math.round((kit.current_screen_index / kit.total_screens) * 100)
      : 0;

  const checklistData = kit.checklist_data as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-2 transition-colors"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">{kit.name}</h1>
            <p className="text-white/50 text-sm mt-1 capitalize">
              {kit.category} UI · {kit.input_method} input · Created {formatDate(kit.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {kit.status === "collecting_input" && <span className="badge-warning">Draft</span>}
            {kit.status === "queued" && <span className="badge-brand">Queued</span>}
            {isGenerating && <span className="badge-brand animate-pulse">Generating...</span>}
            {isComplete && <span className="badge-success">Complete</span>}
            {isFailed && <span className="badge-error">Failed</span>}
            {kit.status === "cancelled" && <span className="badge-error">Cancelled</span>}
          </div>
        </div>
        {/* Export error */}
        {exportError && (
          <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
            {exportError}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Collecting input state */}
        {kit.status === "collecting_input" && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-white mb-2">Ready to generate</h2>
            <p className="text-white/50 text-sm mb-6">
              Your kit details have been saved. Click generate to start.
              {kit.is_demo && (
                <span className="block mt-2 text-yellow-400/70">
                  Free tier: 2 screens, view-only preview.
                </span>
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&regenerate=true`)}
                className="btn-secondary px-8 py-3"
              >
                ✏️ Edit answers
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary px-8 py-3"
              >
                {generating ? "Starting..." : "Generate UI Kit →"}
              </button>
            </div>
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="card text-center py-12">
            <svg className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Generating your UI kit</h2>
            <p className="text-white/50 text-sm mb-4">
              {kit.current_step ?? "Starting generation..."}
            </p>
            {kit.total_screens > 0 && (
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>Screen {kit.current_screen_index} of {kit.total_screens}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="usage-bar-track">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
            <p className="text-white/30 text-xs mt-6">Updates every 3 seconds</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&regenerate=true`)}
                className="btn-secondary px-6 py-2 text-sm"
              >
                ✏️ Edit & Restart
              </button>
              <button
                onClick={handleCancel}
                className="btn-danger px-6 py-2 text-sm"
              >
                Cancel generation
              </button>
            </div>
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Generation failed</h2>
            <p className="text-white/50 text-sm mb-6">
              {kit.error_message ?? "An unexpected error occurred."}
            </p>
          <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&regenerate=true`)}
                className="btn-secondary px-8 py-3"
              >
                ✏️ Edit & Regenerate
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary px-8 py-3"
              >
                {generating ? "Starting..." : "Try again"}
              </button>
            </div>
          </div>
        )}
        {/* Cancelled state */}
        {kit.status === "cancelled" && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Generation cancelled</h2>
            <p className="text-white/50 text-sm mb-6">
              Your kit was cancelled. Regenerate with your previous inputs or edit them first.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&regenerate=true`)}
                className="btn-secondary px-8 py-3"
              >
                ✏️ Edit & Regenerate
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary px-8 py-3"
              >
                {generating ? "Starting..." : "Regenerate →"}
              </button>
            </div>
          </div>
        )}
        {/* Complete state */}
        {isComplete && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-white/50 text-sm">
                {sortedScreens.length} screen{sortedScreens.length === 1 ? "" : "s"} generated
                {kit.is_demo && (
                  <span className="text-yellow-400/70 ml-2">· Demo mode</span>
                )}
              </p>
              <div className="flex items-center gap-3">
                {kit.is_demo && (
  <>
    <span className="badge-warning">Demo</span>
    <button
      onClick={() => setShowUpgradeModal(true)}
      className="btn-primary text-sm py-1.5 px-4"
    >
      ⚡ Upgrade your plan
    </button>
  </>
)}
                <button
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                  className="btn-secondary text-sm py-1.5 px-4"
                >
                  {showAuditTrail ? "Hide" : "📋 View"} inputs
                </button>
                <div className="flex items-center gap-2">
                  {/* PNG — all paid tiers */}
                  <button
                    onClick={() => handleExport("png")}
                    disabled={exporting}
                    className="btn-secondary text-sm py-1.5 px-4"
                  >
                    {exporting ? "Exporting..." : "Export PNG"}
                  </button>

                  {/* Figma — Pro and Studio only */}
                  {(subscriptionTier === "pro" || subscriptionTier === "studio") && (
                    <button
                      onClick={() => handleExport("figma")}
                      disabled={exporting}
                      className="btn-secondary text-sm py-1.5 px-4"
                    >
                      Export Figma
                    </button>
                  )}

                  {/* Unity UXML — Studio only, game kits only */}
                  {kit.category === "game" && subscriptionTier === "studio" && (
                    <button
                      onClick={() => handleExport("uxml")}
                      disabled={exporting}
                      className="btn-secondary text-sm py-1.5 px-4"
                    >
                      Export UXML
                    </button>
                  )}
                </div>
              <button
                onClick={() => handleGatedAction(
                  () => router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&addScreens=true`),
                  "generate"
                )}
                className="btn-secondary text-sm py-1.5 px-4"
              >
                + Add screens
              </button>
              <button
                onClick={() => handleGatedAction(
                  () => router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&regenerate=true`),
                  "generate"
                )}
                className="btn-secondary text-sm py-1.5 px-4"
              >
                🔄 Regenerate
              </button>
              </div>
            </div>

            {/* Audit trail — UX-06 */}
            {showAuditTrail && (
              <div className="card mb-6">
                <h3 className="section-title mb-4">Generation inputs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(checklistData).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={key} className="bg-surface-100 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">{label}</p>
                        <p className="text-white text-sm">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Screens grid */}
            {sortedScreens.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/50">No screens generated yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedScreens.map((screen) => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  isDemo={kit.is_demo}
                  kitId={id}
                  onScreenUpdated={handleScreenUpdated}
                  isSubscriptionActive={isSubscriptionActive()}
                />
              ))}
              </div>
            )}
          </div>
        )}

      </div>
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          trigger={upgradeModalTrigger}
        />
      )}
    </div>
  );
}