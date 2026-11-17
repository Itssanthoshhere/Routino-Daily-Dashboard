import type { Task } from "@/types/dashboard";
export function meetingActionKey(noteId: string, itemId: string): string { return JSON.stringify([noteId, itemId]); }
export function hasMeetingAction(tasks: Task[], noteId: string, itemId: string): boolean {
  const key = meetingActionKey(noteId, itemId);
  return tasks.some(task => task.meetingActionKey === key || task.meta === `Meeting note: ${noteId} · Action: ${itemId}`);
}
