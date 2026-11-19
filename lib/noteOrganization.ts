import type { KeepNote, QuickLink, DashboardEvent } from "@/types/dashboard";
import { isEncryptedPayload } from "@/lib/crypto";
export type NoteReference = {
    kind: "task" | "meeting" | "subscription" | "asset";
    id: string;
    label: string;
};
export function validNoteReferences(value: unknown): boolean { return Array.isArray(value) && value.length <= 30 && new Set(value.map(r => JSON.stringify([r?.kind, r?.id]))).size === value.length && value.every(r => r && ['task', 'meeting', 'subscription', 'asset'].includes(r.kind) && typeof r.id === 'string' && !!r.id && r.id.length <= 2000 && typeof r.label === 'string' && !!r.label.trim() && r.label.length <= 500); }
export function meetingReferenceId(event: DashboardEvent) { return JSON.stringify([event.source || 'google', event.calendarId || 'primary', event.id]); }
export function relatedNotes(notes: KeepNote[], kind: NoteReference['kind'], id: string, legacyMeetingId?: string) { return notes.filter(note => !note.isEncrypted && !isEncryptedPayload(note.content) && (note.references?.some(r => r.kind === kind && r.id === id) || (kind === 'meeting' && !!legacyMeetingId && note.meetingEventId === legacyMeetingId))); }
export function noteTemplate(kind: 'meeting' | 'journal' | 'project', today: string, createId: () => string): Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'> {
    const layouts = { meeting: { title: 'Meeting notes', content: '## Agenda\n\n## Notes\n\n## Decisions\n\n## Action items\n', steps: ['Confirm decisions', 'Follow up on action items'] }, journal: { title: `Journal · ${today}`, content: '## Today\n\n## What went well\n\n## What I learned\n\n## Tomorrow\n', steps: [] }, project: { title: 'Project notes', content: '## Goal\n\n## Scope\n\n## Milestones\n\n## Decisions\n\n## Next steps\n', steps: ['Define first milestone', 'Choose next action'] } };
    const layout = layouts[kind];
    return { title: layout.title, content: layout.content, color: kind === 'meeting' ? 'blue' : kind === 'journal' ? 'yellow' : 'green', checklist: layout.steps.map(text => ({ id: createId(), text, done: false })) };
}
export function readingStatus(link: QuickLink, legacyRead = false): 'unread' | 'reading' | 'read' { return link.readingStatus || (link.read ?? legacyRead ? 'read' : 'unread'); }
export function readingTags(value: string | string[]): string[] { const tags = Array.isArray(value) ? value : value.split(/[,\s]+/); return Array.from(new Set(tags.map(t => t.replace(/^#/, '').trim().toLowerCase()).filter(t => new RegExp('^[\\p{L}\\p{M}\\p{N}_-]{1,40}$', 'u').test(t)))).slice(0, 20); }
export function isReadingLink(link: QuickLink) { return link.available && (link.readLater || !!link.readingStatus || !!link.readingTags?.length || link.readingFavourite || /github|docs|developer|tech|read|repo/i.test(`${link.title} ${link.subtitle} ${link.url}`)); }
