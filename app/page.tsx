"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, Circle, Clock3, Command, ExternalLink, FileText, Focus,
  Inbox, Link2, ListTodo, Mail, Menu, MoreHorizontal, Plus, Search, Sparkles,
  Target, Timer, TriangleAlert, Video, X,
} from "lucide-react";
import { connectGoogle } from "./actions";

import type { Task, DashboardEvent, DashboardMail, DashboardData, QuickLink, NotificationItem } from "@/types/dashboard";
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
import { CalendarView } from "@/components/views/CalendarView";
import { InboxView } from "@/components/views/InboxView";
import { TasksView } from "@/components/views/TasksView";
import { playTick } from "@/lib/sound";
import { appConfig } from "@/lib/config";

/* ─── Sample / seed data ────────────────────────────────────────── */

type ScheduleItem = { time: string; end: string; name: string; detail: string; tag: string; color: string };

const nav = [
  { icon: Target, label: "Overview" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Inbox, label: "Inbox" },
  { icon: ListTodo, label: "Tasks" },
];

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
  { id: "t-1", title: "Review the Q4 proposal", meta: "Before project review · 11:00 AM", checked: false, priority: true, category: "work", createdAt: 1 },
  { id: "t-2", title: "Reply to Riya about the scope", meta: "Today · Email follow-up", checked: false, priority: false, category: "personal", createdAt: 2 },
  { id: "t-3", title: "Send invoice to finance", meta: "Due Friday · 2 days left", checked: false, priority: false, category: "urgent", createdAt: 3 },
  { id: "t-4", title: "Block focus time for roadmap", meta: "Suggested · 90 min", checked: true, priority: false, category: "work", createdAt: 4 },
];

const seedLinks: QuickLink[] = [
  { id: "ql-1", title: "Google Calendar", subtitle: "Your schedule", url: appConfig.links.calendar, iconName: "calendar", available: true },
  { id: "ql-2", title: "Gmail", subtitle: "Your inbox", url: appConfig.links.mail, iconName: "mail", available: true },
  { id: "ql-3", title: "Google Drive", subtitle: "Not integrated", url: "#", iconName: "drive", available: false },
  { id: "ql-4", title: "Google Sites", subtitle: "Not integrated", url: "#", iconName: "sites", available: false },
];

