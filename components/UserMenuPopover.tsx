"use client";

import { useEffect, useRef } from "react";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { connectGoogle } from "@/app/actions";
import { appConfig } from "@/lib/config";

type UserMenuPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onResetData: () => void;
};

export function UserMenuPopover({
  isOpen,
  onClose,
  isConnected,
  onResetData,
}: UserMenuPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

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
      className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-line bg-[#fbfcf8] p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e4d4c2] text-[13px] font-bold text-[#614d3f]">
          {appConfig.user.initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink leading-tight">{appConfig.user.name}</p>
          <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-[#78a36d]" : "bg-[#efbd60]"}`} />
            {isConnected ? "Google Connected" : "Local Workspace"}
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {!isConnected ? (
          <form action={connectGoogle}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-medium text-forest hover:bg-[#eaf3e8] transition"
            >
              <ShieldCheck size={14} /> Connect Google Account
            </button>
          </form>
        ) : (
          <a
            href="/api/auth/signout"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-medium text-[#c05746] hover:bg-[#faeeec] transition"
          >
            <LogOut size={14} /> Disconnect Google
          </a>
        )}

        <button
          onClick={() => {
            onResetData();
            onClose();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[11px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"
        >
          <RefreshCw size={14} /> Reset Sample Data
        </button>
      </div>

      <div className="mt-3 border-t border-line pt-3 text-[10px] text-muted">
        <p className="leading-snug">{appConfig.name} · Local private storage active</p>
      </div>
    </div>
  );
}
