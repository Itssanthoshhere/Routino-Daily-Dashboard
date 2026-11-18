import type { Task } from "@/types/dashboard";
import { completeRepeatingTask, editTaskOccurrences } from "@/lib/taskRecurrence";
import { rescheduleTaskDate } from "@/lib/taskDates";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";

const tagPattern = new RegExp("^[\\p{L}\\p{M}\\p{N}_-]{1,40}$", "u");
export function normalizeTaskTags(value: string | string[]): string[] {
  const parts = typeof value === "string" ? value.split(/[,\s]+/) : value;
  return Array.from(new Set(parts.map(tag => tag.normalize("NFKC").replace(/^#/, "").trim().toLowerCase()).filter(tag => tagPattern.test(tag)))).slice(0,20);
}
export function taskTags(task: Pick<Task,"tags"|"meta"> & Partial<Pick<Task,"category"|"projectName">>): string[] {
  const tags = normalizeTaskTags(task.tags || Array.from(task.meta.matchAll(new RegExp("(?:^|\\s)#([\\p{L}\\p{M}\\p{N}_-]+)", "gu")), match=>match[1]));
  // Category/group tags are derived for display and filtering, without rewriting saved tasks.
  return task.category === "project" || task.projectName?.trim() ? ["project", ...tags.filter(tag=>tag!=="project")] : tags;
}

export const inTaskInbox = (task: Pick<Task,"inbox"|"dueDate"|"checked"|"skipped">) => task.inbox === true && !task.dueDate && !task.checked && !task.skipped;
export type TaskBulkAction = { type:"complete" } | { type:"date"; date:string } | { type:"category"; category: NonNullable<Task["category"]> };
/** Each selected open occurrence changes once. Completed history and unrelated records are retained. */
export function bulkUpdateTasks(tasks: Task[], ids: string[], action: TaskBulkAction, today: string, now = Date.now()): Task[] {
  const selected = new Set(ids);
  if (action.type === "date" && !isSubscriptionDate(action.date)) return tasks;
  if (action.type === "category" && !["work","personal","meeting","urgent","project","travel"].includes(action.category)) return tasks;
  const targets = tasks.filter(task=>selected.has(task.id)&&!task.checked&&!task.skipped);
  let result = tasks;
  for (const task of targets) {
    if (action.type === "complete") result = completeRepeatingTask(result,task.id,today,now);
    else if (action.type === "date") {
      const meta=task.meta.replace(/\b(?:Due )?Today\b|Due \d{4}-\d{2}-\d{2}|\bInbox\b/gi,`Due ${action.date}`);
      result=editTaskOccurrences(result,task.id,{...task,inbox:false,dueDate:rescheduleTaskDate(task.dueDate,action.date),meta:meta===task.meta?`Due ${action.date} · ${meta}`:meta},"occurrence");
    }
    else result = result.map(item=>item.id===task.id?{...item,category:action.category}:item);
  }
  return result;
}
export function taskProjectGroups(tasks: Task[]) {
  const groups = new Map<string,{name:string;tasks:Task[]}>();
  for (const task of tasks) {
    const name=task.projectName?.trim(); if(!name)continue;
    const key=name.normalize("NFKC").toLowerCase();
    const group=groups.get(key)||{name,tasks:[]};group.tasks.push(task);groups.set(key,group);
  }
  return Array.from(groups.entries()).map(([key,group])=>({key,...group,completed:group.tasks.filter(task=>task.checked&&!task.skipped).length,milestones:Array.from(new Set(group.tasks.map(task=>task.milestone?.trim()).filter((name):name is string=>!!name))).map(name=>{const matching=group.tasks.filter(task=>task.milestone?.trim()===name);return {name,total:matching.length,completed:matching.filter(task=>task.checked&&!task.skipped).length};})})).sort((a,b)=>a.name.localeCompare(b.name));
}
