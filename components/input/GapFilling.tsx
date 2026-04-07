"use client";

import { useState } from "react";
import { getChecklist } from "@/lib/checklist";
import { getMissingFields } from "@/lib/checklist/validate";
import type { ChecklistField } from "@/lib/checklist";

interface GapFillingProps {
  data: Record<string, unknown>;
  category: string;
  onComplete: (filledData: Record<string, unknown>) => void;
  loading?: boolean;
}

export function GapFilling({
  data,
  category,
  onComplete,
  loading = false,
}: GapFillingProps) {
  const [filledData, setFilledData] = useState<Record<string, unknown>>(data);

  const missingFields = getMissingFields(
    category as "game" | "mobile" | "web",
    filledData
  );

  const checklist = getChecklist(category as "game" | "mobile" | "web");

  const allFields = checklist.sections.flatMap((s) => s.fields);

  function getField(id: string): ChecklistField | undefined {
    return allFields.find((f) => f.id === id);
  }

  function updateField(id: string, value: unknown) {
    setFilledData((prev) => ({ ...prev, [id]: value }));
  }

  function renderField(field: ChecklistField) {
    const value = filledData[field.id];

    return (
      <div key={field.id} className="card space-y-2">
        <div>
          <label className="label">{field.label}</label>
          {field.hint && (
            <p className="text-white/40 text-xs mb-2">{field.hint}</p>
          )}
        </div>

        {field.type === "textarea" ? (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
            className="input min-h-[80px] resize-none"
            disabled={loading}
          />
        ) : field.type === "select" ? (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            className="input"
            disabled={loading}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
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
                  disabled={loading}
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    const next = selected
                      ? current.filter((v) => v !== opt)
                      : [...current, opt];
                    updateField(field.id, next);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selected
                      ? "bg-brand-500/30 text-brand-300 border border-brand-500/50"
                      : "bg-surface-200 text-white/50 border border-surface-300 hover:border-brand-500/30"
                  }`}
                >
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
            placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
            className="input"
            disabled={loading}
          />
        )}
      </div>
    );
  }

  if (missingFields.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          All required information filled
        </h3>
        <p className="text-white/50 text-sm mb-6">
          Ready to generate your UI kit.
        </p>
        <button
          onClick={() => onComplete(filledData)}
          disabled={loading}
          className="btn-primary px-8 py-3"
        >
          {loading ? "Creating kit..." : "Generate UI Kit →"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3">
        <p className="text-yellow-300 text-sm font-medium mb-1">
          {missingFields.length} required field{missingFields.length === 1 ? "" : "s"} missing
        </p>
        <p className="text-white/50 text-xs">
          Please fill in the following fields to continue.
        </p>
      </div>

      {/* Missing fields */}
      <div className="space-y-4">
        {missingFields.map(({ id }) => {
          const field = getField(id);
          if (!field) return null;
          return renderField(field);
        })}
      </div>

      {/* Submit */}
      <button
        onClick={() => onComplete(filledData)}
        disabled={loading || missingFields.length > 0}
        className="btn-primary w-full py-3"
      >
        {loading ? "Creating kit..." : "Generate UI Kit →"}
      </button>

    </div>
  );
}