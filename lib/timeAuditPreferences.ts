import type { TimeAuditCategory } from "@/types/dashboard";
export type TimeAuditPreference = { id: "time-audit"; categories: TimeAuditCategory[]; previousCategories?: TimeAuditCategory[] };
export function timeAuditKeywordOverlaps(categories: TimeAuditCategory[]) {
  const matches = new Map<string, TimeAuditCategory[]>();
  for (const category of categories) {
    if (category.id === "other" || category.name === "Other") continue;
    for (const keyword of Array.from(new Set(category.keys.map(key => key.trim().toLowerCase()).filter(Boolean)))) {
      matches.set(keyword, [...(matches.get(keyword) || []), category]);
    }
  }
  return Array.from(matches, ([keyword, categories]) => ({ keyword, categories })).filter(match => match.categories.length > 1);
}
/** Keep one account-synced undo snapshot; undo consumes it rather than toggling. */
export function nextTimeAuditPreference(current: TimeAuditPreference | undefined, categories: TimeAuditCategory[], undo = false): TimeAuditPreference {
  if (!validTimeAuditCategories(categories)) throw new Error("Invalid category settings.");
  if (undo) {
    if (!current?.previousCategories || JSON.stringify(current.previousCategories) !== JSON.stringify(categories)) throw new Error("Saved rules changed. Refresh before undoing.");
    return { id: "time-audit", categories: structuredClone(categories) };
  }
  if (current && JSON.stringify(current.categories) === JSON.stringify(categories)) return current;
  return { id: "time-audit", categories: structuredClone(categories), ...(current ? { previousCategories: structuredClone(current.categories) } : {}) };
}
export function validTimeAuditPreference(value: Record<string, unknown>): boolean {
  return validTimeAuditCategories(value.categories) && (value.previousCategories === undefined || validTimeAuditCategories(value.previousCategories));
}
/** Include unfinished keyword fields when saving, without altering source rules. */
export function appendTimeAuditKeywords(categories: TimeAuditCategory[], pending: Record<string, string>): TimeAuditCategory[] {
  return categories.map(category => {
    const keyword = (pending[category.id] || "").trim().toLowerCase();
    if (!keyword) return category;
    if (keyword.length > 200) throw new Error("Keywords must be 200 characters or fewer.");
    if (category.keys.some(key => key.trim().toLowerCase() === keyword)) return category;
    if (category.keys.length >= 500) throw new Error(`${category.name} already has the maximum of 500 keywords.`);
    return { ...category, keys: [...category.keys, keyword] };
  });
}
export function validTimeAuditCategories(value: unknown): value is TimeAuditCategory[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) return false;
  const ids = new Set<string>();
  return value.every(category => {
    if (!category || typeof category !== "object" || typeof category.id !== "string" || !category.id.trim() || category.id.length > 100 || ids.has(category.id) || typeof category.name !== "string" || !category.name.trim() || category.name.length > 100 || typeof category.color !== "string" || !/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(category.color) || !Array.isArray(category.keys) || category.keys.length > 500 || !category.keys.every((key: unknown) => typeof key === "string" && !!key.trim() && key.length <= 200)) return false;
    ids.add(category.id);
    return true;
  });
}
