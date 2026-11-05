"use client";

import { useState, useEffect } from "react";
import {
  X,
  Flame,
  Book,
  Footprints,
  Droplets,
  Dumbbell,
  Coffee,
  Sun,
  Heart,
  Brain,
  CheckCircle2,
  Trash2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Habit } from "@/types/dashboard";

export const HABIT_ICONS = [
  { id: "flame", label: "Energy", icon: Flame },
  { id: "book", label: "Reading", icon: Book },
  { id: "footprints", label: "Walk / Run", icon: Footprints },
  { id: "droplets", label: "Hydrate", icon: Droplets },
  { id: "dumbbell", label: "Fitness", icon: Dumbbell },
  { id: "coffee", label: "Routine", icon: Coffee },
  { id: "sun", label: "Morning", icon: Sun },
  { id: "heart", label: "Health", icon: Heart },
  { id: "brain", label: "Mind", icon: Brain },
  { id: "check", label: "Task", icon: CheckCircle2 },
] as const;

export const QUICK_HABIT_TEMPLATES = [
  { name: "Morning Walk 20m", icon: "footprints" },
  { name: "Read 15 Pages", icon: "book" },
  { name: "Drink 2L Water", icon: "droplets" },
  { name: "Quick Workout", icon: "dumbbell" },
  { name: "10m Meditation", icon: "brain" },
  { name: "Inbox Zero", icon: "check" },
];

type HabitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit | null; // null/undefined for create mode, Habit for edit mode
  onSaveHabit: (data: { id?: string; name: string; icon?: string; streak?: number }) => void;
  onDeleteHabit?: (id: string) => void;
};

export function HabitModal({
  isOpen,
  onClose,
  habit,
  onSaveHabit,
  onDeleteHabit,
}: HabitModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>("flame");
  const [streak, setStreak] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditMode = Boolean(habit);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon || "flame");
      setStreak(habit.streak ?? 0);
    } else {
      setName("");
      setIcon("flame");
      setStreak(0);
    }
    setConfirmDelete(false);
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveHabit({
      id: habit?.id,
      name: name.trim(),
      icon,
      streak: Math.max(0, Number(streak) || 0),
    });

    onClose();
  };

  const handleDelete = () => {
    if (!habit || !onDeleteHabit) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteHabit(habit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf2f2] text-forest">
              {isEditMode ? <Sparkles size={16} /> : <Flame size={16} />}
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">
                {isEditMode ? "Edit Micro-Habit" : "Create Daily Micro-Habit"}
              </h3>
              <p className="text-[11px] text-muted">
                {isEditMode
                  ? "Update habit name, icon, or streak"
                  : "Build small daily rituals for compound progress"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick templates (create mode only) */}
        {!isEditMode && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Quick Ideas
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_HABIT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => {
                    setName(tpl.name);
                    setIcon(tpl.icon);
                  }}
                  className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-forest/40 hover:bg-[#fdf2f2] hover:text-forest transition"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-ink">
              Habit Name <span className="text-[#c05746]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. 10 Min Meditation, Hydrate 2L, Read 20 Mins..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-ink">
              Choose an Icon
            </label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {HABIT_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition ${
                      isSelected
                        ? "border-forest bg-[#fdf2f2] text-forest shadow-sm ring-1 ring-forest/30"
                        : "border-line bg-white text-muted hover:border-[#cbd5cc] hover:text-ink"
                    }`}
                  >
                    <IconComp size={16} />
                    <span className="text-[9px] font-medium leading-none truncate w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Streak adjustment (available in edit mode or when establishing baseline) */}
          {isEditMode && (
            <div className="rounded-xl border border-line bg-white p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[11px] font-semibold text-ink">
                    Streak Count (Days)
                  </label>
                  <p className="text-[10px] text-muted">
                    Adjust if you already have an ongoing streak
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={streak}
                    onChange={(e) => setStreak(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 rounded-lg border border-line bg-[#fbfcf9] px-2 py-1 text-center text-[12px] font-bold text-ink outline-none focus:border-forest"
                  />
                  <button
                    type="button"
                    onClick={() => setStreak(0)}
                    title="Reset streak to 0"
                    className="rounded-lg p-1 text-muted hover:bg-[#f1f3ed] hover:text-ink transition"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-line">
            {isEditMode && onDeleteHabit ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
                  confirmDelete
                    ? "bg-[#c05746] text-white hover:bg-[#a64738]"
                    : "text-[#c05746] hover:bg-[#fef2f2]"
                }`}
              >
                <Trash2 size={13} />
                {confirmDelete ? "Confirm Delete?" : "Delete"}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-3.5 py-2 text-[11px] font-medium text-muted hover:bg-[#f1f3ed] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
              >
                {isEditMode ? "Save Changes" : "Create Habit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
