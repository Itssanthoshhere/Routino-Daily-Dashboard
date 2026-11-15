"use client";

import { useMemo } from "react";
import {
  X,
  Sparkles,
  Calendar,
  Mail,
  CheckCircle2,
  Clock3,
  Shield,
  CreditCard,
  Server,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { Task, DashboardEvent, DashboardMail, CalendarCheckInfo } from "@/types/dashboard";
import { classifyEmail } from "@/lib/email-classifier";
import { appConfig } from "@/lib/config";

type MorningDigestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  tasks: Task[];
  events: DashboardEvent[];
  mail: DashboardMail[];
  unread48hEstimate?: number | null;
  unreadTotalEstimate?: number;
  calendarsChecked?: CalendarCheckInfo[];
  lastSyncedAt?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function MorningDigestModal({
  isOpen,
  onClose,
  userName = "Santhosh",
  tasks,
  events,
  mail,
  unread48hEstimate = null,
  unreadTotalEstimate = 0,
  calendarsChecked = [],
  lastSyncedAt,
  onRefresh,
  isRefreshing = false,
}: MorningDigestModalProps) {
  const todayStr = useMemo(() => new Intl.DateTimeFormat("en-CA").format(new Date()), []);
  const formattedTodayDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Today's calendar events
  const todayEvents = useMemo(() => {
    return events.filter((e) => {
      const dt = e.start?.dateTime || e.start?.date;
      return dt && dt.startsWith(todayStr);
    }).sort((a, b) => {
      const aT = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
      const bT = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
      return aT - bT;
    });
  }, [events, todayStr]);

  // Calendar conflicts check for today
  const conflicts = useMemo(() => {
    const list: Array<{ a: DashboardEvent; b: DashboardEvent }> = [];
    for (let i = 0; i < todayEvents.length; i++) {
      for (let j = i + 1; j < todayEvents.length; j++) {
        const aStart = new Date(todayEvents[i].start?.dateTime || "").getTime();
        const aEnd = new Date(todayEvents[i].end?.dateTime || "").getTime();
        const bStart = new Date(todayEvents[j].start?.dateTime || "").getTime();
        const bEnd = new Date(todayEvents[j].end?.dateTime || "").getTime();

        if (aStart && aEnd && bStart && bEnd && aStart < bEnd && bStart < aEnd) {
          list.push({ a: todayEvents[i], b: todayEvents[j] });
        }
      }
    }
    return list;
  }, [todayEvents]);

  // Classified emails
  const classifiedEmails = useMemo(() => {
    return mail.map((m) => {
      const classification = classifyEmail(m);
      return {
        ...m,
        classification,
      };
    });
  }, [mail]);

  const securityEmails = useMemo(
    () => classifiedEmails.filter((m) => m.classification?.variant === "security"),
    [classifiedEmails]
  );
  const financeEmails = useMemo(
    () => classifiedEmails.filter((m) => m.classification?.variant === "finance"),
    [classifiedEmails]
  );
  const infraEmails = useMemo(
    () => classifiedEmails.filter((m) => m.classification?.variant === "infra"),
    [classifiedEmails]
  );
  const careerEmails = useMemo(
    () => classifiedEmails.filter((m) => m.classification?.variant === "career"),
    [classifiedEmails]
  );

  // Active and overdue tasks
  const activeTasks = useMemo(() => tasks.filter((t) => !t.checked), [tasks]);
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => !t.checked && t.dueDate && t.dueDate < todayStr);
  }, [tasks, todayStr]);

  const urgentDeadlines = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = new Intl.DateTimeFormat("en-CA").format(nextWeek);
    return tasks.filter(
      (t) => !t.checked && t.dueDate && t.dueDate >= todayStr && t.dueDate <= nextWeekStr
    );
  }, [tasks, todayStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6 bg-[#fafbf9]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fdf2f2] text-forest border border-[#fbd5d5]">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-ink sm:text-[15px]">Executive Daily Briefing</h2>
                <span className="rounded-md bg-[#eaf3e9] px-2 py-0.5 text-[9.5px] font-bold text-forest tracking-wide">
                  REVIEW COMPLETED
                </span>
              </div>
              <p className="text-[11px] text-muted">
                {formattedTodayDate} · {appConfig.name} Executive Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium text-muted hover:text-ink hover:bg-[#fafbf7] transition cursor-pointer disabled:opacity-50"
                title="Refresh sources"
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin text-forest" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 sidebar-scroll">
          {/* Greeting banner */}
          <div className="rounded-xl border border-line bg-gradient-to-r from-[#faf6ed] via-[#f7f9f3] to-white p-4">
            <h3 className="text-[13px] font-bold text-ink">
              Good day, {userName?.split(" ")[0] || "there"}!
            </h3>
            <p className="mt-1 text-[11.5px] text-[#556358] leading-relaxed">
              Your connected Gmail, Google Calendar profiles, and active priorities have been consolidated.
              {securityEmails.length > 0 && " There are security & authentication notices requiring verification."}
              {infraEmails.length > 0 && " Developer infrastructure alerts have upcoming service deadlines."}
              {overdueTasks.length > 0 && ` You have ${overdueTasks.length} overdue task commitment(s).`}
            </p>
          </div>

          {/* KPI Snapshot Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-[#fafbf8] p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">
                {unread48hEstimate !== null ? "48h Unread (Est.)" : "Total Unread (Est.)"}
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[20px] font-black text-ink">
                  {unread48hEstimate !== null ? `~${unread48hEstimate}` : (unreadTotalEstimate ? `~${unreadTotalEstimate}` : mail.length)}
                </span>
                <span className="text-[10px] text-muted">messages</span>
              </div>
              <span className="mt-1 block text-[9.5px] text-[#6d7970]">
                {unread48hEstimate !== null
                  ? "Estimated messages in last 2 days"
                  : "Overall unread estimate (48h query unavailable)"}
              </span>
            </div>

            <div className="rounded-xl border border-line bg-[#fafbf8] p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Active Priorities</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[20px] font-black text-forest">{activeTasks.length}</span>
                <span className="text-[10px] text-muted">pending</span>
              </div>
              <span className="mt-1 block text-[9.5px] text-[#6d7970]">{tasks.filter(t => t.checked).length} completed</span>
            </div>

            <div className="rounded-xl border border-line bg-[#fafbf8] p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Today&apos;s Calendar</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[20px] font-black text-ink">{todayEvents.length}</span>
                <span className="text-[10px] text-muted">events</span>
              </div>
              <span className="mt-1 block text-[9.5px] text-[#6d7970]">
                {conflicts.length > 0 ? `${conflicts.length} overlap detected` : "No conflicts"}
              </span>
            </div>

            <div className="rounded-xl border border-line bg-[#fafbf8] p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Critical Deadlines</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-[20px] font-black ${overdueTasks.length > 0 ? "text-[#b91c1c]" : "text-ink"}`}>
                  {overdueTasks.length + urgentDeadlines.length}
                </span>
                <span className="text-[10px] text-muted">items</span>
              </div>
              <span className="mt-1 block text-[9.5px] text-[#6d7970]">
                {overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "Due this week"}
              </span>
            </div>
          </div>

          {/* Today's Schedule Overview */}
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-forest" />
                <h4 className="text-[12px] font-bold text-ink">Today&apos;s Schedule & Commitments</h4>
              </div>
              <span className="text-[10px] font-medium text-muted">
                {todayEvents.length} commitments today
              </span>
            </div>

            {conflicts.length > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#fff1f1] px-3 py-2 text-[10.5px] text-[#b91c1c] border border-[#fecaca]">
                <AlertTriangle size={13} className="shrink-0" />
                <span>
                  <strong>Schedule Overlap:</strong> &quot;{conflicts[0].a.summary}&quot; overlaps with &quot;{conflicts[0].b.summary}&quot;.
                </span>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {todayEvents.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-muted">No scheduled calendar events for today. Open calendar for deep work!</p>
              ) : (
                todayEvents.map((evt, idx) => {
                  const startTime = evt.start?.dateTime
                    ? new Date(evt.start.dateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "All day";
                  const endTime = evt.end?.dateTime
                    ? new Date(evt.end.dateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "";
                  const isPast = evt.end?.dateTime ? new Date(evt.end.dateTime).getTime() < Date.now() : false;

                  return (
                    <div
                      key={evt.id + idx}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-[11px] transition ${
                        isPast ? "bg-[#fafbf8] border-[#edf0e9] opacity-70" : "bg-white border-[#e6ebe3]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-20 shrink-0 font-medium tabular-nums text-muted text-[10px]">
                          {startTime}{endTime ? `–${endTime}` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: evt.color || evt.calendarColor || "#a82025" }}
                          />
                          <span className={`font-semibold ${isPast ? "line-through text-muted" : "text-ink"}`}>
                            {evt.summary || "Untitled Event"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted">
                        {isPast ? "COMPLETED" : "UPCOMING"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actionable Email Alerts (Classified from top preview messages) */}
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-1">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-forest" />
                <h4 className="text-[12px] font-bold text-ink">Actionable Communications ({mail.length} Loaded Preview Messages)</h4>
              </div>
              <span className="text-[10px] text-muted">
                Classified from recent preview · Not a full scan of all {unread48hEstimate !== null ? `~${unread48hEstimate}` : "unread"} emails
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {/* Security Alerts */}
              {securityEmails.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#b91c1c] flex items-center gap-1">
                    <Shield size={11} />
                    Security & Authentication ({securityEmails.length})
                  </span>
                  {securityEmails.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[#fecaca] bg-[#fff8f8] p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11.5px] font-semibold text-ink">{m.subject || "Security Notice"}</span>
                        <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase bg-[#fce8e6] text-[#b91c1c]">
                          ACTION NEEDED
                        </span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-[#556358] line-clamp-2">{m.snippet}</p>
                      <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
                        <span>From: {m.from}</span>
                        <a
                          href={m.href || `https://mail.google.com/mail/u/0/#inbox/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-forest hover:underline inline-flex items-center gap-0.5"
                        >
                          Review in Gmail <ExternalLink size={9} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Infrastructure Alerts */}
              {infraEmails.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0369a1] flex items-center gap-1">
                    <Server size={11} />
                    Cloud & Dev Infrastructure ({infraEmails.length})
                  </span>
                  {infraEmails.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff] p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11.5px] font-semibold text-ink">{m.subject}</span>
                        <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase bg-[#e0f2fe] text-[#0369a1]">
                          INFRA NOTICE
                        </span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-[#556358] line-clamp-2">{m.snippet}</p>
                      <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
                        <span>From: {m.from}</span>
                        <a
                          href={m.href || `https://mail.google.com/mail/u/0/#inbox/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-forest hover:underline inline-flex items-center gap-0.5"
                        >
                          View details <ChevronRight size={9} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Finance / Banking */}
              {financeEmails.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400e] flex items-center gap-1">
                    <CreditCard size={11} />
                    Finance & Transaction Alerts ({financeEmails.length})
                  </span>
                  {financeEmails.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[#fde68a] bg-[#fffdf5] p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11.5px] font-semibold text-ink">{m.subject}</span>
                        <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase bg-[#fef3c7] text-[#92400e]">
                          VERIFY
                        </span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-[#556358] line-clamp-2">{m.snippet}</p>
                      <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
                        <span>From: {m.from}</span>
                        <a
                          href={m.href || `https://mail.google.com/mail/u/0/#inbox/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-forest hover:underline inline-flex items-center gap-0.5"
                        >
                          Open message <ExternalLink size={9} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Career / Opportunities */}
              {careerEmails.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7e22ce] flex items-center gap-1">
                    <Briefcase size={11} />
                    Career & Recruitment ({careerEmails.length})
                  </span>
                  {careerEmails.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[#e9d5ff] bg-[#faf5ff] p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11.5px] font-semibold text-ink">{m.subject}</span>
                        <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase bg-[#f3e8ff] text-[#7e22ce]">
                          OPPORTUNITY
                        </span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-[#556358] line-clamp-2">{m.snippet}</p>
                      <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
                        <span>From: {m.from}</span>
                        <a
                          href={m.href || `https://mail.google.com/mail/u/0/#inbox/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-forest hover:underline inline-flex items-center gap-0.5"
                        >
                          View alert <ExternalLink size={9} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {securityEmails.length === 0 && infraEmails.length === 0 && financeEmails.length === 0 && careerEmails.length === 0 && (
                <p className="py-3 text-center text-[11px] text-muted">
                  No urgent security or vendor warnings in recent unread items.
                </p>
              )}
            </div>
          </div>

          {/* Tracked Task Deadlines (Routino Board) */}
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-1">
              <div className="flex items-center gap-2">
                <Clock3 size={14} className="text-forest" />
                <h4 className="text-[12px] font-bold text-ink">Tracked Task Deadlines (Routino Board)</h4>
              </div>
              <span className="text-[10px] text-muted">
                From your tracked tasks & goals · {urgentDeadlines.length + overdueTasks.length} commitments
              </span>
            </div>
            <p className="mt-2 text-[10px] text-muted">
              Note: Deadlines are sourced from your active tasks in Routino. (Auto-extracting deadlines from raw email bodies is not active; add detected dates as tasks).
            </p>

            <div className="mt-3 space-y-2">
              {overdueTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#fecaca] bg-[#fff5f5]">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#b91c1c] shrink-0" />
                    <div>
                      <span className="text-[11.5px] font-semibold text-ink block">{t.title}</span>
                      <span className="text-[9.5px] text-muted">{t.meta}</span>
                    </div>
                  </div>
                  <span className="rounded bg-[#fef2f2] px-2 py-0.5 text-[9px] font-bold text-[#b91c1c] border border-[#fecaca]">
                    OVERDUE ({t.dueDate})
                  </span>
                </div>
              ))}

              {urgentDeadlines.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#edf0e9] bg-[#fafbf8]">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-forest shrink-0" />
                    <div>
                      <span className="text-[11.5px] font-semibold text-ink block">{t.title}</span>
                      <span className="text-[9.5px] text-muted">{t.meta}</span>
                    </div>
                  </div>
                  <span className="rounded bg-[#f1f3ed] px-2 py-0.5 text-[9px] font-semibold text-[#5c6960]">
                    DUE {t.dueDate}
                  </span>
                </div>
              ))}

              {overdueTasks.length === 0 && urgentDeadlines.length === 0 && (
                <p className="py-3 text-center text-[11px] text-muted">
                  No impending hard deadlines in the next 7 days.
                </p>
              )}
            </div>
          </div>

          {/* Sources Verified & Sync Status Checklist */}
          <div className="rounded-xl border border-line bg-[#f8faf6] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11.5px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-forest" />
                Data Sources Review Checklist
              </h4>
              <span className={`text-[10px] font-semibold ${calendarsChecked.some(c => c.status === "failed") ? "text-[#b45309]" : "text-forest"}`}>
                {calendarsChecked.some(c => c.status === "failed") ? "Partial Sync Warning" : "All Systems Checked"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {/* Primary Google */}
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-[#edf0e9]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-forest" />
                  <span className="text-[#455248]">Primary Google Account</span>
                </div>
                <span className="font-semibold text-forest text-[10px]">Connected (Read-Only)</span>
              </div>

              {/* Calendars */}
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-[#edf0e9]">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      calendarsChecked.some((c) => c.status === "failed") ? "bg-[#d97706]" : "bg-forest"
                    }`}
                  />
                  <span className="text-[#455248]">Calendar Sources</span>
                </div>
                <span
                  className={`font-semibold text-[10px] ${
                    calendarsChecked.some((c) => c.status === "failed") ? "text-[#b45309]" : "text-forest"
                  }`}
                >
                  {calendarsChecked.filter((c) => c.status === "checked").length} Checked
                  {calendarsChecked.some((c) => c.status === "failed")
                    ? ` · ${calendarsChecked.filter((c) => c.status === "failed").length} Failed`
                    : " · 0 Failed"}
                </span>
              </div>

              {/* Gmail API */}
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-[#edf0e9]">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      unread48hEstimate !== null ? "bg-forest" : "bg-[#d97706]"
                    }`}
                  />
                  <span className="text-[#455248]">Gmail Unread Query</span>
                </div>
                <span className="font-semibold text-[10px] text-forest">
                  {unread48hEstimate !== null ? "48h Est. Active" : "Overall Est. Fallback"}
                </span>
              </div>

              {/* Privacy & Storage */}
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-[#edf0e9]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-forest" />
                  <span className="text-[#455248]">Privacy & Data Policy</span>
                </div>
                <span className="font-semibold text-forest text-[10px]">AES-256 Client-Encrypted Notes</span>
              </div>
            </div>

            {/* Detailed per-calendar breakdown */}
            {calendarsChecked.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-[#edf0e9] space-y-1.5">
                <span className="text-[10px] font-semibold text-muted block">Calendar Query Breakdown:</span>
                <div className="flex flex-wrap gap-1.5">
                  {calendarsChecked.map((c) => {
                    const isChecked = c.status === "checked";
                    const isFailed = c.status === "failed";
                    return (
                      <span
                        key={c.id}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9.5px] border ${
                          isChecked
                            ? "bg-white text-[#455248] border-[#edf0e9]"
                            : isFailed
                            ? "bg-[#fff5f5] text-[#b91c1c] border-[#fecaca]"
                            : "bg-[#f5f5f5] text-muted border-line"
                        }`}
                        title={
                          isFailed
                            ? `Failed to query: ${c.error || "Unknown error"}`
                            : `Checked: ${c.eventCount ?? 0} events`
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: isFailed ? "#b91c1c" : c.color || "#4a6741" }}
                        />
                        <span>{c.summary}</span>
                        <span className="font-bold text-[8.5px] opacity-75">
                          {isChecked ? `(✓ ${c.eventCount ?? 0})` : isFailed ? "(✗ Failed)" : "(Connected)"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 pt-2.5 border-t border-[#edf0e9] flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-muted gap-1">
              <span>
                Workspace tasks and settings persist securely. Keep Notes are client-side encrypted before storage.
              </span>
              {lastSyncedAt && (
                <span className="shrink-0">
                  Last refreshed {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3 bg-[#fafbf9]">
          <span className="text-[10.5px] text-muted">
            Plan thoughtfully · Keep your day manageable
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-forest px-4 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
