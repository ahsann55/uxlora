"use client";

import { useState, useEffect } from "react";

interface AdminSettings {
  default_model: string;
  generation_limits: Record<string, number>;
  export_formats: Record<string, boolean>;
  max_screens_per_kit: number;
  png_resolution: { width: number; height: number };
  feature_flags: Record<string, boolean>;
}

const MODELS = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-6",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<AdminSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to save settings.");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/50">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Configure generation limits and features</p>
        </div>
        <div className="flex items-center gap-3">
          {success && <span className="badge-success">Saved ✓</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">

        {/* Default model */}
        <div className="card">
          <h2 className="section-title mb-4">AI Model</h2>
          <div>
            <label className="label">Default Model</label>
            <select
              value={settings.default_model ?? "claude-sonnet-4-6"}
              onChange={(e) => setSettings({ ...settings, default_model: e.target.value })}
              className="input"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <p className="text-white/30 text-xs mt-2">
              Used for all generation unless overridden by prompt template
            </p>
          </div>
        </div>

        {/* Generation limits */}
        <div className="card">
          <h2 className="section-title mb-4">Generation Limits</h2>
          <p className="text-white/40 text-xs mb-4">
            Monthly generation credits per subscription tier
          </p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(settings.generation_limits ?? {}).map(([tier, limit]) => (
              <div key={tier}>
                <label className="label capitalize">{tier} tier</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setSettings({
                    ...settings,
                    generation_limits: {
                      ...(settings.generation_limits ?? {}),
                      [tier]: parseInt(e.target.value),
                    },
                  })}
                  className="input"
                  min="0"
                  max="1000"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Max screens */}
        <div className="card">
          <h2 className="section-title mb-4">Screen Limits</h2>
          <div>
            <label className="label">Max screens per kit</label>
            <input
              type="number"
              value={settings.max_screens_per_kit ?? 15}
              onChange={(e) => setSettings({
                ...settings,
                max_screens_per_kit: parseInt(e.target.value),
              })}
              className="input"
              min="1"
              max="50"
            />
          </div>
        </div>

        {/* Export formats */}
        <div className="card">
          <h2 className="section-title mb-4">Export Formats</h2>
          <div className="space-y-3">
            {Object.entries(settings.export_formats ?? {}).map(([format, enabled]) => (
              <div key={format} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium uppercase">{format}</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    export_formats: {
                      ...(settings.export_formats ?? {}),
                      [format]: !enabled,
                    },
                  })}
                  className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                    enabled ? "bg-brand-500" : "bg-surface-300"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 ${
                    enabled ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature flags */}
        <div className="card">
          <h2 className="section-title mb-4">Feature Flags</h2>
          <p className="text-white/40 text-xs mb-4">
            Enable or disable features without code changes
          </p>
          <div className="space-y-3">
            {Object.entries(settings.feature_flags ?? {}).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">
                    {flag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    feature_flags: {
                      ...(settings.feature_flags ?? {}),
                      [flag]: !enabled,
                    },
                  })}
                  className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                    enabled ? "bg-brand-500" : "bg-surface-300"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 ${
                    enabled ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PNG resolution */}
        <div className="card">
          <h2 className="section-title mb-4">PNG Resolution</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Width (px)</label>
              <input
                type="number"
                value={settings.png_resolution?.width ?? 1920}
                onChange={(e) => setSettings({
                  ...settings,
                  png_resolution: {
                    width: parseInt(e.target.value),
                    height: settings.png_resolution?.height ?? 1080,
                  },
                })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Height (px)</label>
              <input
                type="number"
                value={settings.png_resolution?.height ?? 1080}
                onChange={(e) => setSettings({
                  ...settings,
                  png_resolution: {
                    width: settings.png_resolution?.width ?? 1920,
                    height: parseInt(e.target.value),
                  },
                })}
                className="input"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}