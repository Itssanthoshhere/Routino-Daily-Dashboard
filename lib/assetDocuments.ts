import type { TrackerPurchase } from "@/types/trackers";
import type { AssetDocuments, SavedDocument } from "@/types/documents";

export function assetDocumentKey(asset: Pick<TrackerPurchase, "product" | "model" | "orderDate" | "seller">): string {
  return JSON.stringify([asset.product, asset.model, asset.orderDate, asset.seller].map(value => value.trim().toLowerCase()));
}
export function isDocumentList(value: unknown): value is SavedDocument[] {
  return Array.isArray(value) && value.length <= 50 && value.every(doc => {
    if (!doc || typeof doc !== "object" || typeof doc.id !== "string" || typeof doc.name !== "string" || !doc.name.trim() || doc.name.length > 180 || typeof doc.uploadedAt !== "string" || !Number.isFinite(Date.parse(doc.uploadedAt))) return false;
    if (doc.pathname !== undefined) return typeof doc.pathname === "string" && /^subscription-documents\/[0-9a-f]{64}\/[0-9a-f-]{36}$/.test(doc.pathname);
    try { return typeof doc.url === "string" && ["https:", "http:"].includes(new URL(doc.url).protocol); } catch { return false; }
  });
}
export function isAssetDocuments(value: unknown): value is AssetDocuments {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length <= 1000 && Object.entries(value).every(([key, docs]) => key.length <= 2000 && isDocumentList(docs));
}
