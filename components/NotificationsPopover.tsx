"use client";

import { useEffect, useRef } from "react";
import { Bell, CalendarDays, CheckCircle2, Inbox, ListTodo, X } from "lucide-react";
import { NotificationItem } from "@/types/dashboard";

type NotificationsPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (item: NotificationItem) => void;
  onClearAll: () => void;
};

export function NotificationsPopover({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onClearAll,
}: NotificationsPopoverProps) {
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
      className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-line bg-[#fbfcf8] p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-forest" />
          <h4 className="text-[12px] font-semibold text-ink">Notifications</h4>
          <span className="rounded-full bg-[#f0dfc4] px-1.5 py-0.5 text-[9px] font-bold text-[#9b6c2a]">
            {notifications.length}
          </span>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] font-medium text-muted hover:text-ink transition"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-2 divide-y divide-[#eff1ec] max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={24} className="mx-auto text-[#85af83] opacity-60 mb-2" />
            <p className="text-[11px] font-medium text-muted">All caught up for today!</p>
          </div>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectNotification(item)}
              className="flex w-full items-start gap-2.5 py-2.5 text-left transition hover:bg-[#f4f6f1] rounded-lg px-2 -mx-2"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white border border-line text-[#6088d1]">
                {item.type === "calendar" ? (
                  <CalendarDays size={13} className="text-[#6088d1]" />
                ) : item.type === "mail" ? (
                  <Inbox size={13} className="text-[#d16b5b]" />
                ) : (
                  <ListTodo size={13} className="text-[#819a65]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-ink leading-snug">{item.title}</p>
                <span className="mt-0.5 block text-[9px] text-muted">{item.time}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
