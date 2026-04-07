import { getRequiredFieldIds } from "./index";

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  missingLabels: string[];
}

/**
 * Validate checklist data for a given category.
 * Returns a list of missing required fields.
 */
export function validateChecklist(
  category: "game" | "mobile" | "web",
  data: Record<string, unknown>
): ValidationResult {
  const requiredIds = getRequiredFieldIds(category);

  const missingFields = requiredIds.filter((id) => {
    const value = data[id];
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
    missingLabels: missingFields,
  };
}

/**
 * Get missing required fields with their labels.
 */
export function getMissingFields(
  category: "game" | "mobile" | "web",
  data: Record<string, unknown>
): { id: string; label: string }[] {
  const { getChecklist } = require("./index");
  const checklist = getChecklist(category);

  const allFields = checklist.sections.flatMap(
    (s: { fields: { id: string; label: string; required: boolean }[] }) =>
      s.fields
  );

  const requiredFields = allFields.filter(
    (f: { required: boolean }) => f.required
  );

  return requiredFields
    .filter((f: { id: string }) => {
      const value = data[f.id];
      if (value === null || value === undefined) return true;
      if (typeof value === "string" && value.trim() === "") return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    })
    .map((f: { id: string; label: string }) => ({
      id: f.id,
      label: f.label,
    }));
}