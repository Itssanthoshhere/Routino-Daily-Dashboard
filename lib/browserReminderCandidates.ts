import type {AssetRecords} from "@/types/assets";
import { taskDueDay } from "@/lib/taskDates";
import type { Task } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { workspaceNotifications } from "@/lib/workspaceNotifications";

export function browserReminderCandidates(tasks: Task[], subscriptions: Subscription[], airtel: AirtelData, today: string, now: number, assets: AssetRecords = {}) {
  const items = workspaceNotifications(tasks, subscriptions, airtel, today, assets);
  for (const task of tasks.filter(task => !task.checked && !task.skipped && taskDueDay(task.dueDate) === today)) {
    if (task.dueDate!.length > 10) {
      const due = new Date(task.dueDate!).getTime();
      if (!Number.isFinite(due) || due > now) continue;
    }
    items.push({ id: `due:${task.id}:${task.dueDate}`, title: `Due today: ${task.title}`, time: today, type: "task", read: false, navTarget: "Tasks", taskId: task.id });
  }
  return items;
}
