"use client";

import { useState } from "react";
import {
  Inbox,
  Search,
  Star,
  ExternalLink,
  Mail,
  Filter,
  CheckCircle2,
  Reply,
} from "lucide-react";
import { DashboardMail } from "@/types/dashboard";

type InboxViewProps = {
  mailList: DashboardMail[];
  onSelectMail: (mail: DashboardMail) => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  isConnected: boolean;
};

export function InboxView({
  mailList,
  onSelectMail,
  onToggleStar,
  onToggleRead,
  isConnected,
}: InboxViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "starred" | "reply">("all");

  const filteredMail = mailList.filter((m) => {
    // Search query
    const matchQuery =
      m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchQuery) return false;

    // Filter type
    if (selectedFilter === "unread") return !m.read;
    if (selectedFilter === "starred") return m.starred;
    if (selectedFilter === "reply") return m.category === "reply";
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Inbox Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-line pb-5">
        <div>
          <h2 className="text-[20px] font-bold text-ink">Important Inbox</h2>
          <p className="text-[12px] text-muted">
            {isConnected
              ? "Live unread messages from Gmail · Important & updates"
              : "Showing preview messages · Connect Google for real-time Gmail inbox"}
          </p>
        </div>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition self-start sm:self-auto"
        >
          Open Gmail <ExternalLink size={12} />
        </a>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sender, subject, or content..."
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "all"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            All ({mailList.length})
          </button>
          <button
            onClick={() => setSelectedFilter("unread")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "unread"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Unread ({mailList.filter((m) => !m.read).length})
          </button>
          <button
            onClick={() => setSelectedFilter("starred")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "starred"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Starred
          </button>
          <button
            onClick={() => setSelectedFilter("reply")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "reply"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Reply Needed
          </button>
        </div>
      </div>

      {/* Mail List */}
      <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
        {filteredMail.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox size={32} className="mx-auto text-muted/40 mb-3" />
            <p className="text-[13px] font-semibold text-ink">No messages match your criteria</p>
            <p className="mt-1 text-[11px] text-muted">Try adjusting your search terms or filter selection.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#eff1ec]">
            {filteredMail.map((mail) => (
              <div
                key={mail.id}
                onClick={() => onSelectMail(mail)}
                className={`flex items-start gap-4 p-4 hover:bg-[#fbfcf9] transition cursor-pointer group ${
                  !mail.read ? "bg-[#fffdfa]" : ""
                }`}
              >
                {/* Star Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(mail.id);
                  }}
                  className={`mt-0.5 p-1 rounded transition ${
                    mail.starred ? "text-[#e7a15a]" : "text-muted/40 hover:text-muted"
                  }`}
                  aria-label="Star"
                >
                  <Star size={16} fill={mail.starred ? "currentColor" : "none"} />
                </button>

                {/* Avatar */}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f0c6ae] text-[10px] font-bold text-[#4d5b52]">
                  {mail.from.slice(0, 2).toUpperCase()}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-[12px] ${
                        !mail.read ? "font-bold text-ink" : "font-medium text-[#49574f]"
                      }`}
                    >
                      {mail.from}
                    </p>
                    <span className="text-[10px] text-muted shrink-0">{mail.date}</span>
                  </div>

                  <p
                    className={`mt-0.5 truncate text-[12px] ${
                      !mail.read ? "font-semibold text-ink" : "text-[#58645c]"
                    }`}
                  >
                    {mail.subject}
                  </p>

                  <p className="mt-1 line-clamp-1 text-[11px] text-muted">{mail.snippet}</p>

                  {mail.category && (
                    <span className="mt-2 inline-block rounded bg-[#fbf0e5] px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-[#a7764b]">
                      {mail.category.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRead(mail.id);
                    }}
                    className="text-[10px] text-muted hover:text-forest transition p-1"
                  >
                    {mail.read ? "Mark unread" : "Mark read"}
                  </button>
                  <a
                    href={mail.href || "https://mail.google.com"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-muted hover:text-forest transition"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
