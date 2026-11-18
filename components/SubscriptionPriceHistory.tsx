import type { Subscription } from "@/types/subscriptions";
import { priceImpact } from "@/lib/subscriptionPriceImpact";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export function SubscriptionPriceHistory({ subscription }: { subscription: Subscription }) {
  const history = [...(subscription.priceHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  if (!history.length) return null;
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer">Price history · {history.length} recorded rates</summary>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
        {history.map((entry, index) => {
          const previous = history[index - 1];
          const comparable = previous && entry.currency === previous.currency && entry.cycle === previous.cycle;
          const difference = comparable ? entry.amount - previous.amount : 0;
          const impact = priceImpact(previous, entry);
          return (
            <li key={`${entry.date}-${index}`}>
              {entry.date} · {entry.cycle === "bundled" ? `Included with recharge · reference ${money(entry.amount, entry.currency)}` : `${money(entry.amount, entry.currency)} / ${entry.cycle}`}
              {comparable && entry.cycle !== "bundled" && ` · ${difference > 0 ? "+" : ""}${money(difference, entry.currency)} change`}
              {impact && <p className="mt-1">Annual equivalent: {money(impact.before, entry.currency)} → {money(impact.after, entry.currency)} · {impact.annualChange >= 0 ? "+" : ""}{money(impact.annualChange, entry.currency)} / year{impact.percent !== null ? ` (${impact.percent >= 0 ? "+" : ""}${impact.percent.toFixed(1)}%)` : " (previous rate was free)"}</p>}
            </li>
          );
        })}
      </ul>
      <p className="mt-2">Recorded rates, not payment receipts. Earlier price changes are not inferred.</p>
    </details>
  );
}
