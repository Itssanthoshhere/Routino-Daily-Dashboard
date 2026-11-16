"use client";

import { useCallback, useEffect, useState } from "react";
type Backup = { id: string; createdAt: string; reason: string; taskCount: number };
export function WorkspaceBackups({ email }: { email?: string | null }) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [preview, setPreview] = useState<{ backup: Backup; data: Record<string, unknown> } | null>(null);
  const load = useCallback(async () => {
    if (!email) return;
    try {
      const response = await fetch("/api/workspace-backups", { cache: "no-store" }); const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setBackups(result.backups); setUpdatedAt(result.updatedAt || "");
      setMessage(result.scheduled ? "Daily production backups are configured. Up to 30 days are retained." : "Daily snapshots are made before changes. Scheduled jobs run only on a deployment configured with CRON_SECRET.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load backups."); }
  }, [email]);
  useEffect(() => { void load(); }, [load]);
  const read = async (backup: Backup) => {
    const response = await fetch(`/api/workspace-backups?id=${encodeURIComponent(backup.id)}`, { cache: "no-store" }); const result = await response.json();
    if (!response.ok) throw new Error(result.error); return result;
  };
  const create = async () => {
    setBusy(true);
    try { const response = await fetch("/api/workspace-backups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Backup failed."); }
    finally { setBusy(false); }
  };
  const restore = async () => {
    if (!preview || !email) return;
    const account = email.toLowerCase();
    try {
      const pending = localStorage.getItem(`routino_workspace_pending:${account}`);
      const trackers = JSON.parse(localStorage.getItem(`routino_trackers_v2:${account}`) || "{}");
      if ((pending && Object.keys(JSON.parse(pending)).length) || trackers.pending) { setMessage("Save or export your pending local changes before restoring a backup."); return; }
    } catch { setMessage("Local drafts could not be checked. Export them before restoring."); return; }
    if (!window.confirm(`Restore the workspace saved on ${new Date(preview.backup.createdAt).toLocaleString()}? This replaces current workspace records. A backup of the current version will be kept first.`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/workspace-backups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", id: preview.backup.id, expectedUpdatedAt: updatedAt }) }); const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      localStorage.removeItem(`routino_trackers_v2:${account}`);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Restore failed."); setBusy(false); }
  };
  if (!email) return null;
  return <section className="rounded-xl border border-line bg-white p-4 text-xs space-y-3">
    <div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Database backups</h4><button disabled={busy} className="font-semibold text-forest disabled:opacity-50" onClick={create}>Back up now</button></div>
    <p role="status" className="text-muted">{message}</p><p className="text-muted">Snapshots are separate from live records in the same Neon database. Download a copy for storage outside Neon.</p>
    <ul className="max-h-48 overflow-auto divide-y divide-line">{backups.map(backup => <li key={backup.id} className="flex items-center justify-between gap-2 py-2"><span>{new Date(backup.createdAt).toLocaleString()} · {backup.taskCount} tasks</span><button disabled={busy} className="text-forest" onClick={async () => { try { const result = await read(backup); setPreview({ backup, data: result.data }); } catch { setMessage("Could not preview this backup."); } }}>Preview</button></li>)}</ul>
    {preview && <div className="rounded-lg bg-[#f0f2eb] p-3 space-y-2"><p className="font-semibold">Backup from {new Date(preview.backup.createdAt).toLocaleString()}</p><p>{["tasks", "notes", "habits", "subscriptions"].map(key => `${Array.isArray(preview.data[key]) ? preview.data[key].length : 0} ${key}`).join(" · ")}</p><div className="flex flex-wrap gap-3"><button onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify({ version: "1.0.0", data: preview.data }, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "routino-database-backup.json"; anchor.click(); URL.revokeObjectURL(url); }}>Download JSON</button><button disabled={busy || !updatedAt} className="font-semibold text-red-700 disabled:opacity-50" onClick={restore}>Restore this backup</button><button onClick={() => setPreview(null)}>Close preview</button></div></div>}
  </section>;
}
