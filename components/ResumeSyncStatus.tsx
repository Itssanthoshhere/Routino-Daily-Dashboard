"use client";

import { useEffect, useState } from "react";
import { pendingResumeChanges, resumeSyncStatus } from "@/lib/resumeSyncStatus";

type Props = {
  account: string | null;
  checking: boolean;
  saving: boolean;
  error: boolean;
  localOnly: boolean;
  checkedAt: number | null;
  trackerCheckedAt: number | null;
};

/** Report actual core/tracker refreshes; never schedule a duplicate sync or write records. */
export function ResumeSyncStatus(props: Props) {
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(0);
  const [queue, setQueue] = useState({ pending: false, unreadable: false, account: undefined as string | null | undefined });
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setNow(Date.now());
      setQueue({ ...pendingResumeChanges({ getItem: key => localStorage.getItem(key) }, props.account), account: props.account });
    };
    update();
    const visible = () => { if (document.visibilityState === "visible") update(); };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", visible);
    const interval = window.setInterval(visible, 30000);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(interval);
    };
  }, [props.account, props.checking, props.saving, props.error, props.checkedAt, props.trackerCheckedAt]);
  const status = resumeSyncStatus({ ...props, signedIn: !!props.account, online, checking: props.checking || queue.account !== props.account, pending: queue.account === props.account && queue.pending, error: props.error || (queue.account === props.account && queue.unreadable) }, now);
  return <div className="workspace-resume-status flex w-full items-center gap-1.5 text-[10.5px] sm:hidden" role="status" aria-live="polite" aria-atomic="true">
    <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.tone === 'success' ? 'bg-emerald-600' : status.tone === 'warning' ? 'bg-amber-600' : status.tone === 'busy' ? 'animate-pulse bg-forest' : 'bg-slate-400'}`}/>
    <span className={status.tone === 'warning' ? 'text-amber-800' : 'text-muted'}>{status.label}</span>
  </div>;
}
