export type ReminderSnooze = {
    key: string;
    until: string;
};
export type ReminderPreference = {
    id: 'reminder-snoozes';
    entries: ReminderSnooze[];
};
export const reminderOccurrence = (id: string, date: string) => JSON.stringify([id, date]);
export function validReminderPreference(value: Record<string, unknown>) { return value.id === 'reminder-snoozes' && Array.isArray(value.entries) && value.entries.length <= 500 && new Set(value.entries.map(e => e?.key)).size === value.entries.length && value.entries.every(e => e && typeof e.key === 'string' && e.key.length <= 6000 && typeof e.until === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(e.until) && Number.isFinite(Date.parse(e.until)) && new Date(e.until).toISOString() === e.until); }
export function isReminderSnoozed(entries: ReminderSnooze[], id: string, date: string, now = Date.now()) { return entries.some(e => e.key === reminderOccurrence(id, date) && Date.parse(e.until) > now); }
export function snoozeReminder(entries: ReminderSnooze[], id: string, date: string, until: string, now = Date.now()) { if (!Number.isFinite(Date.parse(until)) || Date.parse(until) <= now)
    throw new Error('Choose a future reminder time.'); const key = reminderOccurrence(id, date); const next = [...entries.filter(e => e.key !== key && Date.parse(e.until) > now - 2 * 86400000), { key, until }]; if (next.length > 500)
    throw new Error('Review existing snoozed reminders before adding more.'); return next; }
export function reminderSnoozes(preferences: readonly unknown[]): ReminderSnooze[] { const found = preferences.find(p => !!p && typeof p === 'object' && (p as {
    id?: string;
}).id === 'reminder-snoozes'); return found && validReminderPreference(found as Record<string, unknown>) ? (found as ReminderPreference).entries : []; }
export function snoozeUntil(choice: string, now = new Date()) { const d = new Date(now); if (choice === 'hour')
    d.setHours(d.getHours() + 1);
else {
    d.setDate(d.getDate() + (choice === 'week' ? 7 : 1));
    d.setHours(9, 0, 0, 0);
} return d.toISOString(); }
