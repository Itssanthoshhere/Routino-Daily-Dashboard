"use client";
import type { Task } from "@/types/dashboard";
export function TaskDuplicateWarning({ tasks, allowed, onAllow }: { tasks: Task[]; allowed: boolean; onAllow: (allowed: boolean) => void }) {
  if (!tasks.length) return null;
  return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"><p className="font-semibold">Similar unfinished task{tasks.length === 1 ? "" : "s"} found</p><ul className="mt-1 list-inside list-disc">{tasks.slice(0, 3).map(task => <li key={task.id} className="break-words">{task.title}{task.dueDate ? ` · Due ${task.dueDate}` : ""}</li>)}</ul>{tasks.length > 3 && <p className="mt-1">And {tasks.length - 3} more.</p>}<label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={allowed} onChange={event => onAllow(event.target.checked)} />Add as a separate task anyway</label></div>;
}
