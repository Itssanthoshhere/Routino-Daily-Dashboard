import type { Subscription } from "@/types/subscriptions";

export function subscriptionExpenses(subscriptions: Subscription[]) {
  const rows: { id: string; name: string; currency: string; amount: number; count: number; kind: "subscription" | "recharge" }[] = [];
  const recharges = new Set<string>();
  for (const subscription of subscriptions) {
    // Invoice history describes the same journal payments, so use only one source.
    const payments = subscription.payments?.length ? subscription.payments : subscription.billingHistory?.length ? subscription.billingHistory : subscription.lastPaidDate ? [{ amount: subscription.amount }] : [];
    if (payments.length) rows.push({ id: subscription.id, name: subscription.name, currency: subscription.currency, amount: payments.reduce((sum, payment) => sum + payment.amount, 0), count: payments.length, kind: "subscription" });
    const bundle = subscription.bundlePlan;
    if (bundle) {
      const key = `${bundle.provider}:${bundle.startDate}:${bundle.endDate}:${bundle.amount}:${subscription.currency}`;
      if (!recharges.has(key)) {
        recharges.add(key);
        rows.push({ id: `recharge:${key}`, name: `${bundle.provider} recharge · ${bundle.startDate}–${bundle.endDate}`, currency: subscription.currency, amount: bundle.amount, count: 1, kind: "recharge" });
      }
    }
  }
  const totals = Array.from(new Set(rows.map(row => row.currency))).map(currency => ({ currency, amount: rows.filter(row => row.currency === currency).reduce((sum, row) => sum + row.amount, 0) }));
  return { rows, totals };
}
