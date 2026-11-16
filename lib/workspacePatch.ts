import type { Task } from "@/types/dashboard";

type Patch = Record<string, unknown>;
/** Combine offline patches without replacing earlier touched tasks with a stale full list. */
export function queueWorkspacePatch(previous: Patch, incoming: Patch): Patch {
  const result = { ...previous, ...incoming };
  for (const key of ["deletedHabitIds", "replaceHabitIds"]) {
    if (Array.isArray(previous[key]) || Array.isArray(incoming[key])) result[key] = Array.from(new Set([...(Array.isArray(previous[key]) ? previous[key] : []), ...(Array.isArray(incoming[key]) ? incoming[key] : [])]));
  }
  if (Array.isArray(incoming.tasks) && Array.isArray(incoming.replaceTaskIds) && Array.isArray(incoming.deletedTaskIds)) {
    const priorTasks = Array.isArray(previous.tasks) ? previous.tasks as Task[] : [];
    const map = new Map(priorTasks.map(task => [task.id, task]));
    const replaced = new Set([...(previous.replaceTaskIds as string[] || []), ...incoming.replaceTaskIds as string[]]);
    const deleted = new Set(previous.deletedTaskIds as string[] || []);
    for (const id of incoming.deletedTaskIds as string[]) { deleted.add(id); map.delete(id); replaced.delete(id); }
    for (const task of incoming.tasks as Task[]) if ((incoming.replaceTaskIds as string[]).includes(task.id)) { map.set(task.id, task); deleted.delete(task.id); }
    result.tasks = Array.from(map.values()); result.replaceTaskIds = Array.from(replaced); result.deletedTaskIds = Array.from(deleted);
  }
  return result;
}
