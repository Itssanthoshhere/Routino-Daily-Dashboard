import type { Task } from "@/types/dashboard";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";

export type TaskRecurrence = { frequency: "daily" | "weekdays" | "weekly" | "monthly" | "yearly"; interval: number; paused?: boolean; until?: string; anchorDate?: string };
export function isTaskRecurrence(value: unknown): value is TaskRecurrence {
  if (!value || typeof value !== "object") return false;
  const rule = value as TaskRecurrence;
  return ["daily", "weekdays", "weekly", "monthly", "yearly"].includes(rule.frequency) && (rule.paused === undefined || typeof rule.paused === "boolean") && Number.isInteger(rule.interval) && rule.interval >= 1 && rule.interval <= 365 && (rule.frequency !== "weekdays" || rule.interval === 1) && (rule.until === undefined || isSubscriptionDate(rule.until)) && (rule.anchorDate === undefined || isSubscriptionDate(rule.anchorDate));
}
const format = (date: Date) => date.toISOString().slice(0, 10);
export function nextTaskDueDate(task: Task, today: string): string | null {
  const rule = task.recurrence;
  const due = task.dueDate?.slice(0, 10);
  if (!rule || rule.paused || !isTaskRecurrence(rule) || !isSubscriptionDate(due) || !isSubscriptionDate(today)) return null;
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
  const next = tasks.map(item => item.id === id ? { ...item, checked: !item.checked, skipped: undefined } : item);
  if (task.checked || task.recurrence?.paused || task.recurrenceTemplate?.recurrence?.paused || (!task.recurrence && !task.recurrenceTemplate?.recurrence)) return next;
  const template = task.recurrenceTemplate ? { ...task, ...task.recurrenceTemplate } : task;
  const dueDate = nextTaskDueDate(template, task.dueDate && task.dueDate.slice(0, 10) > today ? task.dueDate.slice(0, 10) : today);
  if (!dueDate) return next;
  const series = task.recurrenceSeriesId || task.id;
  const nextId = `${series}:repeat:${dueDate}`;
  if (next.some(item => item.id === nextId)) return next;
  return [...next, { ...template, recurrenceTemplate: undefined, skipped: undefined, id: nextId, recurrenceSeriesId: series, dueDate, createdAt: now, checked: false, recurrence: { ...template.recurrence!, anchorDate: template.recurrence?.anchorDate || template.dueDate?.slice(0, 10) }, subtasks: template.subtasks?.map(subtask => ({ ...subtask, completed: false })), meta: template.meta ? template.meta.replace(/\b(?:Due )?Today\b|Due \d{4}-\d{2}-\d{2}/g, `Due ${dueDate.slice(0, 10)}`) : `Due ${dueDate.slice(0, 10)} · Repeating` }];
}

export function recurrenceLabel(rule: TaskRecurrence): string {
  if (rule.frequency === "weekdays") return `${rule.paused ? "Paused · " : ""}Every weekday`;
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[rule.frequency];
  return (rule.paused ? "Paused · " : "") + (rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`);
}

export function editTaskOccurrences(tasks: Task[], id: string, updates: Omit<Task, "id" | "checked" | "createdAt">, scope: "occurrence" | "future" = "future"): Task[] {
  const current = tasks.find(task => task.id === id);
  if (!current) return tasks;
  const series = current.recurrenceSeriesId || current.id;
  return tasks.map(task => {
    if (task.id === id) {
      const { id: _id, checked: _checked, createdAt: _created, recurrenceTemplate: _template, ...template } = current;
      return { ...task, ...updates, recurrenceTemplate: scope === "occurrence" && (current.recurrence || current.recurrenceTemplate) ? current.recurrenceTemplate || template : undefined };
    }
    if (scope !== "future" || task.checked || (task.recurrenceSeriesId || task.id) !== series || (task.dueDate || "") < (current.dueDate || "")) return task;
    // Keep individually scheduled dates and checklist progress on existing future occurrences.
    return { ...task, title: updates.title, meta: updates.meta, priority: updates.priority, category: updates.category, link: updates.link, recurrence: updates.recurrence, recurrenceTemplate: undefined };
  });
}

export function skipTaskOccurrence(tasks: Task[], id: string, today: string, now: number): Task[] {
  const task = tasks.find(item => item.id === id);
  if (!task || task.checked || !task.recurrence || task.recurrence.paused) return tasks;
  return completeRepeatingTask(tasks, id, today, now).map(item => item.id === id ? { ...item, skipped: true, checked: true } : item);
}
export function setSeriesPaused(tasks: Task[], id: string, paused: boolean, today: string, now: number): Task[] {
  const task = tasks.find(item => item.id === id);
  if (!task?.recurrence) return tasks;
  const series = task.recurrenceSeriesId || task.id;
  const setRule = (item: Task): Task => ({ ...item, recurrence: { ...item.recurrence!, paused }, ...(item.recurrenceTemplate ? { recurrenceTemplate: { ...item.recurrenceTemplate, recurrence: { ...item.recurrenceTemplate.recurrence!, paused } } } : {}) });
  const next = tasks.map(item => (item.recurrenceSeriesId || item.id) === series && !item.checked && item.recurrence ? setRule(item) : item);
  if (!paused && !next.some(item => (item.recurrenceSeriesId || item.id) === series && !item.checked)) {
    const last = tasks.filter(item => (item.recurrenceSeriesId || item.id) === series && item.recurrence).sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))[0];
    if (last) {
      const seed = { ...setRule(last), checked: false, skipped: undefined };
      const generated = completeRepeatingTask([seed], seed.id, today, now).slice(1);
      const additions = generated.filter(item => !next.some(existing => existing.id === item.id));
      return additions.length ? [...next, ...additions] : tasks;
    }
  }
  return next;
}
