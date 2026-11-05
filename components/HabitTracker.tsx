"use client";

import { useState } from "react";
import { Plus, Check, Flame, X, Sparkles } from "lucide-react";
import { Habit } from "@/types/dashboard";

type HabitTrackerProps = {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (name: string, icon?: string) => void;
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
  onDeleteHabit,
}: HabitTrackerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName("");
    setShowAddModal(false);
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
              <h2 className="text-[14px] font-semibold text-ink leading-tight">Daily Micro-Habits</h2>
              <span className="rounded-full bg-[#fdf2f2] px-2 py-0.5 text-[9px] font-bold text-forest">
                {completedTodayCount}/{habits.length} Done Today
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              Small consistent daily wins build compound momentum
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-line bg-[#fbfcf9] px-3 py-1.5 text-[11px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition"
        >
          <Plus size={13} /> Add Habit
        </button>
      </div>

      {/* Habit Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {habits.map((habit) => {
          const isDoneToday = habit.completedDates.includes(todayStr);

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
                      onClick={() => onToggleHabit(habit.id)}
                      className={`cursor-pointer text-[12px] font-semibold truncate select-none ${
                        isDoneToday ? "text-forest" : "text-ink"
                      }`}
                    >
                      {habit.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-[#c05746] rounded transition"
                      aria-label="Delete habit"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        habit.streak > 0
                          ? "bg-[#fff7ed] text-[#c2410c]"
                          : "bg-[#f1f3ed] text-muted"
                      }`}
                    >
                      <Flame size={10} className={habit.streak > 0 ? "fill-orange-500 text-orange-500" : ""} />
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

      {/* Add Custom Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-[14px] font-semibold text-ink flex items-center gap-2">
                <Sparkles size={15} className="text-forest" /> Create Daily Micro-Habit
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink">Habit Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 10 Min Meditation, Hydrate 2L..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-[12px] text-ink outline-none focus:border-forest"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-[#f1f3ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-[#8b1116] transition"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
