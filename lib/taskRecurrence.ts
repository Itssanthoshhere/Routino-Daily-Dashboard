import type { Task } from "@/types/dashboard";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";

export type TaskRecurrence = { frequency: "daily" | "weekdays" | "weekly" | "monthly" | "yearly"; interval: number; until?: string; anchorDate?: string };
export function isTaskRecurrence(value: unknown): value is TaskRecurrence {
  if (!value || typeof value !== "object") return false;
  const rule = value as TaskRecurrence;
  return ["daily", "weekdays", "weekly", "monthly", "yearly"].includes(rule.frequency) && Number.isInteger(rule.interval) && rule.interval >= 1 && rule.interval <= 365 && (rule.frequency !== "weekdays" || rule.interval === 1) && (rule.until === undefined || isSubscriptionDate(rule.until)) && (rule.anchorDate === undefined || isSubscriptionDate(rule.anchorDate));
}
const format = (date: Date) => date.toISOString().slice(0, 10);
export function nextTaskDueDate(task: Task, today: string): string | null {
  const rule = task.recurrence;
  const due = task.dueDate?.slice(0, 10);
  if (!rule || !isTaskRecurrence(rule) || !isSubscriptionDate(due) || !isSubscriptionDate(today)) return null;
  const base = new Date(`${due}T12:00:00Z`);
  const threshold = due > today ? due : today;
  let candidate = new Date(base);
  if (rule.frequency === "daily" || rule.frequency === "weekly") {
    const days = rule.interval * (rule.frequency === "weekly" ? 7 : 1);
    const gap = Math.floor((Date.parse(threshold) - Date.parse(due)) / 86400000);
    candidate.setUTCDate(candidate.getUTCDate() + (Math.floor(gap / days) + 1) * days);
  } else if (rule.frequency === "weekdays") {
    candidate = new Date(`${threshold}T12:00:00Z`);
    do { candidate.setUTCDate(candidate.getUTCDate() + 1); } while ([0, 6].includes(candidate.getUTCDay()));
  } else {
    const anchor = new Date(`${rule.anchorDate || due}T12:00:00Z`);
    const [year, month] = threshold.split("-").map(Number);
    const step = rule.interval * (rule.frequency === "yearly" ? 12 : 1);
    const months = (year - base.getUTCFullYear()) * 12 + month - 1 - base.getUTCMonth();
    let offset = Math.max(1, Math.floor(months / step)) * step;
    const at = (value: number) => {
      const date = new Date(base); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + value);
      const last = new Date(date); last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0);
      date.setUTCDate(Math.min(anchor.getUTCDate(), last.getUTCDate())); return date;
    };
    candidate = at(offset);
    while (format(candidate) <= threshold) { offset += step; candidate = at(offset); }
  }
  const date = format(candidate);
  if (rule.until && date > rule.until) return null;
  return date + (task.dueDate?.slice(10) || "");
}

export function completeRepeatingTask(tasks: Task[], id: string, today: string, now: number): Task[] {
  const task = tasks.find(item => item.id === id);
  if (!task) return tasks;
  const next = tasks.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
  if (task.checked || !task.recurrence) return next;
  const dueDate = nextTaskDueDate(task, today);
  if (!dueDate) return next;
  const series = task.recurrenceSeriesId || task.id;
  const nextId = `${series}:repeat:${dueDate}`;
  if (next.some(item => item.id === nextId)) return next;
  return [...next, { ...task, id: nextId, recurrenceSeriesId: series, dueDate, createdAt: now, checked: false, recurrence: { ...task.recurrence, anchorDate: task.recurrence.anchorDate || task.dueDate?.slice(0, 10) }, subtasks: task.subtasks?.map(subtask => ({ ...subtask, completed: false })), meta: task.meta ? task.meta.replace(/\b(?:Due )?Today\b|Due \d{4}-\d{2}-\d{2}/g, `Due ${dueDate.slice(0, 10)}`) : `Due ${dueDate.slice(0, 10)} · Repeating` }];
}

export function recurrenceLabel(rule: TaskRecurrence): string {
  if (rule.frequency === "weekdays") return "Every weekday";
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[rule.frequency];
  return rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
}
