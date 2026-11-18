import type { Task } from "@/types/dashboard";
const normalize = (title: string) => title.normalize("NFKC").toLocaleLowerCase("en").replace(/[.,!?;:'"“”‘’]/g, " ").replace(/\s+/g, " ").trim();

/** Advisory only: compare loaded unfinished titles; never merge or change tasks. */
export function findTaskDuplicates(title: string, tasks: Task[]): Task[] {
  const normalized = normalize(title);
  if (!normalized) return [];
  const words = new Set(normalized.split(" "));
  return tasks.filter(task => {
    if (task.checked || task.skipped) return false;
    const candidate = normalize(task.title);
    if (candidate === normalized) return true;
    const other = new Set(candidate.split(" "));
    const shared = Array.from(words).filter(word => other.has(word)).length;
    return words.size >= 3 && other.size >= 3 && shared >= 3 && shared / (words.size + other.size - shared) >= 0.8;
  });
}
export function duplicateWarningKey(title: string, tasks: Task[]) {
  return JSON.stringify([title, tasks.map(task => task.id).sort()]);
}
