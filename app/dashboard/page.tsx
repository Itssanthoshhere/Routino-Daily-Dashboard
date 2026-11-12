
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, ChevronUp, CheckSquare, Circle, Clock3, ExternalLink, FileText, Focus, FolderOpen, Github, Globe,
  Inbox, Keyboard, Link2, ListTodo, Mail, MapPin, Menu, MoreHorizontal, Plane, Plus, Printer, Search, Shuffle, Sparkles,
  StickyNote, Target, Timer, TriangleAlert, Video, X, PieChart, Gauge,
  Key, Zap, Wallet, Briefcase, Copy, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { connectGoogle } from "@/app/actions";

import type { Task, DashboardEvent, DashboardMail, DashboardData, QuickLink, NotificationItem, Habit, SubTask, KeepNote, TrackersData } from "@/types/dashboard";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { FocusTimerModal } from "@/components/FocusTimerModal";
import { TaskModal } from "@/components/TaskModal";
import { EventModal } from "@/components/EventModal";
import { MailDrawer } from "@/components/MailDrawer";
import { QuickLinkModal } from "@/components/QuickLinkModal";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { UserMenuPopover } from "@/components/UserMenuPopover";
import { CommandPalette } from "@/components/CommandPalette";
import { MobileSidebar } from "@/components/MobileSidebar";
import { GoogleSetupModal } from "@/components/GoogleSetupModal";
import { GoogleDriveFilesCard } from "@/components/GoogleDriveFilesCard";
import { UpNextMeetingBanner } from "@/components/UpNextMeetingBanner";
import { FlightTravelCard } from "@/components/FlightTravelCard";
import { DayTimelineBar } from "@/components/DayTimelineBar";
import { DailyRoutineModal } from "@/components/DailyRoutineModal";
import { DailyDeskSheetModal } from "@/components/DailyDeskSheetModal";
import { QuickCaptureModal } from "@/components/QuickCaptureModal";
import { QuickScratchpadCard } from "@/components/QuickScratchpadCard";
import { PreferencesModal } from "@/components/PreferencesModal";
import { WeatherWidget } from "@/components/WeatherWidget";
import { HabitTracker, getLocalDateString } from "@/components/HabitTracker";
import { HabitsManagerModal } from "@/components/HabitsManagerModal";
import { HabitModal } from "@/components/HabitModal";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { CalendarView } from "@/components/views/CalendarView";
import { InboxView } from "@/components/views/InboxView";
import { TasksView } from "@/components/views/TasksView";
import { NotesView } from "@/components/views/NotesView";
import { TimeAuditView } from "@/components/views/TimeAuditView";
import { TrackersView, type TrackersTabKey } from "@/components/views/TrackersView";
import { SEED_TRACKERS_DATA } from "@/lib/trackersSync";
import { playTick } from "@/lib/sound";
import { appConfig } from "@/lib/config";
import { DAILY_INTENTIONS, getTodayIntentionIndex } from "@/lib/quotes";
import { getMeetingUrl, inferEventCategory, inferTaskCategory } from "@/lib/meeting";

/* ─── Sample / seed data ────────────────────────────────────────── */

type ScheduleItem = {
  time: string;
  end: string;
  name: string;
  detail: string;
  tag: string;
  color: string;
  meetUrl?: string | null;
  location?: string | null;
};

const nav = [
  { icon: Target, label: "Overview" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: PieChart, label: "Time Audit" },
  { icon: Gauge, label: "Trackers" },
  { icon: Inbox, label: "Inbox" },
  { icon: ListTodo, label: "Tasks" },
  { icon: StickyNote, label: "Notes" },
];

const TAB_TO_PARAM: Record<string, string> = {
  Overview: "overview",
  Calendar: "calendar",
  "Time Audit": "time-audit",
  Trackers: "trackers",
  Inbox: "inbox",
  Tasks: "tasks",
  Notes: "notes",
};

const PARAM_TO_TAB: Record<string, string> = {
  overview: "Overview",
  calendar: "Calendar",
  "time-audit": "Time Audit",
  timeaudit: "Time Audit",
  trackers: "Trackers",
  inbox: "Inbox",
  tasks: "Tasks",
  notes: "Notes",
};

const TRACKER_SHORTCUTS: Record<string, TrackersTabKey> = {
  tokens: "tokens",
  eb: "eb",
  electricity: "eb",
  expenses: "expenses",
  budget: "expenses",
  placements: "placements",
  career: "placements",
  investments: "investments",
  purchases: "purchases",
  gadgets: "purchases",
  life: "life",
};

const sampleSchedule: ScheduleItem[] = [
  { time: "09:30", end: "10:00", name: "Weekly team sync", detail: "Product & design · Meet link", tag: "PREP", color: "#7b8df4" },
  { time: "11:00", end: "12:00", name: "Project review", detail: "Q4 roadmap · 3 guests", tag: "IN 2H", color: "#e7a15a" },
  { time: "14:30", end: "15:00", name: "Catch up with Maya", detail: "Personal · Google Meet", tag: "", color: "#5fa77d" },
];

const sampleMail: DashboardMail[] = [
  {
    id: "sample-1",
    from: "Riya Kapoor",
    subject: "Updated proposal for your review",
    date: "8:42 AM",
    snippet: "Could you take a look at the revised scope before tomorrow?",
    read: false,
    starred: true,
    category: "reply",
  },
  {
    id: "sample-2",
    from: "Aarav · CloudDesk",
    subject: "Invoice #CD-2048 is due Friday",
    date: "Yesterday",
    snippet: "Your monthly workspace invoice is ready to view.",
    read: false,
    starred: false,
    category: "payment",
  },
  {
    id: "sample-3",
    from: "Design Guild",
    subject: "Design system components v2.4 released",
    date: "Oct 30",
    snippet: "Check out the new design tokens, buttons, and responsive grid layouts.",
    read: true,
    starred: false,
    category: "update",
  },
];

const seedTasks: Task[] = [
  {
    id: "t-1",
    title: "Review the Q4 proposal",
    meta: "Before project review · 11:00 AM",
    checked: false,
    priority: true,
    category: "project",
    createdAt: 1,
    subtasks: [
      { id: "st-1", title: "Outline key milestones", completed: true },
      { id: "st-2", title: "Verify budget projection table", completed: false },
      { id: "st-3", title: "Format executive summary", completed: false },
    ],
  },
  { id: "t-2", title: "Reply to Riya about the scope", meta: "Today · Email follow-up", checked: false, priority: false, category: "personal", createdAt: 2 },
  { id: "t-3", title: "Send invoice to finance", meta: "Due Friday · 2 days left", checked: false, priority: false, category: "urgent", createdAt: 3 },
  { id: "t-4", title: "Block focus time for roadmap", meta: "Suggested · 90 min", checked: true, priority: false, category: "project", createdAt: 4 },
];

const seedHabits: Habit[] = [
  { id: "h-1", name: "Hydrate 2L", streak: 3, completedDates: [], icon: "droplet" },
  { id: "h-2", name: "Morning Walk", streak: 5, completedDates: [], icon: "footprints" },
  { id: "h-3", name: "Read 20 min", streak: 2, completedDates: [], icon: "book" },
  { id: "h-4", name: "Inbox Zero", streak: 4, completedDates: [], icon: "mail" },
];

const seedLinks: QuickLink[] = [
  { id: "ql-1", title: "Google Calendar", subtitle: "Your schedule", url: appConfig.links.calendar, iconName: "calendar", available: true },
  { id: "ql-2", title: "Gmail", subtitle: "Your inbox", url: appConfig.links.mail, iconName: "mail", available: true },
  { id: "ql-3", title: "Outlook", subtitle: "Mail & calendar", url: "https://outlook.live.com/mail", iconName: "outlook", available: true },
  { id: "ql-5", title: "GitHub", subtitle: "Itssanthoshhere", url: appConfig.links.github, iconName: "github", available: true },
  { id: "ql-6", title: "Portfolio", subtitle: "santhosh-vs-portfolio", url: appConfig.links.portfolio, iconName: "globe", available: true },
  { id: "ql-7", title: "Google Drive", subtitle: "Recent files", url: appConfig.links.drive, iconName: "drive", available: true },
];

const seedNotifications: NotificationItem[] = [
  { id: "n-1", title: "Weekly team sync starts in 30 min", time: "9:00 AM", type: "calendar", read: false, navTarget: "Calendar" },
  { id: "n-2", title: "Riya Kapoor replied to your thread", time: "8:42 AM", type: "mail", read: false, navTarget: "Inbox" },
  { id: "n-3", title: "Task 'Q4 proposal' is due today", time: "Yesterday", type: "task", read: false, navTarget: "Tasks" },
];

const seedNotes: KeepNote[] = [
  {
    id: "note-1",
    title: "Welcome to Routino Notes 💡",
    content: "Capture thoughts, quick snippets, and daily scratchpad notes just like Google Keep.\n\n• Pin your most important notes to the top\n• Color-code notes for fast visual organization\n• Drag and reorder notes seamlessly\n• Add priority tags (High, Med, Low) and images!",
    color: "peach",
    pinned: true,
    priority: "high",
    updatedAt: Date.now(),
    createdAt: Date.now() - 3600000,
  },
  {
    id: "note-2",
    title: "Daily Standup & Action Items",
    content: "",
    color: "blue",
    pinned: false,
    priority: "medium",
    checklist: [
      { id: "c-1", text: "Responsive layout optimization across all screens", done: true },
      { id: "c-2", text: "Focus audio engine cleanup on pause/close", done: true },
      { id: "c-3", text: "Interactive note scratchpad and reminders", done: true },
    ],
    updatedAt: Date.now() - 1800000,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "note-3",
    title: "Ideas & Architecture Notes",
    content: "Next sprint:\n1. Azure Outlook Calendar deep synchronization.\n2. Ambient soundscapes (Rain, Cafe, White Noise).\n3. Offline PWA caching with IndexedDB.",
    color: "green",
    pinned: false,
    updatedAt: Date.now() - 900000,
    createdAt: Date.now() - 14400000,
  },
];

const hueClasses: Record<string, string> = {
  blue: "bg-[#edf0ff] text-[#6d76b1]",
  peach: "bg-[#fbefe5] text-[#a17652]",
  green: "bg-[#eaf3e9] text-[#648266]",
};
const hues = ["blue", "peach", "green"];

/* ─── Helpers ────────────────────────────────────────────────── */

