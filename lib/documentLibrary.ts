import type { TrackerPurchase } from "@/types/trackers";
import type { AssetRecords } from "@/types/assets";
import type { AssetDocuments, SavedDocument } from "@/types/documents";
import type { Subscription } from "@/types/subscriptions";
import { assetDocumentKey } from "@/lib/assetDocuments";
export type LibraryDocument = {
    id: string;
    document: SavedDocument;
    owner: string;
    context: string;
    kind: "asset" | "service" | "claim" | "subscription";
};
export function documentLibrary(purchases: TrackerPurchase[], assets: AssetDocuments, records: AssetRecords, subscriptions: Subscription[]): LibraryDocument[] {
    const rows: LibraryDocument[] = [];
    const names = new Map(purchases.map(p => [assetDocumentKey(p), `${p.product} ${p.model}`.trim()]));
    const add = (documents: SavedDocument[] | undefined, owner: string, context: string, kind: LibraryDocument['kind'], key: string) => documents?.forEach(document => rows.push({ id: JSON.stringify([kind, key, document.id]), document, owner, context, kind }));
    const name = (key: string) => { if (names.has(key))
        return names.get(key)!; try {
        const fields = JSON.parse(key);
        return Array.isArray(fields) ? fields.filter(x => typeof x === 'string').join(' · ') : 'Saved asset';
    }
    catch {
        return 'Saved asset';
    } };
    for (const [key, docs] of Object.entries(assets))
        add(docs, name(key), 'Asset receipts', 'asset', key);
    for (const [key, record] of Object.entries(records)) {
        for (const service of record.services || [])
            add(service.documents, name(key), `${service.title} · ${service.provider} · ${service.date}`, 'service', `${key}:${service.id}`);
        for (const claim of record.claims || [])
            add(claim.documents, name(key), `${claim.title} · ${claim.contact} · ${claim.reference}`, 'claim', `${key}:${claim.id}`);
    }
    for (const plan of subscriptions)
        add(plan.documents, plan.name, `${plan.category} · ${plan.planName || ''}`, 'subscription', plan.id);
    return rows.sort((a, b) => b.document.uploadedAt.localeCompare(a.document.uploadedAt) || a.id.localeCompare(b.id));
}
export function searchDocuments(rows: LibraryDocument[], query: string, kind = 'all') {
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return rows.filter(row => (kind === 'all' || row.kind === kind) && terms.every(term => `${row.document.name} ${row.owner} ${row.context}`.toLocaleLowerCase().includes(term)));
}
