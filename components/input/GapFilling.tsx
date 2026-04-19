"use client";

import { useState } from "react";
import { getChecklist } from "@/lib/checklist";
import type { ChecklistField } from "@/lib/checklist";

interface GapFillingProps {
  data: Record<string, unknown>;
  category: "game" | "mobile" | "web";
  onComplete: (filledData: Record<string, unknown>) => void;
}

// Fields important enough to always ask if missing
const ALWAYS_ASK_IF_MISSING = [
  "product_name", "product_description", "genre_or_category",
  "visual_style", "theme", "orientation", "key_screens",
  "platform", "currencies", "monetization",
];

function isMissing(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function GapFilling({ data, category, onComplete }: GapFillingProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...data });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const checklist = getChecklist(category);

  // Collect all fields that need filling
  const missingFields: ChecklistField[] = [];
  for (const section of checklist.sections) {
    for (const field of section.fields) {
      // Skip purely conditional fields
      if (field.id === "custom_resolution") continue;
      if (field.id === "custom_genre") continue;
      if (field.id === "custom_visual_style") continue;
      if (field.id === "custom_typography") continue;
      if (field.id === "custom_home_focus") continue;

      const missing = isMissing(formData[field.id]);
      const shouldAsk = field.required || ALWAYS_ASK_IF_MISSING.includes(field.id);

      if (missing && shouldAsk) {
        missingFields.push(field);
      }
    }
  }

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
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === "multiselect" ? (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    updateField(field.id, selected
                      ? current.filter(v => v !== opt)
                      : [...current, opt]
                    );
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