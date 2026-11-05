"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  CalendarDays,
  Inbox,
  ListTodo,
  Target,
  Focus,
  Plus,
  ArrowRight,
  Sparkles,
  X,
  ExternalLink,
  Settings,
  Keyboard,
} from "lucide-react";
import { Task, DashboardEvent } from "@/types/dashboard";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenFocusTimer: () => void;
  onOpenAddTask: () => void;
  onOpenAddEvent: () => void;
  onOpenPreferences?: () => void;
  onOpenShortcuts?: () => void;
  tasks: Task[];
  events: DashboardEvent[];
};

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenFocusTimer,
  onOpenAddTask,
  onOpenAddEvent,
  onOpenPreferences,
  onOpenShortcuts,
  tasks,
  events,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or toggle
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );
  const filteredEvents = events.filter((e) =>
    (e.summary || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-20 sm:pt-28">
      <div className="relative w-full max-w-xl rounded-2xl border border-line bg-[#fbfcf8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 bg-white">
          <Search size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, meetings, or commands (e.g. 'Focus', 'Calendar')..."
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
          <kbd className="hidden sm:inline-block rounded bg-[#f1f3ed] px-2 py-0.5 text-[10px] font-semibold text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {/* Quick Actions */}
          <div className="mb-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Navigation & Actions
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleAction(() => onNavigate("Overview"))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <Target size={15} className="text-forest" />
              <span>Go to Overview</span>
            </button>
            <button
              onClick={() => handleAction(() => onNavigate("Calendar"))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <CalendarDays size={15} className="text-[#6088d1]" />
              <span>Open Calendar View</span>
            </button>
            <button
              onClick={() => handleAction(() => onNavigate("Inbox"))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <Inbox size={15} className="text-[#d16b5b]" />
              <span>Open Inbox View</span>
            </button>
            <button
              onClick={() => handleAction(() => onNavigate("Tasks"))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <ListTodo size={15} className="text-forest" />
              <span>Open Tasks Manager</span>
            </button>
            <button
              onClick={() => handleAction(onOpenFocusTimer)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <Focus size={15} className="text-forest" />
              <span>Start Focus Mode / Timer</span>
            </button>
            <button
              onClick={() => handleAction(onOpenAddTask)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <Plus size={15} className="text-muted" />
              <span>Create New Task</span>
            </button>
            <button
              onClick={() => handleAction(onOpenAddEvent)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
            >
              <Plus size={15} className="text-[#6088d1]" />
              <span>Schedule Calendar Event</span>
            </button>
            {onOpenPreferences && (
              <button
                onClick={() => handleAction(onOpenPreferences)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
              >
                <Settings size={15} className="text-forest" />
                <span>Open Preferences & Settings</span>
              </button>
            )}
            {onOpenShortcuts && (
              <button
                onClick={() => handleAction(onOpenShortcuts)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition"
              >
                <Keyboard size={15} className="text-[#6d76b1]" />
                <span>Keyboard Shortcuts Guide (?)</span>
              </button>
            )}
          </div>

          {/* Matched Tasks */}
          {filteredTasks.length > 0 && (
            <div className="mt-3">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Tasks ({filteredTasks.length})
              </div>
              <div className="space-y-1">
                {filteredTasks.slice(0, 4).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleAction(() => onNavigate("Tasks"))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#eef2ea] transition"
                  >
                    <span className={task.checked ? "line-through text-muted" : "font-medium"}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-muted">{task.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Events */}
          {filteredEvents.length > 0 && (
            <div className="mt-3">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Calendar Events ({filteredEvents.length})
              </div>
              <div className="space-y-1">
                {filteredEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleAction(() => onNavigate("Calendar"))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#eef2ea] transition"
                  >
                    <span className="font-medium">{event.summary || "Untitled"}</span>
                    <span className="text-[10px] text-muted">{event.description || "Meeting"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-[#f4f5f0] px-4 py-2.5 text-[10px] text-muted">
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span>Press <strong>Cmd + K</strong> anytime</span>
        </div>
      </div>
    </div>
  );
}
