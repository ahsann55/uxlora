"use client";

import { useState, useMemo } from "react";
import { getChecklist } from "@/lib/checklist";
import type { ChecklistField } from "@/lib/checklist";

interface GapFillingProps {
  data: Record<string, unknown>;
  category: "game" | "mobile" | "web";
  onComplete: (filledData: Record<string, unknown>) => void;
}

function CustomScreenInput({ value, onAdd }: { value: string[]; onAdd: (name: string) => void }) {
  const [input, setInput] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (input.trim()) { onAdd(input.trim()); setInput(""); } } }}
        placeholder="Add custom screen name..."
        className="input flex-1 text-sm"
      />
      <button
        type="button"
        onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(""); } }}
        disabled={!input.trim()}
        className="btn-secondary text-sm px-4 py-2"
      >
        + Add
      </button>
    </div>
  );
}

function isMissing(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function GapFilling({ data, category, onComplete }: GapFillingProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...data });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const checklist = getChecklist(category);

  // Compute missing fields only once on mount — not on every formData change
  // This prevents fields from disappearing when user selects an option
  const missingFields = useMemo(() => {
    const fields: ChecklistField[] = [];
    for (const section of checklist.sections) {
      for (const field of section.fields) {
        if (field.id === "custom_resolution") continue;
        if (field.id === "custom_genre") continue;
        if (field.id === "custom_visual_style") continue;
        if (field.id === "custom_typography") continue;
        if (field.id === "custom_home_focus") continue;
        if (field.id === "custom_currencies") continue;
        if (field.id === "custom_monetization") continue;
        if (field.id === "custom_game_systems") continue;
        if (isMissing(data[field.id]) || field.id === "key_screens") {
          fields.push(field);
        }
      }
    }
    return fields;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps — compute once on mount using initial data

  function updateField(id: string, value: unknown) {
    setFieldErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  function handleContinue() {
    // Validate required fields
    const errors: Record<string, string> = {};
    missingFields.forEach(field => {
      if (!field.required) return;
      const value = formData[field.id];
      if (isMissing(value)) {
        errors[field.id] = `${field.label} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onComplete(formData);
  }

  function renderField(field: ChecklistField) {
    const value = formData[field.id];
    const error = fieldErrors[field.id];

    return (
      <div key={field.id} className="space-y-2">
        <label className="label">
          {field.label}
          {field.required && <span className="text-brand-400 ml-1">*</span>}
        </label>
        {field.hint && <p className="text-white/40 text-xs">{field.hint}</p>}

        {field.type === "textarea" ? (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="input min-h-[80px] resize-none"
            rows={3}
          />
        ) : field.type === "select" ? (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            className="input"
          >
            <option value="">Select {field.label}</option>
            {(field.id === "screen_resolution"
              ? field.options?.filter(opt => {
                  if (opt === "Custom") return true;
                  const match = opt.match(/^(\d+)×(\d+)/);
                  if (!match) return true;
                  const w = parseInt(match[1]);
                  const h = parseInt(match[2]);
                  const isLandscape = (formData.orientation as string) === "Landscape";
                  return isLandscape ? w > h : h >= w;
                })
              : field.options
            )?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === "multiselect" ? (
          <div className="space-y-3">
            {field.id === "key_screens" && (
              <p className="text-white/40 text-xs">Currently selected screens are pre-checked. Add or remove as needed.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {/* Show all checklist options */}
              {field.options?.map((opt) => {
                const currentValue = formData[field.id];
                const selected = Array.isArray(currentValue) && (currentValue as string[]).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(formData[field.id]) ? (formData[field.id] as string[]) : [];
                      const next = selected
                        ? current.filter((v: string) => v !== opt)
                        : [...current, opt];
                      updateField(field.id, next);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selected
                        ? "bg-brand-500/30 text-brand-300 border border-brand-500/50"
                        : "bg-surface-200 text-white/50 border border-surface-300 hover:border-brand-500/30 hover:text-white/70"
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {opt}
                  </button>
                );
              })}
              {/* Show any custom screens extracted by parser that aren't in checklist options */}
              {field.id === "key_screens" && Array.isArray(formData[field.id]) && 
                (formData[field.id] as string[])
                  .filter(s => !field.options?.includes(s))
                  .map((customScreen) => (
                    <button
                      key={customScreen}
                      type="button"
                      onClick={() => {
                        const current = formData[field.id] as string[];
                        updateField(field.id, current.filter(v => v !== customScreen));
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-500/30 text-brand-300 border border-brand-500/50 transition-all"
                    >
                      ✓ {customScreen} ×
                    </button>
                  ))
              }
            </div>
            {/* Custom screen input for key_screens */}
            {field.id === "key_screens" && (
              <CustomScreenInput
                value={formData[field.id] as string[]}
                onAdd={(name) => {
                  const current = Array.isArray(formData[field.id]) ? (formData[field.id] as string[]) : [];
                  if (!current.includes(name)) updateField(field.id, [...current, name]);
                }}
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="input"
          />
        )}

        {/* Show custom text input when Other is selected for multiselect fields */}
        {field.id === "currencies" && Array.isArray(formData.currencies) && (formData.currencies as string[]).includes("Other") && (
          <input
            type="text"
            value={(formData.custom_currencies as string) ?? ""}
            onChange={(e) => updateField("custom_currencies", e.target.value)}
            placeholder="e.g. Diamonds, Crystals, Reputation Points"
            className="input mt-2"
          />
        )}
        {field.id === "monetization" && Array.isArray(formData.monetization) && (formData.monetization as string[]).includes("Other") && (
          <input
            type="text"
            value={(formData.custom_monetization as string) ?? ""}
            onChange={(e) => updateField("custom_monetization", e.target.value)}
            placeholder="e.g. Season Pass, Loot Boxes, NFTs"
            className="input mt-2"
          />
        )}
        {field.id === "game_systems" && Array.isArray(formData.game_systems) && (formData.game_systems as string[]).includes("Other") && (
          <input
            type="text"
            value={(formData.custom_game_systems as string) ?? ""}
            onChange={(e) => updateField("custom_game_systems", e.target.value)}
            placeholder="e.g. Trading System, Alliance Wars, Tournaments"
            className="input mt-2"
          />
        )}

        {field.id === "home_focus_element" && formData.home_focus_element === "Other" && (
          <input
            type="text"
            value={(formData.custom_home_focus as string) ?? ""}
            onChange={(e) => updateField("custom_home_focus", e.target.value)}
            placeholder="e.g. Vehicle, Spaceship, Avatar"
            className="input mt-2"
          />
        )}
        {field.id === "genre_or_category" && formData.genre_or_category === "Other" && (
          <input
            type="text"
            value={(formData.custom_genre as string) ?? ""}
            onChange={(e) => updateField("custom_genre", e.target.value)}
            placeholder="Describe your genre"
            className="input mt-2"
          />
        )}
        {field.id === "visual_style" && formData.visual_style === "Other" && (
          <input
            type="text"
            value={(formData.custom_visual_style as string) ?? ""}
            onChange={(e) => updateField("custom_visual_style", e.target.value)}
            placeholder="Describe your art style"
            className="input mt-2"
          />
        )}
        {field.id === "typography_preferences" && formData.typography_preferences === "Other" && (
          <input
            type="text"
            value={(formData.custom_typography as string) ?? ""}
            onChange={(e) => updateField("custom_typography", e.target.value)}
            placeholder="Describe your typography style"
            className="input mt-2"
          />
        )}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
    );
  }

  // If nothing is missing, skip straight to review
  if (missingFields.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-white/60 text-sm mb-2">✓ All required information was extracted from your document.</p>
        <button onClick={() => onComplete(formData)} className="btn-primary mt-4 px-8">
          Review & Generate →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-3">
        <p className="text-brand-300 text-sm font-medium mb-1">
          {missingFields.length} field{missingFields.length === 1 ? "" : "s"} not found in your document
        </p>
        <p className="text-white/40 text-xs">
          Fill in the missing details below. Required fields must be completed.
        </p>
      </div>

      <div className="card space-y-5">
        {missingFields.map(field => renderField(field))}
      </div>

      <button
        onClick={handleContinue}
        className="btn-primary w-full py-3"
      >
        Continue to Review →
      </button>
    </div>
  );
}