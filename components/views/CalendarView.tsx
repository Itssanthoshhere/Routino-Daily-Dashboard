"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Video,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Plane,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Palette,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { DashboardEvent } from "@/types/dashboard";
import { connectGoogle } from "@/app/actions";
import { getMeetingUrl, findScheduleConflicts, isBananaYellowColor } from "@/lib/meeting";

type CalendarViewProps = {
  events: DashboardEvent[];
  onOpenAddEvent: () => void;
  onSelectEvent: (event: DashboardEvent) => void;
  isConnected: boolean;
};

const hues = ["#7b8df4", "#e7a15a", "#5fa77d", "#d16b5b"];

export function CalendarView({
  events,
  onOpenAddEvent,
  onSelectEvent,
  isConnected,
}: CalendarViewProps) {
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [isColorizing, setIsColorizing] = useState(false);
  const [colorizeMessage, setColorizeMessage] = useState<string | null>(null);
  const [colorizeError, setColorizeError] = useState<string | null>(null);
  const [showReauthPrompt, setShowReauthPrompt] = useState(false);

  // Background auto-colorize once per browser session
  useEffect(() => {
    if (!isConnected) return;
    const key = "routino_auto_colorized_session";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      void fetch("/api/calendar/auto-colorize", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.needsReauth) {
            setShowReauthPrompt(true);
          }
        })
        .catch(() => {});
    }
  }, [isConnected]);

  const handleAutoColorize = async () => {
    setIsColorizing(true);
    setColorizeMessage(null);
    setColorizeError(null);
    setShowReauthPrompt(false);
    try {
      const res = await fetch("/api/calendar/auto-colorize", { method: "POST" });
      const data = await res.json();
      if (data.needsReauth) {
        setShowReauthPrompt(true);
      } else if (data.success) {
        setColorizeMessage(data.message);
        setTimeout(() => setColorizeMessage(null), 6000);
      } else {
        setColorizeError(data.error || "Could not auto-colorize calendar events.");
      }
    } catch {
      setColorizeError("Failed to connect to the auto-colorize service.");
    } finally {
      setIsColorizing(false);
    }
  };

  // Today base date (midnight)
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate 7 days based on weekOffset (Default 0 = Main Focus: Today + 6 upcoming days)
  const days = useMemo(() => {
    const baseOffset = weekOffset * 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayDate);
      d.setDate(d.getDate() + baseOffset + i);
      const isToday = d.toDateString() === todayDate.toDateString();
      return {
        index: i,
        dateObj: d,
        dayName: new Intl.DateTimeFormat("en", { weekday: "short" }).format(d),
        dateNum: d.getDate(),
        month: new Intl.DateTimeFormat("en", { month: "short" }).format(d),
        year: d.getFullYear(),
        isToday,
      };
    });
  }, [weekOffset, todayDate]);

  const selectedDate = days[selectedDayIndex]?.dateObj || todayDate;

  // Filter events for selected day
  const dayEvents = useMemo(() => {
    return events.filter((ev) => {
      const startStr = ev.start?.dateTime ?? ev.start?.date;
      if (!startStr) return selectedDayIndex === 0 && weekOffset === 0;
      const d = new Date(startStr);
      return d.toDateString() === selectedDate.toDateString();
    });
  }, [events, selectedDate, selectedDayIndex, weekOffset]);

  // Set of date strings in the current 7-day strip
  const weekDatesStrSet = useMemo(() => {
    return new Set(days.map((d) => d.dateObj.toDateString()));
  }, [days]);

  // All events within the current 7-day strip
  const weekEvents = useMemo(() => {
    return events.filter((ev) => {
      const startStr = ev.start?.dateTime ?? ev.start?.date;
      if (!startStr) return false;
      const d = new Date(startStr);
      return weekDatesStrSet.has(d.toDateString());
    });
  }, [events, weekDatesStrSet]);

  // Helper to filter an event list by the selected tag
  const filterByTag = useCallback(
    (evList: DashboardEvent[]) => {
      if (selectedTag === "ALL") return evList;
      if (selectedTag === "BANANA") {
        return evList.filter(
          (e) =>
            (e.tag || "").toUpperCase() === "BANANA" ||
            isBananaYellowColor(e.colorId, e.color || e.calendarColor)
        );
      }
      if (selectedTag === "PROJECT") {
        return evList.filter(
          (e) =>
            (e.tag || "").toUpperCase() === "PROJECT" ||
            /\b(project|projects|product|products|website|building|portfolio|coding|dev|spendo|dashboard|app)\b/i.test(
              `${e.summary || ""} ${e.description || ""}`
            )
        );
      }
      if (selectedTag === "TRAVEL") {
        return evList.filter(
          (e) =>
            (e.tag || "").toUpperCase() === "TRAVEL" ||
            /\b(flight|train|hotel|airport|airline|trip|travel|indigo|6e|ai|uk)\b/i.test(
              `${e.summary || ""} ${e.description || ""}`
            )
        );
      }
      return evList.filter(
        (e) => (e.tag || "WORK").toUpperCase() === selectedTag.toUpperCase()
      );
    },
    [selectedTag]
  );

  const filteredEvents = useMemo(() => filterByTag(dayEvents), [dayEvents, filterByTag]);
  const weekFilteredEvents = useMemo(() => filterByTag(weekEvents), [weekEvents, filterByTag]);

  // Total banana count for the week
  const weekBananaCount = useMemo(() => {
    return weekEvents.filter(
      (e) =>
        (e.tag || "").toUpperCase() === "BANANA" ||
        isBananaYellowColor(e.colorId, e.color || e.calendarColor)
    ).length;
  }, [weekEvents]);

  // Helper to inspect day events for indicator dots & counts
  const getDayMeta = useCallback(
    (d: Date) => {
      const evs = events.filter((ev) => {
        const s = ev.start?.dateTime ?? ev.start?.date;
        return s && new Date(s).toDateString() === d.toDateString();
      });
      const bananaEvs = evs.filter(
        (e) =>
          (e.tag || "").toUpperCase() === "BANANA" ||
          isBananaYellowColor(e.colorId, e.color || e.calendarColor)
      );
      const hasBanana = bananaEvs.length > 0;
      const bananaCount = bananaEvs.length;
      const hasTravel = evs.some(
        (e) =>
          (e.tag || "").toUpperCase() === "TRAVEL" ||
          /\b(flight|train|hotel|airport|airline|trip|travel|indigo|6e)\b/i.test(
            `${e.summary || ""} ${e.description || ""}`
          )
      );
      const hasProject = evs.some(
        (e) =>
          (e.tag || "").toUpperCase() === "PROJECT" ||
          /\b(project|projects|product|products|website|building|portfolio|coding|dev|spendo|app)\b/i.test(
            `${e.summary || ""} ${e.description || ""}`
          )
      );
      return { count: evs.length, hasBanana, bananaCount, hasTravel, hasProject };
    },
    [events]
  );

  const handleResetToToday = () => {
    setWeekOffset(0);
    setSelectedDayIndex(0);
  };

  // Compute schedule conflicts
  const selectedDateStr = new Intl.DateTimeFormat("en-CA").format(selectedDate);
  const dayConflicts = findScheduleConflicts(dayEvents, selectedDateStr);
  const conflictingEventIds = new Set<string>();
  dayConflicts.forEach((c) => {
    conflictingEventIds.add(c.eventA.id);
    conflictingEventIds.add(c.eventB.id);
  });

  // Render a single event item
  const renderEventItem = (event: DashboardEvent, idx: number) => {
    const startFormatted = event.start?.dateTime
      ? new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(event.start.dateTime))
      : "Scheduled";
    const endFormatted = event.end?.dateTime
      ? new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(event.end.dateTime))
      : "";

    const isBanana =
      (event.tag || "").toUpperCase() === "BANANA" ||
      isBananaYellowColor(event.colorId, event.color || event.calendarColor);
    const tagToDisplay = isBanana ? "BANANA" : event.tag;

    return (
      <div
        key={event.id || idx}
        onClick={() => onSelectEvent(event)}
        className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-[#fbfcf9] transition p-2 rounded-xl cursor-pointer group"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span
            className="mt-1 h-3 w-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
            style={{
              backgroundColor: isBanana ? "#eab308" : event.color || hues[idx % hues.length],
            }}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold text-ink group-hover:text-forest transition truncate">
              {event.summary || "Untitled Event"}
            </h4>
            <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
              {event.description || "Workspace calendar meeting"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                <span>
                  {startFormatted}
                  {endFormatted ? ` – ${endFormatted}` : ""}
                </span>
              </span>

              {tagToDisplay && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 ${
                    isBanana
                      ? "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]"
                      : tagToDisplay === "TRAVEL"
                      ? "bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]"
                      : tagToDisplay === "PROJECT"
                      ? "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]"
                      : tagToDisplay === "MEETING"
                      ? "bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]"
                      : tagToDisplay === "PERSONAL"
                      ? "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                      : tagToDisplay === "OUTLOOK"
                      ? "bg-[#ebf3fc] text-[#0078d4] border border-[#c7e0f4]"
                      : "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]"
                  }`}
                >
                  {isBanana && <span>🟡</span>}
                  {tagToDisplay === "TRAVEL" && <Plane size={10} />}
                  {tagToDisplay}
                </span>
              )}

              {conflictingEventIds.has(event.id) && (
                <span className="rounded bg-[#fef3c7] text-[#92400e] border border-[#fde68a] px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1">
                  <AlertTriangle size={10} /> Overlap
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(() => {
            const meetUrl = getMeetingUrl(event);
            if (meetUrl) {
              return (
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#fdf2f2] px-2.5 py-1.5 text-[11px] font-semibold text-forest hover:bg-[#8b1116] hover:text-white transition cursor-pointer"
                >
                  <Video size={13} /> Join Meeting
                </a>
              );
            }
            if (event.location) {
              return (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted max-w-[150px] truncate">
                  <MapPin size={11} className="shrink-0 text-amber-600" />
                  <span className="truncate">{event.location}</span>
                </span>
              );
            }
            return (
              <span className="hidden sm:inline-flex items-center rounded-md bg-[#f4f5f0] px-2 py-0.5 text-[10px] font-medium text-muted">
                In-person
              </span>
            );
          })()}
          <button
            onClick={() => onSelectEvent(event)}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium text-muted group-hover:text-ink transition cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-line pb-5">
        <div>
          <h2 className="text-[20px] font-bold text-ink">Calendar Schedule</h2>
          <p className="text-[12px] text-muted">
            {isConnected
              ? "Synced with Google Calendar · Multi-week navigation & yellow event tracking"
              : "Connect Google for real-time calendar events"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <form action={connectGoogle}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
              >
                Connect Google Account
              </button>
            </form>
          )}
          <button
            onClick={onOpenAddEvent}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"
          >
            <Plus size={14} /> Schedule Event
          </button>
          {isConnected && (
            <button
              type="button"
              onClick={handleAutoColorize}
              disabled={isColorizing}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12px] font-semibold text-ink shadow-2xs hover:bg-[#f1f3ed] transition disabled:opacity-50 cursor-pointer"
              title="Automatically color meals pale green, routine blueberry, typing graphite, and work yellow on Google Calendar"
            >
              <Sparkles size={14} className={isColorizing ? "animate-spin text-forest" : "text-amber-500"} />
              <span>{isColorizing ? "Colorizing..." : "Auto-Colorize"}</span>
            </button>
          )}
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition"
          >
            Google Calendar <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Auto-colorize status banner */}
      {colorizeMessage && (
        <div className="flex items-center justify-between rounded-2xl bg-forest/10 border border-forest/20 px-4 py-3 text-[12px] font-semibold text-forest shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-forest/20 text-forest shrink-0">
              <Check size={13} className="stroke-[3]" />
            </span>
            <span>{colorizeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setColorizeMessage(null)}
            className="text-forest/70 hover:text-forest p-1 cursor-pointer transition"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Auto-colorize error banner */}
      {colorizeError && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 border border-red-200/80 px-4 py-3 text-[12px] font-medium text-red-900 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-red-100 text-red-700 shrink-0">
              <AlertTriangle size={13} />
            </span>
            <span>{colorizeError}</span>
          </div>
          <button
            type="button"
            onClick={() => setColorizeError(null)}
            className="text-red-700 hover:text-red-900 p-1 cursor-pointer transition"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Permission Re-auth Banner */}
      {showReauthPrompt && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-[#fffcf2] via-[#fffbeb] to-[#fffdf5] p-4 sm:p-5 text-amber-950 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-800 shrink-0 shadow-2xs ring-1 ring-amber-200">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <h4 className="text-[13.5px] font-bold text-amber-950">
                Google Calendar Edit Permission Required
              </h4>
              <p className="text-[11.5px] text-amber-900/90 mt-0.5 leading-relaxed">
                Your account is currently connected with <strong>read-only</strong> access. To allow Routino to colorize events directly on Google Calendar, click below to authorize calendar edit permission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <button
              type="button"
              onClick={() => setShowReauthPrompt(false)}
              className="rounded-xl px-3.5 py-2 text-[11.5px] font-medium text-amber-900/80 hover:bg-amber-100/70 transition cursor-pointer"
            >
              Dismiss
            </button>
            <form action={connectGoogle}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer whitespace-nowrap"
              >
                <span>Grant Edit Permission</span>
                <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7-Day Navigation & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-line bg-white/70 p-3 sm:px-4 sm:py-2.5 shadow-2xs backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-ink">
            {days[0]?.month} {days[0]?.dateNum} – {days[6]?.month} {days[6]?.dateNum}, {days[6]?.year}
          </span>
          {weekOffset === 0 ? (
            <span className="rounded-md bg-forest/10 px-2 py-0.5 text-[10px] font-bold text-forest uppercase tracking-wide">
              Main Focus · Next 7 Days
            </span>
          ) : weekOffset < 0 ? (
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              Previous Days ({Math.abs(weekOffset)} {Math.abs(weekOffset) === 1 ? "week" : "weeks"} ago)
            </span>
          ) : (
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase tracking-wide">
              Upcoming (+{weekOffset} {weekOffset === 1 ? "week" : "weeks"})
            </span>
          )}

          {/* Quick badge showing Banana events in this 7-day range */}
          {weekBananaCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedTag("BANANA");
                setViewMode("week");
              }}
              className="inline-flex items-center gap-1 rounded-md bg-[#fef9c3] px-2 py-0.5 text-[10px] font-bold text-[#854d0e] border border-[#fef08a] hover:bg-[#fef08a] transition cursor-pointer shadow-2xs"
              title="Click to view all Banana events in this week"
            >
              <span>🟡</span>
              <span>{weekBananaCount} Banana Events</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:text-ink hover:bg-[#f1f3ed] transition cursor-pointer shadow-2xs"
            title="View previous 7 days"
          >
            <ChevronLeft size={13} />
            <span>Previous Days</span>
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={handleResetToToday}
              className="inline-flex items-center gap-1 rounded-xl bg-forest px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-[#8b1116] transition cursor-pointer"
              title="Return to today & next 7 days"
            >
              <RotateCcw size={11} />
              <span>Today (Main Focus)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:text-ink hover:bg-[#f1f3ed] transition cursor-pointer shadow-2xs"
            title="View next 7 days"
          >
            <span>Next Days</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* 7-Day Strip with Badges */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:overflow-visible">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 min-w-[340px] sm:min-w-0">
          {days.map((day) => {
            const isSelected = selectedDayIndex === day.index;
            const meta = getDayMeta(day.dateObj);
            return (
              <button
                key={day.index}
                onClick={() => {
                  setSelectedDayIndex(day.index);
                  setViewMode("day");
                }}
                className={`flex flex-col items-center rounded-2xl p-2 sm:p-3 transition-all cursor-pointer ${
                  isSelected && viewMode === "day"
                    ? "bg-forest text-white shadow-md scale-[1.02]"
                    : "bg-white border border-line text-ink hover:bg-[#f4f7ef]"
                }`}
              >
                <span
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                    isSelected && viewMode === "day" ? "text-accent" : "text-muted"
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="mt-1 text-[16px] sm:text-[18px] font-bold">{day.dateNum}</span>
                <span
                  className={`text-[8px] sm:text-[9px] mt-0.5 ${
                    isSelected && viewMode === "day" ? "text-white/70" : "text-[#9da79e]"
                  }`}
                >
                  {day.month}
                </span>

                {/* Event indicator badges: Yellow (Banana), Sky (Travel), Purple (Project) */}
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 min-h-[14px]">
                  {meta.bananaCount > 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[8.5px] font-extrabold ${
                        isSelected && viewMode === "day"
                          ? "bg-[#fef08a] text-[#854d0e]"
                          : "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]"
                      }`}
                      title={`${meta.bananaCount} Yellow/Banana Event${meta.bananaCount > 1 ? "s" : ""}`}
                    >
                      🟡 {meta.bananaCount}
                    </span>
                  )}
                  {meta.hasTravel && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected && viewMode === "day" ? "bg-sky-200" : "bg-[#0284c7]"
                      }`}
                      title="Travel Event"
                    />
                  )}
                  {meta.hasProject && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected && viewMode === "day" ? "bg-purple-200" : "bg-[#7c3aed]"
                      }`}
                      title="Project Event"
                    />
                  )}
                  {meta.bananaCount === 0 && !meta.hasTravel && !meta.hasProject && day.isToday && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected && viewMode === "day" ? "bg-accent" : "bg-forest"
                      }`}
                      title="Today"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-semibold text-muted flex items-center gap-1 mr-1">
            <Filter size={12} /> Filter:
          </span>
          {["ALL", "PROJECT", "TRAVEL", "BANANA", "WORK", "MEETING", "PERSONAL", "OUTLOOK"].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition cursor-pointer ${
                selectedTag === tag
                  ? tag === "BANANA"
                    ? "bg-[#eab308] text-white shadow-sm"
                    : tag === "PROJECT"
                    ? "bg-[#7c3aed] text-white shadow-sm"
                    : tag === "TRAVEL"
                    ? "bg-[#0284c7] text-white shadow-sm"
                    : "bg-forest text-white shadow-sm"
                  : tag === "BANANA"
                  ? "bg-white border border-[#fef08a] text-[#854d0e] hover:bg-[#fef9c3]"
                  : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
              }`}
            >
              {tag === "BANANA" ? "🟡 BANANA" : tag}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex items-center self-start sm:self-auto rounded-xl border border-line bg-white/80 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("day")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
              viewMode === "day"
                ? "bg-forest text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-[#f1f3ed]"
            }`}
          >
            Selected Day
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
              viewMode === "week"
                ? "bg-forest text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-[#f1f3ed]"
            }`}
          >
            All 7 Days ({weekFilteredEvents.length})
          </button>
        </div>
      </div>

      {/* Event List Section */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <span className="text-[13px] font-semibold text-ink flex items-center gap-2">
            {viewMode === "week" ? (
              <span>
                Full Week Overview ({days[0]?.month} {days[0]?.dateNum} – {days[6]?.month} {days[6]?.dateNum})
              </span>
            ) : (
              <span>
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(selectedDate)}
              </span>
            )}
            {selectedTag !== "ALL" && (
              <span className="rounded bg-[#f4f5f0] px-2 py-0.5 text-[10px] font-bold text-muted">
                FILTER: {selectedTag}
              </span>
            )}
          </span>
          <span className="text-[11px] text-muted">
            {viewMode === "week"
              ? `${weekFilteredEvents.length} ${weekFilteredEvents.length === 1 ? "event" : "events"}`
              : `${filteredEvents.length} ${filteredEvents.length === 1 ? "event" : "events"}`}
          </span>
        </div>

        {/* Schedule Conflicts Alert Banner (Single Day Mode) */}
        {viewMode === "day" && dayConflicts.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-[#fffbeb] p-3 text-[11px] text-amber-900 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold mb-1.5 text-amber-800">
              <AlertTriangle size={13} className="text-amber-600" />
              <span>{dayConflicts.length} Schedule Conflict{dayConflicts.length > 1 ? "s" : ""} on this day</span>
            </div>
            <div className="space-y-1 pl-4 text-[10.5px]">
              {dayConflicts.map((c) => (
                <div key={c.id}>
                  &bull; <strong className="font-semibold">&quot;{c.eventA.summary}&quot;</strong> &amp; <strong className="font-semibold">&quot;{c.eventB.summary}&quot;</strong> ({c.startTimeStr} – {c.endTimeStr}, {c.overlapMinutes}m overlap)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW MODE: FULL WEEK */}
        {viewMode === "week" ? (
          weekFilteredEvents.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays size={32} className="mx-auto text-muted/40 mb-3" />
              <p className="text-[13px] font-semibold text-ink">
                No events found matching &quot;{selectedTag}&quot; across this 7-day range
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Try switching filters to &quot;ALL&quot; or navigating to earlier/later days.
              </p>
              {selectedTag !== "ALL" && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTag("ALL")}
                    className="rounded-xl bg-forest px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition cursor-pointer"
                  >
                    Reset Filter to ALL
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {days.map((day) => {
                const dayEvs = weekFilteredEvents.filter((ev) => {
                  const s = ev.start?.dateTime ?? ev.start?.date;
                  return s && new Date(s).toDateString() === day.dateObj.toDateString();
                });
                if (dayEvs.length === 0) return null;
                const meta = getDayMeta(day.dateObj);

                return (
                  <div key={day.index} className="space-y-2 border-b border-line pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between bg-[#fbfcf8] px-3 py-2 rounded-xl border border-line">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-bold text-ink">
                          {day.dayName}, {day.month} {day.dateNum}
                        </span>
                        {day.isToday && (
                          <span className="rounded bg-forest/10 px-1.5 py-0.5 text-[9px] font-bold text-forest uppercase">
                            Today
                          </span>
                        )}
                        {meta.bananaCount > 0 && (
                          <span className="rounded-full bg-[#fef9c3] px-2 py-0.5 text-[9px] font-extrabold text-[#854d0e] border border-[#fef08a]">
                            🟡 {meta.bananaCount} Banana
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-muted font-medium">
                        {dayEvs.length} {dayEvs.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    <div className="divide-y divide-[#eff1ec] pl-1">
                      {dayEvs.map((event, idx) => renderEventItem(event, idx))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* VIEW MODE: SELECTED DAY */
          filteredEvents.length === 0 ? (
            <div className="py-12 text-center">
              {selectedTag === "BANANA" ? (
                <div>
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[18px] mb-2">
                    🟡
                  </div>
                  <p className="text-[13px] font-semibold text-ink">No Yellow/Banana events on this specific day</p>
                  {weekBananaCount > 0 ? (
                    <div className="mt-2 text-[11px] text-muted">
                      Found <strong className="text-amber-800 font-bold">{weekBananaCount} Banana event{weekBananaCount > 1 ? "s" : ""}</strong> across this 7-day range:
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewMode("week")}
                          className="rounded-xl bg-[#eab308] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-[#ca8a04] transition cursor-pointer"
                        >
                          View All {weekBananaCount} Banana Events in Week View
                        </button>
                        {days
                          .filter((d) => getDayMeta(d.dateObj).bananaCount > 0)
                          .map((d) => (
                            <button
                              key={d.index}
                              type="button"
                              onClick={() => {
                                setSelectedDayIndex(d.index);
                                setViewMode("day");
                              }}
                              className="rounded-xl border border-amber-300 bg-[#fffbeb] px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-[#fef3c7] transition cursor-pointer"
                            >
                              Jump to {d.dayName} {d.dateNum} (🟡 {getDayMeta(d.dateObj).bananaCount})
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted">
                      No banana events found in this 7-day strip. Use &quot;Previous Days&quot; to check earlier weeks.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <CalendarDays size={32} className="mx-auto text-muted/40 mb-3" />
                  <p className="text-[13px] font-semibold text-ink">No events scheduled for this day</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {isConnected
                      ? "Your Google Calendar is clear for this date, or events may be on another day of this week."
                      : "Connect your Google account above to sync your real calendar schedule."}
                  </p>
                  {weekFilteredEvents.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setViewMode("week")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] transition cursor-pointer shadow-2xs"
                      >
                        <Sparkles size={12} className="text-amber-500" />
                        <span>View All {weekFilteredEvents.length} Events in this Week</span>
                      </button>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {!isConnected && (
                      <form action={connectGoogle}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
                        >
                          Connect Google
                        </button>
                      </form>
                    )}
                    <button
                      onClick={onOpenAddEvent}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[11px] font-semibold text-forest hover:bg-[#fdf2f2] transition"
                    >
                      <Plus size={13} /> Add event
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#eff1ec]">
              {filteredEvents.map((event, idx) => renderEventItem(event, idx))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
