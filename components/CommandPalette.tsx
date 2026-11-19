"use client";
import { workspaceScrollBehavior } from "@/lib/workspacePreferences";
import { taskTags } from "@/lib/taskOrganization";

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
import { emptySearchFilters,hasSearchFilters,matchesSearchFilters,type SearchFilters } from "@/lib/searchFilters";
import { searchWorkspace } from "@/lib/workspaceSearch";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelRecharge } from "@/types/airtel";
import { Task, KeepNote, DashboardEvent } from "@/types/dashboard";
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
  notes?: KeepNote[];
  subscriptions?: Subscription[];
  recharges?: AirtelRecharge[];
  onOpenTask?: (id: string) => void;
  onOpenNote?: (id: string) => void;
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
  notes = [],
  subscriptions = [],
  recharges = [],
  onOpenTask,
  onOpenNote,
  events,
}: CommandPaletteProps) {
  const [filters,setFilters]=useState<SearchFilters>(emptySearchFilters);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
      setQuery(""); setFilters(emptySearchFilters);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtering=hasSearchFilters(filters);
  const filteredTasks = tasks.filter((t) => matchesSearchFilters({kind:"task",date:t.dueDate,tags:taskTags(t),status:t.skipped?"skipped":t.checked?"completed":"open",attachment:!!t.documents?.length||!!t.link},filters) &&
    `${t.title} ${t.meta} ${t.dueDate || ""} ${t.category || ""} ${taskTags(t).join(" ")} ${t.projectName || ""} ${t.milestone || ""} ${(t.documents || []).map(doc=>doc.name).join(" ")} ${(t.subtasks || []).map(item => item.title).join(" ")}`.toLowerCase().includes(query.toLowerCase())
  );
  const workspaceResults = searchWorkspace(query, notes, subscriptions, recharges, filters);
  const filteredEvents = events.filter((e) => matchesSearchFilters({kind:"event",date:(e.start?.date||e.start?.dateTime||"").slice(0,10),tags:e.tag?[e.tag]:[],status:e.source||"google"},filters) &&
    (e.summary || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  const navActions = [
    { id: "recycle-bin", label: "Open Recycle Bin", icon: ListTodo, iconColor: "text-forest", action: () => onNavigate("Recycle Bin"), keywords: ["recycle", "bin", "trash", "restore", "deleted"] },
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
  const filteredActions = filtering ? [] : q
    ? navActions.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.keywords.some((k) => k.includes(q))
      )
    : navActions;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-20 sm:pt-28">
      <div className="relative w-full max-w-xl rounded-2xl border border-line bg-[#fbfcf8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-3 transition focus-within:border-forest/40 focus-within:ring-2 focus-within:ring-forest/10">
          <Search size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search workspace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, notes, subscriptions, recharges, or commands…"
            className="command-search-input min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
          <kbd className="hidden sm:inline-block rounded bg-[#f1f3ed] px-2 py-0.5 text-[10px] font-semibold text-muted">
            ESC
          </kbd>
        </div>

        <div className="px-3 pb-2"><button type="button" className="btn-theme rounded-lg border border-line px-3 py-1.5 text-xs" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(!filtersOpen)}>Filters{filtering?" · active":""}</button>{filtersOpen&&<div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-line bg-white p-3 text-xs"><label>Record type<select className="mt-1 w-full rounded border border-line p-2" value={filters.kind} onChange={e=>setFilters({...filters,kind:e.target.value})}>{['all','task','note','event','subscription','recharge'].map(kind=><option key={kind} value={kind}>{kind}</option>)}</select></label><label>Attachment<select className="mt-1 w-full rounded border border-line p-2" value={filters.attachment} onChange={e=>setFilters({...filters,attachment:e.target.value})}><option value="all">Any</option><option value="yes">Has attachment / reference</option><option value="no">No attachment</option></select></label><label>From date<input type="date" className="mt-1 w-full rounded border border-line p-2" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/></label><label>Through date<input type="date" min={filters.from||undefined} className="mt-1 w-full rounded border border-line p-2" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/></label><label>Tag / category<input className="mt-1 w-full rounded border border-line p-2" value={filters.tag} onChange={e=>setFilters({...filters,tag:e.target.value})}/></label><label>Status<input placeholder="e.g. open, active, pinned" className="mt-1 w-full rounded border border-line p-2" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}/></label><p className="col-span-2 text-[10px] text-muted">Dates: task due date, event start, note update, subscription renewal, recharge payment. Undated records are excluded when dates are set. Locked notes stay excluded.</p><button type="button" className="btn-theme rounded border border-line p-2" onClick={()=>setFilters(emptySearchFilters)}>Clear filters</button></div>}</div>
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
                {filteredTasks.slice(0, query.trim() ? 20 : 4).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleAction(() => onOpenTask ? onOpenTask(task.id) : onNavigate("Tasks"))}
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

          {(query.trim() || filtering) && <div className="mt-3"><p className="px-2 py-1 text-[10px] text-muted">Workspace results ({workspaceResults.length}) · Locked notes are excluded</p><div className="space-y-1">{workspaceResults.slice(0, 30).map(item => <button key={`${item.kind}:${item.id}`} className="btn-theme flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs" onClick={() => handleAction(() => {
            if (item.kind === "note") { if (onOpenNote) onOpenNote(item.id); else onNavigate("Notes"); }
            else { onOpenTrackerTab?.(item.kind === "subscription" ? "subscriptions" : "airtel"); window.setTimeout(() => document.getElementById(`${item.kind}-${item.id}`)?.scrollIntoView({ block: "center", behavior: workspaceScrollBehavior() }), 150); }
          })}><span className="min-w-0"><span className="block font-semibold">{item.title}</span><span className="mt-1 block truncate text-muted">{item.detail.replace(/<[^>]*>/g, " ").slice(0, 120)}</span></span><span className="shrink-0 text-muted">{item.kind}</span></button>)}</div>{workspaceResults.length > 30 && <p className="px-2 text-xs text-muted">Showing first 30 results. Refine your search to find more.</p>}</div>}
          {/* Matched Events */}
          {filteredEvents.length > 0 && (
            <div className="mt-3">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Calendar Events ({filteredEvents.length})
              </div>
              <div className="space-y-1">
                {filteredEvents.slice(0, query.trim() ? 20 : 3).map((event) => (
                  <button
                    key={`${event.calendarId || event.source || "custom"}:${event.id}`}
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
          <span>Use <strong>Tab</strong> to navigate, <strong>Enter</strong> to open</span>
          <span>Search with <strong>⌘ K / Ctrl K</strong></span>
        </div>
      </div>
    </div>
  );
}
