import type { Subscription } from '@/types/subscriptions';
import type { AirtelData } from '@/types/airtel';
import { monthOffset, paymentCalendarEvents } from '@/lib/paymentCalendar';
export function spendingForecast(subscriptions: Subscription[], airtel: AirtelData, today: string, months: 3 | 6 | 12) {
    const endMonth = monthOffset(today.slice(0, 7), months);
    const date = new Date(`${endMonth}-01T12:00:00Z`);
    const last = new Date(date);
    last.setUTCMonth(last.getUTCMonth() + 1);
    last.setUTCDate(0);
    date.setUTCDate(Math.min(Number(today.slice(8)), last.getUTCDate()));
    const endExclusive = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() - 1);
    const through = date.toISOString().slice(0, 10);
    const monthRows = Array.from({ length: months + 1 }, (_, i) => { const month = monthOffset(today.slice(0, 7), i); const events = paymentCalendarEvents(subscriptions, airtel, month).filter(e => e.date >= today && e.date < endExclusive && e.kind === 'renewal' && e.amount !== null); return { month, events }; }).filter(row => row.month <= through.slice(0, 7));
    const currencies = Array.from(new Set(monthRows.flatMap(row => row.events.map(e => e.currency))));
    const totals = currencies.map(currency => ({ currency, amount: Math.round(monthRows.flatMap(r => r.events).filter(e => e.currency === currency).reduce((sum, e) => sum + (e.amount || 0), 0) * 100) / 100 }));
    const excluded = subscriptions.filter(s => s.status !== 'active' || !['monthly', 'quarterly', 'yearly'].includes(s.cycle) || !s.renewalDate).map(s => ({ id: s.id, name: s.name, reason: s.status !== 'active' ? `Status: ${s.status}` : s.cycle === 'bundled' ? 'Included access; no separate charge' : !s.renewalDate ? 'No renewal date' : `Billing: ${s.cycle}` }));
    return { monthRows, totals, excluded, through, endExclusive };
}
