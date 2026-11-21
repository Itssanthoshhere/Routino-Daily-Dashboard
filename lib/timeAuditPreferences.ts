import type { TimeAuditCategory } from "@/types/dashboard";
export type TimeAuditPreference = { id: "time-audit"; categories: TimeAuditCategory[] };
export function validTimeAuditCategories(value: unknown): value is TimeAuditCategory[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) return false;
  const ids = new Set<string>();
  return value.every(category => {
    if (!category || typeof category !== "object" || typeof category.id !== "string" || !category.id.trim() || category.id.length > 100 || ids.has(category.id) || typeof category.name !== "string" || !category.name.trim() || category.name.length > 100 || typeof category.color !== "string" || !/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(category.color) || !Array.isArray(category.keys) || category.keys.length > 500 || !category.keys.every((key: unknown) => typeof key === "string" && !!key.trim() && key.length <= 200)) return false;
    ids.add(category.id);
    return true;
  });
}
