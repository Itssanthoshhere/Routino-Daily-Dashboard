"use client";
import { createContext, useContext, useState } from "react";
import { focusPreferences, validFocusRecord, type FocusRecord, type FocusPreferences } from "@/lib/focusWorkspace";
const Context = createContext<{
    records: FocusRecord[];
    save: (records: FocusRecord[]) => void;
}>({ records: [], save: () => { } });
export function FocusWorkspaceProvider({ records, onChange, children }: {
    records: FocusRecord[];
    onChange: (records: FocusRecord[]) => void;
    children: React.ReactNode;
}) { return <Context.Provider value={{ records, save: onChange }}>{children}</Context.Provider>; }
export const useFocusWorkspace = () => useContext(Context);
export function FocusPreferencesEditor() {
    const { records, save } = useFocusWorkspace();
    const [draft, setDraft] = useState<FocusPreferences>(() => focusPreferences(records));
    const [message, setMessage] = useState("");
    return <details className="mt-3 rounded-xl border border-line bg-white p-3">
    <summary className="cursor-pointer text-xs font-semibold">Focus hours, breaks & travel buffers</summary>
    <p className="mt-2 text-xs text-muted">Local time. Buffers protect both sides of timed events; breaks protect recovery time after events and between suggestions. All-day events remain blocked.</p>
    <div className="mt-3 flex flex-wrap gap-1">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <button type="button" key={day} aria-pressed={draft.days.includes(index)} className={`rounded-lg border px-2 py-1 text-xs ${draft.days.includes(index) ? "border-forest bg-forest text-white" : "border-line"}`} onClick={() => setDraft({ ...draft, days: draft.days.includes(index) ? draft.days.filter(d => d !== index) : [...draft.days, index] })}>{day}</button>)}</div>
    <div className="mt-3 grid grid-cols-2 gap-3">{([['start', 'Start'], ['end', 'Finish']] as const).map(([key, label]) => <label key={key} className="text-xs">{label}<input type="time" value={draft[key]} className="mt-1 w-full rounded-lg border border-line p-2" onInput={e => setDraft({ ...draft, [key]: e.currentTarget.value })}/>
        </label>)}{([['breakMinutes', 'Break (minutes)'], ['bufferMinutes', 'Travel / preparation (minutes)']] as const).map(([key, label]) => <label key={key} className="text-xs">{label}<input type="number" min="0" max="120" value={Number.isFinite(draft[key]) ? draft[key] : ""} className="mt-1 w-full rounded-lg border border-line p-2" onChange={e => setDraft({ ...draft, [key]: e.target.valueAsNumber })}/>
        </label>)}</div>
    <button type="button" className="btn-theme mt-3 text-xs" onClick={() => { if (!validFocusRecord(draft)) {
        setMessage("Choose at least one day, finish after start, and 0–120 minutes for breaks and buffers.");
        return;
    } try {
        save([...records.filter(r => r.kind !== "preferences"), draft]);
        setMessage("Preferences saved; slots updated.");
    }
    catch {
        setMessage("Could not save preferences. Please retry.");
    } }}>Save focus preferences</button>
    <p role="status" className="mt-2 text-xs text-muted">{message}</p>
    </details>;
}
export function FocusHistory() {
    const { records } = useFocusWorkspace();
    const sessions = records.filter(r => r.kind === "session").sort((a, b) => a.kind === "session" && b.kind === "session" ? b.completedAt.localeCompare(a.completedAt) : 0);
    return <details className="mt-4 rounded-xl border border-line p-3">
    <summary className="cursor-pointer text-xs font-semibold">Completed focus sessions · {sessions.length}</summary>{sessions.length ? <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-line">{sessions.map(s => s.kind === "session" && <li key={s.id} className="py-2 text-xs">
            <strong>{s.taskTitle}</strong>
            <p className="text-muted">{s.minutes} min · {new Date(s.completedAt).toLocaleString()}{s.taskId ? " · Linked task" : " · Unassigned focus"}</p>
            </li>)}</ul> : <p className="mt-2 text-xs text-muted">Finished focus timers appear here. Breaks and stopped timers are excluded.</p>}</details>;
}
