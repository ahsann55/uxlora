"use client";

import { useState } from "react";
import type { ChecklistCategory, ChecklistField } from "@/lib/checklist";

interface GuidedStepProps {
  section: ChecklistCategory;
  data: Record<string, unknown>;
  onUpdate: (id: string, value: unknown) => void;
  isDemo?: boolean;
  existingScreens?: string[];
  addScreensMode?: boolean;
  errors?: Record<string, string>;
}

const MAX_FREE_SCREENS = 2;

export function GuidedStep({
  section,
  data,
  onUpdate,
  isDemo = true,
  existingScreens = [],
  addScreensMode = false,
  errors = {},
}: GuidedStepProps) {
  const [screenLimitWarningShown, setScreenLimitWarningShown] = useState(false);
  const [customScreenInput, setCustomScreenInput] = useState("");

  function addCustomScreen() {
    const name = customScreenInput.trim();
    if (!name) return;
    const current = Array.isArray(data.custom_screens) ? (data.custom_screens as string[]) : [];
    if (current.includes(name)) return;
    onUpdate("custom_screens", [...current, name]);
    setCustomScreenInput("");
  }

  function removeCustomScreen(name: string) {
    const current = Array.isArray(data.custom_screens) ? (data.custom_screens as string[]) : [];
    onUpdate("custom_screens", current.filter((s) => s !== name));
  }

  function renderField(field: ChecklistField) {
    const value = data[field.id];
    const isScreenField = field.id === "key_screens";

    // Hide custom_resolution field unless "Custom" is selected in screen_resolution
    if (field.id === "custom_resolution" && data.screen_resolution !== "Custom") {
      return null;
    }

    // Hide custom_other fields unless "Other" is selected in parent field
    if (field.id === "custom_genre" && data.genre_or_category !== "Other") return null;
    if (field.id === "custom_visual_style" && data.visual_style !== "Other") return null;
    if (field.id === "custom_typography" && data.typography_preferences !== "Other") return null;
    if (field.id === "custom_home_focus" && data.home_focus_element !== "Other") return null;
    if (field.id === "custom_currencies" && !(Array.isArray(data.currencies) && data.currencies.includes("Other"))) return null;
    if (field.id === "custom_monetization" && !(Array.isArray(data.monetization) && data.monetization.includes("Other"))) return null;
    if (field.id === "custom_game_systems" && !(Array.isArray(data.game_systems) && data.game_systems.includes("Other"))) return null;
    const customScreens = Array.isArray(data.custom_screens) ? (data.custom_screens as string[]) : [];

    return (
      <div key={field.id} className="space-y-2">
        <div>
          <label className="label">
            {field.label}
            {field.required && (
              <span className="text-brand-400 ml-1">*</span>
            )}
          </label>
          {field.hint && (
            <p className="text-white/40 text-xs mb-2">{field.hint}</p>
          )}
          {isScreenField && isDemo && !addScreensMode && (
            <p className="text-yellow-400/70 text-xs mb-2">
              Free tier: select up to {MAX_FREE_SCREENS} screens. Paid plans unlock all.
            </p>
          )}
          {isScreenField && addScreensMode && existingScreens.length > 0 && (
            <p className="text-brand-400/70 text-xs mb-2">
              ✓ {existingScreens.length} screen{existingScreens.length === 1 ? "" : "s"} already generated — locked. Select additional screens to generate.
            </p>
          )}
        </div>

        {field.type === "textarea" ? (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onUpdate(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="input min-h-[100px] resize-none"
            rows={4}
          />
        ) : field.type === "select" ? (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onUpdate(field.id, e.target.value)}
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
                  const isLandscape = (data.orientation as string) === "Landscape";
                  return isLandscape ? w > h : h >= w;
                })
              : field.options
            )?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : field.type === "multiselect" ? (
          <div className="space-y-2">
            {!addScreensMode && (
              <p className="text-white/40 text-xs">
                Select all that apply
                {isScreenField && isDemo && (
                  <span className="text-yellow-400/70 ml-1">
                    (max {MAX_FREE_SCREENS})
                  </span>
                )}
              </p>
            )}

            {isScreenField && screenLimitWarningShown && (
              <div className="bg-warning/10 border border-warning/30 text-yellow-300 text-xs px-3 py-2 rounded-lg">
                Free tier limit reached. Deselect a screen to choose a different one.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt) => {
                const isExisting = existingScreens.includes(opt);
                const selected = Array.isArray(value) && value.includes(opt);
                const currentCount = Array.isArray(value)
                  ? value.filter((v) => !existingScreens.includes(v as string)).length
                  : 0;
                const atLimit = isScreenField && isDemo && !addScreensMode && currentCount >= MAX_FREE_SCREENS;
                const isDisabled = isExisting || (atLimit && !selected);

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isExisting) return;
                      const current = Array.isArray(value) ? value : [];

                      if (isScreenField && isDemo && !addScreensMode) {
                        if (selected) {
                          onUpdate(field.id, current.filter((v) => v !== opt));
                          setScreenLimitWarningShown(false);
                        } else if (currentCount >= MAX_FREE_SCREENS) {
                          if (!screenLimitWarningShown) {
                            setScreenLimitWarningShown(true);
                          }
                        } else {
                          onUpdate(field.id, [...current, opt]);
                        }
                      } else {
                        const next = selected
                          ? current.filter((v) => v !== opt)
                          : [...current, opt];
                        onUpdate(field.id, next);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isExisting
                        ? "bg-success/20 text-success border border-success/40 cursor-not-allowed"
                        : selected
                        ? "bg-brand-500/30 text-brand-300 border border-brand-500/50"
                        : isDisabled
                        ? "bg-surface-100 text-white/20 border border-surface-200 cursor-not-allowed"
                        : "bg-surface-200 text-white/50 border border-surface-300 hover:border-brand-500/30 hover:text-white/70"
                    }`}
                  >
                    {isExisting && <span className="mr-1">✓</span>}
                    {!isExisting && selected && <span className="mr-1">✓</span>}
                    {opt}
                  </button>
                );
              })}

              {/* Custom screens as selected chips */}
              {isScreenField && customScreens.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => removeCustomScreen(name)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-500/30 text-brand-300 border border-brand-500/50"
                >
                  ✓ {name} ×
                </button>
              ))}
            </div>

            {/* Custom screen input — only for paid, non-demo */}
            {isScreenField && !isDemo && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customScreenInput}
                  onChange={(e) => setCustomScreenInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomScreen(); } }}
                  placeholder="Add custom screen name..."
                  className="input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={addCustomScreen}
                  disabled={!customScreenInput.trim()}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  + Add
                </button>
              </div>
            )}

            {Array.isArray(value) && (value.length > 0 || customScreens.length > 0) && (
              <p className="text-white/40 text-xs">
                {(Array.isArray(value) ? value.length : 0) + customScreens.length} total ({existingScreens.length} existing
                {((Array.isArray(value) ? value.length : 0) + customScreens.length) - existingScreens.length > 0
                  ? `, ${((Array.isArray(value) ? value.length : 0) + customScreens.length) - existingScreens.length} new`
                  : ""})
                {isScreenField && isDemo && !addScreensMode && (
                  <span className="text-yellow-400/70 ml-1">
                    / {MAX_FREE_SCREENS} max
                  </span>
                )}
              </p>
            )}
          </div>
        ) : field.type === "number" ? (
          <input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => onUpdate(field.id, Number(e.target.value))}
            placeholder={field.placeholder}
            className="input"
          />
        ) : (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onUpdate(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="input"
          />
        )}
      {errors[field.id] && (
        <p className="text-red-400 text-xs mt-1">{errors[field.id]}</p>
      )}
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      {section.fields.map((field) => renderField(field))}
    </div>
  );
}