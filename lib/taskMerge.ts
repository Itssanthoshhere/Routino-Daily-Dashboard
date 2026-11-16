import type { Task } from "@/types/dashboard";

export function mergeTaskRecords(existing: Task[], incoming: Task[], replacedIds: string[], deletedIds: string[]): Task[] {
  const removed = new Set(deletedIds);
  const replaced = new Set(replacedIds);
  const merged = new Map(existing.filter(task => !removed.has(task.id)).map(task => [task.id, task]));
  for (const task of incoming) if (!removed.has(task.id) && replaced.has(task.id)) merged.set(task.id, task);
  return Array.from(merged.values());
}
