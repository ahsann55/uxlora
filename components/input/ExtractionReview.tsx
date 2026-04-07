"use client";

import { useState } from "react";
import { getChecklist } from "@/lib/checklist";
import type { ChecklistField } from "@/lib/checklist";

interface ExtractionReviewProps {
  data: Record<string, unknown>;
  category: string;
  onComplete: (finalData: Record<string, unknown>) => void;
  loading?: boolean;
}

export function ExtractionReview({
  data,
  category,
  onComplete,
  loading = false,
}: ExtractionReviewProps) {
  const [editedData, setEditedData] =
    useState<Record<string, unknown>>(data);

  const checklist = getChecklist(category as "game" | "mobile" | "web");

  function updateField(id: string, value: unknown) {
    setEditedData((prev) => ({ ...prev, [id]: value }));
  }

  function renderField(field: ChecklistField) {
    const value = editedData[field.id];
    const hasValue = value !== null && value !== undefined && value !== "";

    return (
      <div key={field.id} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="label mb-0">{field.label}</label>
          {hasValue ? (
            <span className="badge-success text-xs">Extracted</span>
          ) : (
            <span className="badge-warning text-xs">Not found</span>
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

  return (
    <div className="space-y-8">

      {/* Info banner */}
      <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-3">
        <p className="text-brand-300 text-sm">
          We extracted the following information from your document. Review and
          edit anything before generating.
        </p>
      </div>

      {/* Sections */}
      {checklist.sections.map((section) => (
        <div key={section.id} className="card space-y-4">
          <h3 className="section-title">{section.label}</h3>
          {section.fields.map((field) => renderField(field))}
        </div>
      ))}

      {/* Submit */}
      <button
        onClick={() => onComplete(editedData)}
        disabled={loading}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Creating kit...
          </span>
        ) : (
          "Generate UI Kit →"
        )}
      </button>

    </div>
  );
}