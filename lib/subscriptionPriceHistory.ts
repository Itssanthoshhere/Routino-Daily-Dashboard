import type { Subscription } from "@/types/subscriptions";

/** A rate change is metadata, never a new expense or historical payment. */
export function saveSubscriptionPrice(previous: Subscription | undefined, next: Subscription, today: string): Subscription {
  const rate = (item: Subscription, date: string) => ({ date, amount: item.amount, currency: item.currency, cycle: item.cycle });
  if (!previous) return { ...next, priceHistory: [rate(next, today)] };
  const history = previous.priceHistory || [];
  if (previous.amount === next.amount && previous.currency === next.currency && previous.cycle === next.cycle) return { ...next, priceHistory: history };
  // The old rate was confirmed today, not at an assumed signup date.
  return { ...next, priceHistory: [...(history.length ? history : [rate(previous, today)]), rate(next, today)].slice(-500) };
}
