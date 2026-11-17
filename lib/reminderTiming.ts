export function focusStartAllowed(start: Date, now = Date.now()): boolean {
  return Number.isFinite(start.getTime()) && start.getTime() >= now - 5 * 60000;
}
export function renewalReminderStart(date: string, now = new Date()): Date {
  const requested = new Date(`${date}T09:00:00`);
  if (!Number.isFinite(requested.getTime())) throw new Error("Invalid reminder date");
  return requested.getTime() <= now.getTime() ? new Date(now.getTime() + 15 * 60000) : requested;
}
