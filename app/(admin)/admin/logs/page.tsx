"use client";

import { useState, useEffect } from "react";
import { AdminTableSkeleton } from "@/components/ui/LoadingSkeleton";

interface EnrichedLog {
  id: string;
  kit_id: string;
  step: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  status: string;
  error_message: string | null;
  created_at: string;
  systemPrompt: string | null;
  userPrompt: string | null;
}

interface KitGroup {
  kitId: string;
  kitName: string;
  category: string;
  createdAt: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  failedSteps: number;
  logs: EnrichedLog[];
}

function PromptBlock({ label, content }: { label: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
      >
        {expanded ? "▲" : "▼"} {label}
      </button>
      {expanded && (
        <pre className="mt-2 p-3 bg-surface-200 rounded-lg text-xs text-white/60 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
          {content}
        </pre>
      )}
    </div>
  );
}

function LogRow({ log }: { log: EnrichedLog }) {
  const stepLabel = log.step.replace(/_/g, " ");
  const cost = ((log.input_tokens * 0.000003) + (log.output_tokens * 0.000015)).toFixed(4);

  return (
    <div className="border-b border-surface-300 last:border-0 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            log.status === "success" ? "bg-green-400" : "bg-red-400"
          }`} />
          <span className="text-sm text-white font-medium truncate">{stepLabel}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/40 flex-shrink-0">
          <span>{log.input_tokens?.toLocaleString() ?? 0} in</span>
          <span>{log.output_tokens?.toLocaleString() ?? 0} out</span>
          <span>${cost}</span>
          <span>{log.duration_ms > 1000
            ? `${(log.duration_ms / 1000).toFixed(1)}s`
            : `${log.duration_ms}ms`}
          </span>
        </div>
      </div>

      {log.error_message && (
        <p className="mt-1 text-xs text-red-400 pl-5">{log.error_message}</p>
      )}

      <div className="pl-5">
        {log.systemPrompt ? (
          <PromptBlock label="System Prompt" content={log.systemPrompt} />
        ) : (
          !["icon_selection", "suggestion", "design_system"].includes(log.step) && (
            <p className="mt-1 text-xs text-white/20 italic">No system prompt saved — regenerate this kit to capture prompts</p>
          )
        )}
        {log.userPrompt && (
          <PromptBlock label="User Prompt" content={log.userPrompt} />
        )}
      </div>
    </div>
  );
}

function KitAccordion({ kit }: { kit: KitGroup }) {
  const [open, setOpen] = useState(false);
  const totalCost = ((kit.totalInputTokens * 0.000003) + (kit.totalOutputTokens * 0.000015)).toFixed(4);
  const categoryIcon = kit.category === "game" ? "🎮" : kit.category === "mobile" ? "📱" : "🌐";

  return (
    <div className="card p-0 overflow-hidden mb-4">
      {/* Kit header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span>{categoryIcon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{kit.kitName}</p>
            <p className="text-xs text-white/40">
              {new Date(kit.createdAt).toLocaleDateString()} · {kit.logs.length} steps
              {kit.failedSteps > 0 && (
                <span className="text-red-400 ml-2">· {kit.failedSteps} failed</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>{kit.totalInputTokens.toLocaleString()} in</span>
          <span>{kit.totalOutputTokens.toLocaleString()} out</span>
          <span className="text-white/60">${totalCost}</span>
          <span className="text-white/60 text-base">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Logs list */}
      {open && (
        <div className="border-t border-surface-300">
          {kit.logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogsPage() {
  const [kitGroups, setKitGroups] = useState<KitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((data) => {
        setKitGroups(data.kits ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load generation logs.");
        setLoading(false);
      });
  }, []);

  const totalInputTokens = kitGroups.reduce((s, k) => s + k.totalInputTokens, 0);
  const totalOutputTokens = kitGroups.reduce((s, k) => s + k.totalOutputTokens, 0);
  const totalCost = ((totalInputTokens * 0.000003) + (totalOutputTokens * 0.000015)).toFixed(4);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Generation Logs</h1>
        <p className="page-subtitle">{kitGroups.length} kits · {totalInputTokens.toLocaleString()} total input tokens · ${totalCost} estimated cost</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-0 overflow-hidden animate-pulse">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-surface-200 rounded" />
                  <div>
                    <div className="h-4 bg-surface-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-surface-200 rounded w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-3 bg-surface-200 rounded w-16" />
                  <div className="h-3 bg-surface-200 rounded w-16" />
                  <div className="h-3 bg-surface-200 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : kitGroups.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-white/40">No generation logs yet.</p>
        </div>
      ) : (
        kitGroups.map((kit) => (
          <KitAccordion key={kit.kitId} kit={kit} />
        ))
      )}
    </div>
  );
}