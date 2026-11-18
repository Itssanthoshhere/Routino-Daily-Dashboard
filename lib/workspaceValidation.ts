import { validSubscriptionBudget } from "@/lib/subscriptionPlanning";
import { validFocusRecord } from "@/lib/focusWorkspace";
import { isDocumentList } from "@/lib/assetDocuments";
import { coreCollections } from "@/lib/collectionChanges";
import { validTaskTemplates } from "@/lib/taskTemplates";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import { isTaskRecurrence } from "@/lib/taskRecurrence";
import { isTaskActivity } from "@/lib/taskActivity";
type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string";
const nonempty = (v: unknown) => text(v) && !!v.trim();
const optional = (v: unknown, check: (v: unknown) => boolean) => v === undefined || check(v);
const strings = (v: unknown) => Array.isArray(v) && v.every(text);
const timestamp = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const date = (v: unknown) => text(v) && (v === "" || isSubscriptionDate(v) || (/^\d{4}-\d{2}-\d{2}T/.test(v) && isSubscriptionDate(String(v).slice(0, 10)) && Number.isFinite(Date.parse(v))));
const list = (v: unknown, check: (v: unknown) => boolean) => Array.isArray(v) && v.length <= 20000 && v.every(check) && new Set(v.map(x => x.id)).size === v.length;
const safeUrl = (v: unknown) => { try { return text(v) && ["https:", "http:"].includes(new URL(v).protocol); } catch { return false; } };
const optionalBool = (v: unknown) => optional(v, x => typeof x === "boolean");
export function validTask(v: unknown, template = false): boolean {
  if (!record(v)) return false;
  return (template || (nonempty(v.id) && typeof v.checked === "boolean" && timestamp(v.createdAt))) && nonempty(v.title) && text(v.meta) && typeof v.priority === "boolean"
    && optionalBool(v.inbox) && !(v.inbox === true && (v.dueDate || v.recurrence))
    && optional(v.tags, x => Array.isArray(x) && x.length <= 20 && new Set(x).size === x.length && x.every(tag => text(tag) && new RegExp("^[\\p{L}\\p{M}\\p{N}_-]{1,40}$", "u").test(tag)))
    && optional(v.projectName, x => text(x) && !!x.trim() && x.length <= 100)
    && optional(v.milestone, x => text(x) && !!x.trim() && x.length <= 100) && !(v.milestone && !v.projectName)
    && optional(v.documents, isDocumentList)
    && optional(v.category, x => ["work", "personal", "meeting", "urgent", "project", "travel"].includes(String(x)))
    && optional(v.dueDate, date) && optionalBool(v.skipped) && isTaskActivity(v.activity)
    && optional(v.dependsOn, strings) && optional(v.link, x => x === "" || safeUrl(x))
    && optional(v.recurrence, x => isTaskRecurrence(x) && text(v.dueDate) && isSubscriptionDate(v.dueDate.slice(0,10)))
    && optional(v.recurrenceTemplate, x => validTask(x, true))
    && optional(v.subtasks, x => Array.isArray(x) && x.every(y => record(y) && nonempty(y.id) && text(y.title) && typeof y.completed === "boolean" && optional(y.link, safeUrl)));
}
export function validNote(v: unknown): boolean {
  return record(v) && nonempty(v.id) && text(v.title) && text(v.content) && timestamp(v.updatedAt) && optional(v.createdAt, timestamp)
    && optionalBool(v.pinned) && optionalBool(v.isEncrypted) && optional(v.color, text) && optional(v.priority, text)
    && optional(v.images, strings) && optional(v.imageUrl, text)
    && optional(v.checklist, x => Array.isArray(x) && x.every(y => record(y) && nonempty(y.id) && text(y.text) && typeof y.done === "boolean"));
}
export function validHabit(v: unknown): boolean {
  return record(v) && nonempty(v.id) && nonempty(v.name) && timestamp(v.streak) && Array.isArray(v.completedDates) && v.completedDates.every(isSubscriptionDate)
    && optional(v.counterStartDate, isSubscriptionDate) && optional(v.trackingMode, x => x === "daily" || x === "days-since") && optional(v.icon, text);
}
export function validEvent(v: unknown): boolean {
  const time = (x: unknown) => record(x) && optional(x.date, isSubscriptionDate) && optional(x.dateTime, date);
  return record(v) && nonempty(v.id) && optional(v.summary, text) && optional(v.description, text) && optional(v.start, time) && optional(v.end, time) && optional(v.attendees, strings) && optional(v.source, text) && optionalBool(v.isCustom);
}
export function validLink(v: unknown): boolean {
  return record(v) && nonempty(v.id) && nonempty(v.title) && text(v.subtitle) && safeUrl(v.url) && text(v.iconName) && typeof v.available === "boolean" && optionalBool(v.read) && optionalBool(v.pinned) && optional(v.readingText, text);
}
export function workspaceValidationError(value: unknown): string | null {
  if (!record(value)) return "Workspace update must be an object.";
  const checks: Record<string, (v: unknown) => boolean> = {
    collectionChanges: v => record(v) && Object.entries(v).every(([key,change]) => coreCollections.includes(key as typeof coreCollections[number]) && record(change) && strings(change.replaceIds) && strings(change.deletedIds) && optional(change.orderIds, strings)),
    subscriptionBudgets: v => list(v, validSubscriptionBudget),
    focusRecords: v => list(v, validFocusRecord),
    taskTemplates: validTaskTemplates,
    tasks: v => list(v, validTask), notes: v => list(v, validNote), habits: v => list(v, validHabit), customEvents: v => list(v, validEvent), quickLinks: v => list(v, validLink),
    focusMinutes: v => typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 1440,
    soundEnabled: v => typeof v === "boolean", activeNav: text,
    replaceTaskIds: strings, deletedTaskIds: strings, replaceHabitIds: strings, deletedHabitIds: strings,
    replaceAllHabits: v => typeof v === "boolean",
  };
  for (const [field, check] of Object.entries(checks)) if (value[field] !== undefined && !check(value[field])) return `Invalid ${field}. No changes were saved.`;
  return null;
}
