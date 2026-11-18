"use client";
import { useEffect, useState } from "react";
import { LockKeyhole, UnlockKeyhole } from "lucide-react";
import type { DashboardEvent } from "@/types/dashboard";
import type { ColorSettings } from "@/lib/calendarColorSettings";
type Saved = { settings: ColorSettings; revision: number; pendingRunId?: string };

export function EventColorProtection({ event }: { event: DashboardEvent }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const key = `${event.calendarId}:${event.id}`;
  const protectedColor = !!saved?.settings.excludedEvents.includes(key);
  useEffect(() => {
    let active = true;
    setBusy(true); setError(""); setSaved(null);
    void fetch("/api/calendar/coloring?settingsOnly=1", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not read colour protection.");
      if (active) setSaved(result);
    }).catch(() => { if (active) setError("Colour settings could not load. Your saved settings are unchanged."); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [key, reload]);
  const toggle = async () => {
    if (!saved || busy) return;
    const names = Object.fromEntries(Object.entries(saved.settings.excludedEventNames || {}).filter(([id]) => id !== key));
    const settings: ColorSettings = { ...saved.settings, excludedEvents: protectedColor ? saved.settings.excludedEvents.filter(id => id !== key) : [...saved.settings.excludedEvents, key], excludedEventNames: protectedColor ? names : { ...names, [key]: (event.summary || "Untitled event").slice(0, 250) } };
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/calendar/coloring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "save", revision: saved.revision, settings }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save colour protection.");
      setSaved(result.state);
      window.dispatchEvent(new Event("routino:calendar-color-settings"));
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save. Reload colour settings before retrying."); }
    finally { setBusy(false); }
  };
  return <section className="mt-3 rounded-xl border border-line bg-white p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Event colour</p><p role="status" className="mt-1 text-muted">{protectedColor ? "Protected from colour rules. Your current colour stays as it is." : "Keep this event’s current colour when applying rules."}</p></div><button type="button" aria-pressed={protectedColor} disabled={busy || !saved || !!saved.pendingRunId} className="btn-theme inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 font-semibold disabled:opacity-40" onClick={() => void toggle()}>{protectedColor ? <UnlockKeyhole size={14}/> : <LockKeyhole size={14}/>}{busy ? "Checking…" : protectedColor ? "Allow rule changes" : "Keep this colour"}</button></div>{saved?.pendingRunId && <p className="mt-2 text-amber-800">A colour operation is running. Reload its status before changing protection.</p>}{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}{(error || saved?.pendingRunId) && <button type="button" disabled={busy} className="mt-2 font-semibold text-forest underline" onClick={() => setReload(value => value + 1)}>Reload colour settings</button>}</section>;
}
