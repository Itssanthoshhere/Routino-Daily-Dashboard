export type FocusPreferences = {
    id: "preferences";
    kind: "preferences";
    days: number[];
    start: string;
    end: string;
    breakMinutes: number;
    bufferMinutes: number;
};
export type FocusSession = {
    id: string;
    kind: "session";
    taskId?: string;
    taskTitle: string;
    minutes: number;
    completedAt: string;
};
export type FocusRecord = FocusPreferences | FocusSession;
export const defaultFocusPreferences: FocusPreferences = { id: "preferences", kind: "preferences", days: [0, 1, 2, 3, 4, 5, 6], start: "08:00", end: "20:00", breakMinutes: 0, bufferMinutes: 0 };
export function validFocusRecord(value: unknown): boolean {
    if (!value || typeof value !== "object")
        return false;
    const v = value as Record<string, unknown>;
    if (v.kind === "preferences")
        return v.id === "preferences" && Array.isArray(v.days) && v.days.length > 0 && new Set(v.days).size === v.days.length && v.days.every(x => Number.isInteger(x) && x >= 0 && x <= 6) && typeof v.start === "string" && typeof v.end === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.end) && v.start < v.end && [v.breakMinutes, v.bufferMinutes].every(x => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 120);
    return v.kind === "session" && typeof v.id === "string" && v.id !== "preferences" && !!v.id && typeof v.taskTitle === "string" && (v.taskId === undefined || typeof v.taskId === "string") && typeof v.minutes === "number" && Number.isFinite(v.minutes) && v.minutes > 0 && v.minutes <= 360 && typeof v.completedAt === "string" && Number.isFinite(Date.parse(v.completedAt));
}
export function focusPreferences(records: FocusRecord[]): FocusPreferences { return records.find((r): r is FocusPreferences => r.kind === "preferences" && validFocusRecord(r)) || defaultFocusPreferences; }
/** Timed events reserve preparation before and recovery after; date-only events stay date-only. */
export function bufferedFocusEvents(events: import("@/types/dashboard").DashboardEvent[], preferences: FocusPreferences) {
    return events.filter(event => {
        const status = event as typeof event & {
            status?: string;
            transparency?: string;
        };
        return status.status !== "cancelled" && status.transparency !== "transparent";
    }).map(event => {
        if (!event.start?.dateTime || !event.end?.dateTime)
            return event;
        if (!Number.isFinite(Date.parse(event.start.dateTime)) || !Number.isFinite(Date.parse(event.end.dateTime)))
            return event;
        return { ...event, start: { dateTime: new Date(Date.parse(event.start.dateTime) - preferences.bufferMinutes * 60000).toISOString() }, end: { dateTime: new Date(Date.parse(event.end.dateTime) + Math.max(preferences.bufferMinutes, preferences.breakMinutes) * 60000).toISOString() } };
    });
}
