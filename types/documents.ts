export type SavedDocument = { id: string; name: string; pathname?: string; url?: string; contentType?: string; size?: number; uploadedAt: string };
export type AssetDocuments = Record<string, SavedDocument[]>;
