import type { Subscription } from "@/types/subscriptions";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string";
const amount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function isSubscriptionDate(value: unknown): value is string {
  if (!text(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
const optionalDate = (value: unknown) => value === undefined || value === "" || isSubscriptionDate(value);

export function isSubscription(value: unknown): value is Subscription {
  if (!record(value)) return false;
  if (!text(value.id) || !value.id.trim() || !text(value.name) || !value.name.trim() || !amount(value.amount)) return false;
  if (!["INR", "USD", "EUR", "GBP"].includes(String(value.currency)) || !["monthly", "yearly", "quarterly", "unknown", "one-time", "bundled"].includes(String(value.cycle)) || !["active", "paused", "cancelled", "unconfirmed", "completed"].includes(String(value.status))) return false;
  if (!text(value.category) || !text(value.notes) || !text(value.renewalDate) || !optionalDate(value.renewalDate) || !optionalDate(value.startDate) || !optionalDate(value.lastPaidDate) || !optionalDate(value.bundleEndDate)) return false;
  if (value.bundledSince !== undefined && !(isSubscriptionDate(value.bundledSince) || (text(value.bundledSince) && /^\d{4}-(0[1-9]|1[0-2])$/.test(value.bundledSince)))) return false;
  if (value.bundleRechargeId !== undefined && !text(value.bundleRechargeId)) return false;
  if (value.planName !== undefined && !text(value.planName)) return false;
  if (value.confirmedDetailsVersion !== undefined && (!Number.isInteger(value.confirmedDetailsVersion) || Number(value.confirmedDetailsVersion) < 0)) return false;
  if (value.bundlePlan !== undefined) {
    const bundle = value.bundlePlan;
    if (!record(bundle) || !text(bundle.provider) || !amount(bundle.amount) || !isSubscriptionDate(bundle.startDate) || !isSubscriptionDate(bundle.endDate) || bundle.endDate < bundle.startDate || !Number.isInteger(bundle.validityDays) || Number(bundle.validityDays) <= 0) return false;
  }
  if (value.payments !== undefined && (!Array.isArray(value.payments) || !value.payments.every(payment => record(payment) && isSubscriptionDate(payment.date) && amount(payment.amount) && text(payment.journal) && text(payment.rowId) && text(payment.notes)))) return false;
  if (value.billingHistory !== undefined && (!Array.isArray(value.billingHistory) || !value.billingHistory.every(invoice => record(invoice) && isSubscriptionDate(invoice.date) && isSubscriptionDate(invoice.periodStart) && isSubscriptionDate(invoice.periodEnd) && invoice.periodEnd >= invoice.periodStart && amount(invoice.amount) && amount(invoice.subtotal) && amount(invoice.tax) && text(invoice.source)))) return false;
  return true;
}

export function isSubscriptionList(value: unknown): value is Subscription[] {
  return Array.isArray(value) && value.every(isSubscription) && new Set(value.map(subscription => subscription.id)).size === value.length;
}
