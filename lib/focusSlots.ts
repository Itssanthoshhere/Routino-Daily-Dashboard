import { bufferedFocusEvents, defaultFocusPreferences, type FocusPreferences } from "@/lib/focusWorkspace";
import { DashboardEvent } from "@/types/dashboard";

export type FocusSlot = { start: Date; end: Date; minutes: number };

export function findFocusSlots(
  events: DashboardEvent[],
  from = new Date(),
  days = 7,
  duration = 45,
  preferences: FocusPreferences = defaultFocusPreferences
): FocusSlot[] {
  const slots: FocusSlot[] = [];
  if (!Number.isFinite(duration) || duration <= 0) return slots;
  const buffered = bufferedFocusEvents(events, preferences);
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);
  const stepMs = Math.max((duration + preferences.breakMinutes) * 60000, 90 * 60000); // 90 min spacing in wide open gaps

  for (let day = 0; day < days && slots.length < 12; day++) {
    const dayStart = new Date(startDay);
    dayStart.setDate(dayStart.getDate() + day);
    if (!preferences.days.includes(dayStart.getDay())) continue;
    const [sh, sm] = preferences.start.split(":").map(Number);
    dayStart.setHours(sh, sm, 0, 0);

    const dayEnd = new Date(dayStart);
    const [eh, em] = preferences.end.split(":").map(Number);
    dayEnd.setHours(eh, em, 0, 0);

    const busy = buffered
      .flatMap((event) => {
        const start = event.start?.dateTime ? new Date(event.start.dateTime) : event.start?.date ? new Date(`${event.start.date}T00:00:00`) : null;
        const end = event.end?.dateTime ? new Date(event.end.dateTime) : event.end?.date ? new Date(`${event.end.date}T00:00:00`) : null;
        return start && end && end > dayStart && start < dayEnd
          ? [{ start: start < dayStart ? dayStart : start, end: end > dayEnd ? dayEnd : end }]
          : [];
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: { start: Date; end: Date }[] = [];
    for (const item of busy) {
      const last = merged[merged.length - 1];
      if (last && item.start <= last.end) {
        last.end = item.end > last.end ? item.end : last.end;
      } else {
        merged.push({ start: new Date(item.start), end: new Date(item.end) });
      }
    }

    let cursor = dayStart;
    for (const item of merged) {
      let slotStart =
        cursor < from
          ? new Date(Math.ceil(from.getTime() / (15 * 60000)) * (15 * 60000))
          : cursor;

      while (slotStart.getTime() + duration * 60000 <= item.start.getTime() && slots.length < 12) {
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotStart.getTime() + duration * 60000),
          minutes: duration,
        });
        slotStart = new Date(slotStart.getTime() + stepMs);
      }
      if (item.end > cursor) cursor = item.end;
    }

    let finalStart =
      cursor < from
        ? new Date(Math.ceil(from.getTime() / (15 * 60000)) * (15 * 60000))
        : cursor;

    while (finalStart.getTime() + duration * 60000 <= dayEnd.getTime() && slots.length < 12) {
      slots.push({
        start: new Date(finalStart),
        end: new Date(finalStart.getTime() + duration * 60000),
        minutes: duration,
      });
      finalStart = new Date(finalStart.getTime() + stepMs);
    }
  }

  return slots.slice(0, 12);
}