const seedNotifications: NotificationItem[] = [
  { id: "n-1", title: "Weekly team sync starts in 30 min", time: "9:00 AM", type: "calendar", read: false, navTarget: "Calendar" },
  { id: "n-2", title: "Riya Kapoor replied to your thread", time: "8:42 AM", type: "mail", read: false, navTarget: "Inbox" },
  { id: "n-3", title: "Task 'Q4 proposal' is due today", time: "Yesterday", type: "task", read: false, navTarget: "Tasks" },
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
  const [activeNav, setActiveNav] = useState("Overview");
  const [notice, setNotice] = useState(true);
  const [liveData, setLiveData] = useState<DashboardData | null>(null);
  const [customEvents, setCustomEvents] = useState<DashboardEvent[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(seedLinks);
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);
  const [mailItems, setMailItems] = useState<DashboardMail[]>(sampleMail);
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
  const [viewingEvent, setViewingEvent] = useState<DashboardEvent | null>(null);
  const [viewingMail, setViewingMail] = useState<DashboardMail | null>(null);

  /* ── Derived ── */
  const done = tasks.filter(t => t.checked).length;
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  /* ── LocalStorage Hydration ── */
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem("routino_tasks") || localStorage.getItem("daymark_tasks");
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const storedLinks = localStorage.getItem("routino_links") || localStorage.getItem("daymark_links");
      if (storedLinks) setQuickLinks(JSON.parse(storedLinks));

      const storedEvents = localStorage.getItem("routino_events") || localStorage.getItem("daymark_events");
      if (storedEvents) setCustomEvents(JSON.parse(storedEvents));

      const storedFocus = localStorage.getItem("routino_focus") || localStorage.getItem("daymark_focus");
      if (storedFocus) setFocusMinutes(parseInt(storedFocus, 10));

      if (window.location.search.includes("setup=google")) {
        setShowGoogleSetup(true);
      }
    } catch {
      // Fallback
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("routino_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("routino_links", JSON.stringify(quickLinks));
    } catch {}
  }, [quickLinks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("routino_events", JSON.stringify(customEvents));
    } catch {}
  }, [customEvents, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("routino_focus", String(focusMinutes));
    } catch {}
  }, [focusMinutes, hydrated]);

  /* ── Toast helper ── */
  const toast = useCallback((message: string, type: "success" | "info" = "success") => {
    const id = "toast-" + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  /* ── Keyboard shortcut: Cmd+K ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ── Fetch live data from Google OAuth ── */
  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" }).then(async r => {
      const result = await r.json();
      if (active && result.connected) {
        setLiveData(result as DashboardData);
        if (result.unread && result.unread.length > 0) {
          setMailItems(result.unread.map((m: DashboardMail) => ({
            ...m,
            href: "https://mail.google.com/mail/u/0/#all/" + m.id,
            read: false,
          })));
        }
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => { if (liveData?.connected) setNotice(false); }, [liveData]);

  /* ── Computed calendar data ── */
  const allEvents = useMemo(() => {
    const live = liveData?.events ?? [];
    return [...live, ...customEvents];
  }, [liveData, customEvents]);

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
      items: events.map((ev, i) => ({ time: formatTime(ev.start?.dateTime), title: ev.summary || "Untitled event", hue: hues[i % hues.length] })),
    };
  }), [allEvents]);

  const schedule: ScheduleItem[] = liveData?.connected || customEvents.length > 0
    ? [...(liveData?.connected ? todayEvents.filter(e => !e.isCustom) : []), ...customEvents.filter(e => {
        const start = e.start?.dateTime ?? e.start?.date;
        return start && new Date(start).toDateString() === new Date().toDateString();
      })].map((ev, i) => ({
        time: formatTime(ev.start?.dateTime),
        end: formatTime(ev.end?.dateTime),
        name: ev.summary || "Untitled event",
        detail: ev.description?.slice(0, 90) || "Google Calendar",
        tag: ev.tag || "",
        color: ev.color || ["#7b8df4", "#e7a15a", "#5fa77d"][i % 3],
      }))
    : sampleSchedule;

  const displaySchedule = schedule.length > 0 ? schedule : sampleSchedule;
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 6);

  /* ── Handlers ── */
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, checked: !t.checked };
      if (next.checked) {
        playTick();
        toast(`"${t.title}" marked complete`);
      }
      return next;
    }));
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) toast(`"${task.title}" removed`, "info");
  };

  const addTask = (data: Omit<Task, "id" | "checked" | "createdAt">) => {
    const newTask: Task = { ...data, id: "t-" + Date.now(), checked: false, createdAt: Date.now() };
    setTasks(prev => [newTask, ...prev]);
    toast(`"${newTask.title}" added to priorities`);
  };

  const addEvent = (event: DashboardEvent) => {
    setCustomEvents(prev => [...prev, event]);
    toast(`"${event.summary}" scheduled`);
  };

  const addQuickLink = (link: QuickLink) => {
    setQuickLinks(prev => [...prev, link]);
    toast(`"${link.title}" added to quick links`);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.navTarget) setActiveNav(item.navTarget);
    setNotifications(prev => prev.filter(n => n.id !== item.id));
    setShowNotifications(false);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast("All notifications cleared", "info");
  };

  const toggleMailStar = (id: string) => {
    setMailItems(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
  };

  const toggleMailRead = (id: string) => {
    setMailItems(prev => prev.map(m => m.id === id ? { ...m, read: !m.read } : m));
  };

  const resetData = () => {
    localStorage.removeItem("routino_tasks");
    localStorage.removeItem("routino_links");
    localStorage.removeItem("routino_events");
    localStorage.removeItem("routino_focus");
    localStorage.removeItem("daymark_tasks");
    localStorage.removeItem("daymark_links");
    localStorage.removeItem("daymark_events");
    localStorage.removeItem("daymark_focus");
    setTasks(seedTasks);
    setCustomEvents([]);
    setQuickLinks(seedLinks);
    setNotifications(seedNotifications);
    setMailItems(sampleMail);
    setFocusMinutes(appConfig.defaults.focusMinutes);
    toast("Dashboard reset to defaults", "info");
  };

  const handleFocusComplete = (mins: number) => {
    setFocusMinutes(prev => prev + mins);
    toast(`Focus session complete! ${mins} minutes logged.`);
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen">
      {/* ─── Sidebar (desktop) ─── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-line bg-[#fbfcf8] px-5 py-6 lg:flex">
        <a href="#overview" onClick={() => setActiveNav("Overview")} className="mb-10 flex items-center gap-3 px-1">
          <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-forest text-accent"><Command size={19} /></span>
          <span className="text-[15px] font-bold tracking-tight">{appConfig.name.toLowerCase()}<span className="text-[#9eaaa1]">.</span></span>
        </a>
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">Workspace</p>
        <nav className="mt-3 space-y-1">
          {nav.map(({ icon: Icon, label }) => (
            <button key={label} onClick={() => setActiveNav(label)} className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition " + (activeNav === label ? "bg-[#eaf3e8] font-semibold text-forest" : "text-[#77827b] hover:bg-[#f1f3ed]")}>
              <Icon size={16} />{label}
              {label === "Inbox" && <span className="ml-auto rounded-full bg-[#f0dfc4] px-2 py-0.5 text-[10px] font-bold text-[#9b6c2a]">{mailItems.filter(m => !m.read).length}</span>}
              {label === "Tasks" && <span className="ml-auto rounded-full bg-[#e8efe4] px-2 py-0.5 text-[10px] font-bold text-forest">{tasks.filter(t => !t.checked).length}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-9">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">Connected apps</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#4285f4] shadow-sm"><CalendarDays size={14} /></span>
              Google Calendar
              <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#d86b5b] shadow-sm"><Mail size={14} /></span>
              Gmail
              <span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")} />
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-[#e2e6df] px-3 py-3">
          <p className="text-[11px] font-medium text-[#929c93]">Not connected</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#f1f2ee] px-2 py-1 text-[10px] text-[#808a81]">Drive</span>
            <span className="rounded-md bg-[#f1f2ee] px-2 py-1 text-[10px] text-[#808a81]">Sites</span>
          </div>
        </div>
        <div className="mt-auto rounded-2xl bg-forest p-4 text-white">
          <div className="mb-3 flex items-center gap-2 text-accent"><Sparkles size={15} /><span className="text-[11px] font-semibold">A calmer day</span></div>
          <p className="text-[11px] leading-relaxed text-white/70">{appConfig.tagline}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
            <div className="h-6 w-6 rounded-full bg-[#f0c6ae]" />
            <span className="text-[11px] text-white/85">{appConfig.user.name}&apos;s workspace</span>
            <MoreHorizontal className="ml-auto" size={15} />
          </div>
        </div>
      </aside>

      {/* ─── Mobile sidebar ─── */}
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        unreadCount={mailItems.filter(m => !m.read).length}
        isConnected={!!liveData?.connected}
      />

      {/* ─── Main ─── */}
      <main id="overview" className="min-h-screen lg:ml-[236px]">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-line bg-[#f7f7f2]/90 px-5 backdrop-blur-md sm:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileSidebar(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white lg:hidden" aria-label="Open menu"><Menu size={17} /></button>
            <div className="hidden h-8 w-8 place-items-center rounded-[11px] bg-forest text-accent sm:grid lg:hidden"><Command size={16} /></div>
            <div className="text-[12px] text-muted">Workspace <span className="mx-2 text-[#c4cbc3]">/</span><span className="font-semibold text-ink">{activeNav}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className={"hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:flex " + (liveData?.connected ? "border-[#dce9d8] bg-[#eef5ea] text-forest" : "border-[#eadfc6] bg-[#fbf5e9] text-[#987537]")}>
              <span className={"h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#e7ae51]")} />
              {liveData?.connected ? "GOOGLE CONNECTED" : "PREVIEW MODE"}
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
              <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#e4d4c2] text-[11px] font-semibold text-[#614d3f] hover:ring-2 hover:ring-forest/20 transition">
                {appConfig.user.initial}
              </button>
              <UserMenuPopover
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                isConnected={!!liveData?.connected}
                onResetData={resetData}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-[1420px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
          {/* Notice banner */}
          {notice && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#eadfc6] bg-[#fffaf0] px-4 py-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="mt-0.5 text-[#b28948]"><TriangleAlert size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#715a31]">{liveData?.error ? "Google data needs attention" : "Connect your accounts to see your real day"}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#927e58]">{liveData?.error ?? (liveData?.connected ? "Calendar and unread Gmail data are connected. Tasks remain editable in this browser session. Drive and Sites aren't integrated." : "You're viewing sample content. Gmail and Calendar will populate after secure Google sign-in. Drive and Sites aren't integrated.")}</p>
              </div>
              {!liveData?.connected && (
                <form action={connectGoogle} className="hidden shrink-0 sm:inline-flex">
                  <button className="rounded-lg bg-forest px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#204c3d] transition">Connect Google <ArrowRight className="ml-1.5 inline" size={13} /></button>
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
              isConnected={!!liveData?.connected}
            />
          ) : activeNav === "Inbox" ? (
            <InboxView
              mailList={mailItems}
              onSelectMail={(m) => setViewingMail(m)}
              onToggleStar={toggleMailStar}
              onToggleRead={toggleMailRead}
              isConnected={!!liveData?.connected}
            />
          ) : activeNav === "Tasks" ? (
            <TasksView
              tasks={tasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onAddTask={addTask}
              onOpenTaskModal={() => setShowTaskModal(true)}
            />
          ) : (
            /* ─── OVERVIEW DASHBOARD VIEW ─── */
            <>
              {/* Page heading */}
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.12em] text-[#89948b]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#85af83] animate-pulse" />Your {new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}
                  </div>
                  <h1 className="mt-2 text-[26px] font-semibold tracking-[-.045em] text-ink sm:text-[31px]">Make today count<span className="text-[#9aab82]">.</span></h1>
                  <p className="mt-1.5 text-[12px] text-muted">{today} <span className="mx-1.5">·</span> A little clarity goes a long way.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveNav("Calendar")} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"><CalendarDays size={14} />Today<ChevronDown size={13} /></button>
                  {!liveData?.connected && (
                    <form action={connectGoogle}>
                      <button className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#204c3d]">Connect Google <ArrowUpRight size={14} /></button>
                    </form>
                  )}
                </div>
              </div>

              {/* ─── Summary cards ─── */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* Intention card */}
                <div className="rounded-2xl bg-forest p-5 text-white shadow-card sm:col-span-2 xl:col-span-1 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-white/65">A note for today</span><Sparkles size={15} className="text-accent" /></div>
                  <p className="mt-5 max-w-[220px] text-[18px] font-medium leading-[1.4] tracking-[-.02em]">Start with what needs your <span className="text-accent">attention.</span></p>
                  <div className="mt-5 flex items-center gap-2 text-[10px] text-white/55"><span className="h-px w-6 bg-white/30" />Your daily intention</div>
                </div>

                {/* Calendar summary */}
                <button onClick={() => setActiveNav("Calendar")} className="rounded-2xl border border-line bg-white p-5 shadow-card text-left hover:shadow-lg hover:border-forest/20 transition-all group">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">On your calendar</span><CalendarDays size={16} className="text-[#809184] group-hover:text-forest transition" /></div>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{liveData?.connected ? todayEvents.length : displaySchedule.length}</span><span className="text-[11px] text-muted">events today</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]">
                    <Clock3 size={13} />
                    {liveData?.connected
                      ? (todayEvents[0] ? <>Next at <strong className="text-ink">{formatTime(todayEvents[0].start?.dateTime)}</strong></> : "No more events today")
                      : <>Next up at <strong className="text-ink">9:30 AM</strong></>}
                  </div>
                </button>

                {/* Inbox summary */}
                <button onClick={() => setActiveNav("Inbox")} className="rounded-2xl border border-line bg-white p-5 shadow-card text-left hover:shadow-lg hover:border-[#bd8054]/20 transition-all group">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">Needs a response</span><Inbox size={16} className="text-[#bd8054] group-hover:text-[#a0622e] transition" /></div>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{mailItems.filter(m => !m.read).length}</span><span className="text-[11px] text-muted">unread emails</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#d79257]" />{liveData?.connected ? "Filtered to important inbox categories" : "1 reply · 1 payment update"}</div>
                </button>

                {/* Focus summary */}
                <button onClick={() => setShowFocusTimer(true)} className="rounded-2xl border border-line bg-white p-5 shadow-card text-left hover:shadow-lg hover:border-[#819a65]/20 transition-all group">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">A good pace</span><Timer size={16} className="text-[#819a65] group-hover:text-forest transition" /></div>
                  <div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{focusMinutes}</span><span className="text-[11px] text-muted">min focus planned</span></div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#87ac6c] animate-pulse" />Click to start a focus session</div>
                </button>
              </div>

              {/* ─── Schedule + Tasks row ─── */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
                {/* Today's schedule */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={CalendarDays}
                    title="Today's schedule"
                    sub="A quick look at what's ahead"
                    right={
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setViewingEvent(null); setShowEventModal(true); }} className="rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold text-forest hover:bg-[#eaf3e8] transition">
                          <Plus size={11} className="mr-0.5 inline" /> Add
                        </button>
                        <button onClick={() => setActiveNav("Calendar")} className="text-[10px] font-semibold text-[#648170] hover:text-forest transition">Calendar view <ArrowRight size={12} className="ml-1 inline" /></button>
                      </div>
                    }
                  />
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#faf6ed] px-3 py-2.5 text-[10px] text-[#90744a]">
                    <Sparkles size={13} />
                    <span><strong>{liveData?.connected ? "Your calendar:" : "One thing to prep:"}</strong> {liveData?.connected ? "Events for today and the coming week are synced from Google Calendar." : "have your Q4 proposal notes ready for the 11 AM review."}</span>
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
                            <div className="flex items-center gap-2">
                              <span className="hidden text-[10px] text-[#a0aaa1] sm:inline">{item.time}–{item.end}</span>
                              {item.tag && <span className="rounded-md bg-[#faf1e4] px-2 py-1 text-[9px] font-bold tracking-wide text-[#a5793d]">{item.tag}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : <p className="py-5 text-center text-[11px] text-muted">No more events on your calendar today.</p>}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[10px] text-muted">
                    <span>{liveData?.connected ? todayEvents.length + " events today · From Google Calendar" : displaySchedule.length + " events · Click to view details"}</span>
                    <button onClick={() => setActiveNav("Calendar")} className="font-semibold text-[#648170] hover:text-forest">Full 7-day view <ArrowDownRight size={12} className="ml-1 inline" /></button>
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
                        <button onClick={() => setShowTaskModal(true)} aria-label="Add task" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e] hover:bg-[#eaf3e8] hover:text-forest transition">
                          <Plus size={14} />
                        </button>
                      </div>
                    }
                  />
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#f0f2ed]">
                    <div className="h-full rounded-full bg-[#a2c38c] transition-all duration-500 ease-out" style={{ width: (tasks.length > 0 ? done / tasks.length * 100 : 0) + "%" }} />
                  </div>
                  <div className="space-y-1">
                    {tasks.map(task => (
                      <div key={task.id} className="group flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition hover:bg-[#f8f9f5]">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={"mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border transition-all duration-200 " + (task.checked ? "border-[#a0bd8b] bg-[#a0bd8b] text-white scale-110" : "border-[#d6ddd4] text-transparent group-hover:border-[#9fb39f]")}
                        >
                          {task.checked ? <Check size={11} /> : <Circle size={10} />}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className={"block text-[11px] font-medium transition-all duration-200 " + (task.checked ? "text-[#9aa49b] line-through" : "text-[#314239]")}>{task.title}</span>
                          <span className="mt-1 flex items-center gap-2 text-[10px] text-[#98a198]">
                            {task.meta}
                            {task.category && (
                              <span className={`rounded px-1 py-0.5 text-[8px] font-bold ${
                                task.category === "urgent" ? "bg-[#fce8e6] text-[#c05746]" :
                                task.category === "meeting" ? "bg-[#edf0ff] text-[#6d76b1]" :
                                task.category === "personal" ? "bg-[#eaf3e9] text-[#648266]" :
                                "bg-[#f1f2ee] text-[#808a81]"
                              }`}>{task.category.toUpperCase()}</span>
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
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setShowTaskModal(true)} className="flex-1 rounded-xl border border-dashed border-[#dfe5dc] py-2.5 text-[10px] font-semibold text-[#79887b] hover:bg-[#fafbf8] hover:border-forest/30 transition">
                      <Plus size={12} className="mr-1 inline" /> Add a personal task
                    </button>
                    <button onClick={() => setActiveNav("Tasks")} className="rounded-xl border border-line bg-white px-3 py-2.5 text-[10px] font-semibold text-forest hover:bg-[#eaf3e8] transition">
                      Manage all →
                    </button>
                  </div>
                </section>
              </div>

              {/* ─── Week + Inbox row ─── */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
                {/* Week ahead */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={CalendarDays}
                    title="The week ahead"
                    sub="Today + the next 6 days"
                    right={<button onClick={() => setActiveNav("Calendar")} className="rounded-lg bg-[#f4f5f0] px-2.5 py-1.5 text-[10px] text-[#77837a] hover:bg-[#eef2ea] transition">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())} – {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(rangeEnd)} <ChevronDown size={12} className="ml-1 inline" /></button>}
                  />
                  <div id="week" className="grid grid-cols-7 gap-1.5">
                    {weekDays.map((day, index) => (
                      <div
                        key={day.day + day.date}
                        onClick={() => setActiveNav("Calendar")}
                        className={"min-h-[112px] rounded-xl p-2 cursor-pointer transition-colors " + (index === 0 ? "bg-[#f4f7ef] ring-1 ring-forest/10" : "bg-[#fafbf8] hover:bg-[#f4f7ef]")}
                      >
                        <p className={"text-center text-[8px] font-bold tracking-wide " + (index === 0 ? "text-forest" : "text-[#9da79e]")}>{day.day}</p>
                        <p className={"mx-auto mt-1 grid h-6 w-6 place-items-center rounded-full text-[10px] " + (index === 0 ? "bg-forest font-semibold text-white" : "text-[#68766c]")}>{day.date}</p>
                        <div className="mt-2 space-y-1">
                          {day.items.map(item => (
                            <div key={item.title} className={"truncate rounded px-1 py-1 text-[8px] font-medium leading-tight hover:opacity-80 transition " + hueClasses[item.hue]}>
                              <span className="hidden 2xl:inline">{item.time} </span>{item.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
                    sub={liveData?.connected ? "Unread messages from Gmail" : "Sample messages · connect to load your inbox"}
                    right={
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setActiveNav("Inbox")} className="rounded-full bg-[#f7eee4] px-2.5 py-1 text-[9px] font-bold text-[#a2764b] hover:bg-[#ebdcc9] transition">
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
                    <button onClick={() => setActiveNav("Inbox")} className="text-[10px] font-semibold text-forest hover:underline">View all inbox →</button>
                  </div>
                </section>
              </div>

              {/* ─── Focus + Quick links row ─── */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {/* Focus plan */}
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                  <SectionHeading
                    icon={Clock3}
                    title="Make room for focus"
                    sub="A gentle shape for the rest of your day"
                    right={<button onClick={() => setShowFocusTimer(true)} aria-label="Start focus timer" className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold text-forest hover:bg-[#eaf3e8] transition"><Focus size={12} className="mr-1 inline" /> Timer</button>}
                  />
                  <div className="space-y-2">
                    <button onClick={() => setShowFocusTimer(true)} className="flex w-full items-center gap-3 rounded-xl bg-[#f4f7ef] px-3 py-3 text-left hover:bg-[#eaf3e8] transition group">
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
                    right={<button onClick={() => setShowQuickLinkModal(true)} aria-label="Add link" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e] hover:bg-[#eaf3e8] hover:text-forest transition"><Plus size={14} /></button>}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    {quickLinks.map(link => {
                      const IconComponent = linkIcons[link.iconName] || Link2;
                      if (!link.available) {
                        return (
                          <div key={link.id} className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#e5e9e2] p-3 opacity-70">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f1f2ee] text-[#969f96]"><IconComponent size={14} /></span>
                            <span>
                              <span className="block text-[10px] font-semibold">{link.title}</span>
                              <span className="mt-0.5 block text-[9px] text-[#98a198]">{link.subtitle}</span>
                            </span>
                          </div>
                        );
                      }
                      return (
                        <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-[#edf0e9] p-3 hover:bg-[#fafbf8] hover:border-forest/20 transition group">
                          <span className={`grid h-7 w-7 place-items-center rounded-lg shadow-sm ${
                            link.iconName === "calendar" ? "bg-[#edf3ff] text-[#6088d1]" :
                            link.iconName === "mail" ? "bg-[#fbefeb] text-[#d16b5b]" :
                            "bg-[#eaf3e8] text-forest"
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
            </>
          )}

          {/* Footer */}
          <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line pt-5 text-[9px] text-[#9ca69d] sm:flex-row">
            <span>{appConfig.name.toLowerCase()} · {appConfig.tagline}</span>
            <span className="flex items-center gap-2"><span>Private by design</span><span>·</span><span>Google Drive & Sites not integrated</span></span>
          </footer>
        </div>
      </main>

      {/* ─── Modals & overlays ─── */}
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
        onNavigate={setActiveNav}
        onOpenFocusTimer={() => setShowFocusTimer(true)}
        onOpenAddTask={() => setShowTaskModal(true)}
        onOpenAddEvent={() => setShowEventModal(true)}
        tasks={tasks}
        events={allEvents}
      />
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <GoogleSetupModal isOpen={showGoogleSetup} onClose={() => setShowGoogleSetup(false)} />
    </div>
  );
}
