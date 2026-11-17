"use client";
import { useRef, useState } from "react";

export function SyncCenter({ email, lastSyncedAt, onRetry, onBackup }: { email?: string | null; lastSyncedAt: string | null; onRetry: () => Promise<unknown>; onBackup: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [usage, setUsage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inspect = async () => {
    try { const patch = JSON.parse(localStorage.getItem(`routino_workspace_pending:${email?.toLowerCase()}`) || "{}"); setPending(Object.keys(patch).filter(key => !key.startsWith("replace") && !key.startsWith("deleted"))); } catch { setPending(["Local queue could not be read"]); }
    try { const estimate = await navigator.storage?.estimate(); setUsage(estimate?.usage === undefined ? "Unavailable" : `${(estimate.usage / 1048576).toFixed(1)} MB used${estimate.quota ? ` of ${(estimate.quota / 1048576).toFixed(0)} MB available` : ""}`); } catch { setUsage("Unavailable"); }
  };
  return <><button className="fixed bottom-3 left-3 z-40 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold shadow" onClick={() => { void inspect(); dialog.current?.showModal(); }}>Sync Center</button><dialog ref={dialog} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white p-5 text-ink shadow-xl backdrop:bg-black/40" aria-labelledby="sync-center-title"><div className="flex justify-between"><h3 id="sync-center-title" className="font-bold">Sync Center</h3><button onClick={() => dialog.current?.close()} className="text-xs">Close</button></div><p className="mt-4 text-xs">{email ? `Account: ${email}` : "Sign in to sync this device with your account."}</p><p className="mt-2 text-xs">Last successful save: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not recorded this session"}</p><p className="mt-2 text-xs">Pending workspace sections: {pending.length ? pending.join(", ") : "None in the core workspace queue"}</p><p className="mt-2 text-xs">Device storage: {usage || "Checking…"}</p><p className="mt-2 text-xs text-muted">Tracker sync status and backup controls are available in Preferences.</p><div className="mt-4 flex gap-3"><button disabled={busy || !email} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={async () => { setBusy(true); setError(""); try { await onRetry(); await inspect(); } catch { setError("Sync could not complete. Your pending changes remain saved locally."); } finally { setBusy(false); } }}>{busy ? "Retrying…" : "Retry sync"}</button><button className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => { dialog.current?.close(); onBackup(); }}>Backups & export</button></div>{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}</dialog></>;
}
