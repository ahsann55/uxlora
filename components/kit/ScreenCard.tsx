"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { ReviseModal } from "./ReviseModal";
import type { Database } from "@/lib/supabase/types";

type Screen = Database["public"]["Tables"]["screens"]["Row"];

interface ScreenCardProps {
  screen: Screen;
  isDemo: boolean;
  kitId: string;
  onScreenUpdated: (screen: Screen) => void;
  isSubscriptionActive: boolean;
  screenW?: number;
  screenH?: number;
  subscriptionTier?: string;
}

const categoryColors: Record<string, string> = {
  "Main Menu": "from-orange-900 to-amber-950",
  "HUD / In-Game UI": "from-green-900 to-emerald-950",
  "Pause Menu": "from-slate-800 to-slate-950",
  "Inventory Screen": "from-yellow-900 to-amber-950",
  "Shop / Store": "from-purple-900 to-violet-950",
  "Character / Stats Screen": "from-blue-900 to-blue-950",
  "Map Screen": "from-teal-900 to-cyan-950",
  "Settings": "from-gray-800 to-gray-950",
  "Onboarding": "from-indigo-900 to-indigo-950",
  "Home / Feed": "from-pink-900 to-rose-950",
  "Dashboard / Overview": "from-sky-900 to-sky-950",
  "Sign In / Sign Up": "from-violet-900 to-purple-950",
  "Profile": "from-rose-900 to-pink-950",
  "Data Table / List View": "from-cyan-900 to-teal-950",
};

const REVISION_LIMITS: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  studio: 3,
};

export function ScreenCard({ 
  screen, 
  isDemo, 
  kitId, 
  onScreenUpdated, 
  isSubscriptionActive,
  screenW = 390,
  screenH = 844,
  subscriptionTier = "free" }: ScreenCardProps) {
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(screen);

  const pngUrl = currentScreen.png_url ?? "";
  const uxmlUrl = currentScreen.uxml_url ?? "";
  const figmaUrl = currentScreen.figma_url ?? "";
  const gradientClass = categoryColors[currentScreen.name] ?? "from-surface-100 to-surface-200";
  const maxRevisions = REVISION_LIMITS[subscriptionTier] ?? 2;
  const revisionsLeft = Math.max(0, maxRevisions - currentScreen.revision_count);

  // Universal preview — landscape gets wider container to match visual weight of portrait cards
  const previewW = screenW > screenH ? 460 : 190;
  const scale = previewW / screenW;
  const previewH = Math.ceil(screenH * scale);
  const cardW = previewW + 30;

  function handleViewScreen() {
    if (!currentScreen.html_css) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(currentScreen.html_css);
    win.document.close();
    win.document.documentElement.style.width = `${screenW}px`;
    win.document.documentElement.style.height = `${screenH}px`;
    win.document.documentElement.style.overflow = "hidden";
    win.document.body.style.width = `${screenW}px`;
    win.document.body.style.height = `${screenH}px`;
    win.document.body.style.overflow = "hidden";
  }

  function handleDownload(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }

  function handleScreenRevised(updatedScreen: Record<string, unknown>) {
    const updated = updatedScreen as unknown as Screen;
    setCurrentScreen(updated);
    onScreenUpdated(updated);
  }

  return (
    <>
      <div className="card" style={{ width: `${cardW}px`, padding: "12px" }}>
        {/* Revision badge — top of card */}
        {!isDemo && (
          <div className="flex justify-center mb-2">
            <span className={`badge text-xs ${
              revisionsLeft === 0
                ? "bg-surface-200 text-white/30 border border-surface-300"
                : "badge-brand"
            }`}>
              {revisionsLeft} revision{revisionsLeft === 1 ? "" : "s"} left
            </span>
          </div>
        )}
        {/* Screen preview — universally calculated from actual screen dimensions */}
        <div
          className="rounded-xl mb-2 overflow-hidden relative group cursor-pointer mx-auto"
          style={{ width: `${previewW}px`, height: `${previewH}px` }}
          onClick={handleViewScreen}
        >
          {currentScreen.html_css ? (
            <div className="w-full h-full relative overflow-hidden">
              <iframe
                srcDoc={currentScreen.html_css}
                className="border-none pointer-events-none"
                style={{
                  width: `${screenW}px`,
                  height: `${screenH}px`,
                  transformOrigin: "top center",
                  transform: `scale(${scale})`,
                  position: "absolute",
                  left: "50%",
                  top: "0",
                  marginLeft: `-${screenW / 2}px`,
                }}
                scrolling="no"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
            </div>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br ${gradientClass}`}>
              <p className="text-white/20 text-xs font-medium uppercase tracking-widest">
                {currentScreen.name}
              </p>
            </div>
          )}
        </div>

        {/* Screen name */}
        <p className="text-sm font-medium text-white mb-1.5">
          {currentScreen.name}
        </p>

        {/* Revision notes */}
        {currentScreen.revision_notes && (
          <p className="text-xs text-white/30 mb-1.5 italic">
            Last revision: {currentScreen.revision_notes}
          </p>
        )}

        {/* Actions */}
        {!isDemo ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleViewScreen}
                className="btn-secondary text-xs py-1.5 px-3 flex-1"
              >
                👁 Preview
              </button>
              <button
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  setShowReviseModal(true);
                }}
                disabled={revisionsLeft === 0}
              className={`text-xs py-1.5 px-3 flex-1 rounded-lg font-semibold transition-all duration-200 ${
                revisionsLeft === 0
                    ? "bg-surface-100 text-white/20 border border-surface-200 cursor-not-allowed"
                    : "btn-secondary"
                }`}
              >
                ✏️ Revise
              </button>
            </div>

            {(pngUrl || uxmlUrl || figmaUrl) && (
              <div className="flex gap-2">
                {pngUrl && (
                  <button
                    onClick={() => handleDownload(pngUrl, `${currentScreen.name}.png`)}
                    className="btn-secondary text-xs py-1 px-3 flex-1"
                  >
                    PNG
                  </button>
                )}
                {uxmlUrl && (
                  <button
                    onClick={() => handleDownload(uxmlUrl, `${currentScreen.name}.uxml`)}
                    className="btn-secondary text-xs py-1 px-3 flex-1"
                  >
                    UXML
                  </button>
                )}
                {figmaUrl && (
                  <button
                    onClick={() => window.open(figmaUrl, "_blank")}
                    className="btn-secondary text-xs py-1 px-3 flex-1"
                  >
                    Figma
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
  <div className="space-y-2">
    <button
      onClick={handleViewScreen}
      className="btn-secondary text-xs py-1.5 px-3 w-full"
    >
      👁 Preview
    </button>
    <button
    onClick={() => {
      if (!isSubscriptionActive) {
        setShowUpgradeModal(true);
        return;
      }
      setShowReviseModal(true);
    }}
      className="btn-secondary text-xs py-1.5 px-3 w-full"
    >
      ✏️ Revise
    </button>
    <button
      onClick={() => setShowUpgradeModal(true)}
      className="btn-primary text-xs py-1.5 px-3 w-full"
    >
      ⚡ Upgrade to download
    </button>
  </div>
)}
      </div>

      {showReviseModal && (
        <ReviseModal
          screenId={currentScreen.id}
          screenName={currentScreen.name}
          kitId={kitId}
          revisionCount={currentScreen.revision_count}
          onClose={() => setShowReviseModal(false)}
          onRevised={handleScreenRevised}
        />
      )}
      {showUpgradeModal && (
  <UpgradeModal
    onClose={() => setShowUpgradeModal(false)}
    trigger="download"
  />
)}
    </>
  );
}