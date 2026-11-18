import { rescheduleTaskDate } from "@/lib/taskDates";
import type { Task } from "@/types/dashboard";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import { editTaskOccurrences } from "@/lib/taskRecurrence";
export function offsetDate(today: string, days: number): string {
  const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10);
}
export function snoozeTask(tasks: Task[], id: string, date: string, today: string): Task[] {
  const task = tasks.find(item => item.id === id);
  if (!task || task.checked || !isSubscriptionDate(date) || date <= today) return tasks;
  const meta = task.meta.replace(/\b(?:Due )?Today\b|Due \d{4}-\d{2}-\d{2}|\bInbox\b/gi, `Due ${date}`);
  return editTaskOccurrences(tasks, id, { ...task, inbox: false, dueDate: rescheduleTaskDate(task.dueDate, date), meta: meta === task.meta ? `Due ${date} · ${meta}` : meta }, "occurrence");
}
