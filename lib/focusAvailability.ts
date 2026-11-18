import type { DashboardEvent } from "@/types/dashboard";
/** Compare busy instants; all-day dates are interpreted in the scheduling user's timezone. */
export function hasFocusConflict(events: DashboardEvent[], start: Date, end: Date, timeZone: string): boolean {
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year:"numeric", month:"2-digit", day:"2-digit" });
  const firstDay = format.format(start), lastDay = format.format(new Date(end.getTime() - 1));
  return events.some(event => {
    const value = event as DashboardEvent & { status?: string; transparency?: string };
    if (value.status === "cancelled" || value.transparency === "transparent") return false;
    if (event.start?.date && event.end?.date) return event.start.date <= lastDay && event.end.date > firstDay;
    const from = new Date(event.start?.dateTime || "").getTime(), to = new Date(event.end?.dateTime || "").getTime();
    return Number.isFinite(from) && Number.isFinite(to) && from < end.getTime() && to > start.getTime();
  });
}
