/** Date-only deadlines represent a local calendar day, not midnight UTC. */
export function localDay(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
export function taskDueDay(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? localDay(parsed) : undefined;
}
export function calendarStart(value?: {date?: string;dateTime?: string}) { return value?.dateTime ? new Date(value.dateTime) : value?.date ? new Date(`${value.date}T00:00:00`) : null; }
export function rescheduleTaskDate(original: string | undefined, day: string): string | undefined {
  if (!day) return undefined;
  if (!original || original.length <= 10) return day;
  if (taskDueDay(original) === day) return original;
  const parsed = new Date(original);
  if (!Number.isFinite(parsed.getTime())) return day;
  const [year,month,date] = day.split("-").map(Number);
  parsed.setFullYear(year,month-1,date);
  return parsed.toISOString();
}
