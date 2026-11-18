import type { SavedDocument } from "@/types/documents";
export type Subscription = {
  sharedExpenses?: import("@/lib/subscriptionPlanning").SharedExpense[];
  renewalDecisionDate?: string;
  documents?: SavedDocument[];
  reminderDaysBefore?: number;
  statusHistory?: { date: string; status: Subscription["status"] }[];
  lastUsedDate?: string;
  trialEndDate?: string;
  cancellationDeadline?: string;
  renewalTaskDate?: string;
  renewalCalendarDate?: string;
  cancellationChecklist?: { id: string; label: string; done: boolean }[];
  renewalDecision?: "keep" | "cancel" | "later";
  priceHistory?: { date: string; amount: number; currency: Subscription["currency"]; cycle: Subscription["cycle"] }[];
  bundleRechargeId?: string;
  confirmedDetailsVersion?: number;
  planName?: string;
  bundlePlan?: { provider: string; amount: number; startDate: string; endDate: string; validityDays: number };
  billingHistory?: { date: string; periodStart: string; periodEnd: string; amount: number; subtotal: number; tax: number; source: string }[];
  bundleEndDate?: string;
  bundledSince?: string;
  startDate?: string;
  lastPaidDate?: string;
  payments?: { date: string; amount: number; journal: string; rowId: string; notes: string }[];
  id: string;
  name: string;
  amount: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  cycle: "monthly" | "yearly" | "quarterly" | "unknown" | "one-time" | "bundled";
  renewalDate: string;
  status: "active" | "paused" | "cancelled" | "unconfirmed" | "completed";
  category: string;
  notes: string;
};

export function monthlyCost(subscription: Subscription): number {
  return (subscription.cycle === "unknown" || subscription.cycle === "one-time" || subscription.cycle === "bundled") ? 0 : subscription.amount / (subscription.cycle === "yearly" ? 12 : subscription.cycle === "quarterly" ? 3 : 1);
}

// Advance from the recorded billing day, clamping month-end and leap days.
export function nextRenewal(subscription: Subscription, today: string): string {
  if (!subscription.renewalDate || subscription.cycle === "unknown" || subscription.cycle === "one-time" || subscription.cycle === "bundled") return subscription.renewalDate;
  const [year, month, day] = subscription.renewalDate.split("-").map(Number);
  const [todayYear, todayMonth] = today.split("-").map(Number);
  let offset = subscription.cycle === "yearly" ? Math.max(1, todayYear - year) * 12 : Math.max(1, (todayYear - year) * 12 + todayMonth - month);
  if (subscription.cycle === "quarterly") offset = Math.ceil(offset / 3) * 3;
  const dateAt = (months: number) => {
    const date = new Date(year, month - 1 + months, 1, 12);
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  while (dateAt(offset) <= today) offset += subscription.cycle === "yearly" ? 12 : subscription.cycle === "quarterly" ? 3 : 1;
  return dateAt(offset);
}
