import type {AssetRecords} from "@/types/assets";
import {unifiedReminders} from "@/lib/unifiedReminders";
import { taskDueDay } from "@/lib/taskDates";
import type { NotificationItem, Task } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { expiryReminders } from "@/lib/expiryReminders";
export function workspaceNotifications(tasks: Task[], subscriptions: Subscription[], airtel: AirtelData, today: string, assets: AssetRecords = {}): NotificationItem[] {
  const reminders: NotificationItem[] = expiryReminders(subscriptions, airtel, today).map(item => ({
    id: `expiry:${item.id}:${item.date}`, title: `${item.name}${subscriptions.find(subscription => subscription.id === item.id)?.renewalDecision === "cancel" ? " · cancel before renewal" : ""} · ${item.daysLeft < 0 ? "expired / overdue" : item.daysLeft === 0 ? "due today" : `in ${item.daysLeft} days`}`,
    time: item.date, type: "system", read: false, navTarget: "Trackers", trackerTab: item.tab,
  }));
  const assetAlerts:NotificationItem[]=unifiedReminders([],[],airtel,assets,today,7).filter(i=>i.kind==="warranty"||i.kind==="maintenance").map(i=>({id:`asset:${i.id}:${i.date}`,title:`${i.title} · ${i.date<today?"overdue":i.date}`,time:i.date,type:"system",read:false,navTarget:"Trackers",trackerTab:"purchases"}));
  return [...assetAlerts, ...reminders, ...tasks.filter(task => !task.checked && !task.skipped && task.dueDate && taskDueDay(task.dueDate)! < today).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)).map(task => ({
    id: `overdue:${task.id}:${task.dueDate}`, title: `Overdue: ${task.title}`, time: task.dueDate!.slice(0, 10), type: "task" as const, read: false, navTarget: "Tasks" as const, taskId: task.id,
  }))];
}
