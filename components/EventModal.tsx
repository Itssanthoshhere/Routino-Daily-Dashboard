"use client";

import { useState } from "react";
import { CalendarDays, Clock, Video, Users, ExternalLink, X, Plus, MapPin, Calendar } from "lucide-react";
import { DashboardEvent } from "@/types/dashboard";
import { appConfig } from "@/lib/config";
import { getMeetingUrl } from "@/lib/meeting";

type EventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventToView?: DashboardEvent | null;
  onAddEvent?: (event: DashboardEvent) => void;
};

export function EventModal({ isOpen, onClose, eventToView, onAddEvent }: EventModalProps) {
  const [summary, setSummary] = useState("");
  const [time, setTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("11:00 AM");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("WORK");
  const [meetLink, setMeetLink] = useState("https://meet.google.com/new");

  if (!isOpen) return null;

  const isViewing = !!eventToView;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !onAddEvent) return;

    const newEvent: DashboardEvent = {
      id: "evt-" + Date.now(),
      summary: summary.trim(),
      description: description.trim() || `Manual event · ${appConfig.name}`,
      start: { dateTime: new Date().toISOString() },
      end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
      tag,
      meetLink: meetLink.trim() || undefined,
      color:
        tag === "PROJECT"
          ? "#7c3aed"
          : tag === "MEETING"
          ? "#2563eb"
          : tag === "PERSONAL"
          ? "#d97706"
          : "#16a34a",
      isCustom: true,
    };

    onAddEvent(newEvent);
    setSummary("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf0ff] text-[#6088d1]">
              <CalendarDays size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">
                {isViewing ? "Event Details" : "Schedule New Event"}
              </h3>
              <p className="text-[11px] text-muted">
                {isViewing ? "Calendar overview & meet links" : "Plan an appointment or meeting"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {isViewing && eventToView ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-[16px] font-semibold text-ink">{eventToView.summary || "Untitled Event"}</h4>
                  <p className="mt-1 text-[12px] text-muted">{eventToView.description || "No description provided."}</p>
                </div>
                {eventToView.tag && (
                  <span className="rounded-md bg-[#faf1e4] px-2 py-1 text-[10px] font-bold text-[#a5793d]">
                    {eventToView.tag}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-2 text-[12px] text-[#58645c]">
                  <Clock size={14} className="text-muted" />
                  <span>
                    {eventToView.start?.dateTime
                      ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(eventToView.start.dateTime))
                      : "Today"}
                    {eventToView.end?.dateTime &&
                      ` – ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(eventToView.end.dateTime))}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#58645c]">
                  <Users size={14} className="text-muted" />
                  <span>{eventToView.attendees?.length ? `${eventToView.attendees.length} guests` : "Self / Workspace"}</span>
                </div>
              </div>
            </div>

            {(() => {
              const videoMeetUrl = getMeetingUrl(eventToView);
              return (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                  {videoMeetUrl ? (
                    <a
                      href={videoMeetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#8b1116] cursor-pointer"
                    >
                      <Video size={14} /> Join Meeting <ExternalLink size={12} />
                    </a>
                  ) : eventToView.htmlLink ? (
                    <a
                      href={eventToView.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-[12px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition cursor-pointer"
                    >
                      <Calendar size={13} /> View on Google Calendar <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4f5f0] px-3 py-1.5 text-[11px] font-medium text-muted">
                      <Calendar size={13} /> In-person / Local Event
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-xl px-4 py-2 text-[12px] font-medium text-muted hover:bg-[#f1f3ed] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              );
            })()}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-ink">Event Title</label>
              <input
                type="text"
                required
                autoFocus
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Design review with team"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink">Start Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-ink">End Time</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="11:00 AM"
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink">Category / Tag</label>
              <div className="mt-1.5 flex gap-1.5">
                {[
                  { id: "PROJECT", label: "Project", color: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]" },
                  { id: "WORK", label: "Work", color: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]" },
                  { id: "MEETING", label: "Meeting", color: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]" },
                  { id: "PERSONAL", label: "Personal", color: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTag(item.id)}
                    className={`flex-1 rounded-xl border py-1.5 text-[11px] font-bold transition cursor-pointer ${
                      tag === item.id
                        ? `${item.color} ring-1 ring-black/10 shadow-2xs`
                        : "border-line bg-white text-muted hover:bg-black/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink">Meeting / Meet Link</label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink">Description / Agenda</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Review roadmap topics and action items..."
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-muted hover:bg-[#f1f3ed]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-forest px-5 py-2.5 text-[12px] font-semibold text-white shadow transition hover:bg-[#8b1116]"
              >
                Schedule Event
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
