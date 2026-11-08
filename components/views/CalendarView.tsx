"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Video,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  MapPin,
  Plane,
  AlertTriangle,
  RotateCcw,
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

  // Today base date
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
  const dayEvents = events.filter((ev) => {
    const startStr = ev.start?.dateTime ?? ev.start?.date;
    if (!startStr) return selectedDayIndex === 0 && weekOffset === 0;
    const d = new Date(startStr);
    return d.toDateString() === selectedDate.toDateString();
  });

  // Filter by tag
  const filteredEvents =
    selectedTag === "ALL"
      ? dayEvents
      : selectedTag === "BANANA"
      ? dayEvents.filter(
          (e) =>
            (e.tag || "").toUpperCase() === "BANANA" ||
            isBananaYellowColor(e.colorId, e.color || e.calendarColor)
        )
      : selectedTag === "PROJECT"
      ? dayEvents.filter(
          (e) =>
            (e.tag || "").toUpperCase() === "PROJECT" ||
            /\b(project|projects|product|products|website|building|portfolio|coding|dev|spendo|dashboard|app)\b/i.test(
              `${e.summary || ""} ${e.description || ""}`
            )
        )
      : selectedTag === "TRAVEL"
      ? dayEvents.filter(
          (e) =>
            (e.tag || "").toUpperCase() === "TRAVEL" ||
            /\b(flight|train|hotel|airport|airline|trip|travel|indigo|6e|ai|uk)\b/i.test(
              `${e.summary || ""} ${e.description || ""}`
            )
        )
      : dayEvents.filter(
          (e) => (e.tag || "WORK").toUpperCase() === selectedTag.toUpperCase()
        );

  // Helper to inspect day events for dots
  const getDayMeta = (d: Date) => {
    const evs = events.filter((ev) => {
      const s = ev.start?.dateTime ?? ev.start?.date;
      return s && new Date(s).toDateString() === d.toDateString();
    });
    const hasBanana = evs.some(
      (e) =>
        (e.tag || "").toUpperCase() === "BANANA" ||
        isBananaYellowColor(e.colorId, e.color || e.calendarColor)
    );
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
    return { count: evs.length, hasBanana, hasTravel, hasProject };
  };

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-line pb-5">
        <div>
          <h2 className="text-[20px] font-bold text-ink">Calendar Schedule</h2>
          <p className="text-[12px] text-muted">
            {isConnected
              ? "Synced with Google Calendar · Today + upcoming 7 days"
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

      {/* 7-Day Strip with Dots */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:overflow-visible">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 min-w-[340px] sm:min-w-0">
          {days.map((day) => {
            const isSelected = selectedDayIndex === day.index;
            const meta = getDayMeta(day.dateObj);
            return (
              <button
                key={day.index}
                onClick={() => setSelectedDayIndex(day.index)}
                className={`flex flex-col items-center rounded-2xl p-2 sm:p-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-forest text-white shadow-md scale-[1.02]"
                    : "bg-white border border-line text-ink hover:bg-[#f4f7ef]"
                }`}
              >
                <span
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? "text-accent" : "text-muted"
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="mt-1 text-[16px] sm:text-[18px] font-bold">{day.dateNum}</span>
                <span
                  className={`text-[8px] sm:text-[9px] mt-0.5 ${
                    isSelected ? "text-white/70" : "text-[#9da79e]"
                  }`}
                >
                  {day.month}
                </span>

                {/* Event indicator dots: Yellow (Banana), Sky (Travel), Purple (Project) */}
                <div className="mt-1.5 flex items-center justify-center gap-1 min-h-[6px]">
                  {meta.hasBanana && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[#fef08a]" : "bg-[#eab308]"}`}
                      title="Yellow/Banana Event"
                    />
                  )}
                  {meta.hasTravel && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-sky-200" : "bg-[#0284c7]"}`}
                      title="Travel Event"
                    />
                  )}
                  {meta.hasProject && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-purple-200" : "bg-[#7c3aed]"}`}
                      title="Project Event"
                    />
                  )}
                  {!meta.hasBanana && !meta.hasTravel && !meta.hasProject && day.isToday && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-accent" : "bg-forest"
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

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[11px] font-semibold text-muted flex items-center gap-1 mr-1">
          <Filter size={12} /> Filter:
        </span>
        {["ALL", "PROJECT", "TRAVEL", "BANANA", "WORK", "MEETING", "PERSONAL", "OUTLOOK"].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
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

      {/* Event List */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <span className="text-[13px] font-semibold text-ink">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(selectedDate)}
          </span>
          <span className="text-[11px] text-muted">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {/* Schedule Conflicts Alert Banner */}
        {dayConflicts.length > 0 && (
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

        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays size={32} className="mx-auto text-muted/40 mb-3" />
            <p className="text-[13px] font-semibold text-ink">No events scheduled for this day</p>
            <p className="mt-1 text-[11px] text-muted">
              {isConnected
                ? "Your Google Calendar is completely clear for this date."
                : "Connect your Google account above to sync your real calendar schedule."}
            </p>
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
        ) : (
          <div className="divide-y divide-[#eff1ec]">
            {filteredEvents.map((event, idx) => {
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

              return (
                <div
                  key={event.id || idx}
                  onClick={() => onSelectEvent(event)}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#fbfcf9] transition p-2 rounded-xl cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className="mt-1 h-3 w-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{
                        backgroundColor: event.color || hues[idx % hues.length],
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[13px] font-semibold text-ink group-hover:text-forest transition truncate">
                        {event.summary || "Untitled Event"}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
                        {event.description || "Workspace calendar meeting"}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                        <Clock size={12} />
                        <span>
                          {startFormatted}
                          {endFormatted ? ` – ${endFormatted}` : ""}
                        </span>
                        {(() => {
                          const isBanana =
                            (event.tag || "").toUpperCase() === "BANANA" ||
                            isBananaYellowColor(event.colorId, event.color || event.calendarColor);
                          const tagToDisplay = isBanana ? "BANANA" : event.tag;
                          if (!tagToDisplay) return null;
                          return (
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
                          );
                        })()}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
