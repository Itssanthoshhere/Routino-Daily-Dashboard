"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { DashboardEvent, Task } from "@/types/dashboard";
import { findFocusSlots, FocusSlot } from "@/lib/focusSlots";

type Props = {
  events: DashboardEvent[];
  tasks: Task[];
  onScheduleTask: (task: Task, slot: FocusSlot) => void | Promise<void>;
  onClose?: () => void;
};

export function FocusSlotFinder({ events, tasks, onScheduleTask, onClose }: Props) {
  const [duration, setDuration] = useState(45);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(
    tasks.find((t) => !t.checked && !t.skipped)?.id || ""
  );
  const [selectedSlot, setSelectedSlot] = useState(0);

  const slots = useMemo(
    () => findFocusSlots(events, new Date(), 7, duration),
    [events, duration]
  );
  const openTasks = tasks.filter((task) => !task.checked && !task.skipped);

  const format = (date: Date) =>
    new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

  return (
    <div className="rounded-2xl border border-line bg-[#fbfcf8] p-4 sm:p-5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={17} className="text-forest" />
          <h3 className="font-semibold text-ink text-sm sm:text-base">Find focus time</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-muted">
        Open blocks across your merged calendars for the next 7 days.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-muted">
          Duration
          <select
            value={duration}
            onChange={(e) => {
              setDuration(Number(e.target.value));
              setSelectedSlot(0);
            }}
            className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-forest"
          >
            {[25, 45, 60, 90].map((value) => (
              <option key={value} value={value}>
                {value} minutes
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-muted">
          Task
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-forest"
          >
            <option value="">Choose a task</option>
            {openTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
        {slots.length ? (
          slots.map((slot, index) => (
            <button
              key={slot.start.toISOString()}
              type="button"
              onClick={() => setSelectedSlot(index)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition cursor-pointer ${
                selectedSlot === index
                  ? "border-forest bg-[#eef5ee] font-medium"
                  : "border-line bg-white hover:bg-[#f5f7f2]"
              }`}
            >
              <span>
                {format(slot.start)} –{" "}
                {slot.end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              {selectedSlot === index && <Check size={14} className="text-forest shrink-0 ml-2" />}
            </button>
          ))
        ) : (
          <p className="rounded-lg bg-white p-3 text-xs text-muted">
            No open block found for this duration in the next 7 days.
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={saving || !selectedTask || !slots.length}
        onClick={async () => {
          const task = openTasks.find((item) => item.id === selectedTask);
          if (task && slots[selectedSlot]) {
            setSaving(true); setError("");
            try { await onScheduleTask(task, slots[selectedSlot]); } catch (error) { setError(error instanceof Error ? error.message : "Could not schedule session"); } finally { setSaving(false); }
          }
        }}
        className="mt-3.5 w-full rounded-xl bg-forest px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#8b1116] transition disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      >
        {saving ? "Scheduling…" : "Schedule into Google Calendar"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
