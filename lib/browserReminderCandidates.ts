import {isReminderSnoozed,reminderOccurrence,type ReminderSnooze} from "@/lib/reminderSnooze";
import type {AssetRecords} from "@/types/assets";
import { taskDueDay } from "@/lib/taskDates";
import type { Task } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { workspaceNotifications } from "@/lib/workspaceNotifications";

export function browserReminderCandidates(tasks: Task[], subscriptions: Subscription[], airtel: AirtelData, today: string, now: number, assets: AssetRecords = {}, snoozes:ReminderSnooze[] = []) {
  const items = workspaceNotifications(tasks, subscriptions, airtel, today, assets, snoozes, now);
  for (const task of tasks.filter(task => !task.checked && !task.skipped && !isReminderSnoozed(snoozes,`task:${task.id}`,task.dueDate||"",now) && taskDueDay(task.dueDate) === today)) {
    if (task.dueDate!.length > 10) {
      const due = new Date(task.dueDate!).getTime();
      if (!Number.isFinite(due) || due > now) continue;
    }
    items.push({ id: `due:${task.id}:${task.dueDate}`, title: `Due today: ${task.title}`, time: today, type: "task", read: false, navTarget: "Tasks", taskId: task.id });
  }
  // An expired snooze is a fresh delivery opportunity, even if the original alert was shown today.
  // Keep the suffix stable across subsequent checks so delivery still happens only once.
  return items.map(item=>{
    let key:string|undefined;
    if(item.taskId){const task=tasks.find(task=>task.id===item.taskId);if(task?.dueDate)key=reminderOccurrence(`task:${task.id}`,task.dueDate);}
    else if(item.id.startsWith("asset:"))key=reminderOccurrence(item.id.slice(6,-(item.time.length+1)),item.time);
    else if(item.id.startsWith("expiry:"))key=reminderOccurrence(`renewal:${item.id.slice(7,-(item.time.length+1))}`,item.time);
    const expired=snoozes.find(entry=>entry.key===key&&Date.parse(entry.until)<=now);
    return expired?{...item,id:`${item.id}:after-snooze:${Date.parse(expired.until)}`}:item;
  });
}
