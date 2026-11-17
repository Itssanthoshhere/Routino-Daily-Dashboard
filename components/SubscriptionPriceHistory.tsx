import type { Subscription } from "@/types/subscriptions";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export function SubscriptionPriceHistory({ subscription }: { subscription: Subscription }) {
  const history = subscription.priceHistory || [];
  if (!history.length) return null;
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer">Price history · {history.length} recorded rates</summary>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
        {history.map((entry, index) => {
          const previous = history[index - 1];
          const comparable = previous && entry.currency === previous.currency && entry.cycle === previous.cycle;
          const difference = comparable ? entry.amount - previous.amount : 0;
          return (
            <li key={`${entry.date}-${index}`}>
              {entry.date} · {entry.cycle === "bundled" ? `Included with recharge · reference ${money(entry.amount, entry.currency)}` : `${money(entry.amount, entry.currency)} / ${entry.cycle}`}
              {comparable && ` · ${difference > 0 ? "+" : ""}${money(difference, entry.currency)} change`}
            </li>
          );
        })}
      </ul>
      <p className="mt-2">Recorded rates, not payment receipts. Earlier price changes are not inferred.</p>
    </details>
  );
}
