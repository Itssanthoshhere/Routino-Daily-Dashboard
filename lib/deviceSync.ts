export type LocalSyncDevice = {
    id: string;
    label: string;
    coreSavedAt?: string;
    trackerSavedAt?: string;
};
const key = (account: string) => `routino_sync_device:${account.trim().toLowerCase()}`;
export function syncDevice(storage: Pick<Storage, 'getItem' | 'setItem'>, account: string): LocalSyncDevice { const stored = JSON.parse(storage.getItem(key(account)) || 'null'); if (stored && typeof stored.id === 'string' && /^[0-9a-f-]{36}$/.test(stored.id) && typeof stored.label === 'string')
    return stored; const id = crypto.randomUUID(); const device = { id, label: `Browser ${id.slice(0, 6)}` }; storage.setItem(key(account), JSON.stringify(device)); return device; }
export function recordDeviceSave(account: string, area: 'core' | 'tracker', savedAt: string) { if (typeof window === 'undefined')
    return; try {
    const device = syncDevice(localStorage, account);
    localStorage.setItem(key(account), JSON.stringify({ ...device, [area === 'core' ? 'coreSavedAt' : 'trackerSavedAt']: savedAt }));
    window.dispatchEvent(new Event('routino:device-sync'));
}
catch { } }
export function nameSyncDevice(account: string, label: string, storage: Pick<Storage, "getItem" | "setItem"> = localStorage) { const device = syncDevice(storage, account); storage.setItem(key(account), JSON.stringify({ ...device, label: label.trim().slice(0, 80) || device.label })); window.dispatchEvent(new Event('routino:device-sync')); }
export function pendingDeviceEdits(storage: Pick<Storage, 'getItem'>, account: string) { try {
    const core = JSON.parse(storage.getItem(`routino_workspace_pending:${account}`) || '{}');
    const tracker = JSON.parse(storage.getItem(`routino_trackers_v2:${account}`) || '{}');
    return { corePending: Object.keys(core).length > 0, trackerPending: !!tracker.pending };
}
catch {
    return { corePending: null, trackerPending: null };
} }
export function validDeviceReport(value: unknown): boolean { if (!value || typeof value !== 'object')
    return false; const v = value as Record<string, unknown>; return typeof v.id === 'string' && /^[0-9a-f-]{36}$/.test(v.id) && typeof v.label === 'string' && !!v.label.trim() && v.label.length <= 80 && [v.corePending, v.trackerPending].every(x => x === null || typeof x === 'boolean') && [v.coreSavedAt, v.trackerSavedAt].every(x => x === undefined || (typeof x === 'string' && Number.isFinite(Date.parse(x)))); }
