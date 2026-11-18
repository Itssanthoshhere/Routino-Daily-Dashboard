import { coreCollections, mergeCollection, type CollectionChanges } from "@/lib/collectionChanges";
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
  const changes: CollectionChanges = { ...(previous.collectionChanges as CollectionChanges || {}) };
  for (const field of coreCollections) {
    const incomingChange = (incoming.collectionChanges as CollectionChanges | undefined)?.[field];
    if (!incomingChange || !Array.isArray(incoming[field])) continue;
    const prior = changes[field];
    const removed = new Set([...(prior?.deletedIds || []), ...incomingChange.deletedIds]);
    const replaced = new Set([...(prior?.replaceIds || []), ...incomingChange.replaceIds]);
    for (const id of incomingChange.replaceIds) removed.delete(id);
    for (const id of incomingChange.deletedIds) replaced.delete(id);
    result[field] = mergeCollection((previous[field] || []) as {id:string}[], incoming[field] as {id:string}[], incomingChange);
    changes[field] = { replaceIds: Array.from(replaced), deletedIds: Array.from(removed), orderIds: incomingChange.orderIds ?? prior?.orderIds };
  }
  if (Object.keys(changes).length) result.collectionChanges = changes;
  return result;
}
