"use client";
import { useCallback, useEffect, useState } from "react";
import { recycleLabel, type RecycleEntry } from "@/lib/recycleBin";
export function RecycleBin({ email, expanded = false }: { email?: string | null; expanded?: boolean }) {
  const [entries, setEntries] = useState<RecycleEntry[]>([]); const [version, setVersion] = useState("");
  const [query, setQuery] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!email) return;
    setBusy(true);
    try { const response = await fetch('/api/recycle-bin', { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setEntries(data.entries); setVersion(data.version); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load deleted records.'); }
    finally { setBusy(false); }
  }, [email]);
  useEffect(() => { void load(); }, [load]);
  if (!email) return <section className="rounded-xl border border-line bg-white p-4 text-xs"><h4 className="font-semibold">Recycle Bin</h4><p className="mt-2 text-muted">Sign in to your account to view and restore deleted workspace records.</p></section>;
  const visible = entries.filter(entry => `${entry.kind} ${recycleLabel(entry)}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const restore = async (entry: RecycleEntry) => {
    try {
      const account = email.toLowerCase().trim();
      const pending = JSON.parse(localStorage.getItem(`routino_workspace_pending:${account}`) || '{}');
      const trackers = JSON.parse(localStorage.getItem(`routino_trackers_v2:${account}`) || '{}');
      if (Object.keys(pending).length || trackers.pending) { setMessage('Sync or export pending local changes before restoring a record.'); return; }
    } catch { setMessage('Local drafts could not be checked. Export them before restoring.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/recycle-bin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore', id: entry.id, version }) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.dispatchEvent(new Event('routino:workspace-restored'));
      await load(); setMessage('Record restored. The workspace is refreshing from your account.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Restore failed.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-xl border border-line bg-white p-4 text-xs"><div className="flex items-center justify-between">{expanded ? <h2 className="font-semibold">Deleted records</h2> : <h4 className="font-semibold">Recycle Bin</h4>}<button type="button" className="btn-theme rounded-lg border border-line px-2 py-1 disabled:opacity-50" disabled={busy} onClick={() => void load()}>Refresh</button></div><p className="text-muted">Recover individual deleted tasks, notes, habits, links, events, subscriptions and recharge records. Captured after this feature is enabled; retained until restored. Existing IDs are never overwritten. A full plan is not reactivated by restoring its payment.</p><label className="block">Search deleted records<input className="mt-1 w-full rounded-lg border border-line p-2" value={query} onChange={event => setQuery(event.target.value)} /></label><p>{entries.length} saved deletions · {visible.length} matching</p>{message && <p role="status" className="text-amber-800">{message}</p>}<ul className={expanded ? "divide-y divide-line" : "max-h-64 divide-y divide-line overflow-auto"}>{visible.map(entry => <li key={entry.id} className="flex items-start justify-between gap-3 py-2"><span className="min-w-0 break-words">{recycleLabel(entry)}<span className="mt-1 block text-muted">{entry.kind} · {new Date(entry.deletedAt).toLocaleString()}</span></span><button type="button" disabled={busy} className="btn-theme shrink-0 rounded-lg border border-line px-2 py-1 text-forest disabled:opacity-50" onClick={() => void restore(entry)}>Restore</button></li>)}</ul></section>;
}
