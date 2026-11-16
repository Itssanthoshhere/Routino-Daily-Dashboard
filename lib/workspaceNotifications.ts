import type { NotificationItem, Task } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { expiryReminders } from "@/lib/expiryReminders";
export function workspaceNotifications(tasks: Task[], subscriptions: Subscription[], airtel: AirtelData, today: string): NotificationItem[] {
  const reminders: NotificationItem[] = expiryReminders(subscriptions, airtel, today).map(item => ({
    id: `expiry:${item.id}:${item.date}`, title: `${item.name} · ${item.daysLeft < 0 ? "expired / overdue" : item.daysLeft === 0 ? "due today" : `in ${item.daysLeft} days`}`,
    time: item.date, type: "system", read: false, navTarget: "Trackers", trackerTab: item.tab,
  }));
  return [...reminders, ...tasks.filter(task => !task.checked && task.dueDate && task.dueDate.slice(0, 10) < today).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)).map(task => ({
    id: `overdue:${task.id}:${task.dueDate}`, title: `Overdue: ${task.title}`, time: task.dueDate!.slice(0, 10), type: "task" as const, read: false, navTarget: "Tasks" as const, taskId: task.id,
  }))];
}
