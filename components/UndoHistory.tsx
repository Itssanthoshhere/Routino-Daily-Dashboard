'use client';
import { useRef } from 'react';
export type UndoEntry = {
    id: string;
    message: string;
    createdAt: number;
    account: string | null;
    run: () => void;
};
export function UndoHistory({ entries, account }: {
    entries: UndoEntry[];
    account: string | null;
}) { const dialog = useRef<HTMLDialogElement>(null); const visible = entries.filter(e => e.account === account && Date.now() - e.createdAt < 30 * 60000); return <><button type="button" className="btn-theme rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold" onClick={() => dialog.current?.showModal()}>Undo history</button><dialog ref={dialog} aria-labelledby="undo-title" className="m-auto max-h-[80vh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-line bg-white p-5 backdrop:bg-black/40"><div className="flex justify-between gap-3"><h3 id="undo-title" className="font-semibold">Recent Undo actions</h3><button type="button" className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => dialog.current?.close()}>Close</button></div><p className="my-3 text-xs text-muted">Up to 20 supported actions from this session, available for 30 minutes. Undo skips records changed since the action and preserves unrelated edits. Reloading clears this history; deleted records remain in Recycle Bin.</p><ul className="divide-y divide-line">{visible.map(e => <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-xs"><span>{e.message}<span className="mt-1 block text-muted">{new Date(e.createdAt).toLocaleTimeString()}</span></span><button type="button" className="btn-theme rounded-lg border border-line px-3 py-2" onClick={e.run}>Undo</button></li>)}</ul>{!visible.length && <p className="py-4 text-xs text-muted">No recent Undo actions for this account.</p>}</dialog></>; }
