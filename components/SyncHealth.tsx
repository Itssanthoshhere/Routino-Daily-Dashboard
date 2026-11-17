"use client";
import { useCallback, useEffect, useState } from "react";
type Health = { checkedAt: string; database: { configured: boolean; provider: string; reachable: boolean; updatedAt: string | null }; snapshots: { supported: boolean; reachable: boolean; latestAt: string | null }; external: { configured: boolean; reachable: boolean; latestAt: string | null } };
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "None recorded";
export function SyncHealth({ email, coreError, syncing, trackerStatus, trackerSavedAt, onRetry }: { email?: string | null; coreError?: boolean; syncing?: boolean; trackerStatus?: string; trackerSavedAt?: string | null; onRetry?: () => Promise<boolean> }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState({ online: true, fields: 0, trackers: false, readable: true });
  const load = useCallback(async () => {
    if (!email) return;
    setBusy(true);
    try { const response = await fetch("/api/sync-health", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setHealth(result); setMessage(""); }
    catch { setMessage("Health check unavailable. Local changes have not been cleared."); }
    finally { setBusy(false); }
  }, [email]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!email) return;
    const inspect = () => {
      try {
        const account = email.toLowerCase().trim();
        const core = JSON.parse(localStorage.getItem(`routino_workspace_pending:${account}`) || "{}");
        const trackers = JSON.parse(localStorage.getItem(`routino_trackers_v2:${account}`) || "{}");
        const fields = Object.keys(core).filter(key => !/^(replace|deleted)/.test(key)).length;
        setLocal({ online: navigator.onLine, fields, trackers: !!trackers.pending, readable: true });
      } catch { setLocal(previous => ({ ...previous, readable: false, online: navigator.onLine })); }
    };
    inspect(); const timer = setInterval(inspect, 3000);
    window.addEventListener("online", inspect); window.addEventListener("offline", inspect); window.addEventListener("storage", inspect);
    return () => { clearInterval(timer); window.removeEventListener("online", inspect); window.removeEventListener("offline", inspect); window.removeEventListener("storage", inspect); };
  }, [email]);
  if (!email) return null;
  return <section className="space-y-3 rounded-xl border border-line bg-white p-4 text-xs"><div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Sync health</h4><button type="button" className="btn-theme rounded-lg border border-line px-2 py-1 disabled:opacity-50" disabled={busy} onClick={() => void load()}>{busy ? "Checking…" : "Check now"}</button></div><dl className="grid grid-cols-2 gap-2"><dt>Connection</dt><dd>{local.online ? "Online" : "Offline · changes stay local"}</dd><dt>Core saves</dt><dd>{coreError ? "Save failed · retry needed" : syncing ? "Saving…" : "No reported save error"}</dd><dt>Pending workspace fields</dt><dd>{local.readable ? local.fields : "Could not inspect local drafts"}</dd><dt>Tracker sync</dt><dd>{trackerStatus || "Unknown"}{local.trackers ? " · local changes pending" : ""}</dd><dt>Last tracker save in this tab</dt><dd>{trackerSavedAt ? date(trackerSavedAt) : "No save made in this tab"}</dd>{health && <><dt>Database</dt><dd>{!health.database.reachable ? "Read failed" : health.database.configured ? "Reachable · durable storage configured" : "Local fallback · no durable database"}</dd><dt>Latest database update</dt><dd>{date(health.database.updatedAt)}</dd><dt>Database snapshot</dt><dd>{!health.snapshots.supported ? "Not supported by this provider" : !health.snapshots.reachable ? "Check failed" : date(health.snapshots.latestAt)}</dd><dt>External backup</dt><dd>{!health.external.configured ? "Not configured" : !health.external.reachable ? "Check failed" : date(health.external.latestAt)}</dd></>}</dl>{health && <p className="text-muted">Server status checked {date(health.checkedAt)}. Local pending counts refresh automatically; storage checks run only when this panel opens or you select Check now.</p>}{message && <p role="status" className="text-amber-800">{message}</p>}{onRetry && <button type="button" className="btn-theme rounded-lg border border-line px-3 py-2 text-forest disabled:opacity-50" disabled={busy || syncing || !local.online} onClick={async () => { setBusy(true); try { const saved = await onRetry(); await load(); if (!saved) setMessage("Some changes are still pending. Review tracker conflicts or retry when connected."); } catch { setMessage("Retry failed. Local changes are preserved."); } finally { setBusy(false); } }}>Retry pending saves</button>}</section>;
}
