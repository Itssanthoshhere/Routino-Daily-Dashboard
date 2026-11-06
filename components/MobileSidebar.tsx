"use client";

import { useEffect } from "react";
import {
  CalendarDays,
  Inbox,
  ListTodo,
  Sparkles,
  Target,
  X,
  Mail,
  MoreHorizontal,
  Keyboard,
  StickyNote,
} from "lucide-react";
import { appConfig } from "@/lib/config";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  activeNav: string;
  onSelectNav: (label: string) => void;
  unreadCount: number;
  isConnected: boolean;
  isOutlookConnected?: boolean;
  onOpenPreferences?: () => void;
  onOpenShortcuts?: () => void;
};

const navItems = [
  { icon: Target, label: "Overview" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Inbox, label: "Inbox" },
  { icon: ListTodo, label: "Tasks" },
  { icon: StickyNote, label: "Notes" },
];

export function MobileSidebar({
  isOpen,
  onClose,
  activeNav,
  onSelectNav,
  unreadCount,
  isConnected,
  isOutlookConnected = false,
  onOpenPreferences,
  onOpenShortcuts,
}: MobileSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex w-[280px] max-w-[85vw] flex-col bg-[#fbfcf8] p-6 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Routino" className="h-9 w-9 rounded-[13px]" />
            <span className="text-[16px] font-bold tracking-tight">
              {appConfig.name.toLowerCase()}<span className="text-[#9eaaa1]">.</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">
          Workspace
        </p>

        <nav className="mt-3 space-y-1">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => {
                onSelectNav(label);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                activeNav === label
                  ? "bg-[#fdf2f2] font-semibold text-forest"
                  : "text-[#77827b] hover:bg-[#f1f3ed]"
              }`}
            >
              <Icon size={16} />
              {label}
              {label === "Inbox" && (
                <span className="ml-auto rounded-full bg-[#f0dfc4] px-2 py-0.5 text-[10px] font-bold text-[#9b6c2a]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          {onOpenShortcuts && (
            <button
              onClick={() => {
                onClose();
                onOpenShortcuts();
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] text-[#77827b] hover:bg-[#f1f3ed] hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <Keyboard size={16} />
                Shortcuts
              </span>
              <kbd className="rounded bg-[#f1f3ed] px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted">?</kbd>
            </button>
          )}
        </nav>

        <div className="mt-8">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">
            Connected apps
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#4285f4] shadow-sm">
                <CalendarDays size={14} />
              </span>
              Google Calendar
              <span
                className={`ml-auto h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-forest" : "bg-[#efbd60]"
                }`}
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#d86b5b] shadow-sm">
                <Mail size={14} />
              </span>
              Gmail
              <span
                className={`ml-auto h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-forest" : "bg-[#efbd60]"
                }`}
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#0078d4] shadow-sm">
                <CalendarDays size={14} />
              </span>
              Outlook Calendar
              <span
                className={`ml-auto h-1.5 w-1.5 rounded-full ${
                  isOutlookConnected ? "bg-forest" : "bg-[#efbd60]"
                }`}
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#0078d4] shadow-sm">
                <Mail size={14} />
              </span>
              Outlook Mail
              <span
                className={`ml-auto h-1.5 w-1.5 rounded-full ${
                  isOutlookConnected ? "bg-forest" : "bg-[#efbd60]"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-2xl bg-forest p-4 text-white">
          <div className="mb-2 flex items-center justify-between text-accent">
            <div className="flex items-center gap-2">
              <Sparkles size={15} />
              <span className="text-[11px] font-semibold">A calmer day</span>
            </div>
            {onOpenPreferences && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreferences();
                }}
                className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title="Preferences"
                aria-label="Preferences"
              >
                <MoreHorizontal size={15} />
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-white/70">
            Spend your hours intentionally on what matters.
          </p>
        </div>
      </div>
    </div>
  );
}
