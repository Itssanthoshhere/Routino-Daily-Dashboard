"use client";

import { useRef } from "react";
import { X, Printer, Sparkles, CheckSquare, Calendar, Flame, StickyNote } from "lucide-react";
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
  const printAreaRef = useRef<HTMLDivElement>(null);

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

  const highPriorityTasks = tasks.filter((t) => t.priority && !t.checked);
  const otherTasks = tasks.filter((t) => !t.priority && !t.checked);
  const displayTasks = [...highPriorityTasks, ...otherTasks].slice(0, 8);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/95 px-6 py-3.5 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf2f2] text-forest">
              <Printer size={16} />
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-ink">Daily Desk Sheet</h3>
              <p className="text-[11px] text-muted">A printable single-page companion for your physical desk</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Sheet (Cmd+P)</span>
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

        {/* ─── Printable Desk Sheet Page ─── */}
        <div ref={printAreaRef} className="p-8 sm:p-10 font-sans print:p-6 print:text-black">
          {/* Header */}
          <div className="border-b-2 border-forest pb-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-black tracking-tight text-forest">
                  {appConfig.name.toUpperCase()}
                </span>
                <span className="text-[12px] text-muted font-medium">· Daily Desk Companion</span>
              </div>
              <h1 className="mt-1 text-[22px] font-bold text-ink">{today}</h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted block">
                Intention
              </span>
              <span className="text-[12px] italic text-[#4a564e]">
                &quot;Calm focus over frantic speed.&quot;
              </span>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
            {/* Left Column: Priorities & Habits */}
            <div className="space-y-6">
              {/* Top Priorities */}
              <div className="rounded-xl border border-black/15 p-4.5 bg-[#fafbf8] print:bg-white print:border-black/30">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-forest flex items-center gap-1.5 mb-3">
                  <CheckSquare size={14} /> Top Priorities & Tasks
                </h3>
                <div className="space-y-2.5">
                  {displayTasks.map((task, i) => (
                    <div key={task.id} className="flex items-start gap-2.5 text-[12px]">
                      <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-black/40 print:border-black" />
                      <div className="min-w-0 flex-1">
                        <span className={`font-medium ${task.priority ? "font-bold text-forest" : "text-ink"}`}>
                          {task.title}
                        </span>
                        {task.meta && (
                          <span className="block text-[10px] text-muted print:text-gray-600">
                            {task.meta}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Empty task slots if fewer than 6 tasks */}
                  {Array.from({ length: Math.max(0, 6 - displayTasks.length) }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex items-center gap-2.5 text-[12px] pt-1">
                      <span className="h-4 w-4 shrink-0 rounded border border-black/30 border-dashed" />
                      <span className="flex-1 border-b border-black/15 border-dashed h-4" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Micro-Habits */}
              <div className="rounded-xl border border-black/15 p-4.5 bg-[#fafbf8] print:bg-white print:border-black/30">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#ea580c] flex items-center gap-1.5 mb-3">
                  <Flame size={14} /> Daily Micro-Habits
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {habits.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-[11px]">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/40" />
                      <span className="truncate font-medium text-ink">{h.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Schedule & Handwriting Notes */}
            <div className="space-y-6">
              {/* Today's Schedule */}
              <div className="rounded-xl border border-black/15 p-4.5 bg-[#fafbf8] print:bg-white print:border-black/30">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#2563eb] flex items-center gap-1.5 mb-3">
                  <Calendar size={14} /> Today&apos;s Schedule
                </h3>
                <div className="space-y-2">
                  {todayEvents.length > 0 ? (
                    todayEvents.map((ev) => {
                      const timeStr = ev.start?.dateTime
                        ? new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(
                            new Date(ev.start.dateTime)
                          )
                        : "All day";
                      return (
                        <div key={ev.id} className="flex items-start gap-2.5 text-[11.5px]">
                          <span className="w-16 shrink-0 font-bold text-muted text-[10.5px]">
                            {timeStr}
                          </span>
                          <span className="font-semibold text-ink truncate flex-1">
                            {ev.summary || "Event"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-muted italic">No scheduled meetings today.</p>
                  )}
                  {/* Ruled slots for notes/calls */}
                  {Array.from({ length: Math.max(0, 4 - todayEvents.length) }).map((_, idx) => (
                    <div key={`sched-${idx}`} className="flex items-center gap-2.5 text-[11px] pt-1">
                      <span className="w-16 shrink-0 border-b border-black/15 border-dashed h-4" />
                      <span className="flex-1 border-b border-black/15 border-dashed h-4" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desk Scratchpad & Notes */}
              <div className="rounded-xl border border-black/15 p-4.5 bg-[#fafbf8] print:bg-white print:border-black/30">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#ca8a04] flex items-center gap-1.5 mb-2">
                  <StickyNote size={14} /> Scratchpad & Handwriting Notes
                </h3>
                {scratchpadText ? (
                  <p className="text-[11px] text-ink whitespace-pre-wrap leading-relaxed border-b border-black/10 pb-2 mb-2 font-mono">
                    {scratchpadText}
                  </p>
                ) : null}
                {/* Ruled handwriting lines */}
                <div className="space-y-3 pt-1">
                  <div className="border-b border-black/15 border-dashed h-4" />
                  <div className="border-b border-black/15 border-dashed h-4" />
                  <div className="border-b border-black/15 border-dashed h-4" />
                  <div className="border-b border-black/15 border-dashed h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Sheet Footer */}
          <div className="mt-8 pt-3 border-t border-black/15 flex items-center justify-between text-[9px] text-muted print:text-gray-500">
            <span>Printed from Routino Workspace</span>
            <span>routino.app · Private by design</span>
          </div>
        </div>
      </div>
    </div>
  );
}
