import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
export type SpendingPayment = { id: string; name: string; date: string; amount: number; currency: string };
/** Only recorded payments; bundles are represented by their actual recharge payment. */
export function recordedPayments(subscriptions: Subscription[], airtel: AirtelData): SpendingPayment[] {
  const rows: SpendingPayment[] = [];
  const seen = new Set<string>();
  for (const service of subscriptions) {
    const payments = service.payments?.length ? service.payments.map(payment => ({ ...payment, key: `journal:${payment.journal}:${payment.rowId}:${payment.amount}` })) : service.billingHistory?.length ? service.billingHistory.map(payment => ({ ...payment, key: payment.date })) : service.lastPaidDate && service.cycle !== "bundled" ? [{ date: service.lastPaidDate, amount: service.amount, key: service.lastPaidDate }] : [];
    for (const payment of payments) {
      const id = payment.key.startsWith("journal:") ? `${payment.key}:${service.currency}` : `${service.id}:${payment.key}`;
      if (seen.has(id)) continue;
      seen.add(id); rows.push({ id, name: service.name, date: payment.date, amount: payment.amount, currency: service.currency });
    }
  }
  for (const recharge of airtel.records) {
    if (recharge.status === "failed" || recharge.paidByOther) continue;
    const id = `airtel:${recharge.id}`;
    if (seen.has(id)) continue;
    seen.add(id); rows.push({ id, name: recharge.kind === "plan" ? "Airtel main plan" : "Airtel data top-up", date: recharge.date, amount: recharge.amount, currency: "INR" });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
export function monthlySpending(payments: SpendingPayment[], month: string) {
  const rows = payments.filter(payment => payment.date.slice(0, 7) === month);
  const grouped = new Map<string, { name: string; currency: string; amount: number; count: number }>();
  for (const row of rows) {
    const key = `${row.name}:${row.currency}`; const group = grouped.get(key) || { name: row.name, currency: row.currency, amount: 0, count: 0 };
    group.amount += row.amount; group.count++; grouped.set(key, group);
  }
  const totals = Array.from(new Set(rows.map(row => row.currency))).map(currency => ({ currency, amount: rows.filter(row => row.currency === currency).reduce((sum, row) => sum + row.amount, 0) }));
  return { rows, services: Array.from(grouped.values()).sort((a, b) => a.currency.localeCompare(b.currency) || b.amount - a.amount), totals };
}

export type PaymentFilters = { query?: string; from?: string; to?: string; minimum?: string; maximum?: string; currency?: string };
export function filterPayments(payments: SpendingPayment[], filters: PaymentFilters): SpendingPayment[] {
  const minimum = filters.minimum?.trim() ? Number(filters.minimum) : undefined;
  const maximum = filters.maximum?.trim() ? Number(filters.maximum) : undefined;
  if ((minimum !== undefined && (!Number.isFinite(minimum) || minimum < 0)) || (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0)) || (minimum !== undefined && maximum !== undefined && minimum > maximum) || (filters.from && filters.to && filters.from > filters.to)) return [];
  const query = filters.query?.trim().toLowerCase() || "";
  return payments.filter(row => (!query || `${row.name} ${row.date} ${row.amount}`.toLowerCase().includes(query)) && (!filters.from || row.date >= filters.from) && (!filters.to || row.date <= filters.to) && (minimum === undefined || row.amount >= minimum) && (maximum === undefined || row.amount <= maximum) && (!filters.currency || row.currency === filters.currency));
}
export function compareMonthlySpending(payments: SpendingPayment[], month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { previousMonth: "", currencies: [] };
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() - 1);
  const previousMonth = date.toISOString().slice(0, 7);
  const current = monthlySpending(payments, month).totals, previous = monthlySpending(payments, previousMonth).totals;
  return { previousMonth, currencies: Array.from(new Set([...current, ...previous].map(item => item.currency))).map(currency => {
    const amount = current.find(item => item.currency === currency)?.amount || 0;
    const baseline = previous.find(item => item.currency === currency)?.amount || 0;
    const difference = Math.round((amount - baseline) * 100) / 100;
    return { currency, amount, previous: baseline, difference, percent: baseline > 0 ? Math.round(difference / baseline * 1000) / 10 : null };
  }) };
}
