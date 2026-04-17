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
  isLandscape?: boolean;
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

const MAX_REVISIONS = 2;

export function ScreenCard({ 
  screen, 
  isDemo, 
  kitId, 
  onScreenUpdated, 
  isSubscriptionActive,
  isLandscape = false }: ScreenCardProps) {
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(screen);

  const pngUrl = currentScreen.png_url ?? "";
  const uxmlUrl = currentScreen.uxml_url ?? "";
  const figmaUrl = currentScreen.figma_url ?? "";
  const gradientClass = categoryColors[currentScreen.name] ?? "from-surface-100 to-surface-200";
  const revisionsLeft = MAX_REVISIONS - currentScreen.revision_count;

  function handleViewScreen() {
    if (!currentScreen.html_css) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const w = isLandscape ? "844px" : "390px";
    const h = isLandscape ? "390px" : "844px";
    win.document.open();
    win.document.write(currentScreen.html_css);
    win.document.close();
    win.document.documentElement.style.width = w;
    win.document.documentElement.style.height = h;
    win.document.documentElement.style.overflow = "hidden";
    win.document.body.style.width = w;
    win.document.body.style.height = h;
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
      <div className="card">
        {/* Screen preview */}
        <div
          className={`w-full rounded-lg mb-4 overflow-hidden bg-gradient-to-br ${gradientClass} relative group`}
          style={{ height: "200px" }}
        >
          {pngUrl ? (
            <img
              src={pngUrl}
              alt={currentScreen.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <p className="text-white/20 text-xs font-medium uppercase tracking-widest mb-3">
                {currentScreen.name}
              </p>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {!isDemo && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                    Click to preview
                  </span>
                </div>
              )}
              {isDemo && (
                <span className="text-xs text-white/40">Upgrade to preview</span>
              )}
            </div>
          )}

          {/* Revision count badge */}
          {!isDemo && (
            <div className="absolute top-2 right-2">
              <span className={`badge text-xs ${
                revisionsLeft === 0
                  ? "bg-surface-200 text-white/30 border border-surface-300"
                  : "badge-brand"
              }`}>
                {revisionsLeft} revision{revisionsLeft === 1 ? "" : "s"} left
              </span>
            </div>
          )}
        </div>

        {/* Screen name */}
        <p className="text-sm font-medium text-white mb-3">
          {currentScreen.name}
        </p>

        {/* Revision notes */}
        {currentScreen.revision_notes && (
          <p className="text-xs text-white/30 mb-3 italic">
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
                disabled={revisionsLeft === 0 && isSubscriptionActive}
                className={`text-xs py-1.5 px-3 flex-1 rounded-lg font-semibold transition-all duration-200 ${
                  revisionsLeft === 0 && isSubscriptionActive
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