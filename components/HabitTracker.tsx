"use client";

import { useState } from "react";
import {
  Plus,
  Check,
  Flame,
  X,
  Pencil,
  Book,
  Footprints,
  Droplets,
  Dumbbell,
  Coffee,
  Sun,
  Heart,
  Brain,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { Habit } from "@/types/dashboard";
import { HabitModal } from "@/components/HabitModal";
import { HabitsManagerModal } from "@/components/HabitsManagerModal";

export const HABIT_ICON_MAP: Record<string, React.ElementType> = {
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

type HabitTrackerProps = {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (name: string, icon?: string) => void;
  onUpdateHabit?: (id: string, updates: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
};

// Returns YYYY-MM-DD in local time
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function HabitTracker({
  habits,
  onToggleHabit,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
}: HabitTrackerProps) {
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showManagerModal, setShowManagerModal] = useState(false);

  const todayStr = getLocalDateString();

  // Generate the last 7 days for the weekly mini progress bar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: getLocalDateString(d),
      dayLetter: new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(d),
      isToday: i === 6,
    };
  });

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setShowHabitModal(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitModal(true);
  };

  const handleSaveHabit = (data: {
    id?: string;
    name: string;
    icon?: string;
    streak?: number;
  }) => {
    if (data.id && onUpdateHabit) {
      onUpdateHabit(data.id, {
        name: data.name,
        icon: data.icon,
        streak: data.streak,
      });
    } else {
      onAddHabit(data.name, data.icon);
    }
    setShowHabitModal(false);
    setEditingHabit(null);
  };

  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 mb-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf2f2] text-forest">
            <Flame size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-ink leading-tight">
                Daily Micro-Habits
              </h2>
              <span className="rounded-full bg-[#fdf2f2] px-2 py-0.5 text-[9px] font-bold text-forest">
                {completedTodayCount}/{habits.length} Done Today
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              Small consistent daily wins build compound momentum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowManagerModal(true)}
            title="Open Habits Manager Modal"
            className="flex items-center gap-1.5 rounded-xl border border-line bg-[#fbfcf9] px-2.5 py-1.5 text-[11px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition"
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Manage</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-[#fbfcf9] px-3 py-1.5 text-[11px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition"
          >
            <Plus size={13} /> Add Habit
          </button>
        </div>
      </div>

      {/* Habit Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {habits.map((habit) => {
          const isDoneToday = habit.completedDates.includes(todayStr);
          const IconComp = HABIT_ICON_MAP[habit.icon || "flame"] || Flame;

          return (
            <div
              key={habit.id}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                isDoneToday
                  ? "border-[#fecaca] bg-[#fffbfb] shadow-sm"
                  : "border-line bg-white hover:border-[#cbd5cc]"
              }`}
            >
              {/* Top row: Check toggle & Title */}
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => onToggleHabit(habit.id)}
                  aria-label={`Toggle habit ${habit.name}`}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${
                    isDoneToday
                      ? "border-forest bg-forest text-white scale-110 shadow-sm"
                      : "border-[#d1d7ce] text-transparent hover:border-forest/60 bg-white"
                  }`}
                >
                  <Check size={12} className={isDoneToday ? "opacity-100" : "opacity-0"} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      onClick={() => handleOpenEdit(habit)}
                      title="Click to edit habit"
                      className={`cursor-pointer text-[12px] font-semibold truncate select-none hover:underline ${
                        isDoneToday ? "text-forest" : "text-ink"
                      }`}
                    >
                      {habit.name}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(habit)}
                        className="p-1 text-muted hover:text-ink rounded hover:bg-[#f1f3ed] transition"
                        aria-label={`Edit habit ${habit.name}`}
                        title="Edit habit"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1 text-muted hover:text-[#c05746] rounded hover:bg-[#fef2f2] transition"
                        aria-label="Delete habit"
                        title="Delete habit"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        habit.streak > 0
                          ? "bg-[#fff7ed] text-[#c2410c]"
                          : "bg-[#f1f3ed] text-muted"
                      }`}
                    >
                      <IconComp
                        size={10}
                        className={habit.streak > 0 ? "fill-orange-500 text-orange-500" : ""}
                      />
                      {habit.streak} {habit.streak === 1 ? "day" : "days"} streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom row: Weekly 7-day mini progress dots */}
              <div className="mt-3 flex items-center justify-between border-t border-[#f1f3ed] pt-2">
                <span className="text-[9px] font-medium text-[#929c93]">Past 7 days</span>
                <div className="flex items-center gap-1">
                  {last7Days.map((day) => {
                    const completed = habit.completedDates.includes(day.dateStr);
                    return (
                      <span
                        key={day.dateStr}
                        title={`${day.dateStr}: ${completed ? "Done" : "Missed"}`}
                        className={`grid h-3.5 w-3.5 place-items-center rounded-sm text-[7px] font-bold transition-colors ${
                          completed
                            ? "bg-forest text-white"
                            : day.isToday
                            ? "border border-dashed border-[#c0cbbe] text-[#929c93]"
                            : "bg-[#edf0eb] text-[#a4aca2]"
                        }`}
                      >
                        {day.dayLetter}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={showHabitModal}
        onClose={() => {
          setShowHabitModal(false);
          setEditingHabit(null);
        }}
        habit={editingHabit}
        onSaveHabit={handleSaveHabit}
        onDeleteHabit={onDeleteHabit}
      />

      {/* Habits Manager Modal (View, filter, manage, edit all habits in a modal) */}
      <HabitsManagerModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        habits={habits}
        onToggleHabit={onToggleHabit}
        onEditHabit={(h) => {
          setShowManagerModal(false);
          handleOpenEdit(h);
        }}
        onAddNewHabit={() => {
          setShowManagerModal(false);
          handleOpenCreate();
        }}
        onDeleteHabit={onDeleteHabit}
      />
    </section>
  );
}
