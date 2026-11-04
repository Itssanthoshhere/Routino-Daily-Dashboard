"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, Circle, Clock3, Command, ExternalLink, FileText, Focus,
  Inbox, Link2, ListTodo, Mail, Menu, MoreHorizontal, Plus, Search, Sparkles,
  Target, Timer, TriangleAlert, Video, X,
} from "lucide-react";

type DashboardEvent = {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};
type DashboardMail = { id: string; from: string; subject: string; date: string; snippet: string };
type DashboardData = { connected: boolean; events: DashboardEvent[]; unread: DashboardMail[]; error?: string };
type Task = { id: number; title: string; meta: string; checked: boolean; priority: boolean };
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
const sampleMail = [
  { initials: "RK", color: "#f0c6ae", from: "Riya Kapoor", title: "Updated proposal for your review", preview: "Could you take a look at the revised scope before tomorrow?", label: "REPLY NEEDED", time: "8:42 AM" },
  { initials: "AC", color: "#c5d8ee", from: "Aarav · CloudDesk", title: "Invoice #CD-2048 is due Friday", preview: "Your monthly workspace invoice is ready to view.", label: "PAYMENT", time: "Yesterday" },
];
const initialTasks: Task[] = [
  { id: 1, title: "Review the Q4 proposal", meta: "Before project review · 11:00 AM", checked: false, priority: true },
  { id: 2, title: "Reply to Riya about the scope", meta: "Today · Email follow-up", checked: false, priority: false },
  { id: 3, title: "Send invoice to finance", meta: "Due Friday · 2 days left", checked: false, priority: false },
  { id: 4, title: "Block focus time for roadmap", meta: "Suggested · 90 min", checked: true, priority: false },
];
const hueClasses: Record<string, string> = {
  blue: "bg-[#edf0ff] text-[#6d76b1]",
  peach: "bg-[#fbefe5] text-[#a17652]",
  green: "bg-[#eaf3e9] text-[#648266]",
};
const hues = ["blue", "peach", "green"];

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
function SectionHeading({ icon: Icon, title, sub, right }: { icon: typeof CalendarDays; title: string; sub?: string; right?: React.ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f2f4ee] text-[#526259]"><Icon size={16}/></span>
      <div><h2 className="text-[14px] font-semibold leading-tight">{title}</h2>{sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}</div>
    </div>
    {right}
  </div>;
}

export default function Home() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeNav, setActiveNav] = useState("Overview");
  const [notice, setNotice] = useState(true);
  const [liveData, setLiveData] = useState<DashboardData | null>(null);
  const done = tasks.filter(task => task.checked).length;
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (active && result.connected) setLiveData(result as DashboardData);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => { if (liveData?.connected) setNotice(false); }, [liveData]);

  const todayEvents = useMemo(() => (liveData?.events ?? []).filter(event => {
    const start = event.start?.dateTime ?? event.start?.date;
    return start && new Date(start).toDateString() === new Date().toDateString();
  }), [liveData]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const events = (liveData?.events ?? []).filter(event => {
      const start = event.start?.dateTime ?? event.start?.date;
      return start && new Date(start).toDateString() === date.toDateString();
    });
    return {
      day: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date).toUpperCase(),
      date: String(date.getDate()),
      items: events.map((event, index) => ({ time: formatTime(event.start?.dateTime), title: event.summary || "Untitled event", hue: hues[index % hues.length] })),
    };
  }), [liveData]);
  const schedule: ScheduleItem[] = liveData?.connected ? todayEvents.map((event, index) => ({
    time: formatTime(event.start?.dateTime),
    end: formatTime(event.end?.dateTime),
    name: event.summary || "Untitled event",
    detail: event.description?.slice(0, 90) || "Google Calendar",
    tag: "",
    color: ["#7b8df4", "#e7a15a", "#5fa77d"][index % 3],
  })) : sampleSchedule;
  const mailItems: Array<{ initials: string; color: string; from: string; title: string; preview: string; label: string; time: string; href?: string }> = liveData?.connected ? liveData.unread.map((mail, index) => ({
    initials: senderInitials(mail.from),
    color: ["#f0c6ae", "#c5d8ee", "#d7dfbd"][index % 3],
    from: senderName(mail.from),
    title: mail.subject || "(no subject)",
    preview: mail.snippet,
    label: "UNREAD",
    time: formatMailDate(mail.date),
    href: "https://mail.google.com/mail/u/0/#all/" + mail.id,
  })) : sampleMail;
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 6);

  return <div className="min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-line bg-[#fbfcf8] px-5 py-6 lg:flex">
      <a href="#overview" className="mb-10 flex items-center gap-3 px-1"><span className="grid h-9 w-9 place-items-center rounded-[13px] bg-forest text-accent"><Command size={19}/></span><span className="text-[15px] font-bold tracking-tight">daymark<span className="text-[#9eaaa1]">.</span></span></a>
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">Workspace</p>
      <nav className="mt-3 space-y-1">{nav.map(({ icon: Icon, label }) => <button key={label} onClick={() => setActiveNav(label)} className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition " + (activeNav === label ? "bg-[#eaf3e8] font-semibold text-forest" : "text-[#77827b] hover:bg-[#f1f3ed]")}><Icon size={16}/>{label}{label === "Inbox" && <span className="ml-auto rounded-full bg-[#f0dfc4] px-2 py-0.5 text-[10px] font-bold text-[#9b6c2a]">{liveData?.connected ? liveData.unread.length : 2}</span>}</button>)}</nav>
      <div className="mt-9"><p className="px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#a2aaa2]">Connected apps</p><div className="mt-3 space-y-1">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#4285f4] shadow-sm"><CalendarDays size={14}/></span>Google Calendar<span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")}/></div>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#58645c]"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#d86b5b] shadow-sm"><Mail size={14}/></span>Gmail<span className={"ml-auto h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#efbd60]")}/></div>
      </div></div>
      <div className="mt-5 rounded-xl border border-dashed border-[#e2e6df] px-3 py-3"><p className="text-[11px] font-medium text-[#929c93]">Not connected</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-md bg-[#f1f2ee] px-2 py-1 text-[10px] text-[#808a81]">Drive</span><span className="rounded-md bg-[#f1f2ee] px-2 py-1 text-[10px] text-[#808a81]">Sites</span></div></div>
      <div className="mt-auto rounded-2xl bg-forest p-4 text-white"><div className="mb-3 flex items-center gap-2 text-accent"><Sparkles size={15}/><span className="text-[11px] font-semibold">A calmer day</span></div><p className="text-[11px] leading-relaxed text-white/70">Your time is yours. We’ll help you spend it on what matters.</p><div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3"><div className="h-6 w-6 rounded-full bg-[#f0c6ae]"/><span className="text-[11px] text-white/85">Your workspace</span><MoreHorizontal className="ml-auto" size={15}/></div></div>
    </aside>

    <main id="overview" className="min-h-screen lg:ml-[236px]">
      <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-line bg-[#f7f7f2]/90 px-5 backdrop-blur-md sm:px-8 xl:px-10">
        <div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white lg:hidden" aria-label="Open menu"><Menu size={17}/></button><div className="hidden h-8 w-8 place-items-center rounded-[11px] bg-forest text-accent sm:grid lg:hidden"><Command size={16}/></div><div className="text-[12px] text-muted">Workspace <span className="mx-2 text-[#c4cbc3]">/</span><span className="font-medium text-ink">Overview</span></div></div>
        <div className="flex items-center gap-2"><span className={"hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:flex " + (liveData?.connected ? "border-[#dce9d8] bg-[#eef5ea] text-forest" : "border-[#eadfc6] bg-[#fbf5e9] text-[#987537]")}><span className={"h-1.5 w-1.5 rounded-full " + (liveData?.connected ? "bg-[#78a36d]" : "bg-[#e7ae51]")}/>{liveData?.connected ? "GOOGLE CONNECTED" : "PREVIEW MODE"}</span><button aria-label="Search" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-[#758078]"><Search size={15}/></button><button aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-[#758078]"><Bell size={15}/></button><div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#e4d4c2] text-[11px] font-semibold text-[#614d3f]">S</div></div>
      </header>

      <div className="mx-auto max-w-[1420px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        {notice && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#eadfc6] bg-[#fffaf0] px-4 py-3.5"><span className="mt-0.5 text-[#b28948]"><TriangleAlert size={16}/></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-[#715a31]">{liveData?.error ? "Google data needs attention" : "Connect your accounts to see your real day"}</p><p className="mt-1 text-[11px] leading-relaxed text-[#927e58]">{liveData?.error ?? (liveData?.connected ? "Calendar and unread Gmail data are connected. Tasks remain editable in this browser session. Drive and Sites aren’t integrated." : "You’re viewing sample content. Gmail and Calendar will populate after secure Google sign-in. Drive and Sites aren’t integrated.")}</p></div>{!liveData?.connected && <a className="hidden shrink-0 rounded-lg bg-forest px-3 py-2 text-[11px] font-semibold text-white sm:inline-flex" href="/api/auth/signin?provider=google">Connect Google <ArrowRight className="ml-1.5" size={13}/></a>}<button onClick={() => setNotice(false)} aria-label="Dismiss" className="text-[#a99772]"><X size={15}/></button></div>}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.12em] text-[#89948b]"><span className="h-1.5 w-1.5 rounded-full bg-[#85af83]"/>Your {new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}</div><h1 className="mt-2 text-[26px] font-semibold tracking-[-.045em] text-ink sm:text-[31px]">Make today count<span className="text-[#9aab82]">.</span></h1><p className="mt-1.5 text-[12px] text-muted">{today} <span className="mx-1.5">·</span> A little clarity goes a long way.</p></div><div className="flex items-center gap-2"><button className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] font-medium text-[#5c6960]"><CalendarDays size={14}/>Today<ChevronDown size={13}/></button>{!liveData?.connected && <a href="/api/auth/signin?provider=google" className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#204c3d]">Connect Google <ArrowUpRight size={14}/></a>}</div></div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-forest p-5 text-white shadow-card sm:col-span-2 xl:col-span-1"><div className="flex items-center justify-between"><span className="text-[11px] font-medium text-white/65">A note for today</span><Sparkles size={15} className="text-accent"/></div><p className="mt-5 max-w-[220px] text-[18px] font-medium leading-[1.4] tracking-[-.02em]">Start with what needs your <span className="text-accent">attention.</span></p><div className="mt-5 flex items-center gap-2 text-[10px] text-white/55"><span className="h-px w-6 bg-white/30"/>Your daily intention</div></div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">On your calendar</span><CalendarDays size={16} className="text-[#809184]"/></div><div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{liveData?.connected ? todayEvents.length : 3}</span><span className="text-[11px] text-muted">events today</span></div><div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><Clock3 size={13}/>{liveData?.connected ? (todayEvents[0] ? <>Next at <strong className="text-ink">{formatTime(todayEvents[0].start?.dateTime)}</strong></> : "No more events today") : <>Next up at <strong className="text-ink">9:30 AM</strong></>}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">Needs a response</span><Inbox size={16} className="text-[#bd8054]"/></div><div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">{liveData?.connected ? liveData.unread.length : 2}</span><span className="text-[11px] text-muted">unread emails</span></div><div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#d79257]"/>{liveData?.connected ? "Filtered to important inbox categories" : "1 reply · 1 payment update"}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-medium text-muted">A good pace</span><Timer size={16} className="text-[#819a65]"/></div><div className="mt-4 flex items-baseline gap-2"><span className="text-[30px] font-semibold tracking-[-.05em]">90</span><span className="text-[11px] text-muted">min focus planned</span></div><div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-[#6e7c72]"><span className="h-1.5 w-1.5 rounded-full bg-[#87ac6c]"/>Room for breaks between meetings</div></div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading icon={CalendarDays} title="Today’s schedule" sub="A quick look at what’s ahead" right={<a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-[#648170]">Open calendar <ArrowRight size={12} className="ml-1 inline"/></a>}/><div className="mb-4 flex items-center gap-2 rounded-xl bg-[#faf6ed] px-3 py-2.5 text-[10px] text-[#90744a]"><Sparkles size={13}/><span><strong>{liveData?.connected ? "Your calendar:" : "One thing to prep:"}</strong> {liveData?.connected ? "Events for today and the coming week are synced from Google Calendar." : "have your Q4 proposal notes ready for the 11 AM review."}</span></div><div className="space-y-0">{schedule.length ? schedule.map(item => <div key={item.time + item.name} className="relative flex gap-4 pb-5 last:pb-0"><div className="w-[46px] shrink-0 pt-0.5 text-right text-[10px] font-medium tabular-nums text-[#89948b]">{item.time}</div><div className="relative flex-1 border-l border-[#edf0e9] pl-4"><span className="absolute -left-[4px] top-[4px] h-[7px] w-[7px] rounded-full border-2 border-white" style={{ background: item.color }}/><div className="flex items-start justify-between gap-3"><div><h3 className="text-[12px] font-semibold">{item.name}</h3><p className="mt-1 text-[10px] text-muted">{item.detail}</p></div><div className="flex items-center gap-2"><span className="hidden text-[10px] text-[#a0aaa1] sm:inline">{item.time}–{item.end}</span>{item.tag && <span className="rounded-md bg-[#faf1e4] px-2 py-1 text-[9px] font-bold tracking-wide text-[#a5793d]">{item.tag}</span>}</div></div></div></div>) : <p className="py-5 text-center text-[11px] text-muted">No more events on your calendar today.</p>}</div><div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[10px] text-muted"><span>{liveData?.connected ? todayEvents.length + " events today · From Google Calendar" : "3 sample events · Preview only"}</span><a href="#week" className="font-semibold text-[#648170]">See next 7 days <ArrowDownRight size={12} className="ml-1 inline"/></a></div></section>
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading icon={ListTodo} title="Your priorities" sub={done + " of " + tasks.length + " complete · Keep it manageable"} right={<button aria-label="Add task" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e]"><Plus size={14}/></button>}/><div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#f0f2ed]"><div className="h-full rounded-full bg-[#a2c38c] transition-all" style={{ width: (done / tasks.length * 100) + "%" }}/></div><div className="space-y-1">{tasks.map(task => <button onClick={() => setTasks(tasks.map(item => item.id === task.id ? { ...item, checked: !item.checked } : item))} key={task.id} className="group flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition hover:bg-[#f8f9f5]"><span className={"mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border " + (task.checked ? "border-[#a0bd8b] bg-[#a0bd8b] text-white" : "border-[#d6ddd4] text-transparent group-hover:border-[#9fb39f]")}>{task.checked ? <Check size={11}/> : <Circle size={10}/>}</span><span className="min-w-0 flex-1"><span className={"block text-[11px] font-medium " + (task.checked ? "text-[#9aa49b] line-through" : "text-[#314239]")}>{task.title}</span><span className="mt-1 block text-[10px] text-[#98a198]">{task.meta}</span></span>{task.priority && !task.checked ? <span className="mt-0.5 rounded-md bg-[#fcf0e7] px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#b4794e]">FIRST</span> : null}</button>)}</div><button className="mt-3 w-full rounded-xl border border-dashed border-[#dfe5dc] py-2.5 text-[10px] font-semibold text-[#79887b] hover:bg-[#fafbf8]"><Plus size={12} className="mr-1 inline"/> Add a personal task</button></section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading icon={CalendarDays} title="The week ahead" sub="Today + the next 6 days" right={<span className="rounded-lg bg-[#f4f5f0] px-2.5 py-1.5 text-[10px] text-[#77837a]">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())} – {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(rangeEnd)} <ChevronDown size={12} className="ml-1 inline"/></span>}/><div id="week" className="grid grid-cols-7 gap-1.5">{weekDays.map((day, index) => <div key={day.day + day.date} className={"min-h-[112px] rounded-xl p-2 " + (index === 0 ? "bg-[#f4f7ef]" : "bg-[#fafbf8]")}><p className={"text-center text-[8px] font-bold tracking-wide " + (index === 0 ? "text-forest" : "text-[#9da79e]")}>{day.day}</p><p className={"mx-auto mt-1 grid h-6 w-6 place-items-center rounded-full text-[10px] " + (index === 0 ? "bg-forest font-semibold text-white" : "text-[#68766c]")}>{day.date}</p><div className="mt-2 space-y-1">{day.items.map(item => <div key={item.title} className={"truncate rounded px-1 py-1 text-[8px] font-medium leading-tight " + hueClasses[item.hue]}><span className="hidden 2xl:inline">{item.time} </span>{item.title}</div>)}</div></div>)}</div><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#9aa49b]"><span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#9aa7e5]"/>Work</span><span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#dca779]"/>Deadline</span><span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#85b08c]"/>Personal</span></div></section>
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading icon={Mail} title="Worth a look" sub={liveData?.connected ? "Unread messages from Gmail" : "Sample messages · connect to load your inbox"} right={<span className="rounded-full bg-[#f7eee4] px-2.5 py-1 text-[9px] font-bold text-[#a2764b]">{liveData?.connected ? liveData.unread.length + " UNREAD" : "2 SAMPLE"}</span>}/><div className="divide-y divide-[#eff1ec]">{mailItems.length ? mailItems.map((mail, index) => <div key={mail.title + index} className="flex gap-3 py-3 first:pt-0 last:pb-0"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold text-[#4d5b52]" style={{ background: mail.color }}>{mail.initials}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-[10px] font-semibold text-[#33433a]">{mail.from}</p><span className="shrink-0 text-[9px] text-[#a1aaa2]">{mail.time}</span></div><p className="mt-1 truncate text-[10px] font-medium text-ink">{mail.title}</p><p className="mt-1 line-clamp-1 text-[9px] text-[#8b968d]">{mail.preview}</p><span className="mt-2 inline-block rounded bg-[#fbf0e5] px-1.5 py-1 text-[8px] font-bold tracking-wide text-[#a7764b]">{mail.label}</span></div><a href={mail.href ?? "https://mail.google.com"} target="_blank" rel="noreferrer" aria-label={"Open " + mail.title + " in Gmail"} className="mt-1 text-[#a0aaa1]"><ExternalLink size={13}/></a></div>) : <p className="py-5 text-center text-[11px] text-muted">No unread messages in the selected inbox categories.</p>}</div><div className="mt-3 border-t border-[#eff1ec] pt-3"><p className="text-[9px] leading-relaxed text-[#9aa49b]">Only sender, subject, date, and short snippet are shown. Full messages stay in Gmail.</p></div></section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading icon={Clock3} title="Make room for focus" sub="A gentle shape for the rest of your day" right={<button aria-label="More options" className="text-[#9aa49b]"><MoreHorizontal size={17}/></button>}/><div className="space-y-2"><div className="flex items-center gap-3 rounded-xl bg-[#f4f7ef] px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#7d9b68]"><Focus size={15}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold">Focused work</p><p className="mt-0.5 text-[9px] text-muted">Roadmap planning · 90 minutes</p></div><span className="text-[9px] font-medium text-[#82917f]">12:15 PM</span></div><div className="flex items-center gap-3 rounded-xl bg-[#fafbf8] px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#a18b64]"><Timer size={15}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold">Take a breather</p><p className="mt-0.5 text-[9px] text-muted">A real lunch, away from your screen</p></div><span className="text-[9px] font-medium text-[#929d92]">1:00 PM</span></div></div><button className="mt-3 text-[10px] font-semibold text-[#648170]">Adjust your plan <ArrowRight size={12} className="ml-1 inline"/></button></section>
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading icon={Link2} title="Quick links" sub="Your frequently used places" right={<button aria-label="Add link" className="grid h-7 w-7 place-items-center rounded-lg border border-line text-[#7c887e]"><Plus size={14}/></button>}/><div className="grid grid-cols-2 gap-2.5"><a href="https://calendar.google.com" className="flex items-center gap-2.5 rounded-xl border border-[#edf0e9] p-3 hover:bg-[#fafbf8]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#edf3ff] text-[#6088d1]"><CalendarDays size={14}/></span><span className="min-w-0"><span className="block truncate text-[10px] font-semibold">Google Calendar</span><span className="mt-0.5 block text-[9px] text-[#98a198]">Your schedule</span></span><ExternalLink className="ml-auto shrink-0 text-[#b0b8b0]" size={11}/></a><a href="https://mail.google.com" className="flex items-center gap-2.5 rounded-xl border border-[#edf0e9] p-3 hover:bg-[#fafbf8]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#fbefeb] text-[#d16b5b]"><Mail size={14}/></span><span className="min-w-0"><span className="block truncate text-[10px] font-semibold">Gmail</span><span className="mt-0.5 block text-[9px] text-[#98a198]">Your inbox</span></span><ExternalLink className="ml-auto shrink-0 text-[#b0b8b0]" size={11}/></a><div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#e5e9e2] p-3 opacity-70"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f1f2ee] text-[#969f96]"><FileText size={14}/></span><span><span className="block text-[10px] font-semibold">Google Drive</span><span className="mt-0.5 block text-[9px] text-[#98a198]">Not integrated</span></span></div><div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#e5e9e2] p-3 opacity-70"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f1f2ee] text-[#969f96]"><Link2 size={14}/></span><span><span className="block text-[10px] font-semibold">Google Sites</span><span className="mt-0.5 block text-[9px] text-[#98a198]">Not integrated</span></span></div></div></section>
        </div>
        <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line pt-5 text-[9px] text-[#9ca69d] sm:flex-row"><span>daymark · A little more room to think</span><span className="flex items-center gap-2"><span>Private by design</span><span>·</span><span>Google Drive & Sites not integrated</span></span></footer>
      </div>
    </main>
  </div>;
}
