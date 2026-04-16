"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PromptTemplate {
  id: string;
  step: string;
  category: string;
  version: number;
  is_active: boolean;
  system_prompt: string;
  user_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

const MODELS = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-6",
];

export default function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "new";

  const [prompt, setPrompt] = useState<Partial<PromptTemplate>>({
    step: "design_system",
    category: "game",
    system_prompt: "",
    user_template: "",
    model: "claude-sonnet-4-6",
    temperature: 0.7,
    max_tokens: 4096,
    is_active: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchPrompt();
    }
  }, [id]);

  async function fetchPrompt() {
    try {
      const response = await fetch(`/api/admin/prompts/${id}`);
      if (!response.ok) throw new Error("Prompt not found");
      const data = await response.json();
      setPrompt(data);
    } catch {
      setError("Failed to load prompt template.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const url = isNew ? "/api/admin/prompts" : `/api/admin/prompts/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }

      if (isNew) {
        router.push(`/admin/prompts/${data.id}`);
      } else {
        setSuccess(true);
        setPrompt(data);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/prompts"
            className="text-white/50 hover:text-white text-sm mb-2 block transition-colors"
          >
            ← Back to prompts
          </Link>
          <h1 className="page-title">
            {isNew ? "New Prompt Template" : `Edit Prompt — v${prompt.version}`}
          </h1>
          {!isNew && (
            <p className="page-subtitle">
              {prompt.step} · {prompt.category}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="badge-success">Saved ✓</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : isNew ? "Create template" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Metadata */}
        {isNew && (
          <div className="card">
            <h2 className="section-title mb-4">Template Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Step</label>
                <select
                  value={prompt.step}
                  onChange={(e) => setPrompt({ ...prompt, step: e.target.value })}
                  className="input"
                >
                  <option value="parser">Document Parser</option>
                  <option value="design_system">Design System</option>
                  <option value="screen_generator">Screen Generator</option>
                  <option value="state_generator">State Generator</option>
                  <option value="suggestion">AI Suggestions</option>
                  <option value="icon_selection">Icon Selection</option>
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={prompt.category}
                  onChange={(e) => setPrompt({ ...prompt, category: e.target.value })}
                  className="input"
                >
                  <option value="game">Game UI</option>
                  <option value="mobile">Mobile UI</option>
                  <option value="web">Web/SaaS UI</option>
                  <option value="universal">Universal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Model settings */}
        <div className="card">
          <h2 className="section-title mb-4">Model Settings</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Model</label>
              <select
                value={prompt.model}
                onChange={(e) => setPrompt({ ...prompt, model: e.target.value })}
                className="input"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Temperature ({prompt.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={prompt.temperature}
                onChange={(e) => setPrompt({ ...prompt, temperature: parseFloat(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
            <div>
              <label className="label">Max Tokens</label>
              <input
                type="number"
                value={prompt.max_tokens}
                onChange={(e) => setPrompt({ ...prompt, max_tokens: parseInt(e.target.value) })}
                className="input"
                step="512"
                min="512"
                max="16000"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="label mb-0">Active</label>
            <button
              onClick={() => setPrompt({ ...prompt, is_active: !prompt.is_active })}
              className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                prompt.is_active ? "bg-brand-500" : "bg-surface-300"
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 ${
                prompt.is_active ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
            <span className="text-white/50 text-sm">
              {prompt.is_active ? "Active — used in generation" : "Inactive — not used"}
            </span>
          </div>
        </div>

        {/* System prompt */}
        <div className="card">
          <h2 className="section-title mb-2">System Prompt</h2>
          <p className="text-white/40 text-xs mb-4">
            Instructions for Claude's role and behavior. Keep concise.
          </p>
          <textarea
            value={prompt.system_prompt}
            onChange={(e) => setPrompt({ ...prompt, system_prompt: e.target.value })}
            className="input min-h-[160px] resize-y font-mono text-sm"
            placeholder="You are an expert UI/UX designer..."
          />
          <p className="text-white/30 text-xs mt-2">
            {prompt.system_prompt?.length ?? 0} characters
          </p>
        </div>

        {/* User template */}
        <div className="card">
          <h2 className="section-title mb-2">User Template</h2>
          <p className="text-white/40 text-xs mb-4">
            The prompt template. Use {`{{variable}}`} for dynamic values like checklist_data, category, etc.
          </p>
          <textarea
            value={prompt.user_template}
            onChange={(e) => setPrompt({ ...prompt, user_template: e.target.value })}
            className="input min-h-[320px] resize-y font-mono text-sm"
            placeholder="Generate a {{category}} UI kit based on:&#10;&#10;{{checklist_data}}"
          />
          <p className="text-white/30 text-xs mt-2">
            {prompt.user_template?.length ?? 0} characters
          </p>
        </div>

        {/* Version history note */}
        {!isNew && (
          <div className="card bg-brand-500/10 border-brand-500/30">
            <p className="text-brand-300 text-sm">
              💡 Saving changes creates a new version (v{(prompt.version ?? 0) + 1}) and deactivates the current version. The new version becomes active immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}