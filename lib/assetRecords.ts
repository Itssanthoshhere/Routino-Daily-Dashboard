import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import type { AssetRecords } from "@/types/assets";
export function isAssetRecords(value: unknown): value is AssetRecords {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).length <= 1000 && Object.entries(value).every(([key, record]) => {
    if (key.length > 2000 || !record || typeof record !== "object" || Array.isArray(record)) return false;
    const item = record as Record<string, unknown>;
    return [item.warrantyEnd, item.warrantyReminderDate].every(date => date === undefined || date === "" || isSubscriptionDate(date));
  });
}
export function warrantyReminderDate(end: string, today: string): string {
  const date = new Date(`${end}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().slice(0, 10) < today ? today : date.toISOString().slice(0, 10);
}
