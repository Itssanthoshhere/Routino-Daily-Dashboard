"use client";
import { useEffect, useState } from "react";
import { localRecoveryCopies, type RecoveryCopy } from "@/lib/selectiveRecovery";
import { SelectiveRestore } from "@/components/SelectiveRestore";
export function RecoveryCopies({ email, store, request }: {
    email: string;
    store?: Pick<Storage, "length" | "key" | "getItem">;
    request?: typeof fetch;
}) {
    const [copies, setCopies] = useState<RecoveryCopy[]>([]);
    const [selected, setSelected] = useState<RecoveryCopy | null>(null);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const load = () => { try {
        setCopies(localRecoveryCopies(store || localStorage, email));
        setError('');
    }
    catch {
        setError('Browser recovery copies could not be read. Nothing was removed.');
    } };
    useEffect(() => { setSelected(null); load(); }, [email, store]);
    const download = (copy: RecoveryCopy) => { const href = URL.createObjectURL(new Blob([copy.raw], { type: 'application/json' })); const link = document.createElement('a'); link.href = href; link.download = `routino-recovery-${copy.date?.slice(0, 10) || 'local'}.json`; link.click(); URL.revokeObjectURL(href); };
    return <details className="mt-4 rounded-xl border border-line p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Preserved recovery copies · {copies.length}</summary>
    <p className="mt-2 text-muted">Conflict drafts and previous tracker caches kept in this browser for this account. They are not automatically synced to other devices. Preview or download a copy; originals are retained.</p>
    <div className="mt-3 flex gap-2">
    <input aria-label="Search recovery copies" className="min-w-0 flex-1 rounded-lg border border-line p-2" placeholder="Search copy type or date…" value={query} onChange={e => setQuery(e.target.value)}/>
    <button type="button" className="btn-theme rounded-lg border border-line px-3 py-2" onClick={load}>Refresh copies</button>
    </div>
    <ul className="mt-2 max-h-48 divide-y divide-line overflow-auto">{copies.filter(copy => `${copy.label} ${copy.date || ''}`.toLowerCase().includes(query.toLowerCase())).map(copy => <li key={copy.key} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div>
        <strong>{copy.label}</strong>
        <p className="mt-1 text-muted">{copy.date ? new Date(copy.date).toLocaleString() : 'Creation time not recorded'}</p>
        </div>
        <div className="flex gap-2">
        <button type="button" className="btn-theme rounded-lg border border-line px-2 py-1" onClick={() => setSelected(copy)}>View records</button>
        <button type="button" className="btn-theme rounded-lg border border-line px-2 py-1" onClick={() => download(copy)}>Download</button>
        </div>
        </li>)}</ul>{!copies.length && <p className="mt-2 text-muted">No preserved conflict copies found in this browser.</p>}{selected && <SelectiveRestore request={request} key={selected.key} email={email} data={selected.data} label={selected.label}/>}<p role="status" className="mt-2 text-muted">{error}</p>
    </details>;
}
