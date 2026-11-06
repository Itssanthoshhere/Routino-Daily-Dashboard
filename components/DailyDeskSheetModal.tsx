"use client";

import { useEffect } from "react";
import {
  X,
  Printer,
  CheckSquare,
  Calendar,
  Flame,
  FileText,
  Sparkles,
  Droplets,
  HeartHandshake,
  Plane,
} from "lucide-react";
import type { Task, DashboardEvent, Habit } from "@/types/dashboard";
import { appConfig } from "@/lib/config";

type DailyDeskSheetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  events: DashboardEvent[];
  habits: Habit[];
  scratchpadText?: string;
};

export function DailyDeskSheetModal({
  isOpen,
  onClose,
  tasks,
  events,
  habits,
  scratchpadText = "",
}: DailyDeskSheetModalProps) {
  const handlePrint = () => {
    document.body.classList.add("printing-desk-sheet");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-desk-sheet");
    }, 1200);
  };

  // Handle print lifecycle and keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const onBeforePrint = () => {
      document.body.classList.add("printing-desk-sheet");
    };
    const onAfterPrint = () => {
      document.body.classList.remove("printing-desk-sheet");
    };

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("printing-desk-sheet");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const todayStr = new Intl.DateTimeFormat("en-CA").format(new Date());

  const todayEvents = events.filter((e) => {
    const s = e.start?.dateTime || e.start?.date;
    return s && s.startsWith(todayStr);
  });

  // Separate high-priority and normal tasks
  const highPriorityTasks = tasks.filter((t) => t.priority && !t.checked);
  const regularTasks = tasks.filter((t) => !t.priority && !t.checked);

  // Top 3 non-negotiables
  const topPriorities = highPriorityTasks.slice(0, 3);
  // Additional tasks
  const remainingHigh = highPriorityTasks.slice(3);
  const additionalTasks = [...remainingHigh, ...regularTasks].slice(0, 4);

  return (
    <div
      id="desk-sheet-print-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto print:block print:w-full print:max-w-none print:z-auto"
    >
      <div
        id="desk-sheet-modal-dialog"
        className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border border-line bg-[#eeeee8] shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:static print:w-full print:max-w-none print:overflow-visible"
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-5 py-3 shrink-0 print:hidden desk-sheet-no-print">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f4f6f0] text-forest border border-line">
              <Printer size={15} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-ink">Daily Desk Sheet</h3>
                <span className="rounded-md bg-[#e7ebe3] px-1.5 py-0.5 text-[9px] font-bold text-[#455248] uppercase tracking-wider">
                  Single-Page Print
                </span>
              </div>
              <p className="text-[11px] text-muted">A structured physical companion for your desk (Cmd+P)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:overflow-visible print:block">
          {/* ─── Physical Paper Sheet (Guaranteed 1 Single Printed Page) ─── */}
          <div
            id="desk-sheet-paper"
            className="w-full max-w-[760px] bg-white rounded-lg shadow-xl border border-black/10 p-7 sm:p-9 font-sans text-ink print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:break-inside-avoid"
          >
            {/* Sheet Header */}
            <div className="border-b border-black/20 pb-3 print:pb-2.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black tracking-[0.2em] text-forest uppercase">
                      {appConfig.name}
                    </span>
                    <span className="text-[10.5px] font-semibold text-muted tracking-wider uppercase">
                      · Daily Desk Planner
                    </span>
                  </div>
                  <h1 className="mt-1 text-[20px] font-bold tracking-tight text-ink print:text-[18px]">
                    {today}
                  </h1>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted block mb-0.5">
                    Daily Intention
                  </span>
                  <div className="rounded-lg bg-[#fafbf8] border border-black/10 px-2.5 py-1 text-[10.5px] italic text-[#4a564e] print:bg-white print:border-black/20">
                    &quot;Calm focus over frantic speed.&quot;
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Balanced Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4">
              {/* ─── LEFT COLUMN: Priorities, Tasks & Habits ─── */}
              <div className="space-y-3.5 print:space-y-3 flex flex-col justify-between">
                {/* 1. Top 3 Non-Negotiables */}
                <div className="rounded-xl border border-black/15 p-3 bg-[#fbfcf9] print:bg-white print:border-black/25">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Sparkles size={12} className="text-forest" />
                      <span>Top 3 Non-Negotiables</span>
                    </h3>
                    <span className="text-[8.5px] font-semibold text-muted uppercase">Core Focus</span>
                  </div>

                  <div className="space-y-1.5">
                    {[0, 1, 2].map((idx) => {
                      const task = topPriorities[idx];
                      return (
                        <div
                          key={`prio-${idx}`}
                          className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2 py-1 print:border-black/20"
                        >
                          <span className="grid h-4.5 w-4.5 place-items-center rounded bg-[#f5f6f1] text-[9.5px] font-bold text-forest shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            {task ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold text-[11px] truncate text-ink">
                                  {task.title}
                                </span>
                                {task.category === "project" && (
                                  <span className="rounded bg-[#f5f3ff] px-1 py-0.2 text-[7.5px] font-bold text-[#7c3aed] border border-[#ddd6fe] shrink-0 uppercase">
                                    Project
                                  </span>
                                )}
                                {task.category === "travel" && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-[#f0f9ff] px-1 py-0.2 text-[7.5px] font-bold text-[#0284c7] border border-[#bae6fd] shrink-0 uppercase">
                                    <Plane size={8} /> Travel
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="border-b border-black/15 border-dashed h-3.5 w-full" />
                            )}
                          </div>
                          <span className="h-3 w-3 rounded border border-black/30 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tasks & To-Dos */}
                <div className="rounded-xl border border-black/15 p-3 bg-[#fbfcf9] print:bg-white print:border-black/25">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <CheckSquare size={12} className="text-muted" />
                      <span>Additional Tasks</span>
                    </h3>
                    <span className="text-[8.5px] text-muted">To-Do</span>
                  </div>

                  <div className="space-y-1.5">
                    {additionalTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-[10.5px]">
                        <span className="h-3 w-3 rounded border border-black/40 shrink-0" />
                        <span className="truncate flex-1 font-medium text-ink">{t.title}</span>
                        {t.category === "project" && (
                          <span className="rounded bg-[#f5f3ff] px-1 py-0.2 text-[7px] font-bold text-[#7c3aed] border border-[#ddd6fe] shrink-0 uppercase">
                            Project
                          </span>
                        )}
                        {t.category === "travel" && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-[#f0f9ff] px-1 py-0.2 text-[7px] font-bold text-[#0284c7] border border-[#bae6fd] shrink-0 uppercase">
                            <Plane size={7} /> Travel
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Fill remaining slots up to 4 */}
                    {Array.from({ length: Math.max(0, 4 - additionalTasks.length) }).map((_, i) => (
                      <div key={`empty-task-${i}`} className="flex items-center gap-2 pt-0.5">
                        <span className="h-3 w-3 rounded border border-black/25 shrink-0" />
                        <div className="border-b border-black/15 border-dashed h-3 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Daily Habits & Hydration */}
                <div className="rounded-xl border border-black/15 p-3 bg-[#fbfcf9] print:bg-white print:border-black/25">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Flame size={12} className="text-[#ea580c]" />
                      <span>Micro-Habits & Wellness</span>
                    </h3>
                    <span className="text-[8.5px] text-muted">Daily</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {habits.slice(0, 4).map((h) => (
                      <div key={h.id} className="flex items-center gap-1.5 text-[10px]">
                        <span className="h-3 w-3 rounded-full border border-black/40 shrink-0" />
                        <span className="truncate font-medium text-ink">{h.name}</span>
                      </div>
                    ))}
                    {habits.length === 0 && (
                      <span className="text-[9.5px] text-muted italic col-span-2">No habits logged</span>
                    )}
                  </div>

                  {/* Water Hydration tracker */}
                  <div className="pt-1.5 border-t border-black/10 flex items-center justify-between text-[9.5px]">
                    <span className="font-semibold text-muted flex items-center gap-1">
                      <Droplets size={10} className="text-[#0284c7]" /> Water (8 cups):
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 8 }).map((_, cupIdx) => (
                        <span
                          key={`cup-${cupIdx}`}
                          className="h-2.5 w-2.5 rounded-full border border-black/30 inline-block"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Evening Reflection Prompts */}
                <div className="rounded-xl border border-black/15 p-2.5 bg-[#fbfcf9] print:bg-white print:border-black/25 text-[10px]">
                  <div className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-muted mb-1">
                    <HeartHandshake size={11} />
                    <span>Evening Win / Gratitude:</span>
                  </div>
                  <div className="border-b border-black/15 border-dashed h-3.5 mb-1" />
                  <div className="border-b border-black/15 border-dashed h-3.5" />
                </div>
              </div>

              {/* ─── RIGHT COLUMN: Schedule & Ruled Notes ─── */}
              <div className="space-y-3.5 print:space-y-3 flex flex-col justify-between">
                {/* 1. Today's Schedule */}
                <div className="rounded-xl border border-black/15 p-3 bg-[#fbfcf9] print:bg-white print:border-black/25">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Calendar size={12} className="text-muted" />
                      <span>Today&apos;s Schedule</span>
                    </h3>
                    <span className="text-[8.5px] text-muted">Meetings & Calls</span>
                  </div>

                  <div className="space-y-1.5">
                    {todayEvents.length > 0 ? (
                      todayEvents.slice(0, 4).map((ev) => {
                        const timeStr = ev.start?.dateTime
                          ? new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(
                              new Date(ev.start.dateTime)
                            )
                          : "All day";
                        return (
                          <div
                            key={ev.id}
                            className="flex items-start gap-2 text-[10.5px] rounded-lg border border-black/10 bg-white px-2 py-1 print:border-black/20"
                          >
                            <span className="font-bold text-muted text-[9.5px] w-14 shrink-0">
                              {timeStr}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {ev.tag === "TRAVEL" && <Plane size={10} className="shrink-0 text-[#0284c7]" />}
                              <span className="font-semibold text-ink truncate flex-1">
                                {ev.summary || "Event"}
                              </span>
                              {ev.tag && (
                                <span className="text-[8.5px] uppercase font-bold text-muted px-1 rounded bg-black/5 shrink-0 print:border print:border-black/20">
                                  {ev.tag}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-muted italic py-0.5">No scheduled meetings today.</p>
                    )}

                    {/* Lined slots for manual time blocking */}
                    {Array.from({ length: Math.max(2, 4 - Math.min(4, todayEvents.length)) }).map((_, idx) => (
                      <div key={`empty-sched-${idx}`} className="flex items-center gap-2 pt-0.5">
                        <span className="w-12 shrink-0 border-b border-black/15 border-dashed h-3.5" />
                        <span className="flex-1 border-b border-black/15 border-dashed h-3.5" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Scratchpad & Handwriting Notes */}
                <div className="rounded-xl border border-black/15 p-3 bg-[#fbfcf9] flex-1 flex flex-col print:bg-white print:border-black/25">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <FileText size={12} className="text-muted" />
                      <span>Scratchpad & Notes</span>
                    </h3>
                    <span className="text-[8.5px] text-muted">Handwritten or Dump</span>
                  </div>

                  {scratchpadText ? (
                    <div className="text-[10px] text-ink font-mono whitespace-pre-wrap leading-relaxed border-b border-black/10 pb-1.5 mb-1.5 bg-white rounded-lg p-2 border border-black/10 print:bg-transparent">
                      {scratchpadText}
                    </div>
                  ) : null}

                  {/* Ruled handwriting memo lines */}
                  <div className="space-y-2.5 pt-0.5 flex-1">
                    <div className="border-b border-black/15 border-dashed h-3.5" />
                    <div className="border-b border-black/15 border-dashed h-3.5" />
                    <div className="border-b border-black/15 border-dashed h-3.5" />
                    <div className="border-b border-black/15 border-dashed h-3.5" />
                    <div className="border-b border-black/15 border-dashed h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="mt-4 pt-2 border-t border-black/15 flex items-center justify-between text-[8.5px] text-muted print:text-gray-500">
              <span className="font-semibold uppercase tracking-wider">Printed from Routino Workspace</span>
              <span>routino.app · Private by design</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
