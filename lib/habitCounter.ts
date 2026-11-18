import type { Habit } from "@/types/dashboard";
export function habitCounter(habit: Habit, now = new Date()): string {
  const streak = `${habit.streak} ${habit.streak === 1 ? "day" : "days"} streak`;
  if (habit.trackingMode !== "days-since" && !habit.counterStartDate) return streak;
  const date = habit.counterStartDate || [...habit.completedDates].filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort().pop();
  if (!date) return "Not recorded yet";
  const [year, month, day] = date.split("-").map(Number);
  const anchor = new Date(year, month - 1, day);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(anchor.getTime()) || anchor.getFullYear() !== year || anchor.getMonth() !== month - 1 || anchor.getDate() !== day) return streak;
  const days = Math.max(0, Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(year, month - 1, day)) / 86400000));
  return `${habit.trackingMode !== "days-since" ? `${streak} · ` : ""}${days} ${days === 1 ? "day" : "days"} since ${habit.counterStartDate ? habit.name.toLowerCase() : "last done"} · ${new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day))}`;
}
