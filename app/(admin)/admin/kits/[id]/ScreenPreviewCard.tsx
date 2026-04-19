"use client";

import { useState } from "react";

interface ScreenPreviewCardProps {
  screen: {
    id: string;
    name: string;
    order_index: number;
    html_css: string | null;
  };
  screenW: number;
  screenH: number;
  scale: number;
  previewH: number;
}

export function ScreenPreviewCard({ screen, screenW, screenH, scale, previewH }: ScreenPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!screen.html_css) return;
    await navigator.clipboard.writeText(screen.html_css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card" style={{ width: `${320 + 24}px`, padding: "12px" }}>
      <div
        className="rounded-xl mb-3 overflow-hidden"
        style={{ width: "320px", height: `${previewH}px`, position: "relative" }}
      >
        {screen.html_css ? (
          <iframe
            srcDoc={screen.html_css}
            className="border-none pointer-events-none absolute top-0 left-0"
            style={{
              width: `${screenW}px`,
              height: `${screenH}px`,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
            }}
            scrolling="no"
          />
        ) : (
          <div className="w-full h-full bg-surface-200 rounded-xl flex items-center justify-center">
            <p className="text-white/30 text-xs">No HTML</p>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-white mb-1">{screen.name}</p>
      <p className="text-xs text-white/30 mb-3">Screen {screen.order_index + 1}</p>
      <button
        onClick={handleCopy}
        disabled={!screen.html_css}
        className={`w-full text-xs py-1.5 rounded-lg font-medium transition-all ${
          copied
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "btn-secondary"
        }`}
      >
        {copied ? "✓ Copied!" : "Copy HTML"}
      </button>
    </div>
  );
}