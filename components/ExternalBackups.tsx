"use client";
import { useCallback, useEffect, useState } from "react";
type Backup = { id: string; date: string; size: number };
export function ExternalBackups({ email }: { email?: string | null }) {
  const [backups, setBackups] = useState<Backup[]>([]); const [configured, setConfigured] = useState(false); const [message, setMessage] = useState("Loading external backups…"); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!email) return;
    try {
      const response = await fetch("/api/external-backups", { cache: "no-store" }); const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setConfigured(!!result.configured); setBackups(result.backups);
      setMessage(result.configured ? "Private encrypted copies outside Neon. One snapshot per UTC day, up to 2 MB, retained for 30 days." : "External backups are not configured for this environment. Database backups remain available.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load external backups."); }
  }, [email]);
  useEffect(() => { void load(); }, [load]);
  if (!email) return null;
  return <section className="space-y-3 rounded-xl border border-line bg-white p-4 text-xs"><div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Encrypted external backups</h4><button disabled={!configured || busy} className="btn-theme-quiet font-semibold text-forest disabled:opacity-50" onClick={async () => {
    setBusy(true);
    try { const response = await fetch("/api/external-backups", { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await load(); setMessage(result.created ? "Encrypted backup uploaded and decrypted successfully for verification." : "Today's existing backup was verified. The next snapshot is created tomorrow."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "External backup failed."); } finally { setBusy(false); }
  }}>Back up saved data</button></div><p role="status" className="text-muted">{message}</p><p className="text-muted">Backs up database-saved records; sync local edits first. Download a recovery JSON to restore through the workspace import. Note contents still require your notes password. The server encryption key must be retained to recover Blob files.</p><ul className="max-h-40 divide-y divide-line overflow-auto">{backups.map(backup => <li key={backup.id} className="flex items-center justify-between gap-2 py-2"><span>{new Date(backup.date).toLocaleString()} · {Math.ceil(backup.size / 1024)} KB</span><button disabled={busy} className="btn-theme-quiet text-forest" onClick={async () => {
    setBusy(true);
    try { const response = await fetch(`/api/external-backups?id=${encodeURIComponent(backup.id)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `routino-recovery-${backup.id.replace(".json.enc", "")}.json`; link.click(); URL.revokeObjectURL(url); }
    catch { setMessage("Could not decrypt or download this backup."); } finally { setBusy(false); }
  }}>Download recovery JSON</button></li>)}</ul></section>;
}
