import type { TimeAuditCategory } from "@/types/dashboard";
export type TimeAuditPreference = { id: "time-audit"; categories: TimeAuditCategory[] };
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
