"use client";

import { useState } from "react";
import {
  X,
  Flame,
  Plus,
  Check,
  Pencil,
  Trash2,
  Sparkles,
  Trophy,
  Calendar,
  Book,
  Footprints,
  Droplets,
  Dumbbell,
  Coffee,
  Sun,
  Heart,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { Habit } from "@/types/dashboard";
import { getLocalDateString } from "@/components/HabitTracker";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  book: Book,
  footprints: Footprints,
  droplets: Droplets,
  dumbbell: Dumbbell,
  coffee: Coffee,
  sun: Sun,
  heart: Heart,
  brain: Brain,
  check: CheckCircle2,
};

type HabitsManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onEditHabit: (habit: Habit) => void;
  onAddNewHabit: () => void;
  onDeleteHabit: (id: string) => void;
};

export function HabitsManagerModal({
  isOpen,
  onClose,
  habits,
  onToggleHabit,
  onEditHabit,
  onAddNewHabit,
  onDeleteHabit,
}: HabitsManagerModalProps) {
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const todayStr = getLocalDateString();

  if (!isOpen) return null;

  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;

  const filteredHabits = habits.filter((h) => {
    const isDone = h.completedDates.includes(todayStr);
    if (filter === "completed") return isDone;
    if (filter === "pending") return !isDone;
    return true;
  });

  const completionRate =
    habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  // Best streak calculation
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-[#fbfcf8] p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-[#fdf2f2] text-forest shadow-sm">
              <Flame size={18} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] sm:text-[16px] font-semibold text-ink">Daily Micro-Habits</h3>
                <span className="rounded-full bg-[#fdf2f2] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-forest">
                  {completedTodayCount}/{habits.length} Done Today
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted">
                Track consistency, edit streaks, and establish compound daily momentum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 py-3 sm:py-4 shrink-0">
          <div className="rounded-xl border border-line bg-white p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] font-semibold text-muted uppercase">Today&apos;s Progress</span>
            <div className="mt-0.5 sm:mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-ink">{completionRate}%</span>
              <span className="text-[10px] sm:text-[11px] text-muted">completion</span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] font-semibold text-muted uppercase">Best Active Streak</span>
            <div className="mt-0.5 sm:mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-[#c2410c] flex items-center gap-1">
                <Flame size={15} className="fill-orange-500" /> {bestStreak}
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted">days</span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] font-semibold text-muted uppercase">Total Habits</span>
            <div className="mt-0.5 sm:mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-ink">{habits.length}</span>
              <span className="text-[10px] sm:text-[11px] text-muted">active</span>
            </div>
          </div>
        </div>

        {/* Filter bar & Add button */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pb-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                filter === "all"
                  ? "bg-forest text-white"
                  : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
              }`}
            >
              All ({habits.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                filter === "pending"
                  ? "bg-forest text-white"
                  : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
              }`}
            >
              Pending ({habits.length - completedTodayCount})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                filter === "completed"
                  ? "bg-forest text-white"
                  : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
              }`}
            >
              Completed ({completedTodayCount})
            </button>
          </div>

          <button
            onClick={onAddNewHabit}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition self-start sm:self-auto"
          >
            <Plus size={13} /> Add Habit
          </button>
        </div>

        {/* Habit items list */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {filteredHabits.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[12px] font-medium text-muted">
                {filter === "completed"
                  ? "No habits completed yet today. Start with a quick win!"
                  : filter === "pending"
                  ? "All habits completed today! Outstanding work! 🎉"
                  : "No habits tracked yet. Create your first micro-habit!"}
              </p>
            </div>
          ) : (
            filteredHabits.map((habit) => {
              const isDoneToday = habit.completedDates.includes(todayStr);
              const IconComp = iconMap[habit.icon || "flame"] || Flame;

              return (
                <div
                  key={habit.id}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                    isDoneToday
                      ? "border-[#fecaca] bg-[#fffbfb]"
                      : "border-line bg-white hover:border-[#cbd5cc]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleHabit(habit.id)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all ${
                        isDoneToday
                          ? "border-forest bg-forest text-white shadow-sm"
                          : "border-[#d1d7ce] text-transparent hover:border-forest/60 bg-white"
                      }`}
                    >
                      <Check size={13} className={isDoneToday ? "opacity-100" : "opacity-0"} />
                    </button>

                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4f6f1] text-[#4d5b51]">
                      <IconComp size={16} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-semibold truncate ${
                          isDoneToday ? "text-forest" : "text-ink"
                        }`}
                      >
                        {habit.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            habit.streak > 0
                              ? "bg-[#fff7ed] text-[#c2410c]"
                              : "bg-[#f1f3ed] text-muted"
                          }`}
                        >
                          <Flame size={10} className={habit.streak > 0 ? "fill-orange-500 text-orange-500" : ""} />
                          {habit.streak} {habit.streak === 1 ? "day" : "days"} streak
                        </span>
                        <span className="text-[10px] text-muted">
                          {habit.completedDates.length} total logged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => onEditHabit(habit)}
                      title="Edit Habit"
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-[#f1f3ed] hover:border-forest/40 transition"
                    >
                      <Pencil size={12} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      title="Delete Habit"
                      className="rounded-lg p-1.5 text-muted hover:bg-[#fef2f2] hover:text-[#c05746] transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line pt-3 mt-3 flex items-center justify-between text-[11px] text-muted shrink-0">
          <span>Click checkboxes to log today&apos;s completion</span>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 font-medium text-ink hover:bg-[#f1f3ed] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
