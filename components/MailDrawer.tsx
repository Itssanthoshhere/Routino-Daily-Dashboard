"use client";

import { useState } from "react";
import { Mail, Star, ExternalLink, X, Reply, Check, Trash2, ListTodo, CheckCircle2 } from "lucide-react";
import { DashboardMail, Task } from "@/types/dashboard";
import { findTaskForEmail } from "@/lib/email-task";

type MailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  mail: DashboardMail | null;
  tasks?: Task[];
  onToggleStar?: (id: string) => void;
  onToggleRead?: (id: string) => void;
  onCreateTask?: (mail: DashboardMail) => void;
  onOpenTask?: (taskId: string) => void;
};

export function MailDrawer({
  isOpen,
  onClose,
  mail,
  tasks = [],
  onToggleStar,
  onToggleRead,
  onCreateTask,
  onOpenTask,
}: MailDrawerProps) {
  const [replyText, setReplyText] = useState("");
  const [replied, setReplied] = useState(false);

  if (!isOpen || !mail) return null;

  const existingTask = findTaskForEmail(mail, tasks);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplied(true);
    setTimeout(() => {
      setReplied(false);
      setReplyText("");
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-lg border-l border-line bg-[#fbfcf8] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fbefeb] text-[#d16b5b]">
                <Mail size={16} />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Message Preview</h3>
                <p className="text-[11px] text-muted">{mail.date || "Recent"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {existingTask ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTask?.(existingTask.id);
                    onClose();
                  }}
                  className="rounded-lg p-2 text-forest bg-[#f4f7ef] hover:bg-[#e9f0e2] transition cursor-pointer"
                  title={`Task already tracked: "${existingTask.title}". Click to open.`}
                  aria-label="View existing task"
                >
                  <CheckCircle2 size={16} />
                </button>
              ) : onCreateTask ? (
                <button
                  type="button"
                  onClick={() => {
                    onCreateTask(mail);
                    onClose();
                  }}
                  className="rounded-lg p-2 text-muted hover:text-forest hover:bg-[#f1f3ed] transition cursor-pointer"
                  title="Create task from this email"
                  aria-label="Create task"
                >
                  <ListTodo size={16} />
                </button>
              ) : null}
              <button
                onClick={() => onToggleStar?.(mail.id)}
                className={`rounded-lg p-2 transition ${
                  mail.starred ? "text-[#e7a15a] bg-[#faf1e4]" : "text-muted hover:bg-[#edf0e9]"
                }`}
                aria-label="Star email"
              >
                <Star size={16} fill={mail.starred ? "currentColor" : "none"} />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Email Header */}
          <div className="mt-5 space-y-3">
            <div>
              <span className="rounded bg-[#fbf0e5] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#a7764b]">
                {mail.category?.toUpperCase() || "INBOX"}
              </span>
              <h2 className="mt-2 text-[17px] font-semibold text-ink leading-snug">
                {mail.subject || "(No subject)"}
              </h2>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0c6ae] text-[11px] font-bold text-[#4d5b52]">
                {mail.from.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink truncate">{mail.from}</p>
                <p className="text-[10px] text-muted">to you</p>
              </div>
              <a
                href={mail.href || "https://mail.google.com"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-forest hover:underline shrink-0"
              >
                Gmail <ExternalLink size={12} />
              </a>
            </div>

            {/* Email Body / Snippet */}
            <div className="rounded-xl border border-line bg-white p-4 leading-relaxed text-[13px] text-[#33433a] shadow-sm">
              <p>{mail.snippet}</p>
              <div className="mt-4 pt-3 border-t border-[#edf0e9] text-[11px] text-muted italic">
                {mail.id.startsWith("sample")
                  ? "This is preview data. Connect your Google account to read your live inbox snippets."
                  : "Message snippet provided via Gmail API read-only scope."}
              </div>
            </div>

            {/* Action Queue: Convert to Task */}
            {existingTask ? (
              <div className="flex items-center justify-between rounded-xl border border-forest/30 bg-[#f4f7ef] p-3 text-[11px]">
                <div>
                  <p className="font-semibold text-ink flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-forest" />
                    <span>Task already tracked</span>
                  </p>
                  <p className="text-[10px] text-muted truncate max-w-[240px]">
                    &quot;{existingTask.title}&quot; ({existingTask.checked ? "Completed" : "Active"})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenTask?.(existingTask.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-[10.5px] font-semibold text-white hover:bg-[#344830] transition cursor-pointer"
                >
                  <span>Open Task</span>
                </button>
              </div>
            ) : onCreateTask ? (
              <div className="flex items-center justify-between rounded-xl border border-[#edf0e9] bg-[#fafbf8] p-3 text-[11px]">
                <div>
                  <p className="font-semibold text-ink">Turn into an action item?</p>
                  <p className="text-[10px] text-muted">Prefill title & link, then pick your deadline.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCreateTask(mail);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-[10.5px] font-semibold text-white hover:bg-[#8b1116] transition cursor-pointer"
                >
                  <ListTodo size={12} />
                  <span>Convert to Task</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Quick Reply Form */}
        <div className="mt-6 border-t border-line pt-4">
          {replied ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#fdf2f2] py-3 text-[12px] font-semibold text-forest">
              <Check size={16} /> Draft saved / Simulation sent!
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-ink">
                <Reply size={13} /> Quick response
              </div>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a quick reply..."
                className="w-full rounded-xl border border-line bg-white p-3 text-[12px] text-ink outline-none focus:border-forest transition"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onToggleRead?.(mail.id)}
                  className="text-[11px] font-medium text-muted hover:text-ink"
                >
                  {mail.read ? "Mark as unread" : "Mark as read"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-[#f1f3ed]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow hover:bg-[#8b1116] transition"
                  >
                    Send reply
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
