"use client";
import { useState } from "react";
import { DashboardEvent } from "@/types/dashboard";

export function FocusEventActions({ event, onChange }: { event: DashboardEvent; onChange: (event: DashboardEvent, deleted: boolean) => void }) {
  const local = (value?: string) => { const date = new Date(value || ""); return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""; };
  const [start, setStart] = useState(local(event.start?.dateTime));
  const [end, setEnd] = useState(local(event.end?.dateTime));
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (deleted: boolean) => {
    setBusy(true); setError("");
    try {
      const next = deleted ? event : { ...event, start: { dateTime: new Date(start).toISOString() }, end: { dateTime: new Date(end).toISOString() } };
      if (!deleted && new Date(end) <= new Date(start)) throw new Error("End must follow start.");
      if (event.source === "google") {
        const response = await fetch("/api/calendar/focus", { method: deleted ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: event.id, start: next.start?.dateTime, end: next.end?.dateTime }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error || "Google update failed");
      }
      onChange(next, deleted);
    } catch (error) { setError(error instanceof Error ? error.message : "Update failed"); } finally { setBusy(false); }
  };
  return <div className="mt-3 space-y-3 rounded-xl border border-line p-3"><p className="text-xs font-semibold">Manage focus session</p><label className="block text-xs">Start<input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2" /></label><label className="block text-xs">End<input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2" /></label><button disabled={busy} onClick={() => void save(false)} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs">Save new time</button><button disabled={busy} onClick={() => setConfirm(true)} className="ml-3 text-xs text-red-700">Delete session</button>{confirm && <div role="alertdialog" aria-label="Confirm focus deletion" className="rounded-lg border border-red-200 p-3 text-xs">Remove this session{event.source === "google" ? " from Google Calendar too" : ""}?<div className="mt-2 flex gap-3"><button disabled={busy} onClick={() => void save(true)}>Confirm delete</button><button onClick={() => setConfirm(false)}>Cancel</button></div></div>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
