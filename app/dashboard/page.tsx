"use client";

import { RecycleBin } from "@/components/RecycleBin";
import { inboxCountLabel } from "@/lib/inboxCount";
import { useBackupWarnings } from "@/hooks/useBackupWarnings";
import { undoRecords } from "@/lib/undoRecords";
import { airtelRecharges } from "@/lib/airtelRecharges";
import { withTaskActivity } from "@/lib/taskActivity";
import { BrowserReminders } from "@/components/BrowserReminders";
import { workspaceNotifications } from "@/lib/workspaceNotifications";
import { snoozeTask } from "@/lib/taskSnooze";
import { mergeTaskRecords } from "@/lib/taskMerge";
import { queueWorkspacePatch } from "@/lib/workspacePatch";
import { completeRepeatingTask, editTaskOccurrences, skipTaskOccurrence, setSeriesPaused } from "@/lib/taskRecurrence";
import { isSubscriptionList } from "@/lib/subscriptionValidation";
import { ExpiryReminders } from "@/components/ExpiryReminders";
import { useTrackerWorkspace } from "@/hooks/useTrackerWorkspace";
import { isAirtelData } from "@/lib/airtelValidation";
import type { AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, ChevronUp, CheckCircle2, CheckSquare, Circle, Clock3, ExternalLink, FileText, Focus, FolderOpen, Github, Globe,
  Inbox, Keyboard, Lightbulb, Link2, ListTodo, Mail, MapPin, Menu, MoreHorizontal, Plane, Plus, Printer, Search, Shuffle, Sparkles,
  StickyNote, Target, Timer, Trash2, TriangleAlert, Video, X, PieChart, Gauge,
  Key, Zap, Wallet, Briefcase, Copy, ShieldCheck, HardDrive, RefreshCw,
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
import { QuickLinkManager } from "@/components/QuickLinkManager";
import { MeetingFollowUps } from "@/components/MeetingFollowUps";
import { SyncCenter } from "@/components/SyncCenter";
import { hasMeetingAction, meetingActionKey } from "@/lib/meetingActions";
import { ReadLaterPanel } from "@/components/ReadLaterPanel";
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
import { MorningDigestModal } from "@/components/MorningDigestModal";
import { classifyEmail } from "@/lib/email-classifier";
import { renderLinkedText } from "@/lib/text-links";
import { findTaskForEmail } from "@/lib/email-task";
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
import { SEED_TRACKERS_DATA } from "@/lib/trackersSeed";
import { playTick } from "@/lib/sound";
import { appConfig } from "@/lib/config";
import { DAILY_INTENTIONS, getTodayIntentionIndex } from "@/lib/quotes";
import { GOOGLE_EVENT_COLORS, getMeetingUrl, inferEventCategory, inferTaskCategory } from "@/lib/meeting";

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
  { icon: Trash2, label: "Recycle Bin" },
];

const TAB_TO_PARAM: Record<string, string> = {
  Overview: "overview",
  Calendar: "calendar",
  "Time Audit": "time-audit",
  Trackers: "trackers",
  Inbox: "inbox",
  Tasks: "tasks",
  Notes: "notes",
  "Recycle Bin": "recycle-bin",
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
  "recycle-bin": "Recycle Bin",
};

const TRACKER_SHORTCUTS: Record<string, TrackersTabKey> = {
  airtel: "airtel",
  recharges: "airtel",
  subscriptions: "subscriptions",
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
  { time: "14:30", end: "15:00", name: "Team catch-up", detail: "Example agenda · Google Meet", tag: "", color: "#5fa77d" },
];

const sampleMail: DashboardMail[] = [
  {
    id: "sample-1",
    from: "Example Sender",
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
    title: "Review Q4 product roadmap proposal",
    meta: "Before project review · 11:00 AM",
    checked: false,
    priority: true,
    category: "project",
    dueDate: "2026-11-16T11:00",
    createdAt: 1,
    subtasks: [
      { id: "st-1", title: "Outline key engineering milestones", completed: true },
      { id: "st-2", title: "Verify quarterly projection table", completed: false },
      { id: "st-3", title: "Format executive summary for stakeholders", completed: false },
    ],
  },
  {
    id: "t-2",
    title: "Review project scope and timeline",
    meta: "Today · Email follow-up",
    checked: false,
    priority: false,
    category: "work",
    dueDate: "2026-11-16T16:00",
    createdAt: 2,
    subtasks: [
      { id: "st-reply-1", title: "Review feedback comments on document draft", completed: false },
      { id: "st-reply-2", title: "Send revised scope timeline to team", completed: false },
    ],
  },
  {
    id: "t-3",
    title: "Send workspace invoice to finance",
    meta: "Due Friday · Finance verification",
    checked: false,
    priority: false,
    category: "urgent",
    createdAt: 3,
  },
  {
    id: "t-4",
    title: "Block focus time for architecture design",
    meta: "Suggested · 90 min deep work session",
    checked: true,
    priority: false,
    category: "personal",
    createdAt: 4,
  },
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
  { id: "ql-3", title: "Google Drive", subtitle: "Recent files & storage", url: appConfig.links.drive, iconName: "drive", available: true },
  { id: "ql-4", title: "Google Keep", subtitle: "Notes & lists", url: appConfig.links.keep, iconName: "keep", available: true },
  { id: "ql-5", title: "Outlook", subtitle: "Mail & calendar", url: "https://outlook.cloud.microsoft/mail/", iconName: "outlook", available: true },
  { id: "ql-6", title: "GitHub", subtitle: "Developer profile", url: appConfig.links.github, iconName: "github", available: true },
  { id: "ql-7", title: "Portfolio", subtitle: "Personal website", url: appConfig.links.portfolio, iconName: "globe", available: true },
];

