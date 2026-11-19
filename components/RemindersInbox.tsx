'use client';
import { useEffect, useRef, useState } from 'react';
import { useWorkspacePreferences } from '@/components/WorkspacePreferences';
import { isReminderSnoozed, reminderSnoozes, snoozeReminder, snoozeUntil, reminderOccurrence } from '@/lib/reminderSnooze';
import type { UnifiedReminder } from '@/lib/unifiedReminders';
export function RemindersInbox({ items, today, onOpen }: {
    items: UnifiedReminder[];
    today: string;
    onOpen: (item: UnifiedReminder) => void;
}) {
    const { records, save } = useWorkspacePreferences();
    const snoozes = reminderSnoozes(records);
    const [clock, setClock] = useState(Date.now());
    const [showSnoozed, setShowSnoozed] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(timer); }, []);
    const isSnoozed = (item: UnifiedReminder) => isReminderSnoozed(snoozes, item.id, item.occurrence || item.date, clock);
    const update = (item: UnifiedReminder, choice: string) => { try {
        const key = reminderOccurrence(item.id, item.occurrence || item.date);
        const entries = choice === 'resume' ? snoozes.filter(e => e.key !== key) : snoozeReminder(snoozes, item.id, item.occurrence || item.date, snoozeUntil(choice));
        save([...records.filter(p => p.id !== 'reminder-snoozes'), { id: 'reminder-snoozes', entries }]);
        setClock(Date.now());
        setMessage(choice === 'resume' ? 'Reminder resumed.' : 'Reminder snoozed. The source deadline is unchanged.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Could not save snooze.');
    } };
    const dialog = useRef<HTMLDialogElement>(null);
    const [kind, setKind] = useState('all');
    const [period, setPeriod] = useState('all');
    const visible = items.filter(i => (showSnoozed || !isSnoozed(i)) && (kind === 'all' || i.kind === kind) && (period === 'all' || (period === 'overdue' ? i.date < today : i.date === today)));
    return <><button type="button" className="btn-theme rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold" onClick={() => dialog.current?.showModal()}>Reminders · {items.filter(i => !isSnoozed(i)).length}</button><dialog ref={dialog} aria-labelledby="reminders-title" className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-2xl border border-line bg-white p-5 text-ink backdrop:bg-black/40"><div className="flex items-center justify-between gap-3"><h3 id="reminders-title" className="font-semibold">Reminders inbox</h3><button type="button" className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => dialog.current?.close()}>Close</button></div><p className="mt-2 text-xs text-muted">Due dates and overdue items through the next 30 days. Expiry notices include the last 30 days. Review the source record before taking action.</p><div className="my-3 flex flex-wrap gap-2"><label className="text-xs">Type<select aria-label="Reminder type" className="ml-2 rounded-lg border border-line p-2" value={kind} onChange={e => setKind(e.target.value)}>{['all', 'task', 'renewal', 'expiry', 'warranty', 'maintenance'].map(k => <option key={k}>{k}</option>)}</select></label><label className="text-xs">When<select aria-label="Reminder period" className="ml-2 rounded-lg border border-line p-2" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">All upcoming & overdue</option><option value="overdue">Overdue</option><option value="today">Today</option></select></label></div><label className="mb-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={showSnoozed} onChange={e => setShowSnoozed(e.target.checked)}/>Include snoozed reminders</label><p role="status" className="mb-2 text-xs text-muted">{message}</p><ul className="divide-y divide-line">{visible.map(item => <li key={item.id}><button type="button" className="btn-theme reminder-row my-1 w-full rounded-xl p-3 text-left text-xs" onClick={() => { dialog.current?.close(); onOpen(item); }}><strong>{item.title}</strong><p className="mt-1 text-forest">{item.date} · {item.kind}{item.date < today ? ' · overdue' : item.date === today ? ' · today' : ''}</p><p className="mt-1 line-clamp-2 text-muted">{item.detail}</p></button><div className="mb-3 flex flex-wrap items-center gap-2 px-3 text-xs">{isSnoozed(item) ? <><span className="text-muted">Snoozed until {new Date(snoozes.find(e => e.key === reminderOccurrence(item.id, item.occurrence || item.date))!.until).toLocaleString()}</span><button type="button" className="btn-theme rounded-lg border border-line px-2 py-1" onClick={() => update(item, "resume")}>Resume reminder</button></> : <><span className="text-muted">Remind me</span>{[["hour", "In 1 hour"], ["tomorrow", "Tomorrow 9 AM"], ["week", "In 1 week"]].map(([choice, label]) => <button type="button" className="btn-theme rounded-lg border border-line px-2 py-1" key={choice} onClick={() => update(item, choice)}>{label}</button>)}</>}</div></li>)}</ul>{!visible.length && <p className="py-4 text-sm text-muted">No reminders match these filters.</p>}</dialog></>;
}
