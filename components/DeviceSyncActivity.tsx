"use client";
import { useCallback, useEffect, useState } from "react";
import { nameSyncDevice, pendingDeviceEdits, syncDevice } from "@/lib/deviceSync";
export function DeviceSyncReporter({ email, signal }: {
    email?: string | null;
    signal: string;
}) { useEffect(() => { if (!email)
    return; const account = email.toLowerCase(); let timer: ReturnType<typeof setTimeout> | undefined; let active = true; let busy = false; const report = async () => { if (!active || busy || !navigator.onLine || document.visibilityState !== 'visible')
    return; busy = true; try {
    const device = syncDevice(localStorage, account);
    await fetch('/api/device-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedAccount: account, device: { ...device, ...pendingDeviceEdits(localStorage, account) } }) });
}
catch { }
finally {
    busy = false;
} }; const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void report(), 1500); }; schedule(); const interval = setInterval(() => void report(), 60000); window.addEventListener('routino:device-sync', schedule); window.addEventListener('online', schedule); window.addEventListener('focus', schedule); window.addEventListener('storage', schedule); document.addEventListener('visibilitychange', schedule); return () => { active = false; clearTimeout(timer); clearInterval(interval); window.removeEventListener('routino:device-sync', schedule); window.removeEventListener('online', schedule); window.removeEventListener('focus', schedule); window.removeEventListener('storage', schedule); document.removeEventListener('visibilitychange', schedule); }; }, [email, signal]); return null; }
type Device = {
    id: string;
    label: string;
    lastSeenAt: string;
    coreSavedAt?: string;
    trackerSavedAt?: string;
    corePending: boolean | null;
    trackerPending: boolean | null;
};
export function DeviceSyncActivity({ email, request = fetch, store }: {
    email: string;
    request?: typeof fetch;
    store?: Pick<Storage, "getItem" | "setItem">;
}) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [id, setId] = useState('');
    const [label, setLabel] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [checked, setChecked] = useState(Date.now());
    const load = useCallback(async () => { setBusy(true); setError(''); try {
        const response = await request('/api/device-sync', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || result.email !== email.toLowerCase())
            throw new Error(result.error || 'Account changed. Reopen Sync Center.');
        setDevices(result.devices);
        setChecked(Date.now());
    }
    catch (error) {
        setError(error instanceof Error ? error.message : 'Device activity unavailable.');
    }
    finally {
        setBusy(false);
    } }, [email, request]);
    useEffect(() => { setDevices([]); try {
        const current = syncDevice(store || localStorage, email);
        setId(current.id);
        setLabel(current.label);
    }
    catch {
        setError('Browser storage is unavailable.');
    } void load(); }, [email, load, store]);
    const date = (value?: string) => value ? new Date(value).toLocaleString() : 'No successful save reported';
    return <details className="mt-4 rounded-xl border border-line p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Device sync activity</summary>
    <p className="mt-2 text-muted">Browsers report while open and online. Last reported pending state may be stale after 5 minutes. This is browser activity, not a list of signed-in security sessions.</p>
    <form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); try {
        nameSyncDevice(email, label, store);
        setError('Name saved locally; activity updates shortly.');
    }
    catch {
        setError('Could not save device name.');
    } }}>
    <input aria-label="This browser name" maxLength={80} className="min-w-0 flex-1 rounded-lg border border-line p-2" value={label} onChange={e => setLabel(e.target.value)}/>
    <button className="btn-theme rounded-lg border border-line px-3 py-2">Save name</button>
    </form>
    <button type="button" disabled={busy} className="btn-theme mt-2 rounded-lg border border-line px-3 py-2" onClick={() => void load()}>{busy ? 'Checking…' : 'Refresh devices'}</button>
    <p role="status" className="mt-2 text-muted">{error}</p>{!devices.length && !busy && !error && <p className="mt-2 text-muted">No browsers have reported yet. This browser reports shortly while online; refresh to check.</p>}<ul className="mt-3 divide-y divide-line">{devices.map(device => <li key={device.id} className="space-y-1 py-3">
        <strong>{device.label}{device.id === id ? ' · This browser' : ''}</strong>
        <p className="text-muted">Last seen: {date(device.lastSeenAt)}{checked - Date.parse(device.lastSeenAt) > 300000 ? ' · Stale report' : ''}</p>
        <p>Core save: {date(device.coreSavedAt)}</p>
        <p>Tracker save: {date(device.trackerSavedAt)}</p>
        <p>Reported edits: {device.corePending === null || device.trackerPending === null ? 'Unknown' : device.corePending || device.trackerPending ? `${device.corePending ? 'Workspace pending ' : ''}${device.trackerPending ? 'Trackers pending' : ''}` : 'None pending at last report'}</p>
        </li>)}</ul>
    </details>;
}
