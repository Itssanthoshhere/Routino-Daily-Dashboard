import type { SavedDocument } from "@/types/documents";
export type AssetService = { id: string; date: string; title: string; provider: string; cost: number; notes: string; documents?: SavedDocument[] };
export type AssetRecord = { warrantyEnd?: string; warrantyReminderDate?: string; services?: AssetService[] };
export type AssetRecords = Record<string, AssetRecord>;
