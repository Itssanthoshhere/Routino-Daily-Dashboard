import { workspaceValidationError } from "@/lib/workspaceValidation";
import { isSubscriptionList } from "@/lib/subscriptionValidation";
import { isAssetRecords } from "@/lib/assetRecords";
import { isAssetDocuments } from "@/lib/assetDocuments";
import { isAirtelData } from "@/lib/airtelValidation";
export const recoveryFields = ['tasks', 'notes', 'habits', 'customEvents', 'quickLinks', 'taskTemplates', 'focusRecords', 'workspacePreferences', 'subscriptionBudgets', 'subscriptions', 'assetRecords', 'assetDocuments', 'airtel'] as const;
export type RecoveryField = typeof recoveryFields[number];
export type RecoverySelection = {
    field: RecoveryField;
    id: string;
};
type Data = Record<string, unknown>;
export function recoveryRows(data: Data) {
    return recoveryFields.flatMap(field => {
        const value = data[field];
        const items = field === 'airtel' ? (Array.isArray((value as {
            records?: unknown[];
        })?.records) ? (value as {
            records: unknown[];
        }).records : []) : field === 'assetRecords' || field === 'assetDocuments' ? Object.entries((value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Data).map(([id, record]) => ({ id, value: record })) : Array.isArray(value) ? value : [];
        return items.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && typeof (r as Data).id === 'string').map(row => ({ field, id: String(row.id), label: String(row.title || row.name || row.summary || (field === 'assetRecords' || field === 'assetDocuments' ? row.id : row.taskTitle || row.id)), record: field === 'assetRecords' || field === 'assetDocuments' ? row.value : row }));
    });
}
export function selectedRecoveryRecord(data: Data, selection: RecoverySelection) { return recoveryRows(data).find(row => row.field === selection.field && row.id === selection.id)?.record; }
export function restoreSelectedRecord(current: Data, selection: RecoverySelection, record: unknown): Data {
    if (!recoveryFields.includes(selection.field) || !selection.id || selection.id === '__proto__' || selection.id === 'constructor' || selection.id === 'prototype')
        throw new Error('Unsupported recovery record.');
    const field = selection.field;
    let value: unknown;
    if (field === 'assetRecords' || field === 'assetDocuments') {
        value = { ...((current[field] || {}) as Data), [selection.id]: record };
        const valid = field === 'assetRecords' ? isAssetRecords(value) : isAssetDocuments(value);
        if (!valid)
            throw new Error('Invalid asset recovery record.');
    }
    else if (field === 'airtel') {
        const prior = (current.airtel || { records: [], deletedIds: [] }) as {
            records: {
                id: string;
            }[];
            deletedIds: string[];
        };
        if (!record || typeof record !== 'object' || (record as Data).id !== selection.id)
            throw new Error('Invalid recharge recovery record.');
        value = { ...prior, records: [...prior.records.filter(r => r.id !== selection.id), record], deletedIds: prior.deletedIds.filter(id => id !== selection.id) };
        if (!isAirtelData(value))
            throw new Error('Invalid recharge recovery record.');
    }
    else {
        if (!record || typeof record !== 'object' || (record as Data).id !== selection.id)
            throw new Error('Record identity does not match.');
        const previous = Array.isArray(current[field]) ? current[field] as {
            id: string;
        }[] : [];
        value = previous.some(row => row.id === selection.id) ? previous.map(row => row.id === selection.id ? record : row) : [...previous, record];
        const error = field === 'subscriptions' ? !isSubscriptionList(value) : workspaceValidationError({ [field]: value });
        if (error)
            throw new Error('Invalid recovery record.');
    }
    return { ...current, [field]: value };
}
export type RecoveryCopy = {
    key: string;
    label: string;
    date: string | null;
    data: Data;
    raw: string;
};
export function localRecoveryCopies(storage: Pick<Storage, 'length' | 'key' | 'getItem'>, account: string): RecoveryCopy[] {
    const owner = account.trim().toLowerCase();
    if (!owner)
        return [];
    const core = `routino_workspace_pending:${owner}:recovery:`, tracker = `routino_trackers_v2:${owner}`;
    const copies: RecoveryCopy[] = [];
    for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (!key || !(key.startsWith(core) || key === `${tracker}:conflict-backup` || key === `${tracker}:previous-cache`))
            continue;
        const raw = storage.getItem(key);
        if (!raw)
            continue;
        try {
            const parsed = JSON.parse(raw);
            const data = parsed?.data || parsed;
            if (!data || typeof data !== 'object' || Array.isArray(data))
                continue;
            const millis = key.startsWith(core) ? Number(key.slice(core.length)) : NaN;
            copies.push({ key, label: key.startsWith(core) ? 'Workspace conflict draft' : key.endsWith('conflict-backup') ? 'Tracker conflict draft' : 'Previous tracker cache', date: Number.isFinite(millis) && millis > 0 ? new Date(millis).toISOString() : null, data, raw });
        }
        catch {
            copies.push({ key, label: 'Unreadable preserved copy', date: null, data: {}, raw });
        }
    }
    return copies.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
export function recoveryHasPending(storage: Pick<Storage, 'getItem'>, account: string): boolean {
    const core = JSON.parse(storage.getItem(`routino_workspace_pending:${account.toLowerCase()}`) || '{}');
    const tracker = JSON.parse(storage.getItem(`routino_trackers_v2:${account.toLowerCase()}`) || '{}');
    return Object.keys(core).length > 0 || !!tracker.pending;
}
