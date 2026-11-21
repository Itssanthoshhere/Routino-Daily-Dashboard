import { validTimeAuditCategories, type TimeAuditPreference } from "@/lib/timeAuditPreferences";
import {validReminderPreference,type ReminderPreference} from "@/lib/reminderSnooze";
export const overviewWidgets = [
    { id: 'intention', label: 'Daily intention', span: 'summary' }, { id: 'meeting-count', label: 'Meeting summary', span: 'summary' }, { id: 'mail-count', label: 'Inbox summary', span: 'summary' }, { id: 'focus-count', label: 'Focus summary', span: 'summary' },
    { id: 'tracker-snapshot', label: 'Trackers snapshot', span: 'full' }, { id: 'habits', label: 'Habits & streaks', span: 'full' }, { id: 'schedule', label: "Today's schedule", span: 'half' }, { id: 'tasks', label: 'Priorities & tasks', span: 'half' }, { id: 'week', label: 'The week ahead', span: 'wide' }, { id: 'inbox', label: 'Worth a look · Inbox', span: 'narrow' },
    { id: 'focus', label: 'Focus plan', span: 'half' }, { id: 'reading', label: 'Read Later', span: 'half' }, { id: 'follow-ups', label: 'Meeting follow-ups', span: 'half' }, { id: 'links', label: 'Quick links', span: 'half' }, { id: 'drive', label: 'Recent Drive files', span: 'half' }, { id: 'scratchpad', label: 'Scratchpad', span: 'half' }
] as const;
export type OverviewWidgetId = typeof overviewWidgets[number]['id'];
export type DisplayPreference = {
    id: 'display';
    textSize: 'standard' | 'large' | 'larger';
    reduceMotion: boolean;
    contrast: 'standard' | 'strong';
};
export type OverviewPreference = {
    id: 'overview';
    order: OverviewWidgetId[];
    hidden: OverviewWidgetId[];
};
export type WorkspacePreference = DisplayPreference | OverviewPreference | ReminderPreference | TimeAuditPreference;
export const defaultDisplay: DisplayPreference = { id: 'display', textSize: 'standard', reduceMotion: false, contrast: 'standard' };
export function validWorkspacePreference(value: unknown): boolean { if (!value || typeof value !== 'object')
    return false; const v = value as Record<string, unknown>; if(v.id==='time-audit') return validTimeAuditCategories(v.categories); if(v.id==='reminder-snoozes')return validReminderPreference(v); if (v.id === 'display')
    return ['standard', 'large', 'larger'].includes(String(v.textSize)) && typeof v.reduceMotion === 'boolean' && ['standard', 'strong'].includes(String(v.contrast)); const ids = (list: unknown) => Array.isArray(list) && list.length <= overviewWidgets.length && new Set(list).size === list.length && list.every(id => overviewWidgets.some(widget => widget.id === id)); return v.id === 'overview' && ids(v.order) && ids(v.hidden); }
export function orderedOverview(preferences: WorkspacePreference[]): OverviewWidgetId[] { const saved = preferences.find((p): p is OverviewPreference => p.id === 'overview'); return [...(saved?.order || []), ...overviewWidgets.map(w => w.id).filter(id => !saved?.order.includes(id))]; }
export function reorderOverview(order: OverviewWidgetId[], id: OverviewWidgetId, direction: -1 | 1): OverviewWidgetId[] { const index = order.indexOf(id), target = index + direction; if (index < 0 || target < 0 || target >= order.length)
    return order; const next = [...order]; [next[index], next[target]] = [next[target], next[index]]; return next; }
export function launchShortcut(search: string): 'capture' | 'focus' | null { const action = new URLSearchParams(search).get('action'); return action === 'capture' || action === 'focus' ? action : null; }
export function workspaceScrollBehavior(): ScrollBehavior { const reduced = typeof document !== "undefined" && document.documentElement.dataset.routinoMotion === 'reduced'; const system = typeof window !== "undefined" && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; return reduced || system ? 'auto' : 'smooth'; }
