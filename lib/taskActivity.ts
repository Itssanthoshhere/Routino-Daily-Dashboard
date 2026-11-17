import type { Task } from "@/types/dashboard";

export type TaskActivity = { at: number; action: string };
export function withTaskActivity(before: Task[], after: Task[], now = Date.now(), actionOverride?: string): Task[] {
  const previous = new Map(before.map(task => [task.id, task]));
  return after.map(task => {
    const old = previous.get(task.id);
    const { activity: _activity, ...value } = task;
    const { activity: _oldActivity, ...oldValue } = old || {};
    if (old && JSON.stringify(value) === JSON.stringify(oldValue)) return task;
    const action = actionOverride ? actionOverride : !old ? "Created" : task.skipped && !old.skipped ? "Skipped" : task.checked !== old.checked ? (task.checked ? "Completed" : "Reopened") : task.recurrence?.paused !== old.recurrence?.paused ? (task.recurrence?.paused ? "Series paused" : "Series resumed") : task.dueDate !== old.dueDate ? "Rescheduled" : JSON.stringify(task.subtasks) !== JSON.stringify(old.subtasks) ? "Checklist updated" : "Edited";
    return { ...task, activity: [...(old?.activity || task.activity || []), { at: now, action }].slice(-200) };
  });
}
export function isTaskActivity(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= 200 && value.every(item => item && typeof item === "object" && Number.isFinite(item.at) && item.at >= 0 && typeof item.action === "string" && item.action.length <= 100));
}
