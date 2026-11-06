"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Video, Calendar, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import type { DashboardEvent } from "@/types/dashboard";
import { getMeetingUrl } from "@/lib/meeting";

interface DayTimelineBarProps {
  events: DashboardEvent[];
  startHour?: number; // e.g. 8 for 8:00 AM
  endHour?: number;   // e.g. 20 for 8:00 PM
}

export function DayTimelineBar({
  events,
  startHour = 8,
  endHour = 20,
}: DayTimelineBarProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const totalDayMinutes = (endHour - startHour) * 60;

  // Calculate current progress
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

  // Filter and map today's events that overlap the display window
  const dayEvents = useMemo(() => {
    const todayStr = now.toISOString().split("T")[0];

    return events
      .filter((ev) => {
        const startStr = ev.start?.dateTime || ev.start?.date;
        if (!startStr) return false;
        return startStr.startsWith(todayStr);
      })
      .map((ev) => {
        const startStr = ev.start?.dateTime || ev.start?.date || "";
        const endStr = ev.end?.dateTime || ev.end?.date || "";
        const startDate = new Date(startStr);
        const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 30 * 60 * 1000);

        const eventStartMin = startDate.getHours() * 60 + startDate.getMinutes();
        const eventEndMin = endDate.getHours() * 60 + endDate.getMinutes();

        // Calculate position percentage along the bar
        const leftPercent = Math.min(
          100,
          Math.max(0, ((eventStartMin - startMinutes) / totalDayMinutes) * 100)
        );
        const widthPercent = Math.min(
          100 - leftPercent,
          Math.max(1.5, ((eventEndMin - eventStartMin) / totalDayMinutes) * 100)
        );

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
          leftPercent,
          widthPercent,
          isPast,
          isCurrent,
          isUpcoming,
          meetUrl,
          htmlLink: ev.htmlLink,
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events, now, startMinutes, totalDayMinutes, currentMinutes]);

  // Format status string
  let statusText = "";
  if (isBeforeWorkday) {
    const minUntil = startMinutes - currentMinutes;
    const h = Math.floor(minUntil / 60);
    const m = minUntil % 60;
    statusText = `Day starts at ${startHour}:00 AM (in ${h > 0 ? `${h}h ` : ""}${m}m)`;
  } else if (isAfterWorkday) {
    statusText = `Workday complete · Rest & recharge 🌙`;
  } else {
    statusText = `${Math.round(progressPercent)}% elapsed · ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m left until ${endHour > 12 ? endHour - 12 : endHour}:00 PM`;
  }

  return (
    <div className="relative rounded-2xl border border-line bg-white p-3.5 sm:p-4 shadow-card transition-all">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[#f0fdf4] text-[#16a34a]">
            <Clock size={12} />
          </span>
          <span className="font-semibold text-ink">Today&apos;s Flow</span>
          <span className="hidden sm:inline-block text-muted/50">·</span>
          <span className="text-muted font-medium">{statusText}</span>
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

      {/* Visual Timeline Bar */}
      <div className="relative mt-2.5 mb-1 pt-1">
        {/* Track */}
        <div className="relative h-2 w-full rounded-full bg-[#f1f3ed] overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-forest/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Meeting Segments overlay on top of the track */}
        {dayEvents.map((ev) => (
          <div
            key={ev.id}
            onMouseEnter={() => setActiveTooltipId(ev.id)}
            onMouseLeave={() => setActiveTooltipId(null)}
            className="absolute top-1 h-2 cursor-pointer transition-all"
            style={{
              left: `${ev.leftPercent}%`,
              width: `${Math.max(ev.widthPercent, 1.5)}%`,
            }}
          >
            <div
              className={`h-full rounded-full transition-transform hover:scale-y-150 ${
                ev.isCurrent
                  ? "bg-[#2563eb] ring-2 ring-[#2563eb]/40 animate-pulse"
                  : ev.isPast
                  ? "bg-[#cbd5e1]"
                  : ev.meetUrl
                  ? "bg-forest"
                  : "bg-[#d97706]"
              }`}
            />

            {/* Hover Tooltip */}
            {activeTooltipId === ev.id && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-lg bg-[#1f2421] px-2.5 py-1.5 text-[10px] text-white shadow-xl pointer-events-auto"
                style={{ transform: "translateX(-50%)" }}
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

        {/* Now Indicator Pin (if within the workday bounds) */}
        {!isBeforeWorkday && !isAfterWorkday && (
          <div
            className="absolute -top-0.5 z-20 -translate-x-1/2 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          >
            <div className="h-3 w-1.5 rounded-full bg-forest ring-2 ring-white shadow-xs animate-pulse" />
          </div>
        )}
      </div>

      {/* Axis Hour Labels */}
      <div className="flex items-center justify-between text-[9px] text-muted/60 font-medium px-0.5 mt-1">
        <span>{startHour}:00 AM</span>
        <span>12:00 PM</span>
        <span>4:00 PM</span>
        <span>{endHour > 12 ? endHour - 12 : endHour}:00 PM</span>
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
