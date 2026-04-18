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
  const [exportProgress, setExportProgress] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<"download" | "generate" | "export" | "revision">("download");
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
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
    const kitChecklistData = kit.checklist_data as Record<string, unknown>;
    const isLandscape = (kitChecklistData?.orientation as string) === "Landscape";
    const width = isMobile ? (isLandscape ? 844 : 390) : 1440;
    const height = isMobile ? (isLandscape ? 390 : 844) : 900;

    for (let i = 0; i < sortedScreens.length; i++) {
      const screen = sortedScreens[i];
      if (!screen.html_css) continue;
      setExportProgress(`Processing screen ${i + 1} of ${sortedScreens.length}: ${screen.name}`);

      const paddedIndex = String(i + 1).padStart(2, "0");
      const sanitizedName = screen.name.replace(/[^a-zA-Z0-9]/g, "_");
      const folderName = `${paddedIndex}_${sanitizedName}`;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "0px";
      iframe.style.top = `-${height + 100}px`;
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

        // Fix viewport meta if model used device-width instead of exact px
        const viewportMeta = iframeDoc.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
        if (viewportMeta) {
          viewportMeta.content = `width=${width}, initial-scale=1.0`;
        }

        // Force exact dimensions — overrides any viewport meta
        iframeDoc.documentElement.style.width = `${width}px`;
        iframeDoc.documentElement.style.height = `${height}px`;
        iframeDoc.documentElement.style.overflow = "hidden";
        iframeDoc.documentElement.style.minWidth = `${width}px`;
        iframeDoc.documentElement.style.maxWidth = `${width}px`;
        if (iframeDoc.body) {
          iframeDoc.body.style.width = `${width}px`;
          iframeDoc.body.style.height = `${height}px`;
          iframeDoc.body.style.overflow = "hidden";
          iframeDoc.body.style.minWidth = `${width}px`;
          iframeDoc.body.style.maxWidth = `${width}px`;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (iframe.contentWindow) {
          iframe.contentWindow.scrollTo(0, 0);
        }

        // Move iframe into visible area for accurate capture
        iframe.style.top = '0px';
        iframe.style.left = '0px';
        iframe.style.zIndex = '-1';
        await new Promise(r => setTimeout(r, 200));

        const htmlEl = iframeDoc.documentElement as HTMLElement;
        const screenEl = (iframeDoc.querySelector('.screen') ?? iframeDoc.body) as HTMLElement;

        // Clamp screenEl to exact dimensions — prevents scrollHeight bleed on landscape screens
        screenEl.style.width = `${width}px`;
        screenEl.style.height = `${height}px`;
        screenEl.style.overflow = 'hidden';
        screenEl.style.minHeight = `${height}px`;
        screenEl.style.maxHeight = `${height}px`;

        const captureOpts = { pixelRatio: isMobile ? 3 : 2, skipFonts: true };
        const capturedDataUrls = new Set<string>();

        // Capture full screen once — capture .screen div directly for correct dimensions
        const fullScreenDataUrl = await htmlToImage.toPng(screenEl, { ...captureOpts, width, height });
        const fullScreenImg = new Image();
        await new Promise<void>((res) => { fullScreenImg.onload = () => res(); fullScreenImg.src = fullScreenDataUrl; });

        async function addToZip(dataUrl: string, filename: string) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          zip.file(`${folderName}/${filename}`, await blob.arrayBuffer());
        }

        // Universal element size — uses the larger of getBoundingClientRect and offsetWidth/offsetHeight
        function elSize(el: HTMLElement) {
          const rect = el.getBoundingClientRect();
          const w = Math.max(rect.width || 0, el.offsetWidth) + 4;
          const h = Math.max(rect.height || 0, el.offsetHeight) + 4;
          return { w: Math.ceil(w), h: Math.ceil(h) };
        }

        // Temporarily remove overflow:hidden from ancestors to prevent clipping
        function unlockOverflow(el: HTMLElement): Array<{el: HTMLElement, overflow: string}> {
          const saved: Array<{el: HTMLElement, overflow: string}> = [];
          let parent = el.parentElement;
          while (parent && parent !== iframeDoc!.body) {
            const style = iframeDoc!.defaultView?.getComputedStyle(parent);
            if (style?.overflow === 'hidden' || style?.overflowY === 'hidden' || style?.overflowX === 'hidden') {
              saved.push({ el: parent, overflow: parent.style.overflow });
              parent.style.overflow = 'visible';
            }
            parent = parent.parentElement;
          }
          return saved;
        }

        function restoreOverflow(saved: Array<{el: HTMLElement, overflow: string}>) {
          saved.forEach(({ el, overflow }) => { el.style.overflow = overflow; });
        }

        // Universal direct capture — adds temporary padding to expand layout box for full border capture
        async function captureEl(el: HTMLElement): Promise<string | null> {
          try {
            const buf = 3;
            const cs = iframeDoc!.defaultView!.getComputedStyle(el);
            const savedStyle = {
              padding: el.style.padding,
              margin: el.style.margin,
              paddingTop: el.style.paddingTop,
              paddingRight: el.style.paddingRight,
              paddingBottom: el.style.paddingBottom,
              paddingLeft: el.style.paddingLeft,
              marginTop: el.style.marginTop,
              marginRight: el.style.marginRight,
              marginBottom: el.style.marginBottom,
              marginLeft: el.style.marginLeft,
            };
            // Expand padding, shrink margin to keep position
            const pt = parseFloat(cs.paddingTop) + buf;
            const pr = parseFloat(cs.paddingRight) + buf;
            const pb = parseFloat(cs.paddingBottom) + buf;
            const pl = parseFloat(cs.paddingLeft) + buf;
            const mt = Math.max(0, parseFloat(cs.marginTop) - buf);
            const mr = Math.max(0, parseFloat(cs.marginRight) - buf);
            const mb = Math.max(0, parseFloat(cs.marginBottom) - buf);
            const ml = Math.max(0, parseFloat(cs.marginLeft) - buf);
            el.style.paddingTop = `${pt}px`;
            el.style.paddingRight = `${pr}px`;
            el.style.paddingBottom = `${pb}px`;
            el.style.paddingLeft = `${pl}px`;
            el.style.marginTop = `${mt}px`;
            el.style.marginRight = `${mr}px`;
            el.style.marginBottom = `${mb}px`;
            el.style.marginLeft = `${ml}px`;
            await new Promise(r => setTimeout(r, 30));
            const { w, h } = elSize(el);
            if (w < 20 || h < 20) {
              Object.assign(el.style, savedStyle);
              return null;
            }
            const dataUrl = await htmlToImage.toPng(el, {
              ...captureOpts,
              backgroundColor: undefined,
              width: w,
              height: h,
            });
            Object.assign(el.style, savedStyle);
            if (!dataUrl || dataUrl.length < 1000 || capturedDataUrls.has(dataUrl)) return null;
            capturedDataUrls.add(dataUrl);
            return dataUrl;
          } catch { return null; }
        }

        // Universal SVG capture — clones into fixed wrapper to ensure correct rendering
        async function captureSvg(svgEl: HTMLElement): Promise<string | null> {
          try {
            const svgElement = svgEl as unknown as SVGSVGElement;
            const viewBox = svgElement.viewBox?.baseVal;
            const w = svgEl.offsetWidth || parseFloat(svgElement.getAttribute?.('width') ?? '0') || (viewBox?.width ?? 0) || 24;
            const h = svgEl.offsetHeight || parseFloat(svgElement.getAttribute?.('height') ?? '0') || (viewBox?.height ?? 0) || 24;
            if (w < 4 || h < 4) return null;
            const wrapper = iframeDoc!.createElement('div');
            wrapper.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent`;
            wrapper.appendChild(svgEl.cloneNode(true) as HTMLElement);
            iframeDoc!.body.appendChild(wrapper);
            await new Promise(r => setTimeout(r, 50));
            const dataUrl = await htmlToImage.toPng(wrapper, { ...captureOpts, backgroundColor: undefined });
            iframeDoc!.body.removeChild(wrapper);
            if (!dataUrl || dataUrl.length < 500) return null;
            return dataUrl;
          } catch { return null; }
        }

        // Universal plain container — expands padding for full border capture, hides content
        async function capturePlainContainer(el: HTMLElement): Promise<string | null> {
          try {
            const buf = 3;
            const cs = iframeDoc!.defaultView!.getComputedStyle(el);
            const savedStyle = {
              paddingTop: el.style.paddingTop, paddingRight: el.style.paddingRight,
              paddingBottom: el.style.paddingBottom, paddingLeft: el.style.paddingLeft,
              marginTop: el.style.marginTop, marginRight: el.style.marginRight,
              marginBottom: el.style.marginBottom, marginLeft: el.style.marginLeft,
              color: el.style.color, borderRadius: el.style.borderRadius,
            };
            const p = (v: string) => parseFloat(v) || 0;
            el.style.paddingTop = `${p(cs.paddingTop) + buf}px`;
            el.style.paddingRight = `${p(cs.paddingRight) + buf}px`;
            el.style.paddingBottom = `${p(cs.paddingBottom) + buf}px`;
            el.style.paddingLeft = `${p(cs.paddingLeft) + buf}px`;
            el.style.marginTop = `${Math.max(0, p(cs.marginTop) - buf)}px`;
            el.style.marginRight = `${Math.max(0, p(cs.marginRight) - buf)}px`;
            el.style.marginBottom = `${Math.max(0, p(cs.marginBottom) - buf)}px`;
            el.style.marginLeft = `${Math.max(0, p(cs.marginLeft) - buf)}px`;
            if (cs.borderRadius) el.style.borderRadius = cs.borderRadius;
            const descendants = Array.from(el.querySelectorAll("*")) as HTMLElement[];
            const savedDesc = descendants.map(c => ({ color: c.style.color, visibility: c.style.visibility }));
            descendants.forEach(c => { c.style.color = "transparent"; c.style.visibility = "hidden"; });
            el.style.color = "transparent";
            await new Promise(r => setTimeout(r, 80));
            const { w, h } = elSize(el);
            if (w < 20 || h < 20) {
              Object.assign(el.style, savedStyle);
              descendants.forEach((c, i) => { c.style.color = savedDesc[i].color; c.style.visibility = savedDesc[i].visibility; });
              return null;
            }
            const dataUrl = await htmlToImage.toPng(el, {
              ...captureOpts,
              backgroundColor: undefined,
              width: w,
              height: h,
            });
            Object.assign(el.style, savedStyle);
            descendants.forEach((c, i) => { c.style.color = savedDesc[i].color; c.style.visibility = savedDesc[i].visibility; });
            if (!dataUrl || dataUrl.length < 500) return null;
            return dataUrl;
          } catch { return null; }
        }

        // Canvas crop — only for backgrounds (includes background color)
        async function canvasCrop(el: HTMLElement): Promise<string | null> {
          try {
            const rect = el.getBoundingClientRect();
            if (!rect || rect.width < 20 || rect.height < 20) return null;
            if (rect.top > height || rect.left > width) return null;
            const canvas = document.createElement("canvas");
            const scale = captureOpts.pixelRatio ?? 1;
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            const ctx = canvas.getContext("2d");
            if (!ctx) return null;
            const borderRadius = parseFloat(iframeDoc?.defaultView?.getComputedStyle(el)?.borderRadius ?? "0") * scale;
            if (borderRadius > 0) {
              ctx.beginPath();
              ctx.roundRect(0, 0, canvas.width, canvas.height, borderRadius);
              ctx.clip();
            }
            ctx.drawImage(fullScreenImg, rect.left * scale, rect.top * scale, rect.width * scale, rect.height * scale, 0, 0, canvas.width, canvas.height);
            const croppedUrl = canvas.toDataURL("image/png");
            if (!croppedUrl || croppedUrl.length < 3000 || capturedDataUrls.has(croppedUrl)) return null;
            capturedDataUrls.add(croppedUrl);
            return croppedUrl;
          } catch { return null; }
        }


        // ── 1. FULL SCREEN ──────────────────────────────────────────
        await addToZip(fullScreenDataUrl, "full_screen.png");

        // ── 2. BUTTONS (primary, secondary, ghost, back, danger) ────
        // Rule 3: complete + plain container + icon. One set per unique style (bg+height).
        const buttons = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora^="ui:button"]:not([data-uxlora="ui:button:icon"]):not([data-uxlora="ui:button:tab"])')
        ) as HTMLElement[];

        let btnCount = 0;
        for (const el of buttons) {
          btnCount++;
          const completeUrl = await captureEl(el);
          if (completeUrl) await addToZip(completeUrl, `button_${btnCount}_complete.png`);
          const plainUrl = await capturePlainContainer(el);
          if (plainUrl) await addToZip(plainUrl, `button_${btnCount}_plain.png`);
          const icon = (el.querySelector('svg[data-uxlora^="vec:icon"]') ?? el.querySelector('svg')) as unknown as HTMLElement | null;
          if (icon) {
            const iconUrl = await captureSvg(icon);
            if (iconUrl) await addToZip(iconUrl, `button_${btnCount}_icon.png`);
          }
        }

        // ── 3. ICON BUTTONS ─────────────────────────────────────────
        // Rule: complete + plain container + icon. Export all unique ones.
        const iconBtns = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora="ui:button:icon"]')
        ) as HTMLElement[];
        let iconBtnCount = 0;
        for (const el of iconBtns) {
          iconBtnCount++;
          const completeUrl = await captureEl(el);
          if (completeUrl) await addToZip(completeUrl, `icon_button_${iconBtnCount}_complete.png`);
          const plainUrl = await capturePlainContainer(el);
          if (plainUrl) await addToZip(plainUrl, `icon_button_${iconBtnCount}_plain.png`);
          const icon = (el.querySelector('svg[data-uxlora^="vec:icon"]') ?? el.querySelector('svg')) as unknown as HTMLElement | null;
          if (icon) {
            const iconUrl = await captureSvg(icon);
            if (iconUrl) await addToZip(iconUrl, `icon_button_${iconBtnCount}_icon.png`);
          }
        }

        // ── 4. CURRENCY & SCORE (game) ──────────────────────────────
        // Rule 4: plain container + icon only. Dedupe by height, keep smallest width.
        const gameChipEls = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora="ui:game:currency"]')
        ) as HTMLElement[];
        const chipByHeight = new Map<number, HTMLElement>();
        for (const el of gameChipEls) {
          const h = Math.round(el.getBoundingClientRect().height);
          const existing = chipByHeight.get(h);
          if (!existing || el.getBoundingClientRect().width < existing.getBoundingClientRect().width) {
            chipByHeight.set(h, el);
          }
        }
        // Plain container — one per unique height (smallest width)
        let chipCount = 0;
        for (const el of chipByHeight.values()) {
          chipCount++;
          const plainUrl = await capturePlainContainer(el);
          if (plainUrl) await addToZip(plainUrl, `chip_${chipCount}_plain.png`);
        }
        // All chip icons exported individually — bypass HUD skip logic, no dedup
        let chipIconCount = 0;
        for (const el of gameChipEls) {
          const icon = (el.querySelector('svg[data-uxlora^="vec:icon"]') ?? el.querySelector('svg')) as unknown as HTMLElement | null;
          if (!icon) continue;
          const iconUrl = await captureSvg(icon);
          if (iconUrl) { chipIconCount++; await addToZip(iconUrl, `chip_icon_${chipIconCount}.png`); }
        }

        // Level/score badge — plain container only (dynamic text)
        const scoreBadges = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora="ui:game:score"]')
        ) as HTMLElement[];
        let scoreCount = 0;
        for (const el of scoreBadges) {
          const plainUrl = await capturePlainContainer(el);
          if (plainUrl) { scoreCount++; await addToZip(plainUrl, `score_badge_${scoreCount}_plain.png`); }
        }

        // ── 5. DYNAMIC CONTAINERS (ui:container:dynamic) ────────────
        // Plain container + icon only — no text, exported like buttons
        const dynamicLayouts = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora="ui:container:dynamic"]')
        ) as HTMLElement[];
        let dynCount = 0;
        for (const el of dynamicLayouts.slice(0, 8)) {
          dynCount++;
          const plainUrl = await capturePlainContainer(el);
          if (plainUrl) await addToZip(plainUrl, `container_dynamic_${dynCount}_plain.png`);
          const icon = (el.querySelector('svg[data-uxlora^="vec:icon"]') ?? el.querySelector('svg')) as unknown as HTMLElement | null;
          if (icon) {
            const iconUrl = await captureSvg(icon);
            if (iconUrl) await addToZip(iconUrl, `container_dynamic_${dynCount}_icon.png`);
          }
        }

        // ── 6. LAYOUT — STATIC (card:static, panel:static) ──────────
        // Rule 2: plain container + complete with text
        const staticLayouts = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora="ui:layout:card:static"], [data-uxlora="ui:layout:panel:static"]')
        ) as HTMLElement[];
        let statCount = 0;
        for (const el of staticLayouts.slice(0, 8)) {
          statCount++;
          const plainUrl = await capturePlainContainer(el);
          if (plainUrl) await addToZip(plainUrl, `container_static_${statCount}_plain.png`);
          const completeUrl = await captureEl(el);
          if (completeUrl) await addToZip(completeUrl, `container_static_${statCount}_complete.png`);
        }

        // ── 7. PLAIN TEXT (not in containers) ───────────────────────
        // Rule 6: text as-is
        const textEls = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora^="ui:text"]')
        ) as HTMLElement[];
        let textCount = 0;
        for (const el of textEls.slice(0, 10)) {
          // Skip if inside a layout container
          const insideLayout = el.closest('[data-uxlora^="ui:layout"], [data-uxlora^="ui:game"], [data-uxlora^="ui:button"]');
          if (insideLayout) continue;
          const dataUrl = await captureEl(el);
          if (dataUrl) { textCount++; await addToZip(dataUrl, `text_${textCount}.png`); }
        }

        // ── 8. NAVIGATION ───────────────────────────────────────────
        // Complete nav bar + each tab icon separately
        const navEls = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora="ui:nav:bar"]')
        ) as HTMLElement[];
        // Fallback: if model missed the tag, find nav by element type
        const navToProcess = navEls.length > 0
          ? navEls
          : Array.from(iframeDoc.querySelectorAll('nav')) as HTMLElement[];
        for (const nav of navToProcess) {
          // Hide active tab decoration before capturing nav
          const activeTabDecorations = Array.from(
            nav.querySelectorAll('[data-uxlora="vec:decoration"], .nav-active-crest')
          ) as HTMLElement[];
          activeTabDecorations.forEach(el => { el.style.visibility = "hidden"; });
          await new Promise(r => setTimeout(r, 100));
          try {
            const navUrl = await canvasCrop(nav);
            if (navUrl) await addToZip(navUrl, "nav_complete.png");
          } catch { /* skip */ }
          activeTabDecorations.forEach(el => { el.style.visibility = ""; });

          // Export active tab decoration separately — add top buffer for absolute positioned elements
          let decorCount = 0;
          for (const decor of activeTabDecorations) {
            try {
              const w = decor.offsetWidth + 4;
              const h = decor.offsetHeight + 4;
              if (w < 5 || h < 5) continue;
              const wrapper = iframeDoc!.createElement('div');
              wrapper.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;overflow:visible;background:transparent;box-sizing:border-box`;
              wrapper.appendChild(decor.cloneNode(true) as HTMLElement);
              iframeDoc!.body.appendChild(wrapper);
              await new Promise(r => setTimeout(r, 50));
              const dataUrl = await htmlToImage.toPng(wrapper, { ...captureOpts, backgroundColor: undefined });
              iframeDoc!.body.removeChild(wrapper);
              if (dataUrl && dataUrl.length > 500) {
                decorCount++;
                await addToZip(dataUrl, `nav_active_decoration_${decorCount}.png`);
              }
            } catch { /* skip */ }
          }

          // Each tab icon separately
          const tabs = Array.from(
            nav.querySelectorAll('[data-uxlora="ui:button:tab"]')
          ) as HTMLElement[];
          let tabCount = 0;
          for (const tab of tabs) {
            const icon = tab.querySelector('svg[data-uxlora^="vec:icon"]') as unknown as HTMLElement | null;
            if (!icon) continue;
            const iconUrl = await captureSvg(icon);
            if (iconUrl) { tabCount++; await addToZip(iconUrl, `nav_icon_${tabCount}.png`); }
          }
        }

        // ── 9. VECTORS & DECORATIVES ────────────────────────────────
        const vectors = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora^="vec"]:not([data-uxlora="vec:decoration"])')
        ) as HTMLElement[];
        let vecCount = 0;
        for (const el of vectors) {
          if (!el.querySelector('svg') && el.tagName !== 'SVG') continue;
          // Skip if inside button, nav, game chip — already exported
          const insideExported = el.closest('[data-uxlora^="ui:button"], [data-uxlora="ui:nav:bar"], [data-uxlora="ui:game:currency"], [data-uxlora="ui:game:score"]');
          if (insideExported) continue;
          const dataUrl = await captureEl(el);
          if (dataUrl) { vecCount++; await addToZip(dataUrl, `vector_${vecCount}.png`); }
        }

        // ── 10. MEDIA (hero, avatar) ─────────────────────────────────
        const mediaEls = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora^="media"]')
        ) as HTMLElement[];
        let mediaCount = 0;
        for (const el of mediaEls) {
          const dataUrl = await captureEl(el);
          if (dataUrl) { mediaCount++; await addToZip(dataUrl, `media_${mediaCount}.png`); }
        }

        // ── 11. FORM ELEMENTS ────────────────────────────────────────
        const formEls = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora^="ui:form"]')
        ) as HTMLElement[];
        let formCount = 0;
        for (const el of formEls) {
          const dataUrl = await captureEl(el);
          if (dataUrl) { formCount++; await addToZip(dataUrl, `form_${formCount}.png`); }
        }

        // ── 12. STATUS ELEMENTS ──────────────────────────────────────
        const statusEls = Array.from(
          iframeDoc.querySelectorAll('[data-uxlora^="ui:status"]')
        ) as HTMLElement[];
        let statusCount = 0;
        for (const el of statusEls) {
          const dataUrl = await captureEl(el);
          if (dataUrl) { statusCount++; await addToZip(dataUrl, `status_${statusCount}.png`); }
        }

        // ── 13. BACKGROUND PLAIN ────────────────────────────────────
        try {
          const hideForPlain = Array.from(
            iframeDoc.querySelectorAll('[data-uxlora^="ui:"], [data-uxlora^="vec"], [data-uxlora^="media"]')
          ) as HTMLElement[];
          hideForPlain.forEach(el => { el.style.visibility = "hidden"; });
          await new Promise(r => setTimeout(r, 150));
          const plainUrl = await htmlToImage.toPng(htmlEl, { ...captureOpts, width, height });
          hideForPlain.forEach(el => { el.style.visibility = ""; });
          if (plainUrl && plainUrl.length > 2000) await addToZip(plainUrl, "background_plain.png");
        } catch { /* skip */ }

        // ── 14. BACKGROUND WITH DECORATIVES ─────────────────────────
        try {
          const hideForDecor = Array.from(
            iframeDoc.querySelectorAll(
              '[data-uxlora^="ui:button"], [data-uxlora^="ui:text"], ' +
              '[data-uxlora^="ui:form"], [data-uxlora^="ui:nav"], ' +
              '[data-uxlora^="ui:layout"], [data-uxlora^="ui:container"], [data-uxlora^="ui:status"], ' +
              '[data-uxlora^="ui:game"], [data-uxlora^="ui:mobile"], ' +
              '[data-uxlora^="ui:web"], [data-uxlora^="media:image:thumbnail"], ' +
              '[data-uxlora^="media:image:item"], [data-uxlora^="media:image:avatar"]'
            )
          ) as HTMLElement[];
          hideForDecor.forEach(el => { el.style.visibility = "hidden"; });
          await new Promise(r => setTimeout(r, 150));
          const decorUrl = await htmlToImage.toPng(htmlEl, { ...captureOpts, width, height });
          hideForDecor.forEach(el => { el.style.visibility = ""; });
          if (decorUrl && decorUrl.length > 2000) await addToZip(decorUrl, "background_with_decoratives.png");
        } catch { /* skip */ }

      } finally {
        document.body.removeChild(iframe);
      }
    }

    // Design system JSON
    if (kit.design_system) {
      zip.file("design_system.json", JSON.stringify(kit.design_system, null, 2));
    }

    // README
    zip.file("README.md", `# ${kit.name} UI Kit\nGenerated by UXLora (uxlora.app)\n\nEach screen folder contains:\n- full_screen.png — complete screen\n- button_N_plain.png / button_N_complete.png / button_N_icon.png — buttons\n- icon_button_N_plain.png / icon_button_N_complete.png — icon buttons\n- chip_N_plain.png / chip_N_icon.png — currency/score chips\n- container_dynamic_N.png — dynamic content containers (plain only)\n- container_static_N_plain.png / container_static_N_complete.png — static containers\n- nav_complete.png / nav_icon_N.png — navigation\n- text_N.png — standalone text elements\n- vector_N.png — icons and illustrations\n- media_N.png — character/hero elements\n- background_plain.png / background_with_decoratives.png — backgrounds\n\ndesign_system.json — complete design tokens\n`);

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
    setExportProgress("");
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
const isMobile = kit.category === "mobile" || kit.category === "game";
const kitScreenW = isMobile ? ((checklistData?.orientation as string) === "Landscape" ? 844 : 390) : 1440;
const kitScreenH = isMobile ? ((checklistData?.orientation as string) === "Landscape" ? 390 : 844) : 900;

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
                  () => setShowRegenerateConfirm(true),
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
              <div className="flex flex-wrap gap-6 justify-start">
              {sortedScreens.map((screen) => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  isDemo={kit.is_demo}
                  kitId={id}
                  onScreenUpdated={handleScreenUpdated}
                  isSubscriptionActive={isSubscriptionActive()}
                  screenW={kitScreenW}
                  screenH={kitScreenH}
                  subscriptionTier={subscriptionTier}
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

      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="card max-w-sm w-full mx-4 py-8 px-6">
            <h3 className="text-white font-semibold text-lg mb-2">Regenerate UI Kit?</h3>
            <p className="text-white/50 text-sm mb-6">
              This will consume <span className="text-white font-semibold">1 generation token</span> from your monthly limit and generate a new version of this kit. Your current screens will be replaced.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="btn-secondary flex-1 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRegenerateConfirm(false);
                  router.push(`/dashboard/new/${kit.category}/guided?kitId=${kit.id}&regenerate=true`);
                }}
                className="btn-primary flex-1 py-2"
              >
                Regenerate →
              </button>
            </div>
          </div>
        </div>
      )}

      {exporting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="card max-w-sm w-full mx-4 text-center py-8 px-6">
            <svg className="w-10 h-10 text-brand-400 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <h3 className="text-white font-semibold text-lg mb-2">Preparing your export</h3>
            <p className="text-white/50 text-sm mb-4">
              {exportProgress || "Initializing..."}
            </p>
            <p className="text-white/30 text-xs">This may take a while for large kits. Please don't close this tab.</p>
          </div>
        </div>
      )}
    </div>
  );
}