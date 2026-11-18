import type { DashboardEvent } from "@/types/dashboard";
import { inferEventCategory } from "@/lib/meeting";
const shortDateFormat = new Intl.DateTimeFormat("en", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
const longDateFormat = new Intl.DateTimeFormat("en", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
const timeFormat = new Intl.DateTimeFormat("en", { hour:"numeric", minute:"2-digit" });

export function calendarSearchDate(event: DashboardEvent): Date | null {
  const value = event.start?.dateTime || event.start?.date;
  if (!value) return null;
  // All-day dates are calendar dates, not UTC instants.
  const date = new Date(event.start?.dateTime ? value : `${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return null;
  if (!event.start?.dateTime && `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` !== value) return null;
  return date;
}

export function calendarSearchDateLabel(event: DashboardEvent): string {
  const date = calendarSearchDate(event);
  if (!date) return "Date unavailable";
  const day = shortDateFormat.format(date);
  return `${day} · ${event.start?.dateTime ? timeFormat.format(date) : "All day"}`;
}
const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.,/|:_–—-]+/g," ").replace(/\s+/g," ").trim();
const sortTime = (event: DashboardEvent) => {
  const date = calendarSearchDate(event);
  if (!date) return Infinity;
  if (!event.start?.dateTime) date.setHours(0,0,0,0);
  return date.getTime();
};

export function searchCalendarEvents(events: DashboardEvent[], query: string): DashboardEvent[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (!terms.length) return [];
  return events.filter(event => {
    const date = calendarSearchDate(event);
    const category = inferEventCategory(event).tag;
    const iso = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` : "";
    const longDate = date ? longDateFormat.format(date) : "";
    const aliases = ({ ENTERTAINMENT:"movie movies series cinema", MEAL:"meal meals", BANANA:"banana yellow work tasks", GAMING:"game games gaming", PROJECT:"project projects", MEETING:"meeting meetings" } as Record<string,string>)[category] || "";
    const text = normalize([event.summary,category,aliases,event.calendarSummary,event.source,iso,longDate,calendarSearchDateLabel(event)].filter(Boolean).join(" "));
    return terms.every(term => text.includes(term));
  }).sort((a,b) => sortTime(a) - sortTime(b) || (a.summary || "").localeCompare(b.summary || ""));
}
