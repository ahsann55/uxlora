"use client";

import { useState } from "react";

interface ReviseModalProps {
  screenId: string;
  screenName: string;
  kitId: string;
  revisionCount: number;
  maxRevisions?: number;
  onClose: () => void;
  onRevised: (updatedScreen: Record<string, unknown>) => void;
}

export function ReviseModal({
  screenId,
  screenName,
  kitId,
  revisionCount,
  maxRevisions = 2,
  onClose,
  onRevised,
}: ReviseModalProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revisionsLeft = maxRevisions - revisionCount;

  async function handleRevise() {
    if (!feedback.trim()) {
      setError("Please describe what you want to change.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/kits/${kitId}/screens/${screenId}/revise`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: feedback.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Revision failed. Please try again.");
        return;
      }

      onRevised(data);
      onClose();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative card w-full max-w-lg z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Revise screen
            </h2>
            <p className="text-white/50 text-sm mt-0.5">
              {screenName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Revision count */}
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: maxRevisions }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < revisionCount
                  ? "bg-brand-500"
                  : "bg-surface-200"
              }`}
            />
          ))}
          <p className="text-white/40 text-xs ml-1 flex-shrink-0">
            {revisionsLeft} revision{revisionsLeft === 1 ? "" : "s"} left
          </p>
        </div>

        {/* Feedback input */}
        <div className="mb-4">
          <label className="label">
            What would you like to change?
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Make the buttons larger and use a darker background. Move the title to the center."
            className="input min-h-[120px] resize-none"
            disabled={loading}
            autoFocus
          />
          <p className="text-white/30 text-xs mt-1">
            Be specific. Describe exactly what you want changed.
          </p>
        </div>

        {/* Examples */}
        <div className="bg-surface-100 rounded-lg p-3 mb-4">
          <p className="text-white/40 text-xs font-medium mb-2">
            Example feedback:
          </p>
          <div className="space-y-1">
            {[
              "Make the buttons larger and more prominent",
              "Use a darker background color",
              "Add more spacing between elements",
              "Make the typography bigger and bolder",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setFeedback(example)}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors block text-left"
              >
                + {example}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleRevise}
            disabled={loading || revisionsLeft === 0}
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
                Revising...
              </span>
            ) : revisionsLeft === 0 ? (
              "No revisions left"
            ) : (
              "Apply revision →"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}