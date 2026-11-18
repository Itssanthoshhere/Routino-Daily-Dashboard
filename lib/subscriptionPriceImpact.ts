import type { Subscription } from "@/types/subscriptions";
type Rate = NonNullable<Subscription["priceHistory"]>[number];
export function priceImpact(previous: Rate | undefined, current: Rate) {
  const cycles = { monthly: 12, quarterly: 4, yearly: 1 };
  if (!previous || previous.currency !== current.currency || !(previous.cycle in cycles) || !(current.cycle in cycles)) return null;
  const before = previous.amount * cycles[previous.cycle as keyof typeof cycles];
  const after = current.amount * cycles[current.cycle as keyof typeof cycles];
  return { before, after, annualChange: after - before, percent: before > 0 ? (after - before) / before * 100 : null };
}
