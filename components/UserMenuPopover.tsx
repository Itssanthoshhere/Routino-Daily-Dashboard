"use client";

import { useEffect, useRef } from "react";
import { LogOut, Settings, ShieldCheck, Keyboard } from "lucide-react";
import { connectGoogle } from "@/app/actions";
import { appConfig } from "@/lib/config";

type UserMenuPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onOpenPreferences?: () => void;
  onOpenShortcuts?: () => void;
};

export function UserMenuPopover({
  isOpen,
  onClose,
  isConnected,
  userName,
  userEmail,
  userImage,
  onOpenPreferences,
  onOpenShortcuts,
}: UserMenuPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  const displayName = isConnected && userName ? userName : appConfig.user.name;
  const displayInitial = isConnected && userName ? userName.charAt(0).toUpperCase() : appConfig.user.initial;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-line bg-[#fbfcf8] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center gap-3 border-b border-line pb-3">
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt={displayName} className="h-10 w-10 rounded-full object-cover ring-1 ring-line" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e4d4c2] text-[13px] font-bold text-[#614d3f]">
            {displayInitial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink leading-tight truncate">{displayName}</p>
          <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5 truncate">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isConnected ? "bg-forest" : "bg-[#efbd60]"}`} />
            <span className="truncate">{isConnected ? (userEmail || "Google Connected") : "Not connected"}</span>
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {!isConnected ? (
          <form action={connectGoogle}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-medium text-forest hover:bg-[#fdf2f2] transition"
            >
              <ShieldCheck size={14} /> Connect Google Account
            </button>
          </form>
        ) : (
          <a
            href="/auth/signout"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-medium text-[#c05746] hover:bg-[#faeeec] transition"
          >
            <LogOut size={14} /> Disconnect Google
          </a>
        )}

        <button
          onClick={() => {
            onClose();
            onOpenPreferences?.();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"
        >
          <Settings size={14} /> Preferences
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenShortcuts?.();
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"
        >
          <span className="flex items-center gap-2.5">
            <Keyboard size={14} /> Keyboard Shortcuts
          </span>
          <kbd className="rounded bg-[#f1f3ed] px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted">?</kbd>
        </button>
      </div>

      <div className="mt-3 border-t border-line pt-3 text-[10px] text-muted">
        <p className="leading-snug">{appConfig.name} · Private workspace</p>
      </div>
    </div>
  );
}
