import type { SavedDocument } from "@/types/documents";
export type AssetService = { id: string; date: string; title: string; provider: string; cost: number; notes: string; documents?: SavedDocument[] };
export type AssetRecord = { identifiers?: import("@/lib/assetPlanning").AssetIdentifier[]; depreciation?: import("@/lib/assetPlanning").Depreciation; claims?: WarrantyClaim[]; maintenance?: AssetMaintenance[]; warrantyEnd?: string; warrantyReminderDate?: string; services?: AssetService[] };
export type AssetRecords = Record<string, AssetRecord>;
export type WarrantyClaim = { id: string; title: string; status: "draft" | "submitted" | "in-service" | "resolved" | "rejected"; contact: string; reference: string; notes: string; checklist: { id: string; label: string; done: boolean }[]; documents?: SavedDocument[] };
export type AssetMaintenance = { id: string; title: string; nextDue: string; repeatDays?: number; notes: string; completed?: boolean; completedDates: string[] };
