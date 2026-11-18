import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import type { AssetRecords } from "@/types/assets";
import { isDocumentList } from "@/lib/assetDocuments";
export function isAssetRecords(value: unknown): value is AssetRecords {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).length <= 1000 && Object.entries(value).every(([key, record]) => {
    if (key.length > 2000 || !record || typeof record !== "object" || Array.isArray(record)) return false;
    const item = record as Record<string, unknown>;
    if (item.services !== undefined && (!Array.isArray(item.services) || item.services.length > 200 || new Set(item.services.map(service => service?.id)).size !== item.services.length || !item.services.every(service => service && typeof service.id === "string" && service.id.length > 0 && isSubscriptionDate(service.date) && typeof service.title === "string" && service.title.trim().length > 0 && service.title.length <= 180 && typeof service.provider === "string" && service.provider.length <= 180 && typeof service.cost === "number" && Number.isFinite(service.cost) && service.cost >= 0 && typeof service.notes === "string" && service.notes.length <= 5000 && (service.documents === undefined || isDocumentList(service.documents))))) return false;
    return [item.warrantyEnd, item.warrantyReminderDate].every(date => date === undefined || date === "" || isSubscriptionDate(date));
  });
}
export function warrantyReminderDate(end: string, today: string): string {
  const date = new Date(`${end}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().slice(0, 10) < today ? today : date.toISOString().slice(0, 10);
}
