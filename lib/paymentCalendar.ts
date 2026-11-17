import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";
export type PaymentCalendarEvent = { id: string; date: string; name: string; kind: 'renewal' | 'expiry'; amount: number | null; currency: string; projected: boolean };
export function monthOffset(month: string, offset: number): string {
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset); return date.toISOString().slice(0, 7);
}
export function paymentCalendarEvents(subscriptions: Subscription[], airtel: AirtelData, month: string): PaymentCalendarEvent[] {
  if (!isSubscriptionDate(`${month}-01`)) return [];
  const events: PaymentCalendarEvent[] = [];
  if (airtel.plan?.endDate.startsWith(month)) events.push({ id: `airtel:${airtel.plan.id}`, date: airtel.plan.endDate, name: 'Airtel recharge and linked benefits expire', kind: 'expiry', amount: null, currency: 'INR', projected: false });
  for (const service of subscriptions) {
    if (service.status !== 'active') continue;
    if (service.cycle === 'bundled') {
      if (airtel.plan && service.bundleRechargeId === airtel.plan.id) continue;
      if (service.bundleEndDate?.startsWith(month)) events.push({ id: service.id, date: service.bundleEndDate, name: `${service.name} access ends`, kind: 'expiry', amount: null, currency: service.currency, projected: false });
      continue;
    }
    if (!['monthly','quarterly','yearly'].includes(service.cycle) || !isSubscriptionDate(service.renewalDate)) continue;
    const anchor = new Date(`${service.renewalDate}T12:00:00Z`);
    const [year, targetMonth] = month.split('-').map(Number);
    const offset = (year - anchor.getUTCFullYear()) * 12 + targetMonth - 1 - anchor.getUTCMonth();
    const step = service.cycle === 'yearly' ? 12 : service.cycle === 'quarterly' ? 3 : 1;
    if (offset < 0 || offset % step) continue;
    const date = new Date(`${month}-01T12:00:00Z`); const last = new Date(date); last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0);
    date.setUTCDate(Math.min(anchor.getUTCDate(), last.getUTCDate()));
    events.push({ id: service.id, date: date.toISOString().slice(0, 10), name: service.name, kind: 'renewal', amount: service.amount, currency: service.currency, projected: offset > 0 });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}
