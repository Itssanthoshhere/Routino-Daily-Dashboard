import type { Task } from '@/types/dashboard';
import type { Subscription } from '@/types/subscriptions';
import type { AirtelData } from '@/types/airtel';
import type { AssetRecords } from '@/types/assets';
import { expiryReminders } from '@/lib/expiryReminders';
import { taskDueDay } from '@/lib/taskDates';
export type UnifiedReminder = {
    id: string;
    title: string;
    date: string;
    occurrence?:string;
    kind: 'task' | 'renewal' | 'expiry' | 'warranty' | 'maintenance';
    target: 'tasks' | 'subscriptions' | 'airtel' | 'purchases';
    taskId?: string;
    subscriptionId?:string; expiryId?:string; planId?:string; assetKey?:string; maintenanceId?:string;
    detail: string;
};
export function unifiedReminders(tasks: Task[], subscriptions: Subscription[], airtel: AirtelData, assets: AssetRecords, today: string, daysAhead = 30): UnifiedReminder[] {
    const cutoff = new Date(`${today}T12:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() + daysAhead);
    const end = cutoff.toISOString().slice(0, 10);
    const rows: UnifiedReminder[] = tasks.filter(t => !t.checked && !t.skipped && taskDueDay(t.dueDate) && taskDueDay(t.dueDate)! <= end).map(t => ({ id: `task:${t.id}`, title: t.title, date: taskDueDay(t.dueDate)!, occurrence:t.dueDate, kind: 'task', target: 'tasks', taskId: t.id, detail: t.meta }));
    rows.push(...expiryReminders(subscriptions, airtel, today, daysAhead).map(e => ({ id: `renewal:${e.id}`, title: e.name, date: e.date, kind: e.id.startsWith('document:') ? 'expiry' as const : 'renewal' as const, target: e.tab, detail: e.detail,subscriptionId:e.subscriptionId,expiryId:e.expiryId,planId:e.planId })));
    const add = (row: UnifiedReminder) => { if (/^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.date <= end)
        rows.push(row); };
    for (const [key, asset] of Object.entries(assets)) {
        let name = 'Saved asset';
        try {
            const fields = JSON.parse(key);
            if (Array.isArray(fields) && typeof fields[0] === 'string')
                name = fields[0];
        }
        catch { }
        if (asset.warrantyEnd)
            add({ id: `warranty:${key}`, title: `${name} · Warranty`, date: asset.warrantyEnd, assetKey:key,kind: 'warranty', target: 'purchases', detail: 'Review coverage and receipts before expiry.' });
        for (const m of asset.maintenance || [])
            if (!m.completed)
                add({ id: `maintenance:${key}:${m.id}`, title: `${name} · ${m.title}`, date: m.nextDue, assetKey:key,maintenanceId:m.id,kind: 'maintenance', target: 'purchases', detail: m.notes });
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
