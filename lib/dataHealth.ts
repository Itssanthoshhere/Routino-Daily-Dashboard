import type { UserWorkspaceData } from '@/lib/db';
import { documentLibrary } from '@/lib/documentLibrary';
export type HealthIssue = {
    id: string;
    level: 'review' | 'warning';
    title: string;
    detail: string;
};
export function workspaceHealth(data: UserWorkspaceData) {
    const issues: HealthIssue[] = [];
    for (const task of data.tasks || [])
        if (!task.checked && !task.skipped && !task.inbox && !task.dueDate)
            issues.push({ id: `task-date:${task.id}`, level: 'review', title: task.title, detail: 'Open task has no due date. This may be intentional; move it to the task inbox or set a date if useful.' });
    for (const s of data.subscriptions || []) {
        if (s.status === 'active' && (!s.renewalDate || s.cycle === 'unknown') && s.cycle !== 'bundled' && s.cycle !== 'one-time')
            issues.push({ id: `subscription-date:${s.id}`, level: 'review', title: s.name, detail: 'Active plan has unconfirmed billing or no renewal date.' });
        for (const e of s.expiryRecords || [])
            if (!e.provider.trim())
                issues.push({ id: `expiry-provider:${s.id}:${e.id}`, level: 'review', title: e.name, detail: 'Expiry is saved without a provider or registrar.' });
    }
    const documents = documentLibrary([], data.assetDocuments || {}, data.assetRecords || {}, data.subscriptions || []);
    for (const task of data.tasks || [])
        for (const document of task.documents || [])
            documents.push({ id: `task:${task.id}:${document.id}`, document, owner: task.title, context: 'Task attachment', kind: 'asset' });
    for (const d of documents)
        if (d.document.url && !d.document.pathname)
            issues.push({ id: `external:${d.id}`, level: 'review', title: d.document.name, detail: 'External reference: its availability and retention are controlled by the source. Routino has not fetched or backed up this URL.' });
    for (const collection of ['tasks', 'notes', 'habits', 'quickLinks', 'subscriptions'] as const) {
        const seen = new Set<string>();
        for (const item of data[collection] || []) {
            if (seen.has(item.id))
                issues.push({ id: `duplicate:${collection}:${item.id}`, level: 'warning', title: `Duplicate ID in ${collection}`, detail: 'Review preserved copies before changing or removing either record.' });
            seen.add(item.id);
        }
    }
    return { issues, documents };
}
