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
  Shield,
  CreditCard,
  Server,
  Briefcase,
  ListTodo,
  RefreshCw,
} from "lucide-react";
import { DashboardMail, Task } from "@/types/dashboard";
import { connectGoogle } from "@/app/actions";
import { classifyEmail } from "@/lib/email-classifier";
import { findTaskForEmail } from "@/lib/email-task";

type InboxFilterType =
  | "all"
  | "unread"
  | "security"
  | "finance"
  | "infra"
  | "career"
  | "starred"
  | "reply"
  | "outlook";

type InboxViewProps = {
  mailList: DashboardMail[];
  tasks?: Task[];
  onSelectMail: (mail: DashboardMail) => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  onCreateTask?: (mail: DashboardMail) => void;
  onOpenTask?: (taskId: string) => void;
  isConnected: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
};

export function InboxView({
  mailList,
  tasks = [],
  onSelectMail,
  onToggleStar,
  onToggleRead,
  onCreateTask,
  onOpenTask,
  isConnected,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
}: InboxViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<InboxFilterType>("all");

  const counts = {
    all: mailList.length,
    unread: mailList.filter((m) => !m.read).length,
    security: mailList.filter((m) => classifyEmail(m)?.variant === "security").length,
    finance: mailList.filter((m) => classifyEmail(m)?.variant === "finance").length,
    infra: mailList.filter((m) => classifyEmail(m)?.variant === "infra").length,
    career: mailList.filter((m) => classifyEmail(m)?.variant === "career").length,
    starred: mailList.filter((m) => m.starred).length,
    reply: mailList.filter((m) => m.category === "reply").length,
  };

  const filteredMail = mailList.filter((m) => {
    // Search query
    const matchQuery =
      m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchQuery) return false;

    // Filter type
    if (selectedFilter === "unread") return !m.read;
    if (selectedFilter === "security") return classifyEmail(m)?.variant === "security";
    if (selectedFilter === "finance") return classifyEmail(m)?.variant === "finance";
    if (selectedFilter === "infra") return classifyEmail(m)?.variant === "infra";
    if (selectedFilter === "career") return classifyEmail(m)?.variant === "career";
    if (selectedFilter === "starred") return m.starred;
    if (selectedFilter === "reply") return m.category === "reply";
    if (selectedFilter === "outlook") return m.category === "outlook" || m.source === "outlook";
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
              : "Connect Google to see and manage your real unread emails"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <form action={connectGoogle}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
              >
                Connect Google Account
              </button>
            </form>
          )}
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12px] font-medium text-[#5c6960] hover:bg-[#f1f3ed] transition self-start sm:self-auto"
          >
            Open Gmail <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Scope Disclaimer banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-[#faf6ed] px-3.5 py-2.5 text-[11px] text-[#856c3e] border border-[#f0e7d8]">
        <div className="flex items-center gap-2">
          <Filter size={13} className="shrink-0 text-[#b45309]" />
          <span>
            <strong>Loaded Messages:</strong> Showing {mailList.length} recent unread message{mailList.length !== 1 ? "s" : ""}. Category filters reflect these loaded emails.
          </span>
        </div>
        {onLoadMore && hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-white/90 border border-[#e2d5c0] px-2.5 py-1 text-[10px] font-bold text-[#856c3e] hover:bg-white hover:border-[#b45309]/40 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={10} className={isLoadingMore ? "animate-spin text-[#b45309]" : "text-[#b45309]"} />
            <span>{isLoadingMore ? "Loading..." : "Load more unread +"}</span>
          </button>
        )}
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

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "all"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setSelectedFilter("unread")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "unread"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Unread ({counts.unread})
          </button>
          {counts.security > 0 && (
            <button
              onClick={() => setSelectedFilter("security")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1 ${
                selectedFilter === "security"
                  ? "bg-[#b91c1c] text-white"
                  : "bg-[#fff5f5] border border-[#fecaca] text-[#b91c1c] hover:bg-[#fce8e6]"
              }`}
            >
              <Shield size={12} />
              Security ({counts.security})
            </button>
          )}
          {counts.finance > 0 && (
            <button
              onClick={() => setSelectedFilter("finance")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1 ${
                selectedFilter === "finance"
                  ? "bg-[#b45309] text-white"
                  : "bg-[#fffbeb] border border-[#fde68a] text-[#b45309] hover:bg-[#fef3c7]"
              }`}
            >
              <CreditCard size={12} />
              Finance ({counts.finance})
            </button>
          )}
          {counts.infra > 0 && (
            <button
              onClick={() => setSelectedFilter("infra")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1 ${
                selectedFilter === "infra"
                  ? "bg-[#0284c7] text-white"
                  : "bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] hover:bg-[#e0f2fe]"
              }`}
            >
              <Server size={12} />
              Infra ({counts.infra})
            </button>
          )}
          {counts.career > 0 && (
            <button
              onClick={() => setSelectedFilter("career")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1 ${
                selectedFilter === "career"
                  ? "bg-[#7e22ce] text-white"
                  : "bg-[#faf5ff] border border-[#e9d5ff] text-[#7e22ce] hover:bg-[#f3e8ff]"
              }`}
            >
              <Briefcase size={12} />
              Career ({counts.career})
            </button>
          )}
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
          {mailList.some((m) => m.category === "outlook" || m.source === "outlook") && (
            <button
              onClick={() => setSelectedFilter("outlook")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                selectedFilter === "outlook"
                  ? "bg-[#0078d4] text-white"
                  : "bg-white border border-line text-[#0078d4] hover:bg-[#ebf3fc]"
              }`}
            >
              Outlook ({mailList.filter((m) => m.category === "outlook" || m.source === "outlook").length})
            </button>
          )}
        </div>
      </div>

      {/* Mail List */}
      <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
        {filteredMail.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox size={32} className="mx-auto text-muted/40 mb-3" />
            <p className="text-[13px] font-semibold text-ink">
              {isConnected ? "All caught up!" : "No messages found"}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {isConnected
                ? "No unread messages in your primary Gmail categories."
                : "Connect your Google account above to load your real unread emails."}
            </p>
            {!isConnected && (
              <form action={connectGoogle} className="mt-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
                >
                  Connect Google
                </button>
              </form>
            )}
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

                  {(() => {
                    const actionBadge = classifyEmail(mail);
                    if (actionBadge) {
                      return (
                        <span
                          className={`mt-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[8.5px] font-bold tracking-wide uppercase ${actionBadge.colorClass}`}
                        >
                          {actionBadge.label}
                        </span>
                      );
                    }
                    if (mail.category) {
                      return (
                        <span
                          className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wide ${
                            mail.category === "outlook" || mail.source === "outlook"
                              ? "bg-[#ebf3fc] text-[#0078d4]"
                              : "bg-[#fbf0e5] text-[#a7764b]"
                          }`}
                        >
                          {mail.category.toUpperCase()}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {(() => {
                    const existingTask = tasks.length > 0 ? findTaskForEmail(mail, tasks) : undefined;
                    if (existingTask) {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTask?.(existingTask.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-forest/30 bg-[#f4f7ef] px-2 py-1 text-[10px] font-semibold text-forest hover:bg-[#ebf2e3] hover:border-forest/50 transition cursor-pointer"
                          title={`Task already tracked: "${existingTask.title}" (${existingTask.checked ? "Completed" : "Active"}). Click to open.`}
                        >
                          <CheckCircle2 size={11} className="text-forest" />
                          <span>View Task</span>
                        </button>
                      );
                    }
                    if (onCreateTask) {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateTask(mail);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold text-[#5c6960] hover:text-forest hover:border-forest/40 hover:bg-[#fafbf7] transition cursor-pointer"
                          title="Create a reviewable task from this email"
                        >
                          <ListTodo size={11} className="text-forest" />
                          <span>+ Task</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
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

        {/* Load More Footer */}
        {filteredMail.length > 0 && onLoadMore && hasMore && (
          <div className="p-4 text-center border-t border-[#edf0e9] bg-[#fafbf8]">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] hover:border-forest/40 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw size={12} className={isLoadingMore ? "animate-spin text-forest" : "text-forest"} />
              <span>{isLoadingMore ? "Loading more unread messages..." : `Load more unread messages (${mailList.length} loaded)`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
