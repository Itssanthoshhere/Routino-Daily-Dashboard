"use client";

import { useEffect, useRef } from "react";
import { accountStorageKey } from "@/lib/accountStorage";
import { mayResumeSection, readWorkspacePosition, resumeScroll, type WorkspacePosition } from "@/lib/workspaceResume";

/** Device-local navigation only; never stores note content, forms, or account records. */
export function useWorkspaceResume({ ready, account, section, tracker, onResume }: {
  ready: boolean; account: string | null; section: string; tracker: string;
  onResume: (position: WorkspacePosition) => void;
}) {
  const latest = useRef({ section, tracker, onResume });
  latest.current = { section, tracker, onResume };
  const launch = useRef(typeof window === "undefined" ? null : { search: window.location.search, hash: window.location.hash });
  const savePosition = useRef<(() => void) | null>(null);
  const interacted = useRef(false);
  useEffect(() => {
    const mark = () => { interacted.current = true; };
    window.addEventListener("pointerdown", mark, { passive: true });
    window.addEventListener("keydown", mark);
    window.addEventListener("wheel", mark, { passive: true });
    window.addEventListener("touchstart", mark, { passive: true });
    window.addEventListener("popstate", mark);
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("wheel", mark);
      window.removeEventListener("touchstart", mark);
      window.removeEventListener("popstate", mark);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const key = accountStorageKey("routino_workspace_position", account);
    let saved: WorkspacePosition | null = null;
    try { saved = readWorkspacePosition(localStorage.getItem(key)); } catch {}
    // Capture launch intent before shortcuts remove their query parameters.
    const { search, hash } = launch.current || { search: window.location.search, hash: window.location.hash };
    let target = { section: latest.current.section, tracker: latest.current.tracker, scrollY: 0 };
    if (saved && !interacted.current && mayResumeSection(search, hash)) {
      target = saved;
      latest.current.onResume(saved);
    }
    const y = saved && !interacted.current ? resumeScroll(saved, target, search, hash) : null;
    let restoring = y !== null && y > 0;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;
    let retry: ReturnType<typeof setInterval> | undefined;
    let frame = 0;
    const persist = () => {
      if (restoring || disposed || document.querySelector('dialog[open], [aria-modal="true"]')) return;
      try { localStorage.setItem(key, JSON.stringify({ section: latest.current.section, tracker: latest.current.tracker, scrollY: Math.max(0, window.scrollY) })); } catch {}
    };
    savePosition.current = persist;
    const finish = () => { restoring = false; observer?.disconnect(); if (retry) clearInterval(retry); if (finishTimer) clearTimeout(finishTimer); };
    const cancel = () => { finish(); cancelAnimationFrame(frame); };
    const restore = () => {
      if (!restoring || disposed) return;
      const top = Math.min(y!, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
      if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" });
    };
    // Tracker mounting and late sheet results can change document height. Reapply only
    // during launch, and stop immediately when the user touches or types in the app.
    if (restoring) {
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(restore); });
      observer = new ResizeObserver(restore);
      observer.observe(document.body);
      retry = setInterval(restore, 150);
      finishTimer = setTimeout(finish, 8000);
    }
    const scroll = () => { if (timer) clearTimeout(timer); timer = setTimeout(persist, 200); };
    const hidden = () => { if (document.visibilityState === "hidden") persist(); };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pointerdown", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("popstate", cancel);
    window.addEventListener("keydown", cancel);
    return () => {
      disposed = true;
      savePosition.current = null;
      finish();
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [ready, account]);
  // Save destination changes even when a short page never emits a scroll event.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => savePosition.current?.(), 250);
    return () => clearTimeout(timer);
  }, [ready, section, tracker]);
}
