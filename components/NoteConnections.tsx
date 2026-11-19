"use client";
import { createContext, useCallback, useContext, useState } from "react";
import type { KeepNote } from "@/types/dashboard";
import { relatedNotes, type NoteReference } from "@/lib/noteOrganization";
const Context = createContext<{
    notes: KeepNote[];
    entities: NoteReference[];
    target: NoteReference | null;
    consume: (reference:NoteReference)=>void;
    open: (ref: NoteReference) => void;
    openNote: (id: string) => void;
}>({ notes: [], entities: [], target: null, consume:()=>{}, open: () => { }, openNote: () => { } });
export function NoteConnectionsProvider({ notes, entities, onOpenReference, onOpenNote, children }: {
    notes: KeepNote[];
    entities: NoteReference[];
    onOpenReference: (ref: NoteReference) => void;
    onOpenNote: (id: string) => void;
    children: React.ReactNode;
}) { const [target, setTarget] = useState<NoteReference | null>(null); const consume=useCallback((reference:NoteReference)=>setTarget(current=>current?.kind===reference.kind&&current.id===reference.id?null:current),[]); return <Context.Provider value={{ notes, entities, target, consume, open: ref => { setTarget({ ...ref }); onOpenReference(ref); }, openNote: onOpenNote }}>{children}</Context.Provider>; }
export const useNoteConnections = () => useContext(Context);
export function NoteReferenceEditor({ value, onChange }: {
    value: NoteReference[];
    onChange: (value: NoteReference[]) => void;
}) {
    const { entities } = useNoteConnections();
    const [search, setSearch] = useState('');
    const [choice, setChoice] = useState('');
    const candidates = entities.filter(entity => entity.id.length <= 2000 && `${entity.kind} ${entity.label}`.toLowerCase().includes(search.toLowerCase()) && !value.some(r => r.kind === entity.kind && r.id === entity.id));
    return <details className="my-3 rounded-xl border border-line bg-white/60 p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Linked records · {value.length}</summary>
    <p className="mt-2 text-muted">Connect this note to tasks, meetings, subscriptions, or gadgets. Linked records show a link back to this note.</p>
    <ul className="mt-2 space-y-1">{value.map(ref => <li key={JSON.stringify([ref.kind, ref.id])} className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate">{ref.kind} · {ref.label}</span>
        <button type="button" className="btn-theme rounded-lg border border-line px-2 py-1" onClick={() => onChange(value.filter(r => r.kind !== ref.kind || r.id !== ref.id))}>Unlink</button>
        </li>)}</ul>
    <input aria-label="Search records to link" placeholder="Search workspace records…" className="mt-2 w-full rounded-lg border border-line p-2" value={search} onChange={e => { setSearch(e.target.value); setChoice(''); }}/>
    <div className="mt-2 flex gap-2">
    <select aria-label="Record to link" className="min-w-0 flex-1 rounded-lg border border-line p-2" value={choice} onChange={e => setChoice(e.target.value)}>
    <option value="">Choose a record</option>{candidates.slice(0, 100).map(ref => <option key={JSON.stringify([ref.kind, ref.id])} value={JSON.stringify([ref.kind, ref.id])}>{ref.kind} · {ref.label}</option>)}</select>
    <button type="button" disabled={!choice || value.length >= 30} className="btn-theme rounded-lg border border-line px-3 py-2 disabled:opacity-40" onClick={() => { const found = candidates.find(r => JSON.stringify([r.kind, r.id]) === choice); if (found)
        onChange([...value, { ...found, label: found.label.slice(0, 500) }]); setChoice(''); }}>Link</button>
    </div>
    </details>;
}
export function NoteReferenceChips({ references }: {
    references?: NoteReference[];
}) {
    const { open, entities } = useNoteConnections();
    if (!references?.length)
        return null;
    return <div className="mt-2 flex flex-wrap gap-1">{references.map(ref => <button type="button" key={JSON.stringify([ref.kind, ref.id])} disabled={!entities.some(e => e.kind === ref.kind && e.id === ref.id)} className="btn-theme max-w-full truncate rounded-lg border border-line px-2 py-1 text-[10px] disabled:opacity-50" onClick={event => { event.stopPropagation(); open(ref); }}>{ref.kind} · {ref.label}</button>)}</div>;
}
export function RelatedNotes({ kind, id, legacyMeetingId }: {
    kind: NoteReference['kind'];
    id: string;
    legacyMeetingId?: string;
}) {
    const { notes, openNote } = useNoteConnections();
    const linked = relatedNotes(notes, kind, id, legacyMeetingId);
    if (!linked.length)
        return null;
    return <details className="my-3 rounded-xl border border-line p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Linked notes · {linked.length}</summary>
    <ul className="mt-2 space-y-1">{linked.map(note => <li key={note.id}>
        <button type="button" className="btn-theme rounded-lg border border-line px-2 py-1 text-left" onClick={() => openNote(note.id)}>{note.title || 'Untitled note'}</button>
        </li>)}</ul>
    </details>;
}
