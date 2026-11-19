'use client';
import { useEffect, useRef, useState } from 'react';
type Row = {
    id: string;
    name: string;
    contexts: string[];
    size: number;
    status: 'protected' | 'pending' | 'attention' | 'external';
    detail: string;
};
export function BackupCoverage({ email }: {
    email?: string | null;
}) {
    const [rows, setRows] = useState<Row[]>([]), [total, setTotal] = useState(0), [inventory, setInventory] = useState(''), [cursor, setCursor] = useState<number | null>(null), [configured, setConfigured] = useState(false), [filter, setFilter] = useState('all'), [selected, setSelected] = useState<string[]>([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    const account = useRef(email);
    useEffect(() => { account.current = email; setRows([]); setInventory(''); setSelected([]); setTotal(0); setCursor(null); setMessage(''); }, [email]);
    const check = async (more = false) => { const owner = email; setBusy(true); setMessage('Verifying encrypted copies…'); try {
        const response = await fetch(`/api/document-coverage${more ? `?cursor=${cursor}&inventory=${encodeURIComponent(inventory)}` : ''}`, { cache: 'no-store', signal: AbortSignal.timeout(60000) });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error);
        if (account.current !== owner)
            return;
        if (more && result.inventoryId !== inventory)
            throw new Error('Document records changed. Refresh coverage.');
        setRows(old => more ? [...old, ...result.rows] : result.rows);
        setTotal(result.total);
        setCursor(result.nextCursor);
        setInventory(result.inventoryId);
        setConfigured(result.configured);
        if (!more)
            setSelected([]);
        setMessage(`Last checked ${new Date(result.checkedAt).toLocaleString()}. Counts below apply to checked files.`);
    }
    catch (e) {
        if (account.current === owner)
            setMessage(e instanceof Error ? e.message : 'Coverage unavailable.');
    }
    finally {
        setBusy(false);
    } };
    return <details className="mt-4 rounded-xl border border-line bg-white p-4 text-xs"><summary className="cursor-pointer font-semibold">Attachment backup coverage & export</summary><p className="mt-2 text-muted">Check which saved uploads have verified encrypted copies. External links are listed separately. Copies share your existing Blob provider; download a bundle for an independent offline copy. Sync local edits first. Checking and exporting do not change records.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || !email} className="btn-theme rounded-lg border border-line px-3 py-2" onClick={() => void check()}>Check coverage</button>{inventory && <><button type="button" disabled={busy || !configured} className="btn-theme rounded-lg border border-line px-3 py-2" onClick={async () => { const owner = email; setBusy(true); try {
        setMessage('Creating or verifying encrypted copies…');
        const response = await fetch('/api/external-backups', { method: 'POST', signal: AbortSignal.timeout(120000) });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error);
        if (account.current !== owner)
            return;
        await check();
        setMessage(result.attachments?.complete ? `${result.attachments.verified} uploaded files verified. Refresh pages to inspect all records.` : 'Attachment copying is incomplete. Existing copies are preserved; retry to continue.');
    }
    catch (e) {
        if (account.current === owner)
            setMessage(e instanceof Error ? e.message : 'Backup failed.');
    }
    finally {
        setBusy(false);
    } }}>Protect saved uploads</button><button type="button" disabled={busy || !selected.length} className="btn-theme rounded-lg border border-line px-3 py-2" onClick={async () => { const owner = email; setBusy(true); setMessage('Preparing a private document bundle…'); try {
        const response = await fetch('/api/document-bundle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, inventoryId: inventory }), signal: AbortSignal.timeout(120000) });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error);
        }
        const blob = await response.blob();
        if (account.current !== owner)
            return;
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url;
        link.download = `routino-documents-${new Date().toISOString().slice(0, 10)}.tar.gz`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMessage(`Bundle downloaded: ${response.headers.get('X-Routino-Included')} files. ${response.headers.get('X-Routino-Warnings')} external/unavailable items are documented in index.json.`);
    }
    catch (e) {
        if (account.current === owner)
            setMessage(e instanceof Error ? e.message : 'Export failed.');
    }
    finally {
        setBusy(false);
    } }}>Download selected · {selected.length}</button></>}</div><p role="status" className="mt-2 text-muted">{message}</p>{inventory && <><p className="mt-3 font-semibold">{rows.filter(r => r.status === 'protected').length} protected · {rows.filter(r => r.status === 'pending').length} pending · {rows.filter(r => r.status === 'attention').length} need review · {rows.filter(r => r.status === 'external').length} external · {rows.length}/{total} checked</p><label className="mt-3 block">Status<select aria-label="Backup coverage status" className="ml-2 rounded-lg border border-line p-2" value={filter} onChange={e => setFilter(e.target.value)}>{['all', 'protected', 'pending', 'attention', 'external'].map(s => <option key={s}>{s}</option>)}</select></label><p className="mt-2 text-muted">Select up to 25 items and 20 MB per bundle. The .tar.gz archive includes index.json with names, contexts, hashes and availability. External links are listed without being fetched. Keep downloaded files private.</p><ul className="mt-2 max-h-72 divide-y divide-line overflow-auto">{rows.filter(r => filter === 'all' || r.status === filter).map(row => <li key={row.id} className="py-3"><label className="flex items-start gap-2"><input type="checkbox" disabled={busy || !selected.includes(row.id) && selected.length >= 25} checked={selected.includes(row.id)} onChange={e => setSelected(current => e.target.checked ? [...current, row.id] : current.filter(id => id !== row.id))}/><span className="min-w-0"><strong className="break-words">{row.name}</strong><span className="mt-1 block font-medium text-forest">{row.status}</span><span className="mt-1 line-clamp-2 break-words text-muted">{row.contexts.join(' · ')}</span><span className="mt-1 block text-muted">{row.detail}</span></span></label></li>)}</ul>{cursor !== null && <button type="button" disabled={busy} className="btn-theme mt-3 rounded-lg border border-line px-3 py-2" onClick={() => void check(true)}>Check next page</button>}</>}</details>;
}
