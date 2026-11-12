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
  Flame,
  StickyNote,
  Gauge,
  Key,
  Zap,
  Wallet,
  Briefcase,
} from "lucide-react";
import { Task, DashboardEvent } from "@/types/dashboard";
import type { TrackersTabKey } from "@/components/views/TrackersView";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenTrackerTab?: (tab: TrackersTabKey) => void;
  onOpenFocusTimer: () => void;
  onOpenAddTask: () => void;
  onOpenAddEvent: () => void;
  onOpenHabits?: () => void;
  onOpenDailyRoutine?: () => void;
  onOpenPreferences?: () => void;
  onOpenShortcuts?: () => void;
  tasks: Task[];
  events: DashboardEvent[];
};

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenTrackerTab,
  onOpenFocusTimer,
  onOpenAddTask,
  onOpenAddEvent,
  onOpenHabits,
  onOpenDailyRoutine,
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

  const navActions = [
    {
      id: "overview",
      label: "Go to Overview",
      icon: Target,
      iconColor: "text-forest",
      action: () => onNavigate("Overview"),
      keywords: ["overview", "home", "dashboard"],
    },
    {
      id: "calendar",
      label: "Open Calendar View",
      icon: CalendarDays,
      iconColor: "text-[#6088d1]",
      action: () => onNavigate("Calendar"),
      keywords: ["calendar", "schedule", "events", "meetings"],
    },
    {
      id: "inbox",
      label: "Open Inbox View",
      icon: Inbox,
      iconColor: "text-[#d16b5b]",
      action: () => onNavigate("Inbox"),
      keywords: ["inbox", "email", "mail"],
    },
    {
      id: "tasks",
      label: "Open Tasks Manager",
      icon: ListTodo,
      iconColor: "text-forest",
      action: () => onNavigate("Tasks"),
      keywords: ["tasks", "todo", "manager"],
    },
    {
      id: "notes",
      label: "Open Notes & Scratchpad",
      icon: StickyNote,
      iconColor: "text-[#eab308]",
      action: () => onNavigate("Notes"),
      keywords: ["notes", "scratchpad", "keep"],
    },
    {
      id: "trackers",
      label: "Open Trackers Hub",
      icon: Gauge,
      iconColor: "text-[#059669]",
      action: () => onNavigate("Trackers"),
      keywords: ["trackers", "hub", "operations"],
    },
    {
      id: "trackers-tokens",
      label: "Trackers → Antigravity Tokens",
      icon: Key,
      iconColor: "text-[#059669]",
      action: () => (onOpenTrackerTab ? onOpenTrackerTab("tokens") : onNavigate("Trackers")),
      keywords: ["tokens", "antigravity", "profiles", "accounts", "cooldown"],
    },
    {
      id: "trackers-eb",
      label: "Trackers → PG Electricity (EB)",
      icon: Zap,
      iconColor: "text-[#b45309]",
      action: () => (onOpenTrackerTab ? onOpenTrackerTab("eb") : onNavigate("Trackers")),
      keywords: ["eb", "electricity", "meter", "power", "bill", "units"],
    },
    {
      id: "trackers-expenses",
      label: "Trackers → Expense & Budget",
      icon: Wallet,
      iconColor: "text-[#059669]",
      action: () => (onOpenTrackerTab ? onOpenTrackerTab("expenses") : onNavigate("Trackers")),
      keywords: ["expenses", "budget", "spend", "finance", "ledger"],
    },
    {
      id: "trackers-placements",
      label: "Trackers → Placement & Career",
      icon: Briefcase,
      iconColor: "text-[#1d4ed8]",
      action: () => (onOpenTrackerTab ? onOpenTrackerTab("placements") : onNavigate("Trackers")),
      keywords: ["career", "placements", "jobs", "applications", "interviews"],
    },
    {
      id: "focus",
      label: "Start Focus Mode / Timer",
      icon: Focus,
      iconColor: "text-forest",
      action: onOpenFocusTimer,
      keywords: ["focus", "timer", "pomodoro", "deep work"],
    },
    {
      id: "new-task",
      label: "Create New Task",
      icon: Plus,
      iconColor: "text-muted",
      action: onOpenAddTask,
      keywords: ["task", "add", "new", "create"],
    },
    {
      id: "new-event",
      label: "Schedule Calendar Event",
      icon: Plus,
      iconColor: "text-[#6088d1]",
      action: onOpenAddEvent,
      keywords: ["event", "schedule", "calendar", "meeting", "create"],
    },
    ...(onOpenDailyRoutine
      ? [
          {
            id: "daily-routine",
            label: "Daily Routine: Morning Plan / Evening Wrap-up",
            icon: Sparkles,
            iconColor: "text-forest",
            action: onOpenDailyRoutine,
            keywords: ["routine", "morning", "evening", "wrapup", "plan"],
          },
        ]
      : []),
    ...(onOpenHabits
      ? [
          {
            id: "habits",
            label: "Manage Daily Micro-Habits (H)",
            icon: Flame,
            iconColor: "text-[#c2410c]",
            action: onOpenHabits,
            keywords: ["habits", "microhabits", "streak"],
          },
        ]
      : []),
    ...(onOpenPreferences
      ? [
          {
            id: "preferences",
            label: "Open Preferences & Settings",
            icon: Settings,
            iconColor: "text-forest",
            action: onOpenPreferences,
            keywords: ["settings", "preferences", "config"],
          },
        ]
      : []),
    ...(onOpenShortcuts
      ? [
          {
            id: "shortcuts",
            label: "Keyboard Shortcuts Guide (?)",
            icon: Keyboard,
            iconColor: "text-[#6d76b1]",
            action: onOpenShortcuts,
            keywords: ["keyboard", "shortcuts", "hotkeys", "help"],
          },
        ]
      : []),
  ];

  const q = query.trim().toLowerCase();
  const filteredActions = q
    ? navActions.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.keywords.some((k) => k.includes(q))
      )
    : navActions;

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
          {filteredActions.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Navigation & Actions {q ? `(${filteredActions.length})` : ""}
              </div>
              <div className="space-y-1">
                {filteredActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAction(item.action)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] text-ink hover:bg-[#fdf2f2] transition cursor-pointer"
                    >
                      <Icon size={15} className={item.iconColor} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
