"use client";

import { useState, useEffect } from "react";
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
  created_at: string;
  updated_at: string;
}

const stepLabels: Record<string, string> = {
  parser: "Document Parser",
  design_system: "Design System",
  screen_generator: "Screen Generator",
  state_generator: "State Generator",
  suggestion: "AI Suggestions",
  icon_selection: "Icon Selection",
};

const categoryLabels: Record<string, string> = {
  game: "Game UI",
  mobile: "Mobile UI",
  web: "Web/SaaS UI",
  universal: "Universal",
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    try {
      const response = await fetch("/api/admin/prompts");
      if (!response.ok) throw new Error("Failed to fetch prompts");
      const data = await response.json();
      setPrompts(data);
    } catch {
      setError("Failed to load prompt templates.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!response.ok) throw new Error("Failed to update");
      await fetchPrompts();
    } catch {
      setError("Failed to update prompt status.");
    }
  }

  const filteredPrompts = filter === "all"
    ? prompts
    : prompts.filter((p) => p.step === filter);

  const steps = [...new Set(prompts.map((p) => p.step))];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-surface-200 rounded w-48 mb-2" />
            <div className="h-4 bg-surface-200 rounded w-40" />
          </div>
          <div className="h-10 bg-surface-200 rounded w-36" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-surface-200 rounded w-24" />
          ))}
        </div>
        <div className="card overflow-hidden p-0">
          <div className="border-b border-surface-300 flex gap-4 p-4">
            {["Step", "Category", "Version", "Model", "Status", "Updated", "Actions"].map((h) => (
              <div key={h} className="h-4 bg-surface-200 rounded flex-1" />
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-surface-200">
              <div className="h-4 bg-surface-200 rounded flex-1" />
              <div className="h-6 bg-surface-200 rounded w-20 self-center" />
              <div className="h-4 bg-surface-200 rounded w-8 self-center" />
              <div className="h-4 bg-surface-200 rounded w-32 self-center" />
              <div className="h-6 bg-surface-200 rounded w-16 self-center" />
              <div className="h-4 bg-surface-200 rounded w-20 self-center" />
              <div className="h-4 bg-surface-200 rounded w-12 self-center" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Prompt Templates</h1>
          <p className="page-subtitle">
            {prompts.length} templates · {prompts.filter((p) => p.is_active).length} active
          </p>
        </div>
        <Link href="/admin/prompts/new" className="btn-primary">
          + New Template
        </Link>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === "all" ? "bg-brand-500 text-white" : "bg-surface-100 text-white/50 hover:text-white"
          }`}
        >
          All
        </button>
        {steps.map((step) => (
          <button
            key={step}
            onClick={() => setFilter(step)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === step ? "bg-brand-500 text-white" : "bg-surface-100 text-white/50 hover:text-white"
            }`}
          >
            {stepLabels[step] ?? step}
          </button>
        ))}
      </div>

      {/* Prompts table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-300">
              <th className="text-left p-4 text-white/50 text-sm font-medium">Step</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Category</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Version</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Model</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Status</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Updated</th>
              <th className="text-left p-4 text-white/50 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrompts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-white/40">
                  No prompt templates found.
                </td>
              </tr>
            ) : (
              filteredPrompts.map((prompt) => (
                <tr key={prompt.id} className="border-b border-surface-200 hover:bg-surface-100 transition-colors">
                  <td className="p-4">
                    <span className="text-sm font-medium text-white">
                      {stepLabels[prompt.step] ?? prompt.step}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="badge-brand text-xs">
                      {categoryLabels[prompt.category] ?? prompt.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-white/70">v{prompt.version}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-white/50 font-mono">{prompt.model}</span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(prompt.id, prompt.is_active)}
                      className={`badge text-xs cursor-pointer ${
                        prompt.is_active ? "badge-success" : "badge-error"
                      }`}
                    >
                      {prompt.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-white/40">
                      {new Date(prompt.updated_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/prompts/${prompt.id}`}
                      className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}