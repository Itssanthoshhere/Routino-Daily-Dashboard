"use client";

import { useState } from "react";
import { X, Sun, Moon, CheckCircle2, Sparkles, Plus, ArrowRight, Flame } from "lucide-react";
import type { Task, Habit } from "@/types/dashboard";

type DailyRoutineModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
  onAddTask: (task: Task) => void;
  onSaveReflectionNote?: (content: string) => void;
};

export function DailyRoutineModal({
  isOpen,
  onClose,
  tasks,
  habits,
  onToggleHabit,
  onAddTask,
  onSaveReflectionNote,
}: DailyRoutineModalProps) {
  const currentHour = new Date().getHours();
  const defaultMode = currentHour >= 17 ? "evening" : "morning";
  const [mode, setMode] = useState<"morning" | "evening">(defaultMode);

  // Morning State
  const [priority1, setPriority1] = useState("");
  const [priority2, setPriority2] = useState("");
  const [priority3, setPriority3] = useState("");
  const [morningSaved, setMorningSaved] = useState(false);

  // Evening State
  const [reflection, setReflection] = useState("");
  const [eveningSaved, setEveningSaved] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Intl.DateTimeFormat("en-CA").format(new Date()); // YYYY-MM-DD
  const completedTasksToday = tasks.filter((t) => t.checked);
  const pendingTasks = tasks.filter((t) => !t.checked);

  const handleSaveMorning = (e: React.FormEvent) => {
    e.preventDefault();
    const priorities = [priority1, priority2, priority3].filter((p) => p.trim().length > 0);
    priorities.forEach((text, i) => {
      onAddTask({
        id: `routine-task-${Date.now()}-${i}`,
        title: text.trim(),
        meta: "High Priority · Daily Focus",
        checked: false,
        priority: true,
        category: "urgent",
        createdAt: Date.now(),
      });
    });
    setMorningSaved(true);
    setTimeout(() => {
      setMorningSaved(false);
      onClose();
    }, 1200);
  };

  const handleSaveEvening = (e: React.FormEvent) => {
    e.preventDefault();
    if (reflection.trim() && onSaveReflectionNote) {
      onSaveReflectionNote(`### 🌙 Evening Reflection · ${todayStr}\n\n${reflection.trim()}`);
    }
    setEveningSaved(true);
    setTimeout(() => {
      setEveningSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 place-items-center rounded-xl shadow-xs ${
                mode === "morning"
                  ? "bg-[#fff7ed] text-[#ea580c]"
                  : "bg-[#f5f3ff] text-[#7c3aed]"
              }`}
            >
              {mode === "morning" ? <Sun size={17} /> : <Moon size={17} />}
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-ink">
                {mode === "morning" ? "Morning Focus Kick-off" : "Evening Mindful Wrap-up"}
              </h3>
              <p className="text-[11px] text-muted">
                {mode === "morning"
                  ? "Set your 3 non-negotiables to start the day with clarity"
                  : "Celebrate today's wins and unwind your mind for tomorrow"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex rounded-xl bg-black/5 p-1 border border-black/5">
          <button
            type="button"
            onClick={() => setMode("morning")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition cursor-pointer ${
              mode === "morning" ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            <Sun size={13} className="text-[#ea580c]" />
            <span>Morning Plan</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("evening")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition cursor-pointer ${
              mode === "evening" ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            <Moon size={13} className="text-[#7c3aed]" />
            <span>Evening Reflection</span>
          </button>
        </div>

        {/* ─── MORNING MODE ─── */}
        {mode === "morning" ? (
          <form onSubmit={handleSaveMorning} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1.5">
                Top 3 Priorities for Today:
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-forest/10 text-[10px] font-bold text-forest">
                    1
                  </span>
                  <input
                    type="text"
                    value={priority1}
                    onChange={(e) => setPriority1(e.target.value)}
                    placeholder="Most critical task today..."
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12px] text-ink placeholder:text-muted/60 outline-none focus:border-forest"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-forest/10 text-[10px] font-bold text-forest">
                    2
                  </span>
                  <input
                    type="text"
                    value={priority2}
                    onChange={(e) => setPriority2(e.target.value)}
                    placeholder="Second key priority..."
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12px] text-ink placeholder:text-muted/60 outline-none focus:border-forest"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-forest/10 text-[10px] font-bold text-forest">
                    3
                  </span>
                  <input
                    type="text"
                    value={priority3}
                    onChange={(e) => setPriority3(e.target.value)}
                    placeholder="Third essential accomplishment..."
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12px] text-ink placeholder:text-muted/60 outline-none focus:border-forest"
                  />
                </div>
              </div>
            </div>

            {/* Quick Pick from Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="rounded-xl border border-line bg-[#f8faf6] p-3">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                  Quick-add from pending tasks:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {pendingTasks.slice(0, 5).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (!priority1) setPriority1(t.title);
                        else if (!priority2) setPriority2(t.title);
                        else if (!priority3) setPriority3(t.title);
                      }}
                      className="rounded-lg bg-white border border-line px-2 py-1 text-[10px] font-medium text-[#465349] hover:border-forest hover:text-forest transition cursor-pointer"
                    >
                      + {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-[12px] font-medium text-muted hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!priority1.trim() && !priority2.trim() && !priority3.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4.5 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition disabled:opacity-40 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>{morningSaved ? "Priorities Set!" : "Commit Priorities"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ─── EVENING MODE ─── */
          <form onSubmit={handleSaveEvening} className="mt-4 space-y-4">
            {/* Wins Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#dcfce7] bg-[#f0fdf4] p-3 text-center">
                <span className="text-[20px] font-bold text-[#16a34a]">{completedTasksToday.length}</span>
                <span className="block text-[10px] font-medium text-[#166534]">Tasks Completed</span>
              </div>
              <div className="rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-3 text-center">
                <span className="text-[20px] font-bold text-[#c2410c]">
                  {habits.filter((h) => h.completedDates.includes(todayStr)).length} / {habits.length}
                </span>
                <span className="block text-[10px] font-medium text-[#9a3412]">Habits Checked</span>
              </div>
            </div>

            {/* Quick Habit Check-off */}
            {habits.length > 0 && (
              <div className="rounded-xl border border-line bg-white p-3 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                  Check off today&apos;s micro-habits:
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {habits.map((habit) => {
                    const isDone = habit.completedDates.includes(todayStr);
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => onToggleHabit(habit.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                          isDone
                            ? "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]"
                            : "bg-[#f9faf7] text-ink border border-line hover:bg-black/5"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Flame size={12} className={isDone ? "text-[#16a34a]" : "text-muted"} />
                          <span>{habit.name}</span>
                        </span>
                        <span className="text-[10px] font-bold">{isDone ? "✓ Done" : "Mark Done"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reflection Note */}
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1.5">
                Evening Reflection / Clear Your Head:
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={3}
                placeholder="What went well today? What's one thing to look forward to tomorrow?"
                className="w-full rounded-xl border border-line bg-white p-3 text-[12px] text-ink placeholder:text-muted/60 outline-none focus:border-forest resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-[12px] font-medium text-muted hover:bg-black/5"
              >
                Close
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4.5 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#8b1116] transition cursor-pointer"
              >
                <CheckCircle2 size={13} />
                <span>{eveningSaved ? "Saved to Notes!" : "Complete Wind-Down"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
