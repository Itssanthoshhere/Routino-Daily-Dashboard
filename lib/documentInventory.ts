import { createHash } from 'node:crypto';
import type { UserWorkspaceData } from '@/lib/db';
import { workspaceHealth } from '@/lib/dataHealth';
import type { SavedDocument } from '@/types/documents';
export type InventoryDocument = {
    id: string;
    name: string;
    document: SavedDocument;
    contexts: string[];
};
export function documentInventory(data: UserWorkspaceData) { const grouped = new Map<string, InventoryDocument>(); for (const row of workspaceHealth(data).documents) {
    const source = row.document.pathname || row.document.url;
    if (!source)
        continue;
    const id = createHash('sha256').update(source).digest('hex');
    const context = `${row.owner} · ${row.context}`;
    const found = grouped.get(id);
    if (found) {
        if (!found.contexts.includes(context))
            found.contexts.push(context);
    }
    else
        grouped.set(id, { id, name: row.document.name, document: row.document, contexts: [context] });
} const files = Array.from(grouped.values()).sort((a, b) => a.id.localeCompare(b.id)); const inventoryId = createHash('sha256').update(JSON.stringify(files)).digest('hex'); return { files, inventoryId }; }