const seedNotifications: NotificationItem[] = [
  { id: "n-1", title: "Weekly team sync starts in 30 min", time: "9:00 AM", type: "calendar", read: false, navTarget: "Calendar" },
  { id: "n-2", title: "A sample sender replied to your thread", time: "8:42 AM", type: "mail", read: false, navTarget: "Inbox" },
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
  drive: FolderOpen,
  keep: Lightbulb,
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

let globalToastSeq = 0;

/* ─── Main component ─────────────────────────────────────────── */

export default function Home() {
  /* ── Core state ── */
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [searchNote, setSearchNote] = useState<{ id: string } | null>(null);
  const [notes, setNotes] = useState<KeepNote[]>(seedNotes);
  const [activeNav, setActiveNav] = useState("Overview");
  const [notice, setNotice] = useState(true);
  const [liveData, setLiveData] = useState<DashboardData | null>(null);
  const [verifiedWorkspaceAccount, setVerifiedWorkspaceAccount] = useState<string | null>(null);
  const trackerWorkspace = useTrackerWorkspace(liveData?.connected ? liveData.user?.email : null);
  const subscriptions = trackerWorkspace.subscriptions;
  const currentAccount = useRef<string | null>(null);
  currentAccount.current = verifiedWorkspaceAccount || (liveData?.connected ? liveData.user?.email?.toLowerCase() || null : null);
  const [customEvents, setCustomEvents] = useState<DashboardEvent[]>([]);
  const customEventsRef = useRef(customEvents);
  customEventsRef.current = customEvents;
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(seedLinks);
  const backupAlerts = useBackupWarnings(liveData?.connected ? liveData.user?.email : null);
  const backupAlertKey = JSON.stringify(backupAlerts);
  const [notificationDay, setNotificationDay] = useState(() => new Intl.DateTimeFormat("en-CA").format(new Date()));
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);
  const [mailItems, setMailItems] = useState<DashboardMail[]>(sampleMail);
  const [googleMail, setGoogleMail] = useState<DashboardMail[]>([]);
  const [outlookData, setOutlookData] = useState<{
    connected: boolean;
    profile?: { email: string; name?: string };
    recentUnreadCount?: number | null;
    events: DashboardEvent[];
    unread: DashboardMail[];
    syncStatus?: {
      calendar: "checked" | "failed";
      mail: "checked" | "failed";
      overall: "checked" | "failed" | "partial";
    };
  }>({ connected: false, events: [], unread: [] });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(appConfig.defaults.focusMinutes);
  const [hydrated, setHydrated] = useState(false);
  const [gmailNextPageToken, setGmailNextPageToken] = useState<string | null>(null);
  const [gmailExhausted, setGmailExhausted] = useState(false);
  const [outlookNextLink, setOutlookNextLink] = useState<string | null>(null);
  const [outlookExhausted, setOutlookExhausted] = useState(false);
  const [isLoadingMoreMail, setIsLoadingMoreMail] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  /* ── Modal / popover state ── */
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQuickLinkModal, setShowQuickLinkModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferencesDataToken, setPreferencesDataToken] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const coreSyncVersion = useRef(0);
  const coreSaveChain = useRef<Promise<boolean>>(Promise.resolve(true));
  const [workspaceSaveError, setWorkspaceSaveError] = useState(false);
  const [workspaceSyncReady, setWorkspaceSyncReady] = useState(false);
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
  const [overviewTasksTab, setOverviewTasksTab] = useState<"active" | "completed">("active");
  const [showMorningDigest, setShowMorningDigest] = useState(false);
  const [taskModalInitialData, setTaskModalInitialData] = useState<Partial<Omit<Task, "id" | "checked" | "createdAt">> | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  /* ── Trackers Snapshot state ── */
  const [trackersData, setTrackersData] = useState<TrackersData>(SEED_TRACKERS_DATA);
  const [copiedOverviewEmail, setCopiedOverviewEmail] = useState<string | null>(null);
  const [trackersTab, setTrackersTab] = useState<TrackersTabKey>("eb");
  const [trackersTabKey, setTrackersTabKey] = useState<number>(0);

  const fetchTrackersData = useCallback(async () => {
    if (!liveData?.connected) {
      setTrackersData(SEED_TRACKERS_DATA);
      return;
    }
    try {
      const res = await fetch("/api/trackers/sync", { cache: "no-store" });
      const json = await res.json();
      if (json?.success && json?.data) {
        setTrackersData(json.data);
      }
    } catch {
      // Keep seeded fallback
    }
  }, [liveData?.connected]);

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
    const latestReading = latestEbReadingItem ? latestEbReadingItem.meterReading : (trackersData.ebMeta?.latestReading ?? 0);
    const rate = trackersData.ebMeta?.currentRate ?? 0;
    const runningCycle = trackersData.ebCycles?.find((c) => c.status === "Running" || c.cycle.toLowerCase() === "nov") || trackersData.ebCycles?.[trackersData.ebCycles.length - 1];
    const unitsUsed = runningCycle?.unitsUsed ?? 0;
    const people = runningCycle?.peopleSharing || 2;
    const daysElapsed = Math.max(1, new Date().getDate());
    const burnRate = Number((unitsUsed / daysElapsed).toFixed(2));
    const projectedUnits = Math.max(unitsUsed, Math.round(burnRate * 30));
    const projectedTotal = projectedUnits * rate;
    const projectedShare = Math.round(projectedTotal / people);

    // 3. Monthly Budget
    const budget = trackersData.totalMonthlyBudget ?? 0;
    const spent = trackersData.journals?.["2026"]?.totalSpent ?? trackersData.expenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) ?? 0;
    const spentPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    const remaining = Math.max(0, budget - spent);

    // 4. Career Pipelines
    const activeApps = (trackersData.jobApplications || []).filter(
      (j) => !j.status.toLowerCase().includes("reject") && !j.status.toLowerCase().includes("not attend")
    );
    const featuredApplications = activeApps.slice(0, 2);

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
      featuredApplications,
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
  const done = tasks.filter(t => t.checked && !t.skipped).length;
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  /* ── LocalStorage Hydration ── */
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem("routino_tasks");
      if (storedTasks !== null) {
        const parsed = JSON.parse(storedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      }

      const storedLinks = localStorage.getItem("routino_links");
      if (storedLinks !== null) {
        const parsed = JSON.parse(storedLinks);
        if (Array.isArray(parsed)) {
          setQuickLinks(parsed);
        }
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
  const toast = useCallback((message: string, type: "success" | "info" = "success", action?: ToastMessage["action"]) => {
    const id = `toast-${Date.now()}-${++globalToastSeq}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => {
      const isDuplicate = prev.some(t => t.message === message && t.type === type);
      if (isDuplicate && !action) return prev;
      return [...prev.filter(item => !action || item.message !== message || item.type !== type), { id, message, type, action }];
    });
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), action ? 15000 : 3500);
  }, []);

  /* ── Fetch live data from Google OAuth ── */
  const fetchDashboard = useCallback(async (notify = false, resetPages = false) => {
    setIsSyncingGoogle(true);
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      const result = await r.json();
      if (result.connected) {
        setLiveData(result as DashboardData);
        const freshUnread: DashboardMail[] = result.unread || [];
        setGoogleMail((prev) => {
          if (resetPages || prev.length <= freshUnread.length) {
            return freshUnread;
          }
          // Preserve loaded deeper pages while updating/refreshing the top items
          const freshIds = new Set(freshUnread.map((m) => m.id));
          const deeper = prev.filter((m) => !freshIds.has(m.id));
          return [...freshUnread, ...deeper];
        });
        if (resetPages) {
          setGmailExhausted(!result.nextPageToken);
          setGmailNextPageToken(result.nextPageToken || null);
        } else {
          setGmailNextPageToken((prev) => {
            if (gmailExhausted) return null;
            return prev ?? result.nextPageToken ?? null;
          });
        }
        const syncDate = result.lastSyncedAt ? new Date(result.lastSyncedAt) : new Date();
        setLastSyncedTime(syncDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        if (notify) {
          toast("Google calendars & inbox refreshed", "info");
        }
      }
    } catch {
      if (notify) toast("Could not refresh Google data", "info");
    } finally {
      setIsSyncingGoogle(false);
    }
  }, [toast, gmailExhausted]);

  useEffect(() => {
    const refreshColors = () => { void fetchDashboard(false); };
    window.addEventListener("routino:calendar-colors-changed", refreshColors);
    return () => window.removeEventListener("routino:calendar-colors-changed", refreshColors);
  }, [fetchDashboard]);

  useEffect(() => {
    fetchDashboard(false);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard(false);
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
  }, [fetchDashboard]);

  /* ── Fetch live data from Microsoft Outlook ── */
  const fetchOutlookData = useCallback(async (resetPages = false) => {
    try {
      const res = await fetch("/api/outlook/data", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          const freshUnread: DashboardMail[] = data.unread || [];
          setOutlookData((prev) => {
            const freshIds = new Set(freshUnread.map((m) => m.id));
            const deeper = resetPages ? [] : prev.unread.filter((m) => !freshIds.has(m.id));
            return {
              connected: true,
              profile: data.profile,
              recentUnreadCount: data.recentUnreadCount ?? null,
              events: data.events || [],
              unread: [...freshUnread, ...deeper],
              syncStatus: data.syncStatus,
            };
          });
          const nextLink = typeof data.unreadNextLink === "string" ? data.unreadNextLink : null;
          if (resetPages) {
            setOutlookExhausted(!nextLink);
            setOutlookNextLink(nextLink);
          } else {
            setOutlookNextLink((prev) => (outlookExhausted ? null : prev ?? nextLink));
          }
        } else {
          setOutlookData({
            connected: false,
            events: [],
            unread: [],
            syncStatus: { calendar: "failed", mail: "failed", overall: "failed" },
          });
          setOutlookNextLink(null);
          setOutlookExhausted(true);
        }
      } else {
        setOutlookData((prev) => ({
          ...prev,
          syncStatus: { calendar: "failed", mail: "failed", overall: "failed" },
        }));
      }
    } catch {
      setOutlookData((prev) => ({
        ...prev,
        syncStatus: { calendar: "failed", mail: "failed", overall: "failed" },
      }));
    }
  }, [outlookExhausted]);

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

  useEffect(() => {
    const timer = window.setInterval(() => setNotificationDay(new Intl.DateTimeFormat("en-CA").format(new Date())), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem(`routino_notifications:${liveData?.user?.email || "guest"}:${notificationDay}`) || "[]"); setDismissedNotifications(Array.isArray(value) ? value.filter(id => typeof id === "string") : []); }
    catch { setDismissedNotifications([]); }
  }, [liveData?.user?.email, notificationDay]);

  /* ── Dynamic real notifications ── */
  useEffect(() => {
    const isGoogle = Boolean(liveData?.connected);
    const isOutlook = Boolean(outlookData?.connected);

    const realNotifications: NotificationItem[] = [...workspaceNotifications(tasks, subscriptions, trackerWorkspace.airtel, notificationDay), ...backupAlerts.map(item => ({ id: item.id, title: item.title, time: item.detail, type: "system" as const, read: false, openPreferences: true }))];

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

    setNotifications(realNotifications.filter(item => !dismissedNotifications.includes(item.id)));
  }, [liveData, googleMail, outlookData, tasks, subscriptions, trackerWorkspace.airtel, notificationDay, dismissedNotifications, backupAlertKey]);

  useEffect(() => {
    if (liveData?.connected || outlookData?.connected) setNotice(false);
  }, [liveData?.connected, outlookData?.connected]);

  /* ── Computed calendar data ── */
  const allEvents = useMemo(() => {
    const live = (liveData?.events ?? []).map((ev) => {
      const cat = inferEventCategory(ev);
      return { ...ev, tag: ev.tag || cat.tag, color: (ev.colorId && GOOGLE_EVENT_COLORS[ev.colorId]?.hex) || ev.color || cat.color };
    });
    const outlook = (outlookData?.events ?? []).map((ev) => ({
      ...ev,
      tag: ev.tag || "OUTLOOK",
      color: ev.color || "#0078d4",
    }));
    return [...live, ...outlook, ...customEvents.filter(event => !live.some(item => item.id === event.id))];
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

  const activeOverviewTasks = useMemo(() => {
    return sortedOverviewTasks.filter((t) => !t.checked);
  }, [sortedOverviewTasks]);

  const completedOverviewTasks = useMemo(() => {
    return sortedOverviewTasks.filter((t) => t.checked);
  }, [sortedOverviewTasks]);

  const is48hEstimateAvailable = liveData?.unread48hEstimate !== null && liveData?.unread48hEstimate !== undefined;

  const unreadPreviewCount = useMemo(() => {
    if (!isConnected) return mailItems.filter((m) => !m.read).length;
    if (is48hEstimateAvailable) return `~${liveData!.unread48hEstimate}`;
    if (typeof liveData?.unreadEstimate === "number") return `~${liveData.unreadEstimate}`;
    return mailItems.filter((m) => !m.read).length;
  }, [isConnected, is48hEstimateAvailable, liveData, mailItems]);

  const inboxBadge = inboxCountLabel([{ connected: !!liveData?.connected, count: liveData?.recentUnreadCount }, { connected: !!outlookData.connected, count: outlookData.recentUnreadCount }]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return;

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
      deletedHabitIds?: string[];
      replaceHabitIds?: string[];
      replaceAllHabits?: boolean;
      notes?: KeepNote[];
      activeNav?: string;
    }, baselineTasks?: Task[]) => {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      let offlineAccount: string | null = null;
      try { if (offline) offlineAccount = localStorage.getItem("routino_verified_workspace_account"); } catch {}
      if ((!verifiedWorkspaceAccount || !workspaceSyncReady) && !offlineAccount) return false;
      coreSyncVersion.current += 1;
      const account = verifiedWorkspaceAccount || offlineAccount;
      if (!account) return false;
      const accountKey = `routino_workspace_pending:${account}`;
      const incoming = { ...overrideData, ...(overrideData?.tasks ? {
        replaceTaskIds: overrideData.tasks.filter(task => JSON.stringify(task) !== JSON.stringify((baselineTasks || tasks).find(existing => existing.id === task.id))).map(task => task.id),
        deletedTaskIds: (baselineTasks || tasks).filter(task => !overrideData.tasks!.some(next => next.id === task.id)).map(task => task.id),
      } : {}) };
      try {
        const pending = JSON.parse(localStorage.getItem(accountKey) || "{}");
        localStorage.setItem(accountKey, JSON.stringify(queueWorkspacePatch(pending, incoming)));
      } catch { setWorkspaceSaveError(true); return false; }
      if (offline) { setWorkspaceSaveError(true); return false; }
      const operation = async () => {
        if (currentAccount.current !== account) return false;
        setIsSyncing(true);
        try {
          const snapshot = localStorage.getItem(accountKey) || "{}";
          const res = await fetch("/api/user-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: snapshot });
          const json = await res.json();
          coreSyncVersion.current += 1;
          if (!res.ok || !json.success) { setWorkspaceSaveError(true); return false; }
          // A newer local patch stays pending for the queued request; never clear it accidentally.
          if (localStorage.getItem(accountKey) === snapshot) localStorage.removeItem(accountKey);
          setLastSyncedAt(json.savedAt);
          if (json.dbStatus?.sourceLabel) setDbSource(json.dbStatus.sourceLabel);
          setWorkspaceSaveError(false);
          return true;
        } catch { setWorkspaceSaveError(true); return false; }
        finally { setIsSyncing(false); }
      };
      const queued = coreSaveChain.current.then(operation, operation);
      coreSaveChain.current = queued;
      return queued;
    },
    [verifiedWorkspaceAccount, workspaceSyncReady, tasks, customEvents, quickLinks, focusMinutes, soundEnabled, habits, notes, activeNav]
  );

  useEffect(() => {
    if (!workspaceSyncReady || !verifiedWorkspaceAccount) return;
    const retryPending = () => {
      try { if (localStorage.getItem(`routino_workspace_pending:${verifiedWorkspaceAccount}`)) void syncToDatabase(); } catch {}
    };
    retryPending();
    window.addEventListener("online", retryPending);
    window.addEventListener("focus", retryPending);
    return () => { window.removeEventListener("online", retryPending); window.removeEventListener("focus", retryPending); };
  }, [workspaceSyncReady, verifiedWorkspaceAccount, syncToDatabase]);

  /* ── Load user workspace from Database on session connect ── */
  useEffect(() => {
    setWorkspaceSyncReady(false);
    let active = true;
    let readSequence = 0;
    const loadWorkspace = () => {
      const readVersion = coreSyncVersion.current;
      const sequence = ++readSequence;
      return fetch("/api/user-data", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401 && active) {
          setVerifiedWorkspaceAccount(null); setWorkspaceSyncReady(false);
          try { localStorage.removeItem("routino_verified_workspace_account"); } catch {}
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then((res) => {
        if (!active || !res || !res.authenticated || readVersion !== coreSyncVersion.current || sequence !== readSequence) return;
        setWorkspaceSyncReady(true);
        setVerifiedWorkspaceAccount(res.email?.toLowerCase() || null);
        try { if (res.email) localStorage.setItem("routino_verified_workspace_account", res.email.toLowerCase()); } catch {}
        if (res.dbStatus?.sourceLabel) {
          setDbSource(res.dbStatus.sourceLabel);
        }
        if (res.exists && res.data) {
          let d = res.data;
          try {
            const pending = JSON.parse(localStorage.getItem(`routino_workspace_pending:${res.email.toLowerCase()}`) || "{}");
            d = { ...d, ...pending, ...(Array.isArray(pending.tasks) && Array.isArray(pending.replaceTaskIds) && Array.isArray(pending.deletedTaskIds) ? { tasks: mergeTaskRecords(d.tasks || [], pending.tasks, pending.replaceTaskIds, pending.deletedTaskIds) } : {}) };
          } catch { setWorkspaceSaveError(true); }
          if (Array.isArray(d.tasks)) {
            setTasks(d.tasks);
          }
          if (Array.isArray(d.customEvents)) {
            setCustomEvents(d.customEvents);
            try { localStorage.setItem("routino_events", JSON.stringify(d.customEvents)); } catch {}
          }
          if (Array.isArray(d.quickLinks)) {
            setQuickLinks(d.quickLinks);
            try { localStorage.setItem("routino_links", JSON.stringify(d.quickLinks)); } catch {}
          }
          if (typeof d.focusMinutes === "number") {
            setFocusMinutes(d.focusMinutes);
            try { localStorage.setItem("routino_focus", String(d.focusMinutes)); } catch {}
          }
          if (typeof d.soundEnabled === "boolean") {
            setSoundEnabled(d.soundEnabled);
            try { localStorage.setItem("routino_sound_enabled", String(d.soundEnabled)); } catch {}
          }
          if (Array.isArray(d.habits)) {
            setHabits(d.habits);
            try { localStorage.setItem("routino_habits", JSON.stringify(d.habits)); } catch {}
          }
          if (Array.isArray(d.notes)) {
            setNotes(d.notes);
          }
          if (d.updatedAt) {
            setLastSyncedAt(d.updatedAt);
          }
        }
      })
      .catch(() => undefined);
    };
    void loadWorkspace();
    const onVisible = () => { if (document.visibilityState === "visible") void loadWorkspace(); };
    const interval = window.setInterval(onVisible, 30000);
    window.addEventListener("focus", onVisible); window.addEventListener("routino:workspace-restored", onVisible); document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; clearInterval(interval); window.removeEventListener("focus", onVisible); window.removeEventListener("routino:workspace-restored", onVisible); document.removeEventListener("visibilitychange", onVisible); };
  }, [liveData?.connected, liveData?.user?.email]);

  const handleManualSync = async () => {
    const trackersSaved = await trackerWorkspace.retry();
    const saved = (await syncToDatabase()) && trackersSaved;
    toast(saved ? "Workspace synchronized with database!" : "Database sync failed or is unavailable. Local data is preserved.");
    return saved;
  };

  /* ── Handlers ── */
  const offerTaskUndo = (message: string, before: Task[], after: Task[]) => {
    const account = currentAccount.current;
    toast(message, "info", { label: "Undo", onClick: () => {
      if (currentAccount.current !== account) { toast("Undo belongs to a different account. No changes made.", "info"); return; }
      setTasks(current => {
        const result = undoRecords(current, before, after);
        const restored = result && withTaskActivity(current, result, Date.now(), "Undid previous action");
        if (!restored) { toast("Task changed since that action. Undo was skipped to preserve newer edits.", "info"); return current; }
        try { localStorage.setItem("routino_tasks", JSON.stringify(restored)); } catch {}
        void syncToDatabase({ tasks: restored }, current);
        return restored;
      });
    } });
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(item => item.id === id);
      const next = withTaskActivity(prev, completeRepeatingTask(prev, id, new Intl.DateTimeFormat("en-CA").format(new Date()), Date.now()));
      if (task && !task.checked) { playTick(); offerTaskUndo(`"${task.title}" completed${next.length > prev.length ? " · next occurrence created" : ""}`, prev, next); }
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
  };

  const editTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskModalInitialData(task);
    setShowTaskModal(true);
  };

  const saveTaskEdits = (updates: Omit<Task, "id" | "checked" | "createdAt">, scope: "occurrence" | "future" = "future") => {
    if (!editingTaskId) return;
    setTasks(previous => {
      const next = withTaskActivity(previous, editTaskOccurrences(previous, editingTaskId, updates, scope));
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      void syncToDatabase({ tasks: next });
      return next;
    });
    toast("Task changes saved");
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      if (task) offerTaskUndo(`"${task.title}" removed`, prev, next);
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });

  };

  const clearCompletedTasks = () => {
    const count = tasks.filter(t => t.checked).length;
    if (count === 0) return;
    setTasks(prev => {
      const next = prev.filter(t => !t.checked);
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
    toast(`Cleared ${count} completed tasks`, "info");
  };

  const toggleSubTask = (taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const next = withTaskActivity(prev, prev.map(t => {
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
      }));
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
      syncToDatabase({ habits: next, replaceHabitIds: [id] });
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
      syncToDatabase({ habits: next, replaceHabitIds: [newHabit.id] });
      return next;
    });
    toast(`Habit "${name}" created!`);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => {
      const next = prev.map(h => (h.id === id ? { ...h, ...updates } : h));
      try { localStorage.setItem("routino_habits", JSON.stringify(next)); } catch {}
      syncToDatabase({ habits: next, replaceHabitIds: [id] });
      return next;
    });
    toast("Habit updated!");
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => {
      const next = prev.filter(h => h.id !== id);
      try { localStorage.setItem("routino_habits", JSON.stringify(next)); } catch {}
      syncToDatabase({ habits: next, deletedHabitIds: [id] });
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
      const next = withTaskActivity(prev, [newTask, ...prev]);
      try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
      syncToDatabase({ tasks: next });
      return next;
    });
    toast(`"${newTask.title}" added to priorities`);
  };

  const handleOpenExistingTask = useCallback((taskId: string) => {
    setActiveNav("Tasks");
    setHighlightedTaskId(taskId);
    try {
      localStorage.setItem("routino_active_nav", "Tasks");
    } catch {}
    const t = tasks.find((item) => item.id === taskId);
    if (t) {
      toast(`Opened tracked task: "${t.title}"`);
    }
  }, [tasks]);

  const handleCreateTaskFromEmail = useCallback((mail: DashboardMail) => {
    const existing = findTaskForEmail(mail, tasks);
    if (existing) {
      handleOpenExistingTask(existing.id);
      toast(`Task already exists: "${existing.title}" (${existing.checked ? "Completed" : "Active"})`);
      return;
    }

    const classification = classifyEmail(mail);
    const cat =
      classification?.variant === "security" || classification?.variant === "infra"
        ? "urgent"
        : classification?.variant === "career"
        ? "work"
        : "work";

    const senderClean = mail.from.replace(/<[^>]*>/, "").trim();
    const mailIdClean = mail.id.replace(/^outlook-/, "");
    const directLink =
      mail.href ||
      (mail.source === "outlook"
        ? `https://outlook.live.com/mail/0/deeplink/read/${encodeURIComponent(mailIdClean)}`
        : `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(mail.id)}`);

    setTaskModalInitialData({
      title: mail.subject ? `Follow up: ${mail.subject}` : "Follow up on email",
      meta: `From: ${senderClean} · Received ${mail.date || "recently"}`,
      category: cat,
      dueDate: "", // Explicit user review; do not guess deadlines!
      priority: classification?.variant === "security" || classification?.variant === "infra",
      link: directLink,
      subtasks: [
        {
          id: "sub-1",
          title: `Review message details in ${mail.source === "outlook" ? "Outlook" : "Gmail"}`,
          completed: false,
          link: directLink,
        },
      ],
    });
    setShowTaskModal(true);
  }, [tasks, handleOpenExistingTask]);

  const handleLoadMoreMail = useCallback(async () => {
    if (isLoadingMoreMail) return;
    setIsLoadingMoreMail(true);
    try {
      let addedTotal = 0;
      let hasError = false;
      let errorMsg = "";

      // 1. Google Gmail pagination
      if (liveData?.connected && gmailNextPageToken) {
        const res = await fetch(`/api/mail/load-more?source=google&pageToken=${encodeURIComponent(gmailNextPageToken)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const newMsgs: DashboardMail[] = data.messages || [];
          if (newMsgs.length > 0) {
            setGoogleMail((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
              addedTotal += fresh.length;
              return [...prev, ...fresh];
            });
          }
          if (!data.nextPageToken) {
            setGmailNextPageToken(null);
            setGmailExhausted(true);
          } else {
            setGmailNextPageToken(data.nextPageToken);
          }
        } else {
          hasError = true;
          try {
            const errData = await res.json();
            errorMsg = errData.error || "Failed to load additional Gmail messages";
          } catch {
            errorMsg = "Failed to load additional Gmail messages";
          }
        }
      }

      // 2. Outlook pagination
      if (outlookData.connected && outlookNextLink) {
        const res = await fetch(`/api/mail/load-more?source=outlook&nextLink=${encodeURIComponent(outlookNextLink)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const newMsgs: DashboardMail[] = data.messages || [];
          if (newMsgs.length > 0) {
            setOutlookData((prev) => {
              const existingIds = new Set(prev.unread.map((m) => m.id));
              const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
              addedTotal += fresh.length;
              return {
                ...prev,
                unread: [...prev.unread, ...fresh],
              };
            });
          }
          if (!data.hasMore || typeof data.nextLink !== "string") {
            setOutlookNextLink(null);
            setOutlookExhausted(true);
          } else {
            setOutlookNextLink(data.nextLink);
          }
        } else {
          hasError = true;
          try {
            const errData = await res.json();
            errorMsg = errData.error || "Failed to load additional Outlook messages";
          } catch {
            errorMsg = "Failed to load additional Outlook messages";
          }
        }
      }

      if (hasError && addedTotal > 0) {
        toast(`Loaded ${addedTotal} additional email${addedTotal > 1 ? "s" : ""} (note: ${errorMsg.toLowerCase()})`);
      } else if (hasError && addedTotal === 0) {
        toast(errorMsg || "Could not load more emails right now");
      } else if (addedTotal > 0) {
        toast(`Loaded ${addedTotal} additional unread email${addedTotal > 1 ? "s" : ""}`);
      } else {
        toast("No additional unread emails found");
      }
    } catch {
      toast("Could not load more emails right now");
    } finally {
      setIsLoadingMoreMail(false);
    }
  }, [isLoadingMoreMail, liveData?.connected, gmailNextPageToken, outlookData.connected, outlookNextLink, toast]);

  const addEvent = (event: DashboardEvent) => {
    setCustomEvents(prev => {
      const next = [...prev, event];
      try { localStorage.setItem("routino_events", JSON.stringify(next)); } catch {}
      syncToDatabase({ customEvents: next });
      return next;
    });
    toast(`"${event.summary}" scheduled`);
  };

  const scheduleTaskIntoCalendar = async (task: Task, slot: { start: Date; end: Date }) => {
    const descParts = [task.meta].filter(Boolean);
    if (task.link) descParts.push(`Link: ${task.link}`);
    const response = await fetch("/api/calendar/focus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: task.title, description: descParts.join(" · "), start: slot.start.toISOString(), end: slot.end.toISOString() }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not create Google Calendar event");
    addEvent({
      id: result.event.id,
      htmlLink: result.event.htmlLink,
      summary: `Focus: ${task.title}`,
      description: descParts.join(" · ") || "Scheduled from Routino task",
      start: { dateTime: slot.start.toISOString() },
      end: { dateTime: slot.end.toISOString() },
      source: "google",
      isCustom: false,
      tag: "FOCUS",
      color: "#16a34a",
    });
    setActiveNav("Calendar");
  };

  const addQuickLink = (link: QuickLink) => {
    setQuickLinks(prev => {
      const next = [...prev, link];
      try { localStorage.setItem("routino_links", JSON.stringify(next)); } catch {}
      syncToDatabase({ quickLinks: next });
      return next;
    });
    toast(`"${link.title}" added to quick links`);
  };

  const updateQuickLinks = (next: QuickLink[]) => {
    setQuickLinks(next);
    try { localStorage.setItem("routino_links", JSON.stringify(next)); } catch {}
    void syncToDatabase({ quickLinks: next });
  };

  const dismissNotifications = (ids: string[]) => {
    setDismissedNotifications(previous => {
      const next = Array.from(new Set([...previous, ...ids]));
      try { localStorage.setItem(`routino_notifications:${liveData?.user?.email || "guest"}:${notificationDay}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const handleNotificationClick = (item: NotificationItem) => {
    dismissNotifications([item.id]);
    if (item.openPreferences) { setPreferencesDataToken(token => token + 1); setShowPreferences(true); }
    if (item.trackerTab) handleOpenTrackersTab(item.trackerTab);
    if (item.taskId) { setHighlightedTaskId(item.taskId); }

    if (item.navTarget) {
      setActiveNav(item.navTarget);
      try { localStorage.setItem("routino_active_nav", item.navTarget); } catch {}
    }
    setNotifications(prev => prev.filter(n => n.id !== item.id));
    setShowNotifications(false);
  };

  const clearAllNotifications = () => {
    dismissNotifications(notifications.map(item => item.id));
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
    subscriptions?: Subscription[];
    airtel?: AirtelData;
    focusMinutes?: number;
    soundEnabled?: boolean;
  }) => {
    if (imported.subscriptions !== undefined && !isSubscriptionList(imported.subscriptions)) {
      toast("Invalid subscription data in backup. No workspace changes were made.");
      return;
    }
    if (imported.airtel !== undefined && !isAirtelData(imported.airtel)) {
      toast("Invalid Airtel records in backup. No changes were made."); return;
    }
    if (imported.subscriptions !== undefined || imported.airtel !== undefined) {
      if (!trackerWorkspace.update({ ...(imported.subscriptions !== undefined ? { subscriptions: imported.subscriptions } : {}), ...(imported.airtel !== undefined ? { airtel: imported.airtel } : {}) })) {
        toast("Trackers are not ready to restore. No workspace changes were made."); return;
      }
    }
    if (imported.tasks) {
      setTasks(imported.tasks);
      try { localStorage.setItem("routino_tasks", JSON.stringify(imported.tasks)); } catch {}
    }
    if (imported.customEvents) {
      setCustomEvents(imported.customEvents);
      try { localStorage.setItem("routino_events", JSON.stringify(imported.customEvents)); } catch {}
    }
    if (imported.quickLinks) {
      setQuickLinks(imported.quickLinks);
      try { localStorage.setItem("routino_links", JSON.stringify(imported.quickLinks)); } catch {}
    }
    if (imported.habits && Array.isArray(imported.habits)) {
      setHabits(imported.habits);
      try { localStorage.setItem("routino_habits", JSON.stringify(imported.habits)); } catch {}
    }
    if (imported.notes && Array.isArray(imported.notes)) {
      setNotes(imported.notes);
      try { localStorage.setItem("routino_notes", JSON.stringify(imported.notes)); } catch {}
    }
    if (typeof imported.soundEnabled === "boolean") {
      setSoundEnabled(imported.soundEnabled);
      try { localStorage.setItem("routino_sound_enabled", String(imported.soundEnabled)); } catch {}
    }
    if (typeof imported.focusMinutes === "number") {
      setFocusMinutes(imported.focusMinutes);
      try { localStorage.setItem("routino_focus", String(imported.focusMinutes)); } catch {}
    }
    syncToDatabase({
      tasks: imported.tasks,
      customEvents: imported.customEvents,
      quickLinks: imported.quickLinks,
      habits: imported.habits,
      replaceAllHabits: Array.isArray(imported.habits),
      notes: imported.notes,
      focusMinutes: imported.focusMinutes,
      soundEnabled: imported.soundEnabled,
    });
    toast("Workspace snapshot restored & synced!");
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen">
      {workspaceSaveError && <div role="alert" className="fixed bottom-4 left-4 right-4 z-[80] rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 sm:left-auto sm:max-w-md">Workspace changes are kept locally but database sync failed. They will retry when connected.<button className="ml-3 font-semibold underline" onClick={() => { void syncToDatabase(); }}>Retry now</button></div>}
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
                {label === "Inbox" && inboxBadge !== null && <span aria-label={inboxBadge === "—" ? "48-hour unread count unavailable" : `${inboxBadge} unread in the last 48 hours`} title={inboxBadge === "—" ? "48-hour unread count unavailable; refresh account sync" : "Unread in the last 48 hours · Gmail excludes Promotions and Social"} className="ml-auto rounded-full bg-[#f0dfc4] px-2 py-0.5 text-[10px] font-bold text-[#9b6c2a]">{inboxBadge}<span className="ml-1 text-[8px] font-medium">48h</span></span>}
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
                  {liveData?.user?.name ? liveData.user.name.charAt(0).toUpperCase() : (liveData?.connected ? "U" : "D")}
                </div>
              )}
              <span className="text-[10px] xl:text-[11px] text-white/85 truncate">{liveData?.user?.name ? `${liveData.user.name}'s workspace` : (liveData?.connected ? "My workspace" : "Demo workspace")}</span>
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
        unreadCount={inboxBadge}
        isConnected={!!liveData?.connected}
        isOutlookConnected={Boolean(outlookData?.connected)}
        onOpenPreferences={() => setShowPreferences(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {/* ─── Main ─── */}
      <main id="overview" className="min-h-screen lg:ml-[236px]">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-line bg-[#f7f7f2]/95 px-5 backdrop-blur-md sm:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileSidebar(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white lg:hidden" aria-label="Open menu"><Menu size={17} /></button>
            <img src="/favicon.svg" alt="Routino" className="hidden h-8 w-8 rounded-[11px] sm:block lg:hidden" />
            <div className="text-[12px] text-muted">Workspace <span className="mx-2 text-[#c4cbc3]">/</span><span className="font-semibold text-ink">{activeNav}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <SyncCenter trackerStatus={trackerWorkspace.status} trackerSavedAt={trackerWorkspace.savedAt} coreError={workspaceSaveError} syncing={isSyncing} email={verifiedWorkspaceAccount} lastSyncedAt={lastSyncedAt} onRetry={handleManualSync} onBackup={() => setShowPreferences(true)} />
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
            <div className="relative z-50">
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
            <div className="relative z-50">
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

          {(activeNav === "Overview" || activeNav === "Trackers") && trackerWorkspace.ready && <ExpiryReminders subscriptions={subscriptions} airtel={trackerWorkspace.airtel} onOpen={handleOpenTrackersTab} />}


          {/* ─── CONDITIONAL VIEWS BASED ON ACTIVE NAV ─── */}
          {activeNav === "Calendar" ? (
            <CalendarView
              account={verifiedWorkspaceAccount}
              onColorized={() => { void fetchDashboard(false); }}
              events={allEvents}
              onOpenAddEvent={() => { setViewingEvent(null); setShowEventModal(true); }}
              onSelectEvent={(ev) => { setViewingEvent(ev); setShowEventModal(true); }}
              isConnected={isConnected}
              tasks={tasks}
              onScheduleTask={scheduleTaskIntoCalendar}
            />
          ) : activeNav === "Time Audit" ? (
            <TimeAuditView
              events={allEvents}
              isConnected={isConnected}
            />
          ) : activeNav === "Trackers" ? (
            <TrackersView
              assetRecords={trackerWorkspace.assetRecords}
              onAssetRecordsChange={assetRecords => { trackerWorkspace.update({ assetRecords }); }}
              onAssetWarrantyReminder={(key, name, date) => { const source = `Warranty: ${key} · ${date}`; if (tasks.some(task => task.meta === source)) { toast("Warranty reminder already exists"); return; } addTask({ title: `Review warranty: ${name}`, meta: source, dueDate: date, category: "personal", priority: true }); }}
              assetDocuments={trackerWorkspace.assetDocuments}
              onAssetDocumentsChange={assetDocuments => { trackerWorkspace.update({ assetDocuments }); }}
              onRenewalTask={(subscription, date) => addTask({ title: `Review renewal: ${subscription.name}`, meta: `Review billing before ${date}`, dueDate: date, category: "personal", priority: true })}
              onJournalSubscriptions={trackerWorkspace.importSubscriptions}
              subscriptions={subscriptions}
              airtel={trackerWorkspace.airtel}
              onRechargeRenewal={patch => trackerWorkspace.update(patch)}
              onAirtelChange={(airtel) => {
                const before = trackerWorkspace.airtel;
                const account = currentAccount.current;
                if (trackerWorkspace.update({ airtel }) && airtel.deletedIds.some(id => !before.deletedIds.includes(id))) toast("Recharge removed", "info", { label: "Undo", onClick: () => { if (currentAccount.current !== account) { toast("Undo belongs to a different account. No changes made.", "info"); return; } if (!trackerWorkspace.undo({ airtel: before }, { airtel })) toast("Undo unavailable: records changed or sync needs review.", "info"); } });
              }}
              subscriptionsDisabled={!trackerWorkspace.ready || trackerWorkspace.status === "conflict"}
              onSubscriptionsChange={(next) => {
                const before = subscriptions;
                const account = currentAccount.current;
                const undoable = before.some(item => !next.some(row => row.id === item.id) || (item.status !== "completed" && next.some(row => row.id === item.id && row.status === "completed")));
                if (trackerWorkspace.update({ subscriptions: next }) && undoable) toast("Subscription updated", "info", { label: "Undo", onClick: () => { if (currentAccount.current !== account) { toast("Undo belongs to a different account. No changes made.", "info"); return; } if (!trackerWorkspace.undo({ subscriptions: before }, { subscriptions: next })) toast("Undo unavailable: records changed or sync needs review.", "info"); } });
              }}
              trackerSyncStatus={trackerWorkspace.status}
              trackerSyncMessage={trackerWorkspace.message}
              onRetryTrackerSync={() => { void trackerWorkspace.retry(); }}
              onReloadTrackers={() => { void trackerWorkspace.reloadSaved(); }}
              onExportTrackerDraft={trackerWorkspace.downloadLocalCopy}
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
              tasks={tasks}
              onSelectMail={(m) => setViewingMail(m)}
              onToggleStar={toggleMailStar}
              onToggleRead={toggleMailRead}
              onCreateTask={handleCreateTaskFromEmail}
              onOpenTask={handleOpenExistingTask}
              isConnected={isConnected}
              onLoadMore={handleLoadMoreMail}
              isLoadingMore={isLoadingMoreMail}
              hasMore={Boolean((gmailNextPageToken && !gmailExhausted) || (outlookNextLink && !outlookExhausted))}
            />
          ) : activeNav === "Tasks" ? (
            <TasksView
              tasks={tasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onEditTask={editTask}
              onRepeatAction={(id, action) => {
                const today = new Intl.DateTimeFormat("en-CA").format(new Date());
                const before = tasks;
                const changed = action === "skip" ? skipTaskOccurrence(before, id, today, Date.now()) : setSeriesPaused(before, id, action === "pause", today, Date.now());
                if (changed === before) { toast("No occurrence can be changed with these repeat settings. Check the series end date.", "info"); return; }
                const next = withTaskActivity(before, changed);
                setTasks(next); try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
                void syncToDatabase({ tasks: next }, before);
                offerTaskUndo(action === "skip" ? "Occurrence skipped; history preserved" : action === "pause" ? "Series paused" : "Series resumed", before, next);
              }}
              onSnoozeTask={(id, date) => {
                const changed = snoozeTask(tasks, id, date, new Intl.DateTimeFormat("en-CA").format(new Date()));
                if (changed === tasks) return;
                const next = withTaskActivity(tasks, changed, Date.now(), "Snoozed");
                setTasks(next); try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {} void syncToDatabase({ tasks: next }); toast("Task moved; repeat schedule preserved");
              }}
              onUpdateTaskRecurrence={(id, recurrence) => {
                const next = withTaskActivity(tasks, tasks.map(task => task.id === id ? { ...task, recurrence, recurrenceTemplate: undefined, dueDate: recurrence ? task.dueDate || new Intl.DateTimeFormat("en-CA").format(new Date()) : task.dueDate } : task));
                setTasks(next);
                try { localStorage.setItem("routino_tasks", JSON.stringify(next)); } catch {}
                void syncToDatabase({ tasks: next });
              }}
              onAddTask={addTask}
              onOpenTaskModal={() => setShowTaskModal(true)}
              onToggleSubTask={toggleSubTask}
              highlightedTaskId={highlightedTaskId}
            />
          ) : activeNav === "Recycle Bin" ? (
            <div className="mx-auto w-full max-w-4xl space-y-5"><div><h1 className="text-2xl font-bold text-ink">Recycle Bin</h1><p className="mt-2 text-sm text-muted">Recover deleted records from your workspace without replacing newer data.</p></div><RecycleBin email={liveData?.user?.email} expanded /></div>
          ) : activeNav === "Notes" ? (
            <NotesView
              actionTasks={tasks}
              onActionTask={(note, text, itemId) => {
                const source = `Meeting note: ${note.id} · Action: ${itemId}`;
                if (hasMeetingAction(tasks, note.id, itemId)) { toast("This action already has a task"); return; }
                addTask({ title: text, meta: source, meetingActionKey: meetingActionKey(note.id, itemId), category: "meeting", priority: false });
              }}
              searchRequest={searchNote}
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
                    onClick={() => setShowMorningDigest(true)}
                    title="Open Executive Daily Briefing (Consolidated review)"
                    className="flex items-center gap-1.5 rounded-xl border border-forest/30 bg-[#fdf2f2] px-3.5 py-2.5 text-[11px] font-bold text-forest hover:bg-forest hover:text-white transition shadow-2xs cursor-pointer group"
                  >
                    <Sparkles size={13} className="text-forest group-hover:text-white" />
                    <span>Morning Brief</span>
                  </button>
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

              {/* Sync Health & Verified Sources Indicator */}
              {isConnected && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#e6ece1] bg-[#fbfdf9] px-3.5 py-2.5 text-[10.5px] text-[#556358]">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="flex items-center gap-1 font-bold text-forest">
                      <CheckCircle2 size={13} />
                      Sources:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMorningDigest(true)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#f1f4ed] px-2 py-0.5 text-[10px] font-medium text-[#404c42] hover:bg-[#e4ebd9] transition cursor-pointer"
                      title="View all calendars checked and failures"
                    >
                      <CalendarDays size={11} className="text-forest" />
                      {(() => {
                        const checked = liveData?.calendarsChecked?.filter(c => c.status === "checked").length ?? 0;
                        const failed = liveData?.calendarsChecked?.filter(c => c.status === "failed").length ?? 0;
                        if (failed > 0) return `${checked} Checked (${failed} Failed)`;
                        if (checked > 0) return `${checked} Calendars Checked`;
                        return "Google Calendar";
                      })()}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectNav("Inbox")}
                      className="inline-flex items-center gap-1 rounded-md bg-[#f1f4ed] px-2 py-0.5 text-[10px] font-medium text-[#404c42] hover:bg-[#e4ebd9] transition cursor-pointer"
                      title="Open Inbox"
                    >
                      <Inbox size={11} className="text-[#bd8054]" />
                      Gmail ({unreadPreviewCount} unread {is48hEstimateAvailable ? "est. / 48h" : "est."})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectNav("Drive")}
                      className="inline-flex items-center gap-1 rounded-md bg-[#f1f4ed] px-2 py-0.5 text-[10px] font-medium text-[#404c42] hover:bg-[#e4ebd9] transition cursor-pointer"
                      title="Open Drive"
                    >
                      <HardDrive size={11} className="text-[#3b82f6]" />
                      Drive (Metadata)
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-muted text-[10px]">
                    {lastSyncedTime && <span>Refreshed {lastSyncedTime}</span>}
                    <button
                      type="button"
                      onClick={() => fetchDashboard(true)}
                      disabled={isSyncingGoogle}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 font-semibold text-[#5c6960] hover:text-forest hover:border-forest/40 transition cursor-pointer disabled:opacity-50"
                      title="Sync all connected Google sources now"
                    >
                      <RefreshCw size={11} className={isSyncingGoogle ? "animate-spin text-forest" : ""} />
                      <span>{isSyncingGoogle ? "Syncing..." : "Sync"}</span>
                    </button>
                  </div>
                </div>
              )}

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
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{unreadPreviewCount}</span><span className="text-[11px] text-muted">{is48hEstimateAvailable ? "unread est. (48h)" : "unread est."}</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#d79257]" />{isConnected ? (is48hEstimateAvailable ? "Estimated messages in last 48h (Gmail query)" : "Estimated total unread messages") : "Connect Google to load your inbox"}</div>
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
                        {overviewTrackersSummary.featuredApplications.map((application) => (
                          <div key={application.id} className="flex items-center justify-between gap-1 rounded-lg bg-[#eff6ff]/70 border border-[#bfdbfe]/60 px-2 py-1 text-[11px]">
                            <span className="font-bold text-[#1e40af] truncate">{application.company}</span>
                            <span className="shrink-0 text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-white text-[#1d4ed8]">
                              {application.nextAction || application.status}
                            </span>
                          </div>
                        ))}
                        {overviewTrackersSummary.featuredApplications.length === 0 && (
                          <p className="rounded-lg bg-[#f8faf7] px-2 py-2 text-[11px] text-muted">No active items in this tracker.</p>
                        )}
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
                  <div className="space-y-0 max-h-[460px] overflow-y-auto pr-1.5 sidebar-scroll">
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
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 flex flex-col justify-between">
                  <div>
                    <SectionHeading
                      icon={ListTodo}
                      title="Your priorities"
                      sub={done + " of " + tasks.length + " complete · Keep it manageable"}
                      right={
                        <div className="flex items-center gap-2">
                          <button onClick={() => setShowTaskModal(true)} aria-label="Add task" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e] hover:bg-[#fdf2f2] hover:text-forest transition cursor-pointer">
                            <Plus size={14} />
                          </button>
                        </div>
                      }
                    />
                    <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-[#f0f2ed]">
                      <div className="h-full rounded-full bg-forest transition-all duration-500 ease-out" style={{ width: (tasks.length > 0 ? done / tasks.length * 100 : 0) + "%" }} />
                    </div>

                    {/* Filter Tabs: Active vs Completed */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="inline-flex rounded-lg bg-[#f4f6f1] p-0.5 text-[11px] font-medium text-muted">
                        <button
                          type="button"
                          onClick={() => setOverviewTasksTab("active")}
                          className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                            overviewTasksTab === "active"
                              ? "bg-white font-semibold text-ink shadow-xs"
                              : "hover:text-ink"
                          }`}
                        >
                          Active ({activeOverviewTasks.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverviewTasksTab("completed")}
                          className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                            overviewTasksTab === "completed"
                              ? "bg-white font-semibold text-ink shadow-xs"
                              : "hover:text-ink"
                          }`}
                        >
                          History ({completedOverviewTasks.length})
                        </button>
                      </div>

                      {overviewTasksTab === "completed" && completedOverviewTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={clearCompletedTasks}
                          className="text-[10px] font-semibold text-[#a4aca4] hover:text-[#b91c1c] transition cursor-pointer"
                        >
                          Clear completed
                        </button>
                      )}
                    </div>

                    {tasks.length === 0 ? (
                      <div className="py-8 text-center">
                        <ListTodo size={28} className="mx-auto text-muted/40 mb-2" />
                        <p className="text-[12px] font-semibold text-ink">No priorities planned for today</p>
                        <p className="mt-1 text-[10px] text-muted">Click below to add a focus task or daily goal.</p>
                      </div>
                    ) : (
                      <div className="max-h-[460px] overflow-y-auto pr-1 sidebar-scroll space-y-1">
                        {overviewTasksTab === "active" ? (
                          activeOverviewTasks.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#dce3d8] bg-[#fafbf7] p-5 text-center my-2">
                              <CheckCircle2 size={22} className="mx-auto text-forest mb-1.5" />
                              <p className="text-[12px] font-semibold text-ink">All priorities caught up! 🎉</p>
                              <p className="text-[10px] text-muted mt-0.5">Every daily priority has been checked off.</p>
                            </div>
                          ) : (
                            activeOverviewTasks.map(task => {
                              const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
                              const completedSubCount = task.subtasks?.filter(s => s.completed).length || 0;
                              const totalSubCount = task.subtasks?.length || 0;
                              const isExpanded = expandedOverviewTasks[task.id];

                              return (
                                <div key={task.id} className="rounded-xl transition hover:bg-[#f8f9f5]">
                                  <div className="group flex w-full items-start gap-3 px-2.5 py-2.5 text-left">
                                    <button
                                      onClick={() => toggleTask(task.id)}
                                      className={"mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border transition-all duration-200 " + (task.checked ? "border-forest bg-forest text-white scale-110" : "border-[#d6ddd4] text-transparent group-hover:border-forest/50")}
                                    >
                                      {task.checked ? <Check size={11} /> : <Circle size={10} />}
                                    </button>
                                    <span className="min-w-0 flex-1">
                                      <span className={"block text-[11px] font-medium transition-all duration-200 " + (task.checked ? "text-[#9aa49b] line-through" : "text-[#314239]")}>{task.title}</span>
                                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#98a198]">
                                        {task.meta}
                                        {task.skipped && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">Skipped · not completed</span>}
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
                                            className="inline-flex items-center gap-1 rounded bg-[#f1f3ed] px-1.5 py-0.5 text-[8px] font-semibold text-[#5c6960] hover:bg-[#e2e6df] transition cursor-pointer"
                                          >
                                            <CheckSquare size={9} />
                                            {completedSubCount}/{totalSubCount} sub-steps
                                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                          </button>
                                        )}
                                      </span>
                                    </span>
                                    {task.link && (
                                      <a
                                        href={task.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-0.5 inline-flex items-center gap-1 rounded bg-[#f4f7ef] border border-forest/20 px-1.5 py-1 text-[8.5px] font-semibold text-forest hover:bg-[#ebf2e3] transition cursor-pointer"
                                        title="Open linked email"
                                      >
                                        <ExternalLink size={9} />
                                        <span>Email</span>
                                      </a>
                                    )}
                                    {task.priority && !task.checked ? <span className="mt-0.5 rounded-md bg-[#fcf0e7] px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#b4794e]">FIRST</span> : null}
                                    <button onClick={() => editTask(task)} aria-label={`Edit ${task.title}`} className="btn-theme-quiet shrink-0 rounded-md px-2 py-1 text-[11px] font-medium leading-none text-muted">Edit</button>
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="mt-0.5 rounded p-1 text-transparent transition group-hover:text-[#c4a88a] hover:!text-[#c05746] hover:bg-[#fce8e6] cursor-pointer"
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
                                          <span className={st.completed ? "text-muted line-through flex-1" : "text-[#404e45] flex-1"}>
                                            {renderLinkedText(st.title, st.link)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )
                        ) : (
                          completedOverviewTasks.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#e2e6df] bg-[#fafbf8] p-5 text-center my-2">
                              <p className="text-[12px] font-medium text-muted">No completed tasks yet</p>
                              <p className="text-[10px] text-muted/70 mt-0.5">Tasks checked off today will appear here.</p>
                            </div>
                          ) : (
                            completedOverviewTasks.map(task => {
                              const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
                              const completedSubCount = task.subtasks?.filter(s => s.completed).length || 0;
                              const totalSubCount = task.subtasks?.length || 0;

                              return (
                                <div key={task.id} className="rounded-xl transition hover:bg-[#f8f9f5] opacity-80">
                                  <div className="group flex w-full items-start gap-3 px-2.5 py-2 text-left">
                                    <button
                                      onClick={() => toggleTask(task.id)}
                                      className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border border-forest bg-forest text-white transition-all duration-200 hover:scale-105"
                                      title="Mark active"
                                    >
                                      <Check size={11} />
                                    </button>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-[11px] font-medium text-[#9aa49b] line-through">{task.title}</span>
                                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px] text-[#a4aca4]">
                                        {task.meta}
                                        {task.skipped && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">Skipped · not completed</span>}
                                        {hasSubtasks && (
                                          <span>· {completedSubCount}/{totalSubCount} sub-steps</span>
                                        )}
                                        {task.link && (
                                          <a
                                            href={task.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 rounded bg-[#f4f7ef] border border-forest/20 px-1 py-0.2 text-[8px] font-semibold text-forest/70 hover:text-forest transition cursor-pointer"
                                            title="Open original email"
                                          >
                                            <ExternalLink size={7} />
                                            <span>Email</span>
                                          </a>
                                        )}
                                      </span>
                                    </span>
                                    <button onClick={() => editTask(task)} aria-label={`Edit ${task.title}`} className="btn-theme-quiet shrink-0 rounded-md px-2 py-1 text-[11px] font-medium leading-none text-muted">Edit</button>
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="mt-0.5 rounded p-1 text-transparent transition group-hover:text-[#c4a88a] hover:!text-[#c05746] hover:bg-[#fce8e6] cursor-pointer"
                                      aria-label={"Delete " + task.title}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line/60">
                    <button onClick={() => setShowTaskModal(true)} className="flex-1 rounded-xl border border-dashed border-[#dfe5dc] py-2 text-[10px] font-semibold text-[#79887b] hover:bg-[#fafbf8] hover:border-forest/30 transition cursor-pointer">
                      <Plus size={12} className="mr-1 inline" /> Add a personal task
                    </button>
                    <button onClick={() => handleSelectNav("Tasks")} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition cursor-pointer">
                      <span>Open Tasks board</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </section>
              </div>

              {/* ─── Week + Inbox row ─── */}
              <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
                {/* Week ahead */}
                <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 overflow-hidden">
                  <SectionHeading
                    icon={CalendarDays}
                    title="The week ahead"
                    sub="Today + the next 6 days"
                    right={<button onClick={() => handleSelectNav("Calendar")} className="rounded-lg bg-[#f4f5f0] px-2.5 py-1.5 text-[10px] text-[#77837a] hover:bg-[#eef2ea] transition">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())} – {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(rangeEnd)} <ChevronDown size={12} className="ml-1 inline" /></button>}
                  />
                  <div id="week" className="overflow-x-auto pb-1">
                    <div className="grid grid-cols-7 gap-1.5 min-w-[420px]">
                      {weekDays.map((day, index) => (
                        <div
                          key={day.day + day.date}
                          onClick={() => handleSelectNav("Calendar")}
                          className={"min-w-0 min-h-[112px] rounded-xl p-2 cursor-pointer transition-colors " + (index === 0 ? "bg-[#f4f7ef] ring-1 ring-forest/10" : "bg-[#fafbf8] hover:bg-[#f4f7ef]")}
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
                <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
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
                          {unreadPreviewCount} UNREAD →
                        </button>
                      </div>
                    }
                  />
                  <div className="divide-y divide-[#eff1ec]">
                    {mailItems.length ? mailItems.slice(0, 3).map((mail, index) => {
                      const actionBadge = classifyEmail(mail);
                      return (
                        <div
                          key={mail.id || (mail.subject + index)}
                          className="flex gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer rounded-lg transition hover:bg-[#f8f9f5] px-1 -mx-1"
                          onClick={() => setViewingMail(mail)}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold text-[#4d5b52] bg-[#f0c6ae]">
                            {mail.from.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="min-w-0 flex-1 basis-40 truncate text-[10px] font-semibold text-[#33433a]">{mail.from}</p>
                              <span className="max-w-full truncate text-[9px] text-[#a1aaa2]">{mail.date}</span>
                            </div>
                            <p className="mt-1 truncate text-[10px] font-medium text-ink">{mail.subject}</p>
                            <p className="mt-1 line-clamp-1 text-[9px] text-[#8b968d]">{mail.snippet}</p>
                            {actionBadge ? (
                              <span className={`mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wide uppercase ${actionBadge.colorClass}`}>
                                {actionBadge.label}
                              </span>
                            ) : (
                              <span className="mt-2 inline-block rounded bg-[#fbf0e5] px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#a7764b]">
                                {mail.category?.toUpperCase() || "INBOX"}
                              </span>
                            )}
                          </div>
                          <a href={mail.href ?? appConfig.links.mail} target="_blank" rel="noreferrer" aria-label={"Open in Gmail"} className="mt-1 text-[#a0aaa1] hover:text-forest transition" onClick={e => e.stopPropagation()}>
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      );
                    }) : <p className="py-5 text-center text-[11px] text-muted">No unread messages in the selected inbox categories.</p>}
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

                <ReadLaterPanel links={quickLinks} onAdd={() => setShowQuickLinkModal(true)} onDelete={id => {
                  const next = quickLinks.filter(item => item.id !== id);
                  setQuickLinks(next);
                  try { localStorage.setItem("routino_links", JSON.stringify(next)); } catch {}
                  syncToDatabase({ quickLinks: next });
                }} onUpdate={link => {
                  const next = quickLinks.map(item => item.id === link.id ? link : item);
                  setQuickLinks(next);
                  try { localStorage.setItem("routino_links", JSON.stringify(next)); } catch {}
                  syncToDatabase({ quickLinks: next });
                }} />

                <MeetingFollowUps notes={notes} tasks={tasks} onOpenNote={note => { setSearchNote({ id: note.id }); setActiveNav("Notes"); }} onOpenTask={task => { setHighlightedTaskId(task.id); setActiveNav("Tasks"); }} onCreateTask={(note, text, id) => {
                  if (hasMeetingAction(tasks, note.id, id)) return;
                  addTask({ title: text, meta: `Meeting note: ${note.id} · Action: ${id}`, meetingActionKey: meetingActionKey(note.id, id), category: "meeting", priority: false });
                }} />

                {/* Quick links */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={Link2}
                    title="Quick links"
                    sub="Your frequently used places"
                    right={<div className="flex items-center gap-2"><QuickLinkManager links={quickLinks} onChange={updateQuickLinks} /><button onClick={() => setShowQuickLinkModal(true)} aria-label="Add link" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e] hover:bg-[#fdf2f2] hover:text-forest transition"><Plus size={14} /></button></div>}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[...quickLinks].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)).map((link, index) => {
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
                        <a key={key} href={link.title.trim().toLowerCase() === "outlook" || link.iconName === "outlook" ? "https://outlook.cloud.microsoft/mail/" : link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-[#edf0e9] p-3 hover:bg-[#fafbf8] hover:border-forest/20 transition group">
                          <span className={`grid h-7 w-7 place-items-center rounded-lg shadow-sm ${
                            link.iconName === "calendar" ? "bg-[#edf3ff] text-[#6088d1]" :
                            link.iconName === "mail" ? "bg-[#fbefeb] text-[#d16b5b]" :
                            link.iconName === "outlook" ? "bg-[#ebf3fc] text-[#0078d4]" :
                            link.iconName === "drive" ? "bg-[#edf3ff] text-[#4285f4]" :
                            link.iconName === "keep" ? "bg-[#fef9c3] text-[#ca8a04]" :
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
      <MorningDigestModal
        isOpen={showMorningDigest}
        onClose={() => setShowMorningDigest(false)}
        userName={liveData?.user?.name || appConfig.user.name || "Guest"}
        tasks={tasks}
        events={allEvents}
        mail={mailItems}
        unread48hEstimate={liveData?.unread48hEstimate}
        unread48hStatus={liveData?.unread48hStatus}
        unreadTotalEstimate={liveData?.unreadEstimate}
        calendarsChecked={liveData?.calendarsChecked}
        sourcesStatus={liveData?.sourcesStatus}
        isOutlookConnected={Boolean(outlookData.connected)}
        outlookSyncStatus={
          outlookData.connected
            ? (outlookData.syncStatus?.overall || "unknown")
            : "not_connected"
        }
        onCreateTaskFromMail={handleCreateTaskFromEmail}
        onOpenTask={handleOpenExistingTask}
        lastSyncedAt={liveData?.lastSyncedAt}
        onRefresh={() => {
          void fetchDashboard(true, true);
          void fetchOutlookData(true);
        }}
        isRefreshing={isSyncingGoogle}
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
        events={allEvents}
        tasks={tasks}
        onScheduleTask={scheduleTaskIntoCalendar}
        isOpen={showFocusTimer}
        onClose={() => setShowFocusTimer(false)}
        onSessionComplete={handleFocusComplete}
      />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTaskId(null);
          setTaskModalInitialData(null);
        }}
        onAddTask={editingTaskId ? saveTaskEdits : addTask}
        editing={!!editingTaskId}
        initialTask={taskModalInitialData}
        availableTasks={tasks}
      />
      <EventModal
        isOpen={showEventModal}
        onClose={() => { setShowEventModal(false); setViewingEvent(null); }}
        eventToView={viewingEvent}
        onCreateMeetingNote={event => {
          const existing = notes.find(note => note.meetingEventId === event.id);
          if (existing) { setSearchNote({ id: existing.id }); } else {
            const when = (value?: string) => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleString() : "Not provided";
            addNote({ meetingEventId: event.id, title: `Meeting: ${event.summary || "Untitled meeting"}`, content: `# ${event.summary || "Untitled meeting"}\n\nStart: ${when(event.start?.dateTime || event.start?.date)}\nEnd: ${when(event.end?.dateTime || event.end?.date)}\nAttendees: ${event.attendees?.join(", ") || "Not provided"}\n${event.htmlLink ? `Calendar: ${event.htmlLink}\n` : ""}\n## Notes\n\n## Decisions\n- Add decisions here\n\n## Action Items\nAdd action items using the note checklist; use Create task to send them to Tasks.`, color: "blue", checklist: [] });
          }
          setShowEventModal(false); setViewingEvent(null); setActiveNav("Notes");
        }}
        onFocusChange={(event, deleted) => {
          const before = viewingEvent;
          const account = currentAccount.current;
          const next = deleted ? customEvents.filter(item => item.id !== event.id) : [...customEvents.filter(item => item.id !== event.id), event];
          setCustomEvents(next);
          try { localStorage.setItem("routino_events", JSON.stringify(next)); } catch {}
          syncToDatabase({ customEvents: next });
          setLiveData(previous => previous ? { ...previous, events: (previous.events || []).filter(item => item.id !== event.id) } : previous);
          setShowEventModal(false); setViewingEvent(null);
          let undoInProgress = false;
          let undoComplete = false;
          toast(deleted ? "Focus session removed" : "Focus session rescheduled", "info", before ? { label: "Undo", onClick: async () => {
            if (undoInProgress || undoComplete) return;
            if (currentAccount.current !== account) { toast("Sign in to the original account to undo this change."); return; }
            const currentEvent = customEventsRef.current.find(item => item.id === event.id);
            if ((!deleted && JSON.stringify(currentEvent) !== JSON.stringify(event)) || (deleted && currentEvent)) { toast("Session changed since that action; undo skipped."); return; }
            let restored = before;
            undoInProgress = true;
            try {
              if (before.source === "google") {
                const response = await fetch("/api/calendar/focus", { method: deleted ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(deleted ? { title: (before.summary || "Focus session").replace(/^Focus: /, ""), description: before.description, start: before.start?.dateTime, end: before.end?.dateTime } : { id: before.id, start: before.start?.dateTime, end: before.end?.dateTime, expectedStart: event.start?.dateTime, expectedEnd: event.end?.dateTime }) });
                const result = await response.json(); if (!response.ok) throw new Error(result.error || "Calendar undo failed");
                if (deleted) restored = { ...before, id: result.event.id, htmlLink: result.event.htmlLink };
              }
              if (currentAccount.current !== account) { toast("Calendar restored, but the active account changed. Refresh the original account to load it."); undoComplete = true; return; }
              setCustomEvents(current => {
                const existing = current.find(item => item.id === event.id);
                if ((!deleted && JSON.stringify(existing) !== JSON.stringify(event)) || (deleted && existing)) { toast("Session changed since that action; undo skipped."); return current; }
                const updated = [...current.filter(item => item.id !== event.id), restored];
                try { localStorage.setItem("routino_events", JSON.stringify(updated)); } catch {}
                void syncToDatabase({ customEvents: updated }); return updated;
              });
              undoComplete = true;
              toast("Focus session restored");
            } catch (error) { toast(error instanceof Error ? error.message : "Undo failed"); } finally { undoInProgress = false; }
          } } : undefined);
        }}
        onAddEvent={addEvent}
      />
      <MailDrawer
        isOpen={!!viewingMail}
        onClose={() => setViewingMail(null)}
        mail={viewingMail}
        tasks={tasks}
        onToggleStar={toggleMailStar}
        onToggleRead={toggleMailRead}
        onCreateTask={handleCreateTaskFromEmail}
        onOpenTask={handleOpenExistingTask}
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
        notes={notes}
        subscriptions={subscriptions}
        recharges={airtelRecharges(trackersData.isLive ? trackersData.journals || {} : {}, trackerWorkspace.airtel)}
        onOpenTask={handleOpenExistingTask}
        onOpenNote={id => { setSearchNote({ id }); handleSelectNav("Notes"); }}
      />
      <BrowserReminders email={workspaceSyncReady && trackerWorkspace.ready ? liveData?.user?.email : null} tasks={tasks} subscriptions={subscriptions} airtel={trackerWorkspace.airtel} onOpenNotification={handleNotificationClick} />
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <GoogleSetupModal isOpen={showGoogleSetup} onClose={() => setShowGoogleSetup(false)} />
      <PreferencesModal
        openDataToken={preferencesDataToken}
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        focusMinutes={focusMinutes}
        onUpdateFocusMinutes={handleUpdateFocusMinutes}
        tasks={tasks}
        customEvents={customEvents}
        quickLinks={quickLinks}
        habits={habits}
        notes={notes}
        subscriptions={subscriptions}
        airtel={trackerWorkspace.airtel}
        onImportData={handleImportData}
        onClearCompletedTasks={handleClearCompletedTasks}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        userEmail={liveData?.user?.email || null}
        onSyncDatabase={handleManualSync}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        coreSaveError={workspaceSaveError}
        trackerSyncStatus={trackerWorkspace.status}
        trackerSavedAt={trackerWorkspace.savedAt}
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
              ...(data.completedDates ? { completedDates: data.completedDates } : {}),
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
