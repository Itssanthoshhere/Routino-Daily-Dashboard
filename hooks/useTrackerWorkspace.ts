"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { undoRecords, undoMembership } from "@/lib/undoRecords";
import { emptyAirtelData, type AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { isAirtelData } from "@/lib/airtelValidation";
import { isSubscriptionList } from "@/lib/subscriptionValidation";
import { isAssetDocuments } from "@/lib/assetDocuments";
import type { AssetDocuments } from "@/types/documents";

type Data = { subscriptions: Subscription[]; airtel: AirtelData; subscriptionJournalImported: boolean; assetDocuments?: AssetDocuments };
type Status = "loading" | "synced" | "syncing" | "local" | "error" | "conflict";
const empty = (): Data => ({ subscriptions: [], airtel: emptyAirtelData(), subscriptionJournalImported: false });
const valid = (data: Data) => !!data && isSubscriptionList(data.subscriptions) && isAirtelData(data.airtel) && typeof data.subscriptionJournalImported === "boolean" && (data.assetDocuments === undefined || isAssetDocuments(data.assetDocuments));

export function useTrackerWorkspace(email?: string | null) {
  const [data, setData] = useState<Data>(empty);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [durable, setDurable] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const state = useRef({ data: empty(), revision: 0, pending: false, busy: false, blocked: false, ready: false, generation: 0 });
  const key = `routino_trackers_v2:${email?.trim().toLowerCase() || "guest"}`;
  const cache = useCallback(() => {
    const current = state.current;
    localStorage.setItem(key, JSON.stringify({ data: current.data, revision: current.revision, pending: current.pending }));
  }, [key]);

  const flush = useCallback(async () => {
    const current = state.current;
    if (!email || current.busy || current.blocked || !current.ready) return false;
    const generation = current.generation;
    current.busy = true;
    try {
      while (current.pending && generation === state.current.generation) {
        const snapshot = current.data;
        setStatus("syncing");
        const response = await fetch("/api/tracker-workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: current.revision, patch: snapshot }) });
        const result = await response.json();
        if (generation !== state.current.generation) return false;
        if (!response.ok || !result.success) {
          current.blocked = response.status === 409;
          setStatus(current.blocked ? "conflict" : "error");
          setMessage(result.error || "Saved locally; database sync failed.");
          return false;
        }
        current.revision = result.revision;
        current.pending = current.data !== snapshot;
        cache();
        setDurable(!!result.dbStatus?.configured);
        setSavedAt(result.savedAt);
        setStatus(result.dbStatus?.configured ? "synced" : "local");
        setMessage(result.dbStatus?.configured ? "Saved to your account database." : "Saved to this server only. Configure a cloud database for cross-device sync.");
      }
      return !current.pending;
    } catch {
      if (generation === state.current.generation) {
        setStatus("error");
        setMessage("Local copy preserved. Database sync failed; retry when connected.");
      }
      return false;
    } finally { current.busy = false; }
  }, [email, cache]);

  const refresh = useCallback(async (replaceLocal = false) => {
    const current = state.current;
    if (!email || current.busy || (current.pending && !replaceLocal)) return;
    const generation = current.generation;
    try {
      const response = await fetch("/api/tracker-workspace", { cache: "no-store" });
      const result = await response.json();
      if (generation !== state.current.generation) return;
      if (!response.ok) throw new Error(result.error || "Could not load saved records.");
      const server: Data = { subscriptions: result.data?.subscriptions ?? [], airtel: result.data?.airtel ?? emptyAirtelData(), subscriptionJournalImported: result.data?.subscriptionJournalImported ?? false, assetDocuments: result.data?.assetDocuments ?? {} };
      if (!valid(server)) throw new Error("Saved tracker records need repair. Existing data has not been overwritten.");
      if (current.pending && !replaceLocal) return;
      if (replaceLocal) {
        const previousCache = localStorage.getItem(key);
        if (previousCache) localStorage.setItem(`${key}:previous-cache`, previousCache);
        if (current.pending) localStorage.setItem(`${key}:conflict-backup`, JSON.stringify(current.data));
      }
      current.data = server;
      current.revision = result.revision;
      current.pending = false;
      current.blocked = false;
      current.ready = true;
      cache();
      setData(server);
      setReady(true);
      setDurable(!!result.dbStatus?.configured);
      setStatus(result.dbStatus?.configured ? "synced" : "local");
      setMessage(result.dbStatus?.configured ? "Loaded from your account database." : "Cloud database not configured. Cross-device sync is unavailable.");
    } catch (error) {
      if (generation === state.current.generation) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not load records; local data preserved.");
      }
    }
  }, [email, key, cache]);

  useEffect(() => {
    state.current = { data: empty(), revision: 0, pending: false, busy: false, blocked: false, ready: false, generation: state.current.generation + 1 };
    const current = state.current;
    setData(current.data); setReady(false); setStatus("loading");
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!valid(parsed.data) || !Number.isInteger(parsed.revision) || parsed.revision < 0) throw new Error("Invalid tracker cache. Export or repair it before editing.");
        current.data = parsed.data;
        current.revision = parsed.revision;
        current.pending = !!parsed.pending;
        current.ready = true;
        setData(current.data); setReady(true);
      }
    } catch {
      current.blocked = true;
      setStatus("error"); setMessage("Browser tracker cache could not be read. Reload saved records to recover; the existing cache is preserved.");
      return;
    }
    if (!email) {
      current.ready = true; setReady(true); setStatus("local"); setMessage("Saved in this browser. Sign in for cross-device sync.");
    } else if (current.pending) {
      void flush();
    } else { void refresh(); }
    const onFocus = () => { if (current.pending) void flush(); else void refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") onFocus(); };
    const interval = window.setInterval(onVisible, 30000);
    window.addEventListener("focus", onFocus); window.addEventListener("routino:workspace-restored", onFocus); window.addEventListener("online", onFocus); document.addEventListener("visibilitychange", onVisible);
    return () => { current.generation += 1; clearInterval(interval); window.removeEventListener("focus", onFocus); window.removeEventListener("routino:workspace-restored", onFocus); window.removeEventListener("online", onFocus); document.removeEventListener("visibilitychange", onVisible); };
  }, [key, email, refresh, flush]);

  const update = useCallback((patch: Partial<Data>) => {
    const current = state.current;
    if (!current.ready || current.blocked) return false;
    const next = { ...current.data, ...patch };
    if (!valid(next)) { setMessage("Invalid records; no changes saved."); return false; }
    const previous = current.data;
    const pending = current.pending;
    current.data = next; current.pending = true;
    try { cache(); } catch {
      current.data = previous; current.pending = pending;
      setStatus("error"); setMessage("Browser storage is full or unavailable. Changes were not saved."); return false;
    }
    setData(next);
    if (email) void flush(); else setStatus("local");
    return true;
  }, [email, cache, flush]);

  const undo = useCallback((before: Partial<Data>, after: Partial<Data>) => {
    const current = state.current.data;
    const patch: Partial<Data> = {};
    if (before.subscriptions && after.subscriptions) {
      const restored = undoRecords(current.subscriptions, before.subscriptions, after.subscriptions);
      if (!restored) return false;
      patch.subscriptions = restored;
    }
    if (before.airtel && after.airtel) {
      const records = undoRecords(current.airtel.records, before.airtel.records, after.airtel.records);
      const deletedIds = undoMembership(current.airtel.deletedIds, before.airtel.deletedIds, after.airtel.deletedIds);
      if (!records || !deletedIds) return false;
      patch.airtel = { ...current.airtel, records, deletedIds };
    }
    return update(patch);
  }, [update]);

  const importSubscriptions = useCallback((detected: Subscription[]) => {
    const current = state.current;
    if (!current.ready || current.data.subscriptionJournalImported || !detected.length) return;
    const names = new Set(current.data.subscriptions.map(subscription => subscription.name.toLowerCase().replace(/[^a-z0-9]/g, "")));
    update({ subscriptions: [...current.data.subscriptions, ...detected.filter(subscription => !names.has(subscription.name.toLowerCase().replace(/[^a-z0-9]/g, "")))], subscriptionJournalImported: true });
  }, [update]);

  const downloadLocalCopy = useCallback(() => {
    const backup = localStorage.getItem(`${key}:conflict-backup`);
    const blob = new Blob([JSON.stringify({ data: state.current.data, previousLocalDraft: backup ? JSON.parse(backup) : undefined, previousCache: localStorage.getItem(`${key}:previous-cache`) || undefined }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "routino-tracker-backup.json"; anchor.click(); URL.revokeObjectURL(url);
  }, [key]);

  return { ...data, update, undo, importSubscriptions, status, message, ready, durable, savedAt, retry: flush, reloadSaved: () => refresh(true), downloadLocalCopy };
}
