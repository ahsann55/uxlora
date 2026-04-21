"use client";

import { getChecklist } from "@/lib/checklist";

interface GuidedReviewProps {
  data: Record<string, unknown>;
  category: "game" | "mobile" | "web";
  onSubmit: (finalData: Record<string, unknown>) => void;
  onEdit: () => void;
  loading?: boolean;
}

export function GuidedReview({
  data,
  category,
  onSubmit,
  onEdit,
  loading = false,
}: GuidedReviewProps) {
  const checklist = getChecklist(category);

  function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (Array.isArray(value)) {
      return value.length > 0
        ? value.map((item: unknown) =>
            typeof item === 'object' && item !== null
              ? (item as Record<string, unknown>).name
                ? String((item as Record<string, unknown>).name)
                : Object.values(item as Record<string, unknown>)
                    .filter(v => typeof v === 'string')
                    .join(" · ")
              : String(item)
          ).join(", ")
        : "—";
    }
    return String(value);
  }

  return (
    <div className="space-y-6">

      {/* Sections */}
      {checklist.sections.map((section) => (
        <div key={section.id} className="card space-y-4">
          <h3 className="section-title">{section.label}</h3>
          <div className="space-y-3">
            {section.fields.map((field) => {
              const value = data[field.id];
              const isEmpty =
                value === null ||
                value === undefined ||
                value === "" ||
                (Array.isArray(value) && value.length === 0);

              return (
                <div
                  key={field.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs mb-0.5">
                      {field.label}
                      {field.required && (
                        <span className="text-brand-400 ml-1">*</span>
                      )}
                    </p>
                    <p
                      className={`text-sm ${
                        isEmpty ? "text-white/20 italic" : "text-white"
                      }`}
                    >
                      {formatValue(value)}
                    </p>
                  </div>
                  {field.required && isEmpty && (
                    <span className="badge-error flex-shrink-0">Required</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          disabled={loading}
          className="btn-secondary flex-1"
        >
          ← Edit answers
        </button>
        <button
          onClick={() => onSubmit(data)}
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
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

    </div>
  );
}