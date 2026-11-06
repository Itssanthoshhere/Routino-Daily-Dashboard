"use client";

import { useState } from "react";
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
} from "lucide-react";
import { DashboardEvent } from "@/types/dashboard";
import { connectGoogle } from "@/app/actions";
import { getMeetingUrl } from "@/lib/meeting";

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
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Generate 7 rolling days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return {
      offset: i,
      dateObj: d,
      dayName: new Intl.DateTimeFormat("en", { weekday: "short" }).format(d),
      dateNum: d.getDate(),
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(d),
      isToday: i === 0,
    };
  });

  const selectedDate = days[selectedDayOffset].dateObj;

  // Filter events for selected day
  const dayEvents = events.filter((ev) => {
    const startStr = ev.start?.dateTime ?? ev.start?.date;
    if (!startStr) return selectedDayOffset === 0; // Default sample events to today
    const d = new Date(startStr);
    return d.toDateString() === selectedDate.toDateString();
  });

  // Filter by tag
  const filteredEvents =
    selectedTag === "ALL"
      ? dayEvents
      : dayEvents.filter(
          (e) => (e.tag || "WORK").toUpperCase() === selectedTag.toUpperCase()
        );

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

      {/* Rolling 7-Day Picker */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:overflow-visible">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 min-w-[340px] sm:min-w-0">
          {days.map((day) => {
            const isSelected = selectedDayOffset === day.offset;
            return (
              <button
                key={day.offset}
                onClick={() => setSelectedDayOffset(day.offset)}
                className={`flex flex-col items-center rounded-2xl p-2 sm:p-3 transition-all ${
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
                {day.isToday && (
                  <span
                    className={`mt-1 sm:mt-1.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-accent" : "bg-forest"
                    }`}
                  />
                )}
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
        {["ALL", "WORK", "PREP", "PERSONAL", "OUTLOOK"].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
              selectedTag === tag
                ? "bg-forest text-white shadow-sm"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            {tag}
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
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3 w-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{
                        backgroundColor: event.color || hues[idx % hues.length],
                      }}
                    />
                    <div>
                      <h4 className="text-[13px] font-semibold text-ink group-hover:text-forest transition">
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
                        {event.tag && (
                          <span
                            className={`rounded px-1.5 py-0.5 font-bold ${
                              event.tag === "OUTLOOK"
                                ? "bg-[#ebf3fc] text-[#0078d4]"
                                : "bg-[#faf1e4] text-[#a5793d]"
                            }`}
                          >
                            {event.tag}
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
