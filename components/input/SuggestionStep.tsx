"use client";

import type { SuggestionQuestion } from "@/lib/anthropic/index";

interface SuggestionStepProps {
  questions: SuggestionQuestion[];
  answers: Record<string, unknown>;
  onAnswer: (id: string, value: unknown) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export function SuggestionStep({
  questions,
  answers,
  onAnswer,
  onContinue,
  onSkip,
}: SuggestionStepProps) {
  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">
          A few more questions
        </h2>
        <p className="text-white/40 text-sm">
          Help us generate a better UI kit for your project.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <label className="label">{q.question}</label>

            {q.type === "select" && q.options && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onAnswer(q.id, selected ? undefined : opt)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            )}

            {q.type === "multiselect" && q.options && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const current = Array.isArray(answers[q.id]) ? answers[q.id] as string[] : [];
                  const selected = current.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? current.filter((v) => v !== opt)
                          : [...current, opt];
                        onAnswer(q.id, next);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            )}

            {q.type === "text" && (
              <input
                type="text"
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                placeholder={q.default ?? ""}
                className="input"
              />
            )}

            {q.type === "color" && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={(answers[q.id] as string) ?? q.default ?? "#6366f1"}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                  className="w-10 h-10 rounded-lg border border-surface-300 bg-surface-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={(answers[q.id] as string) ?? q.default ?? "#6366f1"}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                  placeholder="#6366f1"
                  className="input flex-1"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="btn-secondary flex-1"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="btn-primary flex-1"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}