'use client';
import { useRef, useState } from 'react';
import type { UnifiedReminder } from '@/lib/unifiedReminders';
export function RemindersInbox({ items, today, onOpen }: {
    items: UnifiedReminder[];
    today: string;
    onOpen: (item: UnifiedReminder) => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [kind, setKind] = useState('all');
    const [period, setPeriod] = useState('all');
    const visible = items.filter(i => (kind === 'all' || i.kind === kind) && (period === 'all' || (period === 'overdue' ? i.date < today : i.date === today)));
    return <><button type="button" className="btn-theme rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold" onClick={() => dialog.current?.showModal()}>Reminders · {items.length}</button><dialog ref={dialog} aria-labelledby="reminders-title" className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-2xl border border-line bg-white p-5 text-ink backdrop:bg-black/40"><div className="flex items-center justify-between gap-3"><h3 id="reminders-title" className="font-semibold">Reminders inbox</h3><button type="button" className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => dialog.current?.close()}>Close</button></div><p className="mt-2 text-xs text-muted">Due dates and overdue items through the next 30 days. Expiry notices include the last 30 days. Review the source record before taking action.</p><div className="my-3 flex flex-wrap gap-2"><label className="text-xs">Type<select aria-label="Reminder type" className="ml-2 rounded-lg border border-line p-2" value={kind} onChange={e => setKind(e.target.value)}>{['all', 'task', 'renewal', 'expiry', 'warranty', 'maintenance'].map(k => <option key={k}>{k}</option>)}</select></label><label className="text-xs">When<select aria-label="Reminder period" className="ml-2 rounded-lg border border-line p-2" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">All upcoming & overdue</option><option value="overdue">Overdue</option><option value="today">Today</option></select></label></div><ul className="divide-y divide-line">{visible.map(item => <li key={item.id}><button type="button" className="btn-theme reminder-row my-1 w-full rounded-xl p-3 text-left text-xs" onClick={() => { dialog.current?.close(); onOpen(item); }}><strong>{item.title}</strong><p className="mt-1 text-forest">{item.date} · {item.kind}{item.date < today ? ' · overdue' : item.date === today ? ' · today' : ''}</p><p className="mt-1 line-clamp-2 text-muted">{item.detail}</p></button></li>)}</ul>{!visible.length && <p className="py-4 text-sm text-muted">No reminders match these filters.</p>}</dialog></>;
}
