"use client";

import { useState } from "react";
import { getChecklist } from "@/lib/checklist";

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
  const [showAll, setShowAll] = useState(false);
  const checklist = getChecklist(category as "game" | "mobile" | "web");

  // Collect all fields with values
  const filledFields: { label: string; value: string }[] = [];
  for (const section of checklist.sections) {
    for (const field of section.fields) {
      const value = data[field.id];
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      filledFields.push({
        label: field.label,
        value: Array.isArray(value)
        ? value.map((item: unknown) =>
            typeof item === 'object' && item !== null
              ? (item as Record<string, unknown>).name
                ? String((item as Record<string, unknown>).name)
                : Object.values(item as Record<string, unknown>)
                    .filter(v => typeof v === 'string')
                    .join(" · ")
              : String(item)
          ).join(", ")
        : String(value),
      });
    }
  }

  const visibleFields = showAll ? filledFields : filledFields.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3">
        <p className="text-green-300 text-sm font-medium mb-1">
          ✓ Ready to generate
        </p>
        <p className="text-white/40 text-xs">
          {filledFields.length} fields collected from your document and inputs.
        </p>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Generation Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleFields.map(({ label, value }) => (
            <div key={label} className="bg-surface-100 rounded-lg p-3">
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white text-sm truncate">{value}</p>
            </div>
          ))}
        </div>
        {filledFields.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-brand-400 text-xs mt-3 hover:text-brand-300 transition-colors"
          >
            {showAll ? "Show less" : `Show ${filledFields.length - 8} more fields`}
          </button>
        )}
      </div>

      <button
        onClick={() => onComplete(data)}
        disabled={loading}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
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