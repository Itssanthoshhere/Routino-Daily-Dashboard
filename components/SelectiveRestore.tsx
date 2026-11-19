"use client";
import { useState } from "react";
import { recoveryRows, selectedRecoveryRecord, restoreSelectedRecord, recoveryHasPending, type RecoverySelection } from "@/lib/selectiveRecovery";
export function SelectiveRestore({ email, data, backupId, label, request = fetch }: {
    request?: typeof fetch;
    email: string;
    data: Record<string, unknown>;
    backupId?: string;
    label: string;
}) {
    const [query, setQuery] = useState('');
    const [chosen, setChosen] = useState('');
    const [preview, setPreview] = useState<{
        selection: RecoverySelection;
        record: unknown;
        current: unknown;
        version: string;
    } | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const rows = recoveryRows(data);
    const visible = rows.filter(row => `${row.field} ${row.label}`.toLowerCase().includes(query.toLowerCase())).slice(0, 200);
    const selected = rows.find(row => JSON.stringify([row.field, row.id]) === chosen);
    const compare = async () => { if (!selected)
        return; setBusy(true); setMessage(''); setPreview(null); setConfirmed(false); try {
        const response = await request('/api/workspace-recovery', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || result.email !== email.toLowerCase())
            throw new Error(result.error || 'Account changed. Reopen recovery.');
        const selection = { field: selected.field, id: selected.id };
        restoreSelectedRecord(result.data, selection, selected.record);
        setPreview({ selection, record: selected.record, current: selectedRecoveryRecord(result.data, selection), version: result.version });
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not preview recovery.');
    }
    finally {
        setBusy(false);
    } };
    const restore = async () => { if (!preview || !confirmed)
        return; setBusy(true); setMessage(''); try {
        if (recoveryHasPending(localStorage, email))
            throw new Error('Save or export pending workspace and tracker edits before recovery. Your drafts remain unchanged.');
        const response = await request('/api/workspace-recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedAccount: email.toLowerCase(), selection: preview.selection, version: preview.version, ...(backupId ? { backupId } : { record: preview.record }) }) });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error || 'Recovery failed.');
        try {
            if (!recoveryHasPending(localStorage, email))
                localStorage.removeItem(`routino_trackers_v2:${email.toLowerCase()}`);
        }
        catch { }
        setMessage('Record restored. Refreshing saved workspace…');
        window.dispatchEvent(new Event('routino:workspace-restored'));
        setPreview(null);
        setConfirmed(false);
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : 'Recovery failed.');
    }
    finally {
        setBusy(false);
    } };
    const content = (value: unknown) => JSON.stringify(value, null, 2) || 'No current record. This will be added.';
    return <div className="mt-3 rounded-xl border border-line bg-white p-3 text-xs">
    <h5 className="font-semibold">Restore one record · {label}</h5>
    <p className="mt-1 text-muted">Choose a record and compare with the cloud. Other records stay unchanged. A current-workspace backup is kept before restoring.</p>
    <input aria-label="Search recovery records" className="mt-3 w-full rounded-lg border border-line p-2" placeholder="Search section or record name…" value={query} onChange={e => { setQuery(e.target.value); }}/>
    <div className="mt-2 flex gap-2">
    <select aria-label="Record to recover" disabled={busy} className="min-w-0 flex-1 rounded-lg border border-line p-2" value={chosen} onChange={e => { setChosen(e.target.value); setPreview(null); setConfirmed(false); }}>
    <option value="">Choose a record ({rows.length} available)</option>{visible.map(row => <option key={JSON.stringify([row.field, row.id])} value={JSON.stringify([row.field, row.id])}>{row.field} · {row.label.slice(0, 100)}</option>)}</select>
    <button type="button" disabled={busy || !selected} className="btn-theme rounded-lg border border-line px-3 py-2 disabled:opacity-40" onClick={() => void compare()}>Preview</button>
    </div>{preview && <div className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
        <div>
        <h6 className="mb-1 font-semibold">Current cloud record</h6>
        <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-stone-50 p-2 text-[10px]">{content(preview.current)}</pre>
        </div>
        <div>
        <h6 className="mb-1 font-semibold">Record to restore</h6>
        <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-stone-50 p-2 text-[10px]">{content(preview.record)}</pre>
        </div>
        </div>
        <label className="flex items-start gap-2">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>
        <span>{preview.current ? 'Replace only this current record with the reviewed copy.' : 'Add only this missing record.'} Existing encrypted content stays encrypted; file references do not recreate missing uploads. Restoring a saved event does not change Google or Outlook.</span>
        </label>
        <button type="button" disabled={busy || !confirmed} className="btn-theme rounded-lg border border-line px-3 py-2 font-semibold disabled:opacity-40" onClick={() => void restore()}>{busy ? 'Restoring…' : 'Restore this record'}</button>
        </div>}<p role="status" className="mt-2 text-muted">{message}</p>
    </div>;
}
