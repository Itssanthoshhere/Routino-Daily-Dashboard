"use client";

import { useState, useEffect, useMemo } from "react";
import { Video, ExternalLink, X, Clock3, Calendar } from "lucide-react";
import type { DashboardEvent } from "@/types/dashboard";

function extractMeetingUrl(event: DashboardEvent): string | null {
  if (event.meetLink) return event.meetLink;
  // Google Calendar raw property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHangout = (event as any).hangoutLink;
  if (rawHangout) return rawHangout;

  const textToScan = `${event.location || ""} ${event.description || ""}`;
  const meetMatch = textToScan.match(/https:\/\/(?:meet\.google\.com|[\w-]+\.zoom\.us\/j|teams\.microsoft\.com|teams\.live\.com)\/[^\s"'>]+/i);
  if (meetMatch) return meetMatch[0];

  return event.htmlLink || null;
}

export function UpNextMeetingBanner({ events }: { events: DashboardEvent[] }) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Refresh current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const upNext = useMemo(() => {
    if (!events || events.length === 0) return null;

    for (const event of events) {
      if (dismissedId === event.id) continue;
      const startStr = event.start?.dateTime || event.start?.date;
      if (!startStr) continue;

      const startTime = new Date(startStr).getTime();
      if (Number.isNaN(startTime)) continue;

      const endStr = event.end?.dateTime || event.end?.date;
      const endTime = endStr ? new Date(endStr).getTime() : startTime + 30 * 60 * 1000;

      const diffMinutes = Math.floor((startTime - currentTime) / (60 * 1000));
      const isOngoing = currentTime >= startTime && currentTime < endTime;
      const isSoon = diffMinutes >= 0 && diffMinutes <= 35;

      if (isOngoing || isSoon) {
        const joinUrl = extractMeetingUrl(event);
        return {
          event,
          isOngoing,
          diffMinutes,
          joinUrl,
          startTimeStr: new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(startTime)),
          endTimeStr: new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(endTime)),
        };
      }
    }
    return null;
  }, [events, dismissedId, currentTime]);

  if (!upNext) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-forest/20 bg-gradient-to-r from-[#fdf6f6] via-[#fffbf9] to-[#fafbf8] p-3.5 sm:p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Meeting Status & Title */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="relative shrink-0 mt-0.5 sm:mt-0">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white shadow-xs">
              <Video size={17} />
            </span>
            <span
              className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                upNext.isOngoing ? "bg-emerald-500 animate-ping" : "bg-amber-500"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  upNext.isOngoing
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Clock3 size={11} />
                <span>{upNext.isOngoing ? "Happening Now" : `Starts in ${upNext.diffMinutes}m`}</span>
              </span>
              <span className="text-[11px] font-medium text-muted flex items-center gap-1">
                <Calendar size={11} />
                {upNext.startTimeStr} – {upNext.endTimeStr}
              </span>
            </div>
            <h4 className="mt-1 truncate text-[13px] font-bold text-ink">
              {upNext.event.summary || "Scheduled Call"}
            </h4>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {upNext.joinUrl && (
            <a
              href={upNext.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
            >
              <Video size={13} />
              <span>Join Meeting</span>
              <ExternalLink size={12} className="opacity-80" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setDismissedId(upNext.event.id)}
            title="Dismiss this notification"
            className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
