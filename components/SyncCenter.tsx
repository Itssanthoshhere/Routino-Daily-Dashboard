"use client";
import { useRef, useState } from "react";
import { RecoveryCopies } from "@/components/RecoveryCopies";
import { DeviceSyncActivity } from "@/components/DeviceSyncActivity";
import {DataHealth} from "@/components/DataHealth";
import { SyncHealth } from "@/components/SyncHealth";

export function SyncCenter({ email, lastSyncedAt, onRetry, onBackup, trackerStatus, trackerSavedAt, coreError, syncing }: { trackerStatus?: string; trackerSavedAt?: string | null; coreError?: boolean; syncing?: boolean; email?: string | null; lastSyncedAt: string | null; onRetry: () => Promise<unknown>; onBackup: () => void }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [usage, setUsage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [offlineReady, setOfflineReady] = useState(false);
  const inspect = async () => {
    let account = email?.toLowerCase();
    try { if (!account && !navigator.onLine) account = localStorage.getItem("routino_verified_workspace_account") || undefined; } catch {}
    try { setOfflineReady(!!(await navigator.serviceWorker?.getRegistration())?.active); } catch { setOfflineReady(false); }
    try { const patch = JSON.parse(localStorage.getItem(`routino_workspace_pending:${account}`) || "{}"); setPending(Object.keys(patch).filter(key => !key.startsWith("replace") && !key.startsWith("deleted") && !key.startsWith("expected") && key !== "collectionChanges")); } catch { setPending(["Local queue could not be read"]); }
    try { const estimate = await navigator.storage?.estimate(); setUsage(estimate?.usage === undefined ? "Unavailable" : `${(estimate.usage / 1048576).toFixed(1)} MB used${estimate.quota ? ` of ${(estimate.quota / 1048576).toFixed(0)} MB available` : ""}`); } catch { setUsage("Unavailable"); }
  };
  return <><button className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold shadow" onClick={() => { void inspect(); setOpen(true); dialog.current?.showModal(); }}>Sync Center</button><dialog ref={dialog} onClose={() => setOpen(false)} className="m-auto max-h-[85vh] overflow-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-line bg-white p-5 text-ink shadow-xl backdrop:bg-black/40" aria-labelledby="sync-center-title"><div className="flex justify-between"><h3 id="sync-center-title" className="font-bold">Sync Center</h3><button type="button" onClick={() => dialog.current?.close()} className="btn-theme rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Close</button></div><p className="mt-3 text-xs">{offlineReady ? "App shell ready offline" : "Offline shell not ready"}</p><p className="mt-4 text-xs">{email ? `Account: ${email}` : "Sign in to sync this device with your account."}</p><p className="mt-2 text-xs">Last successful save: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not recorded this session"}</p><p className="mt-2 text-xs">Pending workspace sections: {pending.length ? pending.join(", ") : "None in the core workspace queue"}</p><p className="mt-2 text-xs">Device storage: {usage || "Checking…"}</p><div className="mt-4">{open && <SyncHealth email={email} coreError={coreError} syncing={syncing} trackerStatus={trackerStatus} trackerSavedAt={trackerSavedAt} />}</div>{open && email && <><DataHealth email={email}/><RecoveryCopies key={`copies:${email}`} email={email}/><DeviceSyncActivity key={`devices:${email}`} email={email}/></>}<div className="mt-4 flex gap-3"><button disabled={busy || !email} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={async () => { setBusy(true); setError(""); try { await onRetry(); await inspect(); } catch { setError("Sync could not complete. Your pending changes remain saved locally."); } finally { setBusy(false); } }}>{busy ? "Retrying…" : "Retry sync"}</button><button className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => { dialog.current?.close(); onBackup(); }}>Backups & export</button></div>{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}</dialog></>;
}
