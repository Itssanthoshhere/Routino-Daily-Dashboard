"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

/** Secondary workspace actions remain accessible without crowding compact headers. */
export function WorkspaceTools({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      // Let native dialogs handle Escape before dismissing their parent panel.
      if (event.target instanceof Element && event.target.closest("dialog[open]")) return;
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return <div ref={root}>
    <button ref={trigger} type="button" className="workspace-tools-toggle rounded-xl border border-line bg-white text-ink" aria-label="Workspace tools" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><MoreHorizontal size={20} /></button>
    <div id={id} className="workspace-tools-panel" data-open={open}>{children}</div>
  </div>;
}