function normalizeQuickLinks(links: QuickLink[]): QuickLink[] {
  const usedIds = new Set<string>();

  return links.filter((link) =>
    String(link.iconName).toLowerCase() !== "linkedin" &&
    !link.url?.toLowerCase().includes("linkedin.com") &&
    link.title?.trim().toLowerCase() !== "linkedin" &&
    String(link.iconName).toLowerCase() !== "sites" &&
    link.title?.trim().toLowerCase() !== "google sites"
  ).map((link, index) => {
    const baseId = link.id?.trim() || `quick-link-${index + 1}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    usedIds.add(id);
    return id === link.id ? link : { ...link, id };
  });
}

function formatTime(value?: string) {
  if (!value) return "All day";
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
function formatMailDate(value: string) {
  if (!value) return "Unread";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
function senderName(value: string) {
  return value.replace(/<.*?>/g, "").replaceAll('"', "").trim() || value;
}
function senderInitials(value: string) {
  return senderName(value).split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase() || "G";
}

const linkIcons: Record<string, typeof CalendarDays> = {
  calendar: CalendarDays,
  mail: Mail,
  outlook: Mail,
  github: Github,
  portfolio: Globe,
  globe: Globe,
  drive: FileText,
  sites: Link2,
  link: Link2,
  file: FileText,
};

function SectionHeading({ icon: Icon, title, sub, right }: { icon: typeof CalendarDays; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f2f4ee] text-[#526259]"><Icon size={16} /></span>
        <div>
          <h2 className="text-[14px] font-semibold leading-tight">{title}</h2>
          {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

export default function Home() {
  /* ── Core state ── */
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [notes, setNotes] = useState<KeepNote[]>(seedNotes);
  const [activeNav, setActiveNav] = useState("Overview");
  const [notice, setNotice] = useState(true);
  const [liveData, setLiveData] = useState<DashboardData | null>(null);
  const [customEvents, setCustomEvents] = useState<DashboardEvent[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(seedLinks);
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);
  const [mailItems, setMailItems] = useState<DashboardMail[]>(sampleMail);
  const [googleMail, setGoogleMail] = useState<DashboardMail[]>([]);
  const [outlookData, setOutlookData] = useState<{
    connected: boolean;
    profile?: { email: string; name?: string };
    events: DashboardEvent[];
    unread: DashboardMail[];
  }>({ connected: false, events: [], unread: [] });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(appConfig.defaults.focusMinutes);
  const [hydrated, setHydrated] = useState(false);

  /* ── Modal / popover state ── */
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQuickLinkModal, setShowQuickLinkModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [dbSource, setDbSource] = useState<string>("Local Storage");
  const [viewingEvent, setViewingEvent] = useState<DashboardEvent | null>(null);
  const [viewingMail, setViewingMail] = useState<DashboardMail | null>(null);
  const [intentionIndex, setIntentionIndex] = useState(0);
  const [habits, setHabits] = useState<Habit[]>(seedHabits);
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [editingHabitInModal, setEditingHabitInModal] = useState<Habit | null>(null);
  const [showIndividualHabitModal, setShowIndividualHabitModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showDeskSheet, setShowDeskSheet] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [expandedOverviewTasks, setExpandedOverviewTasks] = useState<Record<string, boolean>>({});

  /* ── Trackers Snapshot state ── */
  const [trackersData, setTrackersData] = useState<TrackersData>(SEED_TRACKERS_DATA);
  const [copiedOverviewEmail, setCopiedOverviewEmail] = useState<string | null>(null);
  const [trackersTab, setTrackersTab] = useState<TrackersTabKey>("eb");
  const [trackersTabKey, setTrackersTabKey] = useState<number>(0);

  const fetchTrackersData = useCallback(async () => {
    try {
      const res = await fetch("/api/trackers/sync", { cache: "no-store" });
      const json = await res.json();
      if (json?.success && json?.data) {
        setTrackersData(json.data);
      }
    } catch {
      // Keep seeded fallback
    }
  }, []);

  useEffect(() => {
    fetchTrackersData();
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchTrackersData();
      }
    };
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    return () => {
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [fetchTrackersData]);

  const handleCopyNextReadyOverview = (e: React.MouseEvent) => {
    e.stopPropagation();
    const readyList = (trackersData.antigravityTokens || []).filter((t) => t.isAvailable);
    if (readyList.length === 0) return;
    const next = readyList[0];
    navigator.clipboard.writeText(next.email);
    setCopiedOverviewEmail(next.email);
    setTimeout(() => {
      setCopiedOverviewEmail(null);
    }, 2500);
  };

  const overviewTrackersSummary = useMemo(() => {
    // 1. Antigravity Tokens
    const tokens = trackersData.antigravityTokens || [];
    const readyTokens = tokens.filter((t) => t.isAvailable);
    const cooldownTokens = tokens.filter((t) => !t.isAvailable);
    const readyCount = trackersData.antigravityTokenSummary?.available ?? readyTokens.length;
    const cooldownCount = trackersData.antigravityTokenSummary?.inCooldown ?? cooldownTokens.length;

    // 2. EB Meter
    const latestEbReadingItem = trackersData.ebReadings?.[0];
    const latestReading = latestEbReadingItem ? latestEbReadingItem.meterReading : (trackersData.ebMeta?.latestReading ?? 323);
    const rate = trackersData.ebMeta?.currentRate || 10;
    const runningCycle = trackersData.ebCycles?.find((c) => c.status === "Running" || c.cycle.toLowerCase() === "nov") || trackersData.ebCycles?.[trackersData.ebCycles.length - 1];
    const unitsUsed = runningCycle?.unitsUsed ?? 23;
    const people = runningCycle?.peopleSharing || 2;
    const daysElapsed = Math.max(1, new Date().getDate());
    const burnRate = Number((unitsUsed / daysElapsed).toFixed(2));
    const projectedUnits = Math.max(unitsUsed, Math.round(burnRate * 30));
    const projectedTotal = projectedUnits * rate;
    const projectedShare = Math.round(projectedTotal / people);

    // 3. Monthly Budget
    const budget = trackersData.totalMonthlyBudget || 7500;
    const spent = trackersData.journals?.["2026"]?.totalSpent ?? trackersData.expenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) ?? 3420;
    const spentPct = Math.min(100, Math.round((spent / budget) * 100));
    const remaining = Math.max(0, budget - spent);

    // 4. Career Pipelines
    const activeApps = (trackersData.jobApplications || []).filter(
      (j) => !j.status.toLowerCase().includes("reject") && !j.status.toLowerCase().includes("not attend")
    );

    return {
      readyCount,
      cooldownCount,
      latestReading,
      burnRate,
      projectedTotal,
      projectedShare,
      budget,
      spent,
      spentPct,
      remaining,
      activeAppsCount: activeApps.length,
    };
  }, [trackersData]);

  useEffect(() => {
    setIntentionIndex(getTodayIntentionIndex());
  }, []);

  const handleNextIntention = () => {
    setIntentionIndex((prev) => (prev + 1) % DAILY_INTENTIONS.length);
  };

  const currentIntention = DAILY_INTENTIONS[intentionIndex] || DAILY_INTENTIONS[0];

  /* ── Derived ── */
  const done = tasks.filter(t => t.checked).length;
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  /* ── LocalStorage Hydration ── */
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem("routino_tasks");
      if (storedTasks !== null) {
        const parsed = JSON.parse(storedTasks);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map((t: Task) => {
            if (!t.category || t.category === "work" || t.category === "personal") {
              const detected = inferTaskCategory(t.title);
              if (detected === "project" || detected === "travel") {
                const updatedMeta = t.meta && (t.meta.includes("Personal") || t.meta.includes("Work"))
                  ? t.meta.replace(/Personal|Work/g, detected === "project" ? "Project" : "Travel")
                  : t.meta;
                return { ...t, category: detected, meta: updatedMeta };
              }
            }
            return t;
          });
          setTasks(migrated);
        }
      }

      const storedLinks = localStorage.getItem("routino_links");
      if (storedLinks !== null) {
        const parsed = normalizeQuickLinks(JSON.parse(storedLinks) as QuickLink[]);
        // Ensure new default links are added if missing
        const existingUrls = new Set(parsed.map(l => l.url.toLowerCase()));
        const missingDefaults = seedLinks.filter(s => s.available && !existingUrls.has(s.url.toLowerCase()));
        const merged = normalizeQuickLinks([...parsed, ...missingDefaults]);
        setQuickLinks(merged);
        try { localStorage.setItem("routino_links", JSON.stringify(merged)); } catch {}
      }

      const storedEvents = localStorage.getItem("routino_events");
      if (storedEvents !== null) {
        setCustomEvents(JSON.parse(storedEvents));
      }

      const storedFocus = localStorage.getItem("routino_focus");
      if (storedFocus !== null) {
        setFocusMinutes(parseInt(storedFocus, 10));
      }

      const storedSound = localStorage.getItem("routino_sound_enabled");
      if (storedSound !== null) {
        setSoundEnabled(storedSound === "true");
      }

      // 1. Check URL search param (?tab=...) first, then fallback to storedNav
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get("tab")?.toLowerCase();
      const urlSub = urlParams.get("sub")?.toLowerCase() as TrackersTabKey | undefined;

      if (urlTab) {
        if (TRACKER_SHORTCUTS[urlTab]) {
          setActiveNav("Trackers");
          setTrackersTab(TRACKER_SHORTCUTS[urlTab]);
          setTrackersTabKey(k => k + 1);
        } else if (PARAM_TO_TAB[urlTab]) {
          setActiveNav(PARAM_TO_TAB[urlTab]);
          if (PARAM_TO_TAB[urlTab] === "Trackers" && urlSub && TRACKER_SHORTCUTS[urlSub]) {
            setTrackersTab(TRACKER_SHORTCUTS[urlSub]);
            setTrackersTabKey(k => k + 1);
          }
        }
      } else {
        const storedNav = localStorage.getItem("routino_active_nav");
        if (storedNav) {
          setActiveNav(storedNav);
        }
      }

      const storedStarred = localStorage.getItem("routino_starred_mail");
      const storedRead = localStorage.getItem("routino_read_mail");
      if (storedStarred || storedRead) {
        const starredSet = new Set(JSON.parse(storedStarred || "[]"));
        const readSet = new Set(JSON.parse(storedRead || "[]"));
        setMailItems(prev => prev.map(m => ({
          ...m,
          starred: starredSet.has(m.id) || !!m.starred,
          read: readSet.has(m.id) || !!m.read,
        })));
      }

      const storedHabits = localStorage.getItem("routino_habits");
      if (storedHabits !== null) {
        setHabits(JSON.parse(storedHabits));
      }

      const storedNotes = localStorage.getItem("routino_notes");
      if (storedNotes !== null) {
        setNotes(JSON.parse(storedNotes));
      }

      if (window.location.search.includes("setup=google")) {
        setShowGoogleSetup(true);
      }
    } catch {
      // Fallback
    }
    setHydrated(true);
  }, []);

  /* ── Browser Back / Forward URL Sync ── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toLowerCase();
      const subParam = params.get("sub")?.toLowerCase() as TrackersTabKey | undefined;

      if (tabParam) {
        if (TRACKER_SHORTCUTS[tabParam]) {
          setActiveNav("Trackers");
          setTrackersTab(TRACKER_SHORTCUTS[tabParam]);
          setTrackersTabKey((k) => k + 1);
        } else if (PARAM_TO_TAB[tabParam]) {
          setActiveNav(PARAM_TO_TAB[tabParam]);
          if (PARAM_TO_TAB[tabParam] === "Trackers" && subParam && TRACKER_SHORTCUTS[subParam]) {
            setTrackersTab(TRACKER_SHORTCUTS[subParam]);
            setTrackersTabKey((k) => k + 1);
          }
        }
      } else {
        setActiveNav("Overview");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ── Toast helper ── */
  const toast = useCallback((message: string, type: "success" | "info" = "success") => {
    const id = "toast-" + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  /* ── Fetch live data from Google OAuth ── */
  useEffect(() => {
    let active = true;
    const fetchDashboard = () => {
      fetch("/api/dashboard", { cache: "no-store" })
        .then(async (r) => {
          const result = await r.json();
          if (active && result.connected) {
            setLiveData(result as DashboardData);
            setGoogleMail(result.unread || []);
          }
        })
        .catch(() => undefined);
    };

    fetchDashboard();

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard();
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    const interval = setInterval(onFocusOrVisible, 60 * 1000);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      clearInterval(interval);
    };
  }, []);

  /* ── Fetch live data from Microsoft Outlook ── */
  const fetchOutlookData = useCallback(async () => {
    try {
      const res = await fetch("/api/outlook/data", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setOutlookData({
            connected: true,
            profile: data.profile,
            events: data.events || [],
            unread: data.unread || [],
          });
        } else {
          setOutlookData({ connected: false, events: [], unread: [] });
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    void fetchOutlookData();
    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchOutlookData();
      }
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    const interval = setInterval(onFocusOrVisible, 60 * 1000);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      clearInterval(interval);
    };
  }, [fetchOutlookData]);

  // Handle post-redirect toast when returning from Outlook OAuth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("connected") === "outlook") {
        toast("Connected to Microsoft Outlook successfully!", "success");
        void fetchOutlookData();
        const url = new URL(window.location.href);
        url.searchParams.delete("connected");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [toast, fetchOutlookData]);

  /* ── Merge unread emails from Google and Outlook ── */
  useEffect(() => {
    const isGoogle = Boolean(liveData?.connected);
    const isOutlook = Boolean(outlookData?.connected);

    if (!isGoogle && !isOutlook) {
      return;
    }

    const storedStarred = new Set(JSON.parse(localStorage.getItem("routino_starred_mail") || "[]"));
    const storedRead = new Set(JSON.parse(localStorage.getItem("routino_read_mail") || "[]"));

    const combined: DashboardMail[] = [];

    if (isGoogle) {
      combined.push(
        ...googleMail.map(m => ({
          ...m,
          href: m.href || ("https://mail.google.com/mail/u/0/#all/" + m.id),
          starred: storedStarred.has(m.id) || !!m.starred,
          read: storedRead.has(m.id) || !!m.read,
          source: "google" as const,
        }))
      );
    }

    if (isOutlook) {
      combined.push(
        ...(outlookData.unread || []).map(m => ({
          ...m,
          starred: storedStarred.has(m.id) || !!m.starred,
          read: storedRead.has(m.id) || !!m.read,
          source: "outlook" as const,
        }))
      );
    }

    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMailItems(combined);
  }, [liveData?.connected, googleMail, outlookData.connected, outlookData.unread]);

  /* ── Dynamic real notifications ── */
  useEffect(() => {
    const isGoogle = Boolean(liveData?.connected);
    const isOutlook = Boolean(outlookData?.connected);

    if (!isGoogle && !isOutlook) return;

    const realNotifications: NotificationItem[] = [];

    if (isGoogle && googleMail.length > 0) {
      realNotifications.push({
        id: "n-unread-gmail",
        title: `You have ${googleMail.length} unread message${googleMail.length > 1 ? "s" : ""} in Gmail`,
        time: "Now",
        type: "mail",
        read: false,
        navTarget: "Inbox",
      });
    }

    if (isOutlook && outlookData.unread.length > 0) {
      realNotifications.push({
        id: "n-unread-outlook",
        title: `You have ${outlookData.unread.length} unread message${outlookData.unread.length > 1 ? "s" : ""} in Outlook`,
        time: "Now",
        type: "mail",
        read: false,
        navTarget: "Inbox",
      });
    }

    if (isGoogle && liveData?.events && liveData.events.length > 0) {
      const firstEv = liveData.events[0];
      realNotifications.push({
        id: "n-cal-google",
        title: `Google Calendar: ${firstEv.summary || "Event"}`,
        time: formatTime(firstEv.start?.dateTime),
        type: "calendar",
        read: false,
        navTarget: "Calendar",
      });
    }

    if (isOutlook && outlookData.events && outlookData.events.length > 0) {
      const firstEv = outlookData.events[0];
      realNotifications.push({
        id: "n-cal-outlook",
        title: `Outlook Calendar: ${firstEv.summary || "Event"}`,
        time: formatTime(firstEv.start?.dateTime),
        type: "calendar",
        read: false,
        navTarget: "Calendar",
      });
    }

    if (realNotifications.length > 0) {
      setNotifications(realNotifications);
    }
  }, [liveData, googleMail, outlookData]);

  useEffect(() => {
    if (liveData?.connected || outlookData?.connected) setNotice(false);
  }, [liveData?.connected, outlookData?.connected]);

  /* ── Computed calendar data ── */
  const allEvents = useMemo(() => {
    const live = (liveData?.events ?? []).map((ev) => {
      const cat = inferEventCategory(ev);
      return { ...ev, tag: ev.tag || cat.tag, color: ev.color || cat.color };
    });
    const outlook = (outlookData?.events ?? []).map((ev) => ({
      ...ev,
      tag: ev.tag || "OUTLOOK",
      color: ev.color || "#0078d4",
    }));
    return [...live, ...outlook, ...customEvents];
  }, [liveData, outlookData, customEvents]);

  const todayEvents = useMemo(() => allEvents.filter(ev => {
    const start = ev.start?.dateTime ?? ev.start?.date;
    return start && new Date(start).toDateString() === new Date().toDateString();
  }), [allEvents]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const events = allEvents.filter(ev => {
      const start = ev.start?.dateTime ?? ev.start?.date;
      return start && new Date(start).toDateString() === date.toDateString();
    });
    return {
      day: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date).toUpperCase(),
      date: String(date.getDate()),
      items: events.map((ev, i) => ({
        id: ev.id ? `${ev.id}-${i}` : `ev-${offset}-${i}`,
        time: formatTime(ev.start?.dateTime),
        title: ev.summary || "Untitled event",
        hue: hues[i % hues.length],
      })),
    };
  }), [allEvents]);

  const isConnected = !!liveData?.connected || !!outlookData?.connected;

  const schedule: ScheduleItem[] = isConnected || customEvents.length > 0
    ? todayEvents.map((ev, i) => {
        const cat = inferEventCategory(ev);
        return {
          time: formatTime(ev.start?.dateTime),
          end: formatTime(ev.end?.dateTime),
          name: ev.summary || "Untitled event",
          detail: ev.description?.slice(0, 90) || (ev.source === "outlook" ? "Outlook Calendar" : "Google Calendar"),
          tag: ev.tag || cat.tag,
          color: ev.color || cat.color,
          meetUrl: getMeetingUrl(ev),
          location: ev.location || null,
        };
      })
    : sampleSchedule;

  const displaySchedule = isConnected ? schedule : (schedule.length > 0 ? schedule : sampleSchedule);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 6);

  const sortedOverviewTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Remaining (incomplete) tasks first
      if (!a.checked && b.checked) return -1;
      if (a.checked && !b.checked) return 1;
      if (!a.checked && !b.checked) {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
      }
      return 0;
    });
  }, [tasks]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      if (isInput) return;

      // ? key (Shift + /)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // 1, 2, 3, 4 view switches
      if (e.key === "1") {
        e.preventDefault();
        handleSelectNav("Overview");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        handleSelectNav("Calendar");
        return;
      }
      if (e.key === "3") {
        e.preventDefault();
        handleSelectNav("Inbox");
        return;
      }
      if (e.key === "4") {
        e.preventDefault();
        handleSelectNav("Tasks");
        return;
      }
      if (e.key === "5") {
        e.preventDefault();
        handleSelectNav("Notes");
        return;
      }
      if (e.key === "6") {
        e.preventDefault();
        handleSelectNav("Trackers");
        return;
      }

      // F for focus timer
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setShowFocusTimer(true);
        return;
      }

      // T for new task
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setShowTaskModal(true);
        return;
      }

      // E for new event
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setShowEventModal(true);
        return;
      }

      // H for habits manager modal
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowHabitsModal(true);
        return;
      }

      // Q for universal quick capture
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        setShowQuickCapture(true);
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ── Database persistence & synchronization ── */
  const syncToDatabase = useCallback(
    async (overrideData?: {
      tasks?: Task[];
      customEvents?: DashboardEvent[];
      quickLinks?: QuickLink[];
      focusMinutes?: number;
      soundEnabled?: boolean;
      habits?: Habit[];
      notes?: KeepNote[];
      activeNav?: string;
    }) => {
      if (!liveData?.connected) return;
      try {
        setIsSyncing(true);
        const payload = {
          tasks: overrideData?.tasks ?? tasks,
          customEvents: overrideData?.customEvents ?? customEvents,
          quickLinks: overrideData?.quickLinks ?? quickLinks,
          focusMinutes: overrideData?.focusMinutes ?? focusMinutes,
          soundEnabled: overrideData?.soundEnabled ?? soundEnabled,
          habits: overrideData?.habits ?? habits,
          notes: overrideData?.notes ?? notes,
          activeNav: overrideData?.activeNav ?? activeNav,
        };

        const res = await fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();
          setLastSyncedAt(json.savedAt || new Date().toISOString());
          if (json.dbStatus?.sourceLabel) {
            setDbSource(json.dbStatus.sourceLabel);
          }
        }
      } catch {
        // Offline / network failure handled gracefully
      } finally {
        setIsSyncing(false);
      }
    },
    [liveData?.connected, tasks, customEvents, quickLinks, focusMinutes, soundEnabled, habits, notes, activeNav]
  );

  /* ── Load user workspace from Database on session connect ── */
  useEffect(() => {
    if (!liveData?.connected) return;
    let active = true;
    fetch("/api/user-data", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((res) => {
        if (!active || !res || !res.authenticated) return;
        if (res.dbStatus?.sourceLabel) {
          setDbSource(res.dbStatus.sourceLabel);
        }
        if (res.exists && res.data) {
          const d = res.data;
          if (Array.isArray(d.tasks) && d.tasks.length > 0) {
            const migrated = d.tasks.map((t: Task) => {
              if (!t.category || t.category === "work" || t.category === "personal") {
                const detected = inferTaskCategory(t.title);
                if (detected === "project" || detected === "travel") {
                  const updatedMeta = t.meta && (t.meta.includes("Personal") || t.meta.includes("Work"))
                    ? t.meta.replace(/Personal|Work/g, detected === "project" ? "Project" : "Travel")
                    : t.meta;
                  return { ...t, category: detected, meta: updatedMeta };
                }
              }
              return t;
            });
            setTasks(migrated);
            try { localStorage.setItem("routino_tasks", JSON.stringify(migrated)); } catch {}
          }
          if (Array.isArray(d.customEvents)) {
            setCustomEvents(d.customEvents);
            try { localStorage.setItem("routino_events", JSON.stringify(d.customEvents)); } catch {}
          }
          if (Array.isArray(d.quickLinks) && d.quickLinks.length > 0) {
            const normalizedLinks = normalizeQuickLinks(d.quickLinks);
            setQuickLinks(normalizedLinks);
            try { localStorage.setItem("routino_links", JSON.stringify(normalizedLinks)); } catch {}
          }
          if (typeof d.focusMinutes === "number") {
            setFocusMinutes(d.focusMinutes);
            try { localStorage.setItem("routino_focus", String(d.focusMinutes)); } catch {}
          }
          if (typeof d.soundEnabled === "boolean") {
            setSoundEnabled(d.soundEnabled);
            try { localStorage.setItem("routino_sound_enabled", String(d.soundEnabled)); } catch {}
          }
          if (Array.isArray(d.habits) && d.habits.length > 0) {
            setHabits(d.habits);
            try { localStorage.setItem("routino_habits", JSON.stringify(d.habits)); } catch {}
          }
          if (Array.isArray(d.notes) && d.notes.length > 0) {
            setNotes(d.notes);
            try { localStorage.setItem("routino_notes", JSON.stringify(d.notes)); } catch {}
          }
          if (d.updatedAt) {
            setLastSyncedAt(d.updatedAt);
          }
        } else {
          syncToDatabase();
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [liveData?.connected]);

  const handleManualSync = async () => {
    await syncToDatabase();
    toast("Workspace synchronized with database!");
  };

  /* ── Handlers ── */
  const toggleTask = (id: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, checked: !t.checked };
        if (updated.checked) {
          playTick();
          toast(`"${t.title}" marked complete`);
        }
        return updated;
      });
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
    if (task) toast(`"${task.title}" removed`, "info");
  };

  const toggleSubTask = (taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId || !t.subtasks) return t;
        const nextSubtasks = t.subtasks.map(st => {
          if (st.id !== subtaskId) return st;
          const nextCompleted = !st.completed;
          if (nextCompleted) {
            playTick();
          }
          return { ...st, completed: nextCompleted };
        });
        return { ...t, subtasks: nextSubtasks };
      });
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
  };

  const toggleHabit = (id: string) => {
    const todayStr = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    setHabits(prev => {
      const next = prev.map(h => {
        if (h.id !== id) return h;
        const isDone = h.completedDates.includes(todayStr);
        let nextDates: string[];
        let nextStreak: number;

        if (isDone) {
          nextDates = h.completedDates.filter(d => d !== todayStr);
          nextStreak = Math.max(0, h.streak - 1);
        } else {
          nextDates = [...h.completedDates, todayStr];
          const didYesterday = h.completedDates.includes(yesterdayStr);
          nextStreak = didYesterday ? h.streak + 1 : 1;
          playTick();
          toast(`Habit "${h.name}" completed for today! 🔥`);
        }
        return { ...h, completedDates: nextDates, streak: nextStreak };
      });
      try { localStorage.setItem("routino_habits", JSON.stringify(next)); } catch {}
      syncToDatabase({ habits: next });
      return next;
    });
  };

  const addHabit = (name: string, icon?: string) => {
    const newHabit: Habit = {
      id: "h-" + Date.now(),
      name,
      streak: 0,
      completedDates: [],
      icon,
    };
    setHabits(prev => {
      const next = [...prev, newHabit];
      try { localStorage.setItem("routino_habits", JSON.stringify(next)); } catch {}
      syncToDatabase({ habits: next });
      return next;
    });
    toast(`Habit "${name}" created!`);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => {
      const next = prev.map(h => (h.id === id ? { ...h, ...updates } : h));
      try { localStorage.setItem("routino_habits", JSON.stringify(next)); } catch {}
      syncToDatabase({ habits: next });
      return next;
    });
    toast("Habit updated!");
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => {
      const next = prev.filter(h => h.id !== id);
      try { localStorage.setItem("routino_habits", JSON.stringify(next)); } catch {}
      syncToDatabase({ habits: next });
      return next;
    });
    toast("Habit deleted", "info");
  };

  const addTask = (data: Omit<Task, "id" | "checked" | "createdAt">) => {
    const finalCategory = inferTaskCategory(data.title, data.category);
    let finalMeta = data.meta;
    if (!finalMeta || finalMeta === "Today · Work" || finalMeta === "Today · Quick Capture") {
      const catLabel = finalCategory === "project" ? "Project" : finalCategory === "travel" ? "Travel" : finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1);
      finalMeta = `Today · ${catLabel}`;
    }
    const newTask: Task = { ...data, category: finalCategory, meta: finalMeta, id: "t-" + Date.now(), checked: false, createdAt: Date.now() };
    setTasks(prev => {
      const next = [newTask, ...prev];
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
    toast(`"${newTask.title}" added to priorities`);
  };

  const addEvent = (event: DashboardEvent) => {
    setCustomEvents(prev => {
      const next = [...prev, event];
      try { localStorage.setItem("routino_events", JSON.stringify(next)); } catch {}
      syncToDatabase({ customEvents: next });
      return next;
    });
    toast(`"${event.summary}" scheduled`);
  };

  const addQuickLink = (link: QuickLink) => {
    setQuickLinks(prev => {
      const next = normalizeQuickLinks([...prev, link]);
      try { localStorage.setItem("routino_links", JSON.stringify(next)); } catch {}
      syncToDatabase({ quickLinks: next });
      return next;
    });
    toast(`"${link.title}" added to quick links`);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.navTarget) {
      setActiveNav(item.navTarget);
      try { localStorage.setItem("routino_active_nav", item.navTarget); } catch {}
    }
    setNotifications(prev => prev.filter(n => n.id !== item.id));
    setShowNotifications(false);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast("All notifications cleared", "info");
  };

  const toggleMailStar = (id: string) => {
    setMailItems(prev => {
      const next = prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m);
      try {
        const starredIds = next.filter(m => m.starred).map(m => m.id);
        localStorage.setItem("routino_starred_mail", JSON.stringify(starredIds));
      } catch {}
      return next;
    });
  };

  const toggleMailRead = (id: string) => {
    setMailItems(prev => {
      const next = prev.map(m => m.id === id ? { ...m, read: !m.read } : m);
      try {
        const readIds = next.filter(m => m.read).map(m => m.id);
        localStorage.setItem("routino_read_mail", JSON.stringify(readIds));
      } catch {}
      return next;
    });
  };

  const handleSelectNav = (tab: string, pushUrl = true) => {
    setActiveNav(tab);
    try { localStorage.setItem("routino_active_nav", tab); } catch {}

    if (pushUrl && typeof window !== "undefined") {
      const slug = TAB_TO_PARAM[tab] || "overview";
      const newUrl = slug === "overview" ? "/dashboard" : `/dashboard?tab=${slug}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.pushState({ tab }, "", newUrl);
      }
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
  };

  const handleOpenTrackersTab = useCallback((tab: TrackersTabKey, pushUrl = true) => {
    setTrackersTab(tab);
    setTrackersTabKey((k) => k + 1);
    handleSelectNav("Trackers", false);

    if (pushUrl && typeof window !== "undefined") {
      const newUrl = `/dashboard?tab=trackers&sub=${tab}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.pushState({ tab: "Trackers", sub: tab }, "", newUrl);
      }
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
  }, []);

  const handleFocusComplete = (mins: number) => {
    setFocusMinutes(prev => {
      const next = prev + mins;
      try { localStorage.setItem("routino_focus", String(next)); } catch {}
      syncToDatabase({ focusMinutes: next });
      return next;
    });
    toast(`Focus session complete! ${mins} minutes logged.`);
  };

  const handleUpdateFocusMinutes = (mins: number) => {
    setFocusMinutes(mins);
    try { localStorage.setItem("routino_focus", String(mins)); } catch {}
    syncToDatabase({ focusMinutes: mins });
    toast(`Focus target set to ${mins} minutes`);
  };

  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("routino_sound_enabled", String(next)); } catch {}
      syncToDatabase({ soundEnabled: next });
      toast(next ? "Audio feedback enabled" : "Audio muted", "info");
      return next;
    });
  };

  const handleClearCompletedTasks = () => {
    setTasks(prev => {
      const next = prev.filter(t => !t.checked);
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
    toast("Completed tasks archived", "info");
  };

  const addNote = (newNoteData: Omit<KeepNote, "id" | "createdAt" | "updatedAt">) => {
    const newNote: KeepNote = {
      ...newNoteData,
      id: "note-" + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes(prev => {
      const next = [newNote, ...prev];
      try { localStorage.setItem("routino_notes", JSON.stringify(next)); } catch {}
      syncToDatabase({ notes: next });
      return next;
    });
    toast("Note saved!");
  };

  const updateNote = (id: string, updates: Partial<KeepNote>) => {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
      try { localStorage.setItem("routino_notes", JSON.stringify(next)); } catch {}
      syncToDatabase({ notes: next });
      return next;
    });
  };

  const deleteNote = (id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      try { localStorage.setItem("routino_notes", JSON.stringify(next)); } catch {}
      syncToDatabase({ notes: next });
      return next;
    });
    toast("Note removed", "info");
  };

  const handleReorderNotes = (reordered: KeepNote[]) => {
    setNotes(reordered);
    try { localStorage.setItem("routino_notes", JSON.stringify(reordered)); } catch {}
    syncToDatabase({ notes: reordered });
  };

  const handleImportData = (imported: {
    tasks?: Task[];
    customEvents?: DashboardEvent[];
    quickLinks?: QuickLink[];
    habits?: Habit[];
    notes?: KeepNote[];
    focusMinutes?: number;
  }) => {
    if (imported.tasks) {
      setTasks(imported.tasks);
      try { localStorage.setItem("routino_tasks", JSON.stringify(imported.tasks)); } catch {}
    }
    if (imported.customEvents) {
      setCustomEvents(imported.customEvents);
      try { localStorage.setItem("routino_events", JSON.stringify(imported.customEvents)); } catch {}
    }
    if (imported.quickLinks) {
      const normalizedLinks = normalizeQuickLinks(imported.quickLinks);
      setQuickLinks(normalizedLinks);
      try { localStorage.setItem("routino_links", JSON.stringify(normalizedLinks)); } catch {}
    }
    if (imported.habits && Array.isArray(imported.habits)) {
      setHabits(imported.habits);
      try { localStorage.setItem("routino_habits", JSON.stringify(imported.habits)); } catch {}
    }
    if (imported.notes && Array.isArray(imported.notes)) {
      setNotes(imported.notes);
      try { localStorage.setItem("routino_notes", JSON.stringify(imported.notes)); } catch {}
    }
    if (imported.focusMinutes) {
      setFocusMinutes(imported.focusMinutes);
      try { localStorage.setItem("routino_focus", String(imported.focusMinutes)); } catch {}
    }
    syncToDatabase({
      tasks: imported.tasks,
      customEvents: imported.customEvents,
      quickLinks: imported.quickLinks,
      habits: imported.habits,
      notes: imported.notes,
      focusMinutes: imported.focusMinutes,
    });
    toast("Workspace snapshot restored & synced!");
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen">
      {/* ─── Sidebar (desktop) ─── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col justify-between border-r border-line bg-[#fbfcf8] lg:flex">
        {/* Scrollable upper navigation & apps area */}
        <div className="flex-1 overflow-y-auto overscroll-contain sidebar-scroll px-4 xl:px-5 py-4 xl:py-6">
          <a href="#overview" onClick={() => handleSelectNav("Overview")} className="mb-4 xl:mb-7 flex items-center gap-3 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Routino" className="h-8 w-8 xl:h-9 xl:w-9 rounded-[13px]" />
            <span className="text-[15px] font-bold tracking-tight">{appConfig.name.toLowerCase()}<span className="text-[#9eaaa1]">.</span></span>
          </a>
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">Workspace</p>
          <nav className="mt-2 xl:mt-3 space-y-0.5 xl:space-y-1">
            {nav.map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => handleSelectNav(label)} className={"flex w-full items-center gap-3 rounded-xl px-3 py-2 xl:py-2.5 text-left text-[12px] xl:text-[13px] transition " + (activeNav === label ? "bg-[#fdf2f2] font-semibold text-forest" : "text-[#77827b] hover:bg-[#f1f3ed]")}>
                <Icon size={16} />{label}
                {label === "Inbox" && <span className="ml-auto rounded-full bg-[#f0dfc4] px-2 py-0.5 text-[10px] font-bold text-[#9b6c2a]">{mailItems.filter(m => !m.read).length}</span>}
                {label === "Tasks" && <span className="ml-auto rounded-full bg-[#e8efe4] px-2 py-0.5 text-[10px] font-bold text-forest">{tasks.filter(t => !t.checked).length}</span>}
                {label === "Notes" && notes.length > 0 && <span className="ml-auto rounded-full bg-[#fdf2f2] px-2 py-0.5 text-[10px] font-bold text-forest">{notes.length}</span>}
              </button>
            ))}
            <button
              onClick={() => setShowShortcuts(true)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] text-[#77827b] hover:bg-[#f1f3ed] hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <Keyboard size={15} /> Shortcuts
              </span>
              <kbd className="rounded bg-[#f1f3ed] px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted">?</kbd>
            </button>
          </nav>
          <div className="mt-4 xl:mt-6">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">Connected apps</p>
            <div className="mt-2 xl:mt-3 space-y-0.5 xl:space-y-1">
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 xl:py-2 text-[11px] xl:text-[12px] text-[#58645c]">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#4285f4] shadow-sm"><CalendarDays size={13} /></span>
                Google Calendar
                <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 xl:py-2 text-[11px] xl:text-[12px] text-[#58645c]">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#d86b5b] shadow-sm"><Mail size={13} /></span>
                Gmail
                <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 xl:py-2 text-[11px] xl:text-[12px] text-[#58645c]">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#6088d1] shadow-sm"><FolderOpen size={13} /></span>
                Google Drive
                <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 xl:py-2 text-[11px] xl:text-[12px] text-[#58645c]">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#0078d4] shadow-sm"><CalendarDays size={13} /></span>
                Outlook Calendar
                <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (outlookData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 xl:py-2 text-[11px] xl:text-[12px] text-[#58645c]">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#0078d4] shadow-sm"><Mail size={13} /></span>
                Outlook Mail
                <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (outlookData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom "A calmer day" card area with clear separation gap */}
        <div className="shrink-0 px-4 xl:px-5 pb-5 pt-3.5 border-t border-line/60 bg-[#fbfcf8]">
          <div className="rounded-2xl bg-forest p-3.5 xl:p-4 text-white shadow-sm">
            <div className="mb-2 xl:mb-2.5 flex items-center gap-2 text-accent"><Sparkles size={14} /><span className="text-[11px] font-semibold">A calmer day</span></div>
            <p className="text-[10px] xl:text-[11px] leading-relaxed text-white/70">{appConfig.tagline}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
              {liveData?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveData.user.image} alt={liveData.user.name || "User"} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#f0c6ae] text-[10px] font-bold text-[#614d3f]">
                  {liveData?.user?.name ? liveData.user.name.charAt(0).toUpperCase() : appConfig.user.initial}
                </div>
              )}
              <span className="text-[10px] xl:text-[11px] text-white/85 truncate">{liveData?.user?.name || appConfig.user.name}&apos;s workspace</span>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                title="Workspace Preferences"
                className="ml-auto shrink-0 rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Workspace Preferences"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile sidebar ─── */}
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
        unreadCount={mailItems.filter(m => !m.read).length}
        isConnected={!!liveData?.connected}
        isOutlookConnected={Boolean(outlookData?.connected)}
        onOpenPreferences={() => setShowPreferences(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {/* ─── Main ─── */}
      <main id="overview" className="min-h-screen lg:ml-[236px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-line bg-[#f7f7f2]/95 px-5 backdrop-blur-md sm:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileSidebar(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white lg:hidden" aria-label="Open menu"><Menu size={17} /></button>
            <img src="/favicon.svg" alt="Routino" className="hidden h-8 w-8 rounded-[11px] sm:block lg:hidden" />
            <div className="text-[12px] text-muted">Workspace <span className="mx-2 text-[#c4cbc3]">/</span><span className="font-semibold text-ink">{activeNav}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526056] hover:bg-[#f1f3ed] hover:text-ink transition"
              title="View Public Landing Page"
            >
              <Globe size={13} className="text-forest" />
              <span>Tour</span>
            </Link>
            <span className={"hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:flex " + (isConnected ? "border-[#fecaca] bg-[#fdf2f2] text-forest" : "border-[#eadfc6] bg-[#fbf5e9] text-[#987537]")}>
              <span className={"h-1.5 w-1.5 rounded-full " + (isConnected ? "bg-forest" : "bg-[#e7ae51]")} />
              {isConnected ? "GOOGLE CONNECTED" : "PREVIEW MODE"}
            </span>
            <button onClick={() => setShowCommandPalette(true)} aria-label="Search or command palette" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-[#758078] hover:bg-[#f1f3ed] transition" title="Press Cmd+K">
              <Search size={15} />
            </button>
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-[#758078] hover:bg-[#f1f3ed] transition">
                <Bell size={15} />
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#d16b5b] text-[8px] font-bold text-white">{notifications.length}</span>
                )}
              </button>
              <NotificationsPopover
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onSelectNotification={handleNotificationClick}
                onClearAll={clearAllNotifications}
              />
            </div>
            <div className="relative">
              <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} aria-label="User profile" className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#e4d4c2] text-[11px] font-semibold text-[#614d3f] hover:ring-2 hover:ring-forest/20 transition overflow-hidden">
                {liveData?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={liveData.user.image} alt={liveData.user.name || "User"} className="h-full w-full object-cover" />
                ) : (
                  liveData?.user?.name ? liveData.user.name.charAt(0).toUpperCase() : appConfig.user.initial
                )}
              </button>
              <UserMenuPopover
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                isConnected={!!liveData?.connected}
                userName={liveData?.user?.name}
                userEmail={liveData?.user?.email}
                userImage={liveData?.user?.image}
                onOpenPreferences={() => setShowPreferences(true)}
                onOpenShortcuts={() => setShowShortcuts(true)}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1680px] px-4 pb-12 pt-6 sm:px-6 md:px-8 xl:px-10">
          {/* Notice banner */}
          {notice && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#eadfc6] bg-[#fffaf0] px-4 py-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="mt-0.5 text-[#b28948]"><TriangleAlert size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#715a31]">{liveData?.error ? "Google data needs attention" : (isConnected ? "Your accounts are connected" : "Connect your accounts to see your real day")}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#927e58]">{liveData?.error ?? (isConnected ? "Calendar, Gmail, and approved Drive file metadata are available. Tasks are stored locally in this browser." : "You're viewing sample content. Gmail, Calendar, and Drive metadata will populate after secure Google sign-in and consent.")}</p>
              </div>
              {!isConnected && (
                <form action={connectGoogle} className="hidden shrink-0 sm:inline-flex">
                  <button className="rounded-lg bg-forest px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition">Connect Google <ArrowRight className="ml-1.5 inline" size={13} /></button>
                </form>
              )}
              <button onClick={() => setNotice(false)} aria-label="Dismiss" className="text-[#a99772] hover:text-[#715a31] transition"><X size={15} /></button>
            </div>
          )}

          {/* ─── CONDITIONAL VIEWS BASED ON ACTIVE NAV ─── */}
          {activeNav === "Calendar" ? (
            <CalendarView
              events={allEvents}
              onOpenAddEvent={() => { setViewingEvent(null); setShowEventModal(true); }}
              onSelectEvent={(ev) => { setViewingEvent(ev); setShowEventModal(true); }}
              isConnected={isConnected}
            />
          ) : activeNav === "Time Audit" ? (
            <TimeAuditView
              events={allEvents}
              isConnected={isConnected}
            />
          ) : activeNav === "Trackers" ? (
            <TrackersView
              initialTab={trackersTab}
              tabChangeKey={trackersTabKey}
              onTabChange={(tab) => {
                setTrackersTab(tab);
                if (typeof window !== "undefined") {
                  const newUrl = `/dashboard?tab=trackers&sub=${tab}`;
                  if (window.location.pathname + window.location.search !== newUrl) {
                    window.history.pushState({ tab: "Trackers", sub: tab }, "", newUrl);
                  }
                }
              }}
            />
          ) : activeNav === "Inbox" ? (
            <InboxView
              mailList={mailItems}
              onSelectMail={(m) => setViewingMail(m)}
              onToggleStar={toggleMailStar}
              onToggleRead={toggleMailRead}
              isConnected={isConnected}
            />
          ) : activeNav === "Tasks" ? (
            <TasksView
              tasks={tasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onAddTask={addTask}
              onOpenTaskModal={() => setShowTaskModal(true)}
              onToggleSubTask={toggleSubTask}
            />
          ) : activeNav === "Notes" ? (
            <NotesView
              notes={notes}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onReorderNotes={handleReorderNotes}
            />
          ) : (
            /* ─── OVERVIEW DASHBOARD VIEW ─── */
            <>
              {/* Up next meeting quick-join banner, Travel status & Today's Flow Timeline */}
              <div className="mb-5 space-y-3">
                <UpNextMeetingBanner events={allEvents} />
                <FlightTravelCard events={allEvents} onViewEvent={(ev) => { setViewingEvent(ev); setShowEventModal(true); }} />
                <DayTimelineBar events={allEvents} />
              </div>

              {/* Page heading */}
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium uppercase tracking-[.12em] text-[#89948b]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#85af83] animate-pulse" />Your {new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}
                    </span>
                    <WeatherWidget />
                  </div>
                  <h1 className="mt-2 text-[26px] font-semibold tracking-[-.045em] text-ink sm:text-[31px]">Make today count<span className="text-[#9aab82]">.</span></h1>
                  <p className="mt-1.5 text-[12px] text-muted">{today} <span className="mx-1.5">·</span> A little clarity goes a long way.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeskSheet(true)}
                    title="Preview & print today's Desk Sheet (Cmd+P)"
                    className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-[11px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition shadow-2xs cursor-pointer"
                  >
                    <Printer size={13} className="text-[#6088d1]" />
                    <span className="hidden sm:inline">Desk Sheet</span>
                  </button>
                  <button
                    onClick={() => setShowRoutineModal(true)}
                    title="Open Daily Routine (Morning Plan / Evening Wrap-up)"
                    className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition shadow-2xs cursor-pointer"
                  >
                    <Sparkles size={13} className="text-forest" />
                    <span>Daily Routine</span>
                  </button>
                  <button onClick={() => handleSelectNav("Calendar")} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"><CalendarDays size={14} />Today<ChevronDown size={13} /></button>
                  {!isConnected && (
                    <form action={connectGoogle}>
                      <button className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#8b1116]">Connect Google <ArrowUpRight size={14} /></button>
                    </form>
                  )}
                </div>
              </div>

              {/* ─── Summary cards ─── */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Intention card */}
                <div className="rounded-2xl bg-forest p-5 text-white shadow-card hover:shadow-lg transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white/65">A note for today</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleNextIntention}
                          className="rounded-lg p-1 text-white/50 hover:text-white hover:bg-white/10 transition"
                          title="Shuffle daily reflection"
                          aria-label="Shuffle daily reflection"
                        >
                          <Shuffle size={13} />
                        </button>
                        <Sparkles size={15} className="text-accent" />
                      </div>
                    </div>
                    <p className="mt-4 text-[16px] font-medium leading-[1.4] tracking-[-.02em] text-white">
                      &ldquo;{currentIntention.quote}&rdquo;
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-white/60">
                    <span className="font-medium text-white/80">— {currentIntention.author}</span>
                    <span className="text-accent font-semibold">{currentIntention.focusHint}</span>
                  </div>
                </div>

                {/* Calendar summary */}
                <button onClick={() => handleSelectNav("Calendar")} className="rounded-2xl border border-line bg-white p-5 shadow-card text-left hover:shadow-lg hover:border-forest/20 transition-all group">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">On your calendar</span><CalendarDays size={16} className="text-[#809184] group-hover:text-forest transition" /></div>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{isConnected ? todayEvents.length : displaySchedule.length}</span><span className="text-[11px] text-muted">events today</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]">
                    <Clock3 size={13} />
                    {isConnected
                      ? (todayEvents[0] ? <>Next at <strong className="text-ink">{formatTime(todayEvents[0].start?.dateTime)}</strong></> : "No more events today")
                      : <>Connect Google to see your schedule</>}
                  </div>
                </button>

                {/* Inbox summary */}
                <button onClick={() => handleSelectNav("Inbox")} className="rounded-2xl border border-line bg-white p-5 shadow-card text-left hover:shadow-lg hover:border-[#bd8054]/20 transition-all group">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">Needs a response</span><Inbox size={16} className="text-[#bd8054] group-hover:text-[#a0622e] transition" /></div>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{mailItems.filter(m => !m.read).length}</span><span className="text-[11px] text-muted">unread emails</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#d79257]" />{isConnected ? "Filtered to important inbox categories" : "Connect Google to load your inbox"}</div>
                </button>

                {/* Focus summary */}
                <button onClick={() => setShowFocusTimer(true)} className="rounded-2xl border border-line bg-white p-5 shadow-card text-left hover:shadow-lg hover:border-[#819a65]/20 transition-all group">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">A good pace</span><Timer size={16} className="text-[#819a65] group-hover:text-forest transition" /></div>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{focusMinutes}</span><span className="text-[11px] text-muted">min focus planned</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#87ac6c] animate-pulse" />Click to start a focus session</div>
                </button>
              </div>

              {/* ─── Trackers Quick Snapshot Widget ─── */}
              <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-forest/10 text-forest">
                      <Gauge size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-ink">Trackers Quick Snapshot</h3>
                        <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 text-[10px] font-bold text-[#047857]">
                          Live Sync
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted">
                        Executive pulse across Antigravity tokens, utility meters, monthly burn, and career applications
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectNav("Trackers")}
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-line bg-[#fafbf7] px-3 py-1.5 text-[11.5px] font-semibold text-forest hover:bg-forest hover:text-white transition shadow-2xs group"
                  >
                    <span>Open Trackers Hub</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
                  {/* 1. Antigravity Tokens */}
                  <div
                    onClick={() => handleOpenTrackersTab("tokens")}
                    className="cursor-pointer rounded-xl border border-line/80 bg-linear-to-b from-[#fbfcf9] to-white p-4 flex flex-col justify-between hover:border-forest/30 transition group"
                    title="Open Antigravity Tokens Tracker"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">Antigravity Tokens</span>
                        <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#ecfdf5] text-[#047857]">
                          <Key size={13} />
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-[24px] font-bold text-ink tracking-tight">
                          <span className="text-[#059669]">{overviewTrackersSummary.readyCount}</span>
                          <span className="text-[16px] text-muted font-semibold"> / {overviewTrackersSummary.cooldownCount}</span>
                        </span>
                        <span className="text-[11px] font-medium text-muted">Ready / Cooldown</span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-muted">
                        Across 6 Chrome profiles · 36 total
                      </p>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-[#f0f2eb]">
                      <button
                        onClick={handleCopyNextReadyOverview}
                        disabled={overviewTrackersSummary.readyCount === 0}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-forest/30 bg-[#ecfdf5] px-2.5 py-1.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-white disabled:opacity-50 transition cursor-pointer"
                      >
                        {copiedOverviewEmail ? (
                          <>
                            <Check size={12} className="text-white" />
                            <span>Copied {copiedOverviewEmail}!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Next Ready</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. EB Electricity Meter */}
                  <div
                    onClick={() => handleOpenTrackersTab("eb")}
                    className="cursor-pointer rounded-xl border border-line/80 bg-linear-to-b from-[#fbfcf9] to-white p-4 flex flex-col justify-between hover:border-forest/30 transition group"
                    title="Open PG Electricity (EB) Tracker"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">PG Electricity Meter</span>
                        <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#fffbeb] text-[#b45309]">
                          <Zap size={13} />
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-1.5">
                        <span className="text-[24px] font-bold text-ink tracking-tight">
                          {overviewTrackersSummary.latestReading}
                        </span>
                        <span className="text-[12px] font-semibold text-muted">units</span>
                        <span className="ml-auto rounded-full bg-[#f1f3ed] px-2 py-0.5 text-[10px] font-bold text-[#475248]">
                          ~{overviewTrackersSummary.burnRate} u/day
                        </span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-muted">
                        Daily burn velocity over active Nov readings
                      </p>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-[#f0f2eb] flex items-center justify-between text-[10.5px]">
                      <span className="text-muted">Est. 30d: <strong className="text-ink font-semibold">₹{overviewTrackersSummary.projectedTotal}</strong></span>
                      <span className="font-bold text-forest bg-[#ecfdf5] border border-[#a7f3d0] rounded-md px-1.5 py-0.5">
                        My Share: ₹{overviewTrackersSummary.projectedShare}
                      </span>
                    </div>
                  </div>

                  {/* 3. Monthly Budget Burn-Down */}
                  <div
                    onClick={() => handleOpenTrackersTab("expenses")}
                    className="cursor-pointer rounded-xl border border-line/80 bg-linear-to-b from-[#fbfcf9] to-white p-4 flex flex-col justify-between hover:border-forest/30 transition group"
                    title="Open Expense & Budget Ledger"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">Monthly Budget</span>
                        <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#ecfdf5] text-[#059669]">
                          <Wallet size={13} />
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-1.5">
                        <span className="text-[22px] font-bold text-ink tracking-tight">
                          ₹{overviewTrackersSummary.spent.toLocaleString()}
                        </span>
                        <span className="text-[12px] font-normal text-muted">
                          / ₹{overviewTrackersSummary.budget.toLocaleString()}
                        </span>
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            overviewTrackersSummary.spentPct > 90
                              ? "bg-[#fef2f2] text-[#b91c1c]"
                              : overviewTrackersSummary.spentPct > 70
                              ? "bg-[#fffbeb] text-[#b45309]"
                              : "bg-[#ecfdf5] text-[#047857]"
                          }`}
                        >
                          {overviewTrackersSummary.spentPct}%
                        </span>
                      </div>

                      {/* Mini Burn-Down Progress Bar */}
                      <div className="mt-2.5 h-2 w-full bg-[#f0f2eb] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            overviewTrackersSummary.spentPct > 90
                              ? "bg-[#ef4444]"
                              : overviewTrackersSummary.spentPct > 70
                              ? "bg-[#f59e0b]"
                              : "bg-[#10b981]"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, overviewTrackersSummary.spentPct))}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#f0f2eb] flex items-center justify-between text-[10.5px]">
                      <span className="text-muted">Remaining limit:</span>
                      <span className="font-bold text-ink">₹{overviewTrackersSummary.remaining.toLocaleString()} left</span>
                    </div>
                  </div>

                  {/* 4. Active Career Pipelines */}
                  <div
                    onClick={() => handleOpenTrackersTab("placements")}
                    className="cursor-pointer rounded-xl border border-line/80 bg-linear-to-b from-[#fbfcf9] to-white p-4 flex flex-col justify-between hover:border-forest/30 transition group"
                    title="Open Placement & Career Tracker"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">Career Pipelines</span>
                        <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                          <Briefcase size={13} />
                        </div>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-1 rounded-lg bg-[#eff6ff]/70 border border-[#bfdbfe]/60 px-2 py-1 text-[11px]">
                          <span className="font-bold text-[#1e40af] truncate">Digiryte</span>
                          <span className="shrink-0 text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-white text-[#1d4ed8]">
                            Round 3 Challenge
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0]/60 px-2 py-1 text-[11px]">
                          <span className="font-bold text-[#166534] truncate">Josh Talks</span>
                          <span className="shrink-0 text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-white text-[#15803d]">
                            Dataset Task
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#f0f2eb] flex items-center justify-between text-[10.5px] text-muted">
                      <span>{overviewTrackersSummary.activeAppsCount} active in pipeline</span>
                      <span className="font-semibold text-forest group-hover:underline">
                        View Pipeline →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Micro-Habits & Streak Tracker ─── */}
              <div className="mt-6">
                <HabitTracker
                  habits={habits}
                  onToggleHabit={toggleHabit}
                  onAddHabit={addHabit}
                  onUpdateHabit={updateHabit}
                  onDeleteHabit={deleteHabit}
                />
              </div>

              {/* ─── Schedule + Tasks row ─── */}
              <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.12fr_.88fr]">
                {/* Today's schedule */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={CalendarDays}
                    title="Today's schedule"
                    sub="A quick look at what's ahead"
                    right={
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setViewingEvent(null); setShowEventModal(true); }} className="rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition">
                          <Plus size={11} className="mr-0.5 inline" /> Add
                        </button>
                        <button onClick={() => handleSelectNav("Calendar")} className="text-[10px] font-semibold text-[#648170] hover:text-forest transition">Calendar view <ArrowRight size={12} className="ml-1 inline" /></button>
                      </div>
                    }
                  />
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#faf6ed] px-3 py-2.5 text-[10px] text-[#90744a]">
                    <Sparkles size={13} />
                    <span><strong>{isConnected ? "Your calendar:" : "Sample data:"}</strong> {isConnected ? "Events for today and the coming week are synced from Google Calendar." : "Connect Google to see your real schedule and events."}</span>
                  </div>
                  <div className="space-y-0">
                    {displaySchedule.length ? displaySchedule.map((item, idx) => (
                      <div
                        key={item.time + item.name + idx}
                        className="relative flex gap-4 pb-5 last:pb-0 cursor-pointer group"
                        onClick={() => {
                          const matchedEvent = allEvents.find(e => e.summary === item.name) || { id: "s-" + idx, summary: item.name, description: item.detail, tag: item.tag, color: item.color };
                          setViewingEvent(matchedEvent);
                          setShowEventModal(true);
                        }}
                      >
                        <div className="w-[46px] shrink-0 pt-0.5 text-right text-[10px] font-medium tabular-nums text-[#89948b]">{item.time}</div>
                        <div className="relative flex-1 border-l border-[#edf0e9] pl-4 group-hover:border-forest/30 transition">
                          <span className="absolute -left-[4px] top-[4px] h-[7px] w-[7px] rounded-full border-2 border-white transition-transform group-hover:scale-150" style={{ background: item.color }} />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-[12px] font-semibold group-hover:text-forest transition">{item.name}</h3>
                              <p className="mt-1 text-[10px] text-muted">{item.detail}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="hidden text-[10px] text-[#a0aaa1] sm:inline">{item.time}–{item.end}</span>
                              {item.tag && (
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wide flex items-center gap-1 ${
                                    item.tag === "BANANA"
                                      ? "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]"
                                      : item.tag === "TRAVEL"
                                      ? "bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]"
                                      : item.tag === "PROJECT"
                                      ? "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]"
                                      : item.tag === "MEETING"
                                      ? "bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]"
                                      : item.tag === "PERSONAL"
                                      ? "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                                      : item.tag === "OUTLOOK"
                                      ? "bg-[#ebf3fc] text-[#0078d4] border border-[#c7e0f4]"
                                      : "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]"
                                  }`}
                                >
                                  {item.tag === "BANANA" && <span>🟡</span>}
                                  {item.tag === "TRAVEL" && <Plane size={9} />}
                                  {item.tag}
                                </span>
                              )}
                              {item.meetUrl ? (
                                <a
                                  href={item.meetUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#fdf2f2] px-2 py-1 text-[10px] font-bold text-forest hover:bg-[#8b1116] hover:text-white transition cursor-pointer"
                                >
                                  <Video size={10} />
                                  <span>Join Meeting</span>
                                </a>
                              ) : item.location ? (
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted max-w-[120px] truncate">
                                  <MapPin size={9} className="shrink-0 text-amber-600" />
                                  <span className="truncate">{item.location}</span>
                                </span>
                              ) : (
                                <span className="hidden sm:inline-flex items-center rounded-md bg-[#f1f3ed] px-1.5 py-0.5 text-[9px] font-medium text-muted">
                                  In-person
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : <p className="py-5 text-center text-[11px] text-muted">No more events on your calendar today.</p>}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[10px] text-muted">
                    <span>{isConnected ? todayEvents.length + " events today · From Google Calendar" : displaySchedule.length + " sample events · Connect Google for real data"}</span>
                    <button onClick={() => handleSelectNav("Calendar")} className="font-semibold text-[#648170] hover:text-forest">Full 7-day view <ArrowDownRight size={12} className="ml-1 inline" /></button>
                  </div>
                </section>

                {/* Priorities / Tasks */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={ListTodo}
                    title="Your priorities"
                    sub={done + " of " + tasks.length + " complete · Keep it manageable"}
                    right={
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowTaskModal(true)} aria-label="Add task" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e] hover:bg-[#fdf2f2] hover:text-forest transition">
                          <Plus size={14} />
                        </button>
                      </div>
                    }
                  />
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#f0f2ed]">
                    <div className="h-full rounded-full bg-forest transition-all duration-500 ease-out" style={{ width: (tasks.length > 0 ? done / tasks.length * 100 : 0) + "%" }} />
                  </div>
                  {tasks.length === 0 ? (
                    <div className="py-8 text-center">
                      <ListTodo size={28} className="mx-auto text-muted/40 mb-2" />
                      <p className="text-[12px] font-semibold text-ink">No priorities planned for today</p>
                      <p className="mt-1 text-[10px] text-muted">Click below to add a focus task or daily goal.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sortedOverviewTasks.map(task => {
                        const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
                        const completedSubCount = task.subtasks?.filter(s => s.completed).length || 0;
                        const totalSubCount = task.subtasks?.length || 0;
                        const isExpanded = expandedOverviewTasks[task.id];

                        return (
                          <div key={task.id} className="rounded-xl transition hover:bg-[#f8f9f5]">
                            <div className="group flex w-full items-start gap-3 px-2.5 py-3 text-left">
                              <button
                                onClick={() => toggleTask(task.id)}
                                className={"mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border transition-all duration-200 " + (task.checked ? "border-forest bg-forest text-white scale-110" : "border-[#d6ddd4] text-transparent group-hover:border-forest/50")}
                              >
                                {task.checked ? <Check size={11} /> : <Circle size={10} />}
                              </button>
                              <span className="min-w-0 flex-1">
                                <span className={"block text-[11px] font-medium transition-all duration-200 " + (task.checked ? "text-[#9aa49b] line-through" : "text-[#314239]")}>{task.title}</span>
                                <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#98a198]">
                                  {task.meta}
                                  {task.category && (
                                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold ${
                                      task.category === "urgent" ? "bg-[#fce8e6] text-[#c05746]" :
                                      task.category === "project" ? "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]" :
                                      task.category === "travel" ? "bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]" :
                                      task.category === "meeting" ? "bg-[#edf0ff] text-[#6d76b1]" :
                                      task.category === "personal" ? "bg-[#eaf3e9] text-[#648266]" :
                                      "bg-[#f1f2ee] text-[#808a81]"
                                    }`}>
                                      {task.category === "travel" && <Plane size={8} />}
                                      {task.category.toUpperCase()}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold ${
                                      task.dueDate < new Intl.DateTimeFormat("en-CA").format(new Date()) && !task.checked
                                        ? "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
                                        : task.dueDate === new Intl.DateTimeFormat("en-CA").format(new Date())
                                        ? "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                                        : "bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]"
                                    }`}>
                                      <Clock3 size={8} />
                                      {task.dueDate < new Intl.DateTimeFormat("en-CA").format(new Date()) && !task.checked
                                        ? "OVERDUE"
                                        : task.dueDate === new Intl.DateTimeFormat("en-CA").format(new Date())
                                        ? "DUE TODAY"
                                        : task.dueDate}
                                    </span>
                                  )}
                                  {hasSubtasks && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedOverviewTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                                      className="inline-flex items-center gap-1 rounded bg-[#f1f3ed] px-1.5 py-0.5 text-[8px] font-semibold text-[#5c6960] hover:bg-[#e2e6df] transition"
                                    >
                                      <CheckSquare size={9} />
                                      {completedSubCount}/{totalSubCount} sub-steps
                                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                    </button>
                                  )}
                                </span>
                              </span>
                              {task.priority && !task.checked ? <span className="mt-0.5 rounded-md bg-[#fcf0e7] px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#b4794e]">FIRST</span> : null}
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="mt-0.5 rounded p-1 text-transparent transition group-hover:text-[#c4a88a] hover:!text-[#c05746] hover:bg-[#fce8e6]"
                                aria-label={"Delete " + task.title}
                              >
                                <X size={12} />
                              </button>
                            </div>

                            {/* Expanded sub-steps checklist */}
                            {hasSubtasks && isExpanded && (
                              <div className="bg-[#f5f7f2] rounded-lg mx-2.5 mb-2 px-3 py-2 space-y-1.5 border border-[#ebeee6]">
                                {task.subtasks!.map(st => (
                                  <div
                                    key={st.id}
                                    onClick={() => toggleSubTask(task.id, st.id)}
                                    className="flex items-center gap-2 py-0.5 text-[10px] cursor-pointer group/st"
                                  >
                                    <span
                                      className={`grid h-3 w-3 place-items-center rounded-sm border transition ${
                                        st.completed
                                          ? "border-forest bg-forest text-white"
                                          : "border-[#cfd6cd] bg-white group-hover/st:border-forest"
                                      }`}
                                    >
                                      {st.completed && <Check size={8} />}
                                    </span>
                                    <span className={st.completed ? "text-muted line-through" : "text-[#404e45]"}>
                                      {st.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setShowTaskModal(true)} className="flex-1 rounded-xl border border-dashed border-[#dfe5dc] py-2.5 text-[10px] font-semibold text-[#79887b] hover:bg-[#fafbf8] hover:border-forest/30 transition">
                      <Plus size={12} className="mr-1 inline" /> Add a personal task
                    </button>
                    <button onClick={() => handleSelectNav("Tasks")} className="rounded-xl border border-line bg-white px-3 py-2.5 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition">
                      Manage all →
                    </button>
                  </div>
                </section>
              </div>

              {/* ─── Week + Inbox row ─── */}
              <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.12fr_.88fr]">
                {/* Week ahead */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 overflow-hidden">
                  <SectionHeading
                    icon={CalendarDays}
                    title="The week ahead"
                    sub="Today + the next 6 days"
                    right={<button onClick={() => handleSelectNav("Calendar")} className="rounded-lg bg-[#f4f5f0] px-2.5 py-1.5 text-[10px] text-[#77837a] hover:bg-[#eef2ea] transition">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())} – {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(rangeEnd)} <ChevronDown size={12} className="ml-1 inline" /></button>}
                  />
                  <div id="week" className="overflow-x-auto pb-1">
                    <div className="grid grid-cols-7 gap-1.5 min-w-[340px] sm:min-w-0">
                      {weekDays.map((day, index) => (
                        <div
                          key={day.day + day.date}
                          onClick={() => handleSelectNav("Calendar")}
                          className={"min-h-[112px] rounded-xl p-2 cursor-pointer transition-colors " + (index === 0 ? "bg-[#f4f7ef] ring-1 ring-forest/10" : "bg-[#fafbf8] hover:bg-[#f4f7ef]")}
                        >
                          <p className={"text-center text-[8px] font-bold tracking-wide " + (index === 0 ? "text-forest" : "text-[#9da79e]")}>{day.day}</p>
                          <p className={"mx-auto mt-1 grid h-6 w-6 place-items-center rounded-full text-[10px] " + (index === 0 ? "bg-forest font-semibold text-white" : "text-[#68766c]")}>{day.date}</p>
                          <div className="mt-2 space-y-1">
                            {day.items.map((item, itemIdx) => (
                              <div
                                key={item.id ? `${item.id}-${itemIdx}` : `${item.title}-${item.time}-${itemIdx}`}
                                className={"truncate rounded px-1 py-1 text-[8px] font-medium leading-tight hover:opacity-80 transition " + hueClasses[item.hue]}
                              >
                                <span className="hidden 2xl:inline">{item.time} </span>{item.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#9aa49b]">
                    <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#9aa7e5]" />Work</span>
                    <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#dca779]" />Deadline</span>
                    <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#85b08c]" />Personal</span>
                  </div>
                </section>

                {/* Inbox / Mail */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={Mail}
                    title="Worth a look"
                    sub={
                      isConnected
                        ? outlookData.connected && liveData?.connected
                          ? "Unread messages from Gmail & Outlook"
                          : outlookData.connected
                          ? "Unread messages from Outlook"
                          : "Unread messages from Gmail"
                        : "Sample messages · connect to load your inbox"
                    }
                    right={
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleSelectNav("Inbox")} className="rounded-full bg-[#f7eee4] px-2.5 py-1 text-[9px] font-bold text-[#a2764b] hover:bg-[#ebdcc9] transition">
                          {mailItems.filter(m => !m.read).length} UNREAD →
                        </button>
                      </div>
                    }
                  />
                  <div className="divide-y divide-[#eff1ec]">
                    {mailItems.length ? mailItems.slice(0, 3).map((mail, index) => (
                      <div
                        key={mail.id || (mail.subject + index)}
                        className="flex gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer rounded-lg transition hover:bg-[#f8f9f5] px-1 -mx-1"
                        onClick={() => setViewingMail(mail)}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold text-[#4d5b52] bg-[#f0c6ae]">
                          {mail.from.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[10px] font-semibold text-[#33433a]">{mail.from}</p>
                            <span className="shrink-0 text-[9px] text-[#a1aaa2]">{mail.date}</span>
                          </div>
                          <p className="mt-1 truncate text-[10px] font-medium text-ink">{mail.subject}</p>
                          <p className="mt-1 line-clamp-1 text-[9px] text-[#8b968d]">{mail.snippet}</p>
                          <span className="mt-2 inline-block rounded bg-[#fbf0e5] px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#a7764b]">{mail.category?.toUpperCase() || "INBOX"}</span>
                        </div>
                        <a href={mail.href ?? appConfig.links.mail} target="_blank" rel="noreferrer" aria-label={"Open in Gmail"} className="mt-1 text-[#a0aaa1] hover:text-forest transition" onClick={e => e.stopPropagation()}>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )) : <p className="py-5 text-center text-[11px] text-muted">No unread messages in the selected inbox categories.</p>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#eff1ec] pt-3">
                    <p className="text-[9px] leading-relaxed text-[#9aa49b]">Only sender, subject, date, and short snippet are shown.</p>
                    <button onClick={() => handleSelectNav("Inbox")} className="text-[10px] font-semibold text-forest hover:underline">View all inbox →</button>
                  </div>
                </section>
              </div>

              {/* ─── Focus + Quick links row ─── */}
              <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Focus plan */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={Clock3}
                    title="Make room for focus"
                    sub="A gentle shape for the rest of your day"
                    right={<button onClick={() => setShowFocusTimer(true)} aria-label="Start focus timer" className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition"><Focus size={12} className="mr-1 inline" /> Timer</button>}
                  />
                  <div className="space-y-2">
                    <button onClick={() => setShowFocusTimer(true)} className="flex w-full items-center gap-3 rounded-xl bg-[#f4f7ef] px-3 py-3 text-left hover:bg-[#fdf2f2] transition group">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#7d9b68] group-hover:text-forest transition"><Focus size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold">Focused work session</p>
                        <p className="mt-0.5 text-[9px] text-muted">Intentional work · {focusMinutes} minutes planned</p>
                      </div>
                      <span className="text-[9px] font-medium text-[#82917f]">Start →</span>
                    </button>
                    <div className="flex items-center gap-3 rounded-xl bg-[#fafbf8] px-3 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#a18b64]"><Timer size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold">Take a breather</p>
                        <p className="mt-0.5 text-[9px] text-muted">A real lunch or walk, away from your screen</p>
                      </div>
                      <span className="text-[9px] font-medium text-[#929d92]">1:00 PM</span>
                    </div>
                  </div>
                  <button onClick={() => setShowFocusTimer(true)} className="mt-3 text-[10px] font-semibold text-[#648170] hover:text-forest transition">
                    Adjust your plan & timer <ArrowRight size={12} className="ml-1 inline" />
                  </button>
                </section>

                {/* Quick links */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={Link2}
                    title="Quick links"
                    sub="Your frequently used places"
                    right={<button onClick={() => setShowQuickLinkModal(true)} aria-label="Add link" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e] hover:bg-[#fdf2f2] hover:text-forest transition"><Plus size={14} /></button>}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quickLinks.map((link, index) => {
                      const IconComponent = linkIcons[link.iconName] || Link2;
                      const key = `${link.id}-${index}`;
                      if (!link.available) {
                        return (
                          <div key={key} className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#e5e9e2] p-3 opacity-70">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f1f2ee] text-[#969f96]"><IconComponent size={14} /></span>
                            <span>
                              <span className="block text-[10px] font-semibold">{link.title}</span>
                              <span className="mt-0.5 block text-[9px] text-[#98a198]">{link.subtitle}</span>
                            </span>
                          </div>
                        );
                      }
                      return (
                        <a key={key} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-[#edf0e9] p-3 hover:bg-[#fafbf8] hover:border-forest/20 transition group">
                          <span className={`grid h-7 w-7 place-items-center rounded-lg shadow-sm ${
                            link.iconName === "calendar" ? "bg-[#edf3ff] text-[#6088d1]" :
                            link.iconName === "mail" ? "bg-[#fbefeb] text-[#d16b5b]" :
                            link.iconName === "outlook" ? "bg-[#ebf3fc] text-[#0078d4]" :
                            link.iconName === "github" ? "bg-[#f0f1f3] text-[#24292f]" :
                            (link.iconName === "portfolio" || link.iconName === "globe") ? "bg-[#fef7ee] text-[#d97706]" :
                            "bg-[#fdf2f2] text-forest"
                          }`}><IconComponent size={14} /></span>
                          <span className="min-w-0">
                            <span className="block truncate text-[10px] font-semibold">{link.title}</span>
                            <span className="mt-0.5 block text-[9px] text-[#98a198]">{link.subtitle}</span>
                          </span>
                          <ExternalLink className="ml-auto shrink-0 text-[#b0b8b0] group-hover:text-forest transition" size={11} />
                        </a>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* ─── Drive files + Quick Scratchpad row ─── */}
              <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
                <GoogleDriveFilesCard googleConnected={Boolean(liveData?.connected)} />
                <QuickScratchpadCard
                  onSaveAsNote={(note) => {
                    addNote(note);
                    toast("Scratchpad saved to Notes!");
                  }}
                  onAddTask={(task) => {
                    addTask(task);
                    toast("Added as Task!");
                  }}
                  onNavigateToNotes={() => handleSelectNav("Notes")}
                />
              </div>
            </>
          )}

          {/* Footer */}
          <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line pt-5 text-[9px] text-[#9ca69d] sm:flex-row">
            <span>{appConfig.name.toLowerCase()} · {appConfig.tagline}</span>
            <span className="flex items-center gap-2"><span>Private by design</span><span>·</span><span>Zero-Knowledge Notes</span></span>
          </footer>
        </div>
      </main>

      {/* ─── Modals & overlays ─── */}
      <QuickCaptureModal
        isOpen={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
        onAddTask={(task) => {
          addTask(task);
          toast("Task captured!");
        }}
        onAddNote={(note) => {
          addNote(note);
          toast("Note captured!");
        }}
        onAppendScratchpad={(text) => {
          const current =
            typeof window !== "undefined"
              ? localStorage.getItem("routino_scratchpad") || ""
              : "";
          const updated = current ? `${current}\n${text}` : text;
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("routino_scratchpad", updated);
            } catch {}
          }
          toast("Appended to scratchpad!");
        }}
      />
      <DailyDeskSheetModal
        isOpen={showDeskSheet}
        onClose={() => setShowDeskSheet(false)}
        tasks={tasks}
        events={allEvents}
        habits={habits}
        scratchpadText={
          typeof window !== "undefined"
            ? localStorage.getItem("routino_scratchpad") || ""
            : ""
        }
      />
      <DailyRoutineModal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        tasks={tasks}
        habits={habits}
        onToggleHabit={toggleHabit}
        onAddTask={addTask}
        onSaveReflectionNote={(content) => {
          addNote({
            title: "Evening Reflection",
            content,
            color: "peach",
          });
          toast("Reflection saved to your Notes!");
        }}
      />
      <FocusTimerModal
        isOpen={showFocusTimer}
        onClose={() => setShowFocusTimer(false)}
        onSessionComplete={handleFocusComplete}
      />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onAddTask={addTask}
      />
      <EventModal
        isOpen={showEventModal}
        onClose={() => { setShowEventModal(false); setViewingEvent(null); }}
        eventToView={viewingEvent}
        onAddEvent={addEvent}
      />
      <MailDrawer
        isOpen={!!viewingMail}
        onClose={() => setViewingMail(null)}
        mail={viewingMail}
        onToggleStar={toggleMailStar}
        onToggleRead={toggleMailRead}
      />
      <QuickLinkModal
        isOpen={showQuickLinkModal}
        onClose={() => setShowQuickLinkModal(false)}
        onAddLink={addQuickLink}
      />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleSelectNav}
        onOpenTrackerTab={handleOpenTrackersTab}
        onOpenFocusTimer={() => setShowFocusTimer(true)}
        onOpenAddTask={() => setShowTaskModal(true)}
        onOpenAddEvent={() => setShowEventModal(true)}
        onOpenHabits={() => setShowHabitsModal(true)}
        onOpenDailyRoutine={() => setShowRoutineModal(true)}
        onOpenPreferences={() => setShowPreferences(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        tasks={tasks}
        events={allEvents}
      />
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <GoogleSetupModal isOpen={showGoogleSetup} onClose={() => setShowGoogleSetup(false)} />
      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        focusMinutes={focusMinutes}
        onUpdateFocusMinutes={handleUpdateFocusMinutes}
        tasks={tasks}
        customEvents={customEvents}
        quickLinks={quickLinks}
        habits={habits}
        notes={notes}
        onImportData={handleImportData}
        onClearCompletedTasks={handleClearCompletedTasks}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        userEmail={liveData?.user?.email || null}
        onSyncDatabase={handleManualSync}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        dbSource={dbSource}
        onOutlookChange={fetchOutlookData}
      />
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <HabitsManagerModal
        isOpen={showHabitsModal}
        onClose={() => setShowHabitsModal(false)}
        habits={habits}
        onToggleHabit={toggleHabit}
        onEditHabit={(h) => {
          setShowHabitsModal(false);
          setEditingHabitInModal(h);
          setShowIndividualHabitModal(true);
        }}
        onAddNewHabit={() => {
          setShowHabitsModal(false);
          setEditingHabitInModal(null);
          setShowIndividualHabitModal(true);
        }}
        onDeleteHabit={deleteHabit}
      />
      <HabitModal
        isOpen={showIndividualHabitModal}
        onClose={() => {
          setShowIndividualHabitModal(false);
          setEditingHabitInModal(null);
        }}
        habit={editingHabitInModal}
        onSaveHabit={(data) => {
          if (data.id) {
            updateHabit(data.id, {
              name: data.name,
              icon: data.icon,
              streak: data.streak,
            });
          } else {
            addHabit(data.name, data.icon);
          }
          setShowIndividualHabitModal(false);
          setEditingHabitInModal(null);
        }}
        onDeleteHabit={deleteHabit}
      />
    </div>
  );
}
