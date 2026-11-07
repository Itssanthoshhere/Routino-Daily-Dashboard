"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Video, Calendar, ChevronDown, ChevronUp, MapPin, Moon, Plane, AlertTriangle } from "lucide-react";
import type { DashboardEvent } from "@/types/dashboard";
import { getMeetingUrl, findScheduleConflicts, ScheduleConflict } from "@/lib/meeting";

interface DayTimelineBarProps {
  events: DashboardEvent[];
  startHour?: number;
  endHour?: number;
}

export function DayTimelineBar({
  events,
  startHour: propStartHour,
  endHour: propEndHour,
}: DayTimelineBarProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Filter raw today events
  const todayDateStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [now]);

  // Find all events for today
  const rawTodayEvents = useMemo(() => {
    return events.filter((ev) => {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) return false;
      return startStr.startsWith(todayDateStr);
    });
  }, [events, todayDateStr]);

  // Detect schedule overlaps/conflicts for today
  const conflicts: ScheduleConflict[] = useMemo(() => {
    return findScheduleConflicts(rawTodayEvents, todayDateStr);
  }, [rawTodayEvents, todayDateStr]);

  // Dynamically determine start and end hours
  const { startHour, endHour } = useMemo(() => {
    let s = propStartHour ?? 8;
    let e = propEndHour ?? 20;

    const currentH = now.getHours();

    // Check if there are events before 8 AM or after 8 PM (20:00)
    for (const ev of rawTodayEvents) {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) continue;
      const d = new Date(startStr);
      const h = d.getHours();
      if (h < s) s = Math.max(6, h);
      if (h >= e || h === 23 || h === 22 || h === 21) e = 24;
    }

    // If current time is late evening/night, extend timeline to midnight (24:00)
    if (currentH >= 20 || currentH < 6) {
      e = 24;
    }
    if (currentH < s && currentH >= 6) {
      s = 6;
    }

    return { startHour: s, endHour: e };
  }, [propStartHour, propEndHour, now, rawTodayEvents]);

  const totalDayMinutes = (endHour - startHour) * 60;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  const isBeforeWorkday = currentMinutes < startMinutes;
  const isAfterWorkday = currentMinutes >= endMinutes;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentMinutes - startMinutes) / totalDayMinutes) * 100)
  );

  // Remaining time calculation
  const minutesRemaining = Math.max(0, endMinutes - currentMinutes);
  const hoursLeft = Math.floor(minutesRemaining / 60);
  const minsLeft = minutesRemaining % 60;

  // Map today's events with strictly clamped positions
  const dayEvents = useMemo(() => {
    return rawTodayEvents
      .map((ev) => {
        const startStr = ev.start?.dateTime || ev.start?.date || "";
        const endStr = ev.end?.dateTime || ev.end?.date || "";
        const startDate = new Date(startStr);
        const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 30 * 60 * 1000);

        const eventStartMin = startDate.getHours() * 60 + startDate.getMinutes();
        const eventEndMin = endDate.getHours() * 60 + endDate.getMinutes();

        // Raw percentage calculations
        const rawLeft = ((eventStartMin - startMinutes) / totalDayMinutes) * 100;
        const rawWidth = Math.max(2, ((eventEndMin - eventStartMin) / totalDayMinutes) * 100);

        // GUARANTEED CLAMP: marker can NEVER exceed 100% or be less than 0%
        const clampedWidth = Math.min(100, Math.max(2, rawWidth));
        const clampedLeft = Math.max(0, Math.min(100 - clampedWidth, rawLeft));

        const isPast = eventEndMin < currentMinutes;
        const isCurrent = currentMinutes >= eventStartMin && currentMinutes < eventEndMin;
        const isUpcoming = eventStartMin >= currentMinutes;

        const timeLabel = startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const meetUrl = getMeetingUrl(ev);

        return {
          id: ev.id,
          summary: ev.summary || "Untitled Event",
          location: ev.location || null,
          startDate,
          endDate,
          timeLabel,
          leftPercent: clampedLeft,
          widthPercent: clampedWidth,
          isPast,
          isCurrent,
          isUpcoming,
          meetUrl,
          tag: ev.tag,
          color: ev.color,
          htmlLink: ev.htmlLink,
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [rawTodayEvents, startMinutes, totalDayMinutes, currentMinutes]);

  // Format status string
  let statusText = "";
  const currentH = now.getHours();

  if (currentH < 6) {
    statusText = `Late night / quiet hours · Rest & recharge 🌙`;
  } else if (isBeforeWorkday) {
    const minUntil = startMinutes - currentMinutes;
    const h = Math.floor(minUntil / 60);
    const m = minUntil % 60;
    statusText = `Day starts at ${startHour}:00 AM (in ${h > 0 ? `${h}h ` : ""}${m}m)`;
  } else if (isAfterWorkday) {
    statusText = `Day complete · Good night 🌙`;
  } else {
    statusText = `${Math.round(progressPercent)}% elapsed · ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m left until ${
      endHour === 24 ? "Midnight" : `${endHour > 12 ? endHour - 12 : endHour}:00 PM`
    }`;
  }

  // Format axis markers
  const axisMid1 = Math.round(startHour + (endHour - startHour) * 0.33);
  const axisMid2 = Math.round(startHour + (endHour - startHour) * 0.66);

  const formatHourLabel = (h: number) => {
    if (h === 0 || h === 24) return "12:00 AM";
    if (h === 12) return "12:00 PM";
    return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
  };

  return (
    <div className="relative rounded-2xl border border-line bg-white p-3.5 sm:p-4 shadow-card transition-all overflow-hidden">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`grid h-5 w-5 place-items-center rounded-md shrink-0 ${
              currentH < 6 ? "bg-[#f5f3ff] text-[#7c3aed]" : "bg-[#f0fdf4] text-[#16a34a]"
            }`}
          >
            {currentH < 6 ? <Moon size={12} /> : <Clock size={12} />}
          </span>
          <span className="font-semibold text-ink shrink-0">Today&apos;s Flow</span>
          <span className="hidden sm:inline-block text-muted/50 shrink-0">·</span>
          <span className="text-muted font-medium truncate">{statusText}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold text-muted bg-[#f7f7f2] px-2 py-0.5 rounded-md border border-line">
            {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
          {dayEvents.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
              title={isExpanded ? "Collapse event details" : "Expand event details"}
            >
              <span>{dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}</span>
              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>
      </div>

      {/* Schedule Conflicts / Overlap Alert */}
      {conflicts.length > 0 && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-[#fffbeb] px-3 py-1.5 text-[11px] text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <AlertTriangle size={13} className="shrink-0 text-amber-600" />
            <span className="font-bold shrink-0">Schedule Overlap ({conflicts.length}):</span>
            <span className="truncate">
              &quot;{conflicts[0].eventA.summary}&quot; &amp; &quot;{conflicts[0].eventB.summary}&quot; ({conflicts[0].startTimeStr} – {conflicts[0].endTimeStr})
            </span>
          </div>
          <span className="shrink-0 font-extrabold text-[9.5px] uppercase bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
            {conflicts[0].overlapMinutes}m Overlap
          </span>
        </div>
      )}

      {/* Visual Timeline Bar Track Container */}
      <div className="relative mt-2.5 mb-1 pt-1 w-full">
        {/* Track Base */}
        <div className="relative h-2 w-full rounded-full bg-[#f1f3ed] overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-forest/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Meeting Segments overlay on top of the track (bounded within track margins) */}
        <div className="absolute inset-x-0 top-1 h-2 pointer-events-none">
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              onMouseEnter={() => setActiveTooltipId(ev.id)}
              onMouseLeave={() => setActiveTooltipId(null)}
              className="absolute top-0 h-2 cursor-pointer transition-all pointer-events-auto"
              style={{
                left: `${ev.leftPercent}%`,
                width: `${ev.widthPercent}%`,
                maxWidth: `${100 - ev.leftPercent}%`,
              }}
            >
              <div
                className={`h-full rounded-full transition-transform hover:scale-y-150 ${
                  ev.isCurrent
                    ? "bg-[#2563eb] ring-2 ring-[#2563eb]/40 animate-pulse"
                    : ev.isPast
                    ? "bg-[#cbd5e1]"
                    : ev.tag === "TRAVEL"
                    ? "bg-[#0284c7]"
                    : ev.tag === "PROJECT"
                    ? "bg-[#7c3aed]"
                    : ev.meetUrl
                    ? "bg-forest"
                    : "bg-[#d97706]"
                }`}
              />

              {/* Hover Tooltip - Smart horizontal alignment so it never overflows card boundary */}
              {activeTooltipId === ev.id && (
                <div
                  className={`absolute bottom-4 z-30 whitespace-nowrap rounded-lg bg-[#1f2421] px-2.5 py-1.5 text-[10px] text-white shadow-xl pointer-events-auto ${
                    ev.leftPercent > 70
                      ? "right-0"
                      : ev.leftPercent < 25
                      ? "left-0"
                      : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <div className="font-semibold">{ev.summary}</div>
                  <div className="text-white/70 text-[9px] flex items-center gap-1.5 mt-0.5">
                    <span>{ev.timeLabel}</span>
                    {ev.isCurrent && (
                      <span className="rounded bg-[#2563eb] px-1 py-0.2 text-[8px] font-bold text-white uppercase">
                        Now
                      </span>
                    )}
                    {ev.meetUrl ? (
                      <a
                        href={ev.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[#93c5fd] hover:underline"
                      >
                        <Video size={9} /> Join Meeting
                      </a>
                    ) : ev.tag === "TRAVEL" ? (
                      <span className="text-sky-300 flex items-center gap-0.5">
                        <Plane size={9} /> Flight / Travel
                      </span>
                    ) : ev.location ? (
                      <span className="text-amber-200 flex items-center gap-0.5">
                        <MapPin size={9} /> {ev.location}
                      </span>
                    ) : (
                      <span className="text-white/50">In-person</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Now Indicator Pin (clamped inside the bar) */}
        {!isBeforeWorkday && !isAfterWorkday && (
          <div
            className="absolute -top-0.5 z-20 -translate-x-1/2 pointer-events-none"
            style={{ left: `${Math.min(99, Math.max(1, progressPercent))}%` }}
          >
            <div className="h-3 w-1.5 rounded-full bg-forest ring-2 ring-white shadow-xs animate-pulse" />
          </div>
        )}
      </div>

      {/* Axis Hour Labels */}
      <div className="flex items-center justify-between text-[9px] text-muted/60 font-medium px-0.5 mt-1">
        <span>{formatHourLabel(startHour)}</span>
        <span>{formatHourLabel(axisMid1)}</span>
        <span>{formatHourLabel(axisMid2)}</span>
        <span>{formatHourLabel(endHour)}</span>
      </div>

      {/* Expanded Agenda View */}
      {isExpanded && dayEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/[0.04] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in">
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              className={`rounded-xl border p-2 text-[11px] flex items-start justify-between gap-2 transition ${
                ev.isCurrent
                  ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]"
                  : ev.isPast
                  ? "border-line/60 bg-[#fafbf8] text-muted opacity-75"
                  : "border-line bg-white text-ink"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate flex items-center gap-1.5">
                  {ev.isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb] animate-ping" />
                  )}
                  <span className="truncate">{ev.summary}</span>
                </div>
                <div className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
                  <Calendar size={10} className="shrink-0" />
                  <span>{ev.timeLabel}</span>
                  {ev.location && (
                    <>
                      <span>·</span>
                      <MapPin size={9} className="shrink-0 text-amber-600" />
                      <span className="truncate max-w-[100px] text-amber-800">{ev.location}</span>
                    </>
                  )}
                </div>
              </div>
              {ev.meetUrl ? (
                <a
                  href={ev.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition shrink-0 cursor-pointer ${
                    ev.isCurrent
                      ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                      : "bg-[#fdf2f2] text-forest hover:bg-[#8b1116] hover:text-white"
                  }`}
                >
                  <Video size={11} />
                  <span>Join Meeting</span>
                </a>
              ) : ev.tag === "TRAVEL" ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f9ff] border border-[#bae6fd] px-2 py-1 text-[10px] font-semibold text-[#0284c7] shrink-0">
                  <Plane size={10} />
                  <span>Travel</span>
                </span>
              ) : ev.location ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#fefce8] border border-[#fef08a] px-2 py-1 text-[10px] font-semibold text-[#854d0e] shrink-0">
                  <MapPin size={10} />
                  <span>In-person</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#f1f3ed] px-2 py-1 text-[10px] font-medium text-muted shrink-0">
                  <Calendar size={10} />
                  <span>Calendar Event</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
