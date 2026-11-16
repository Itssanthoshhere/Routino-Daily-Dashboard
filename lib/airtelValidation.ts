import type { AirtelData } from "@/types/airtel";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function isAirtelData(value: unknown): value is AirtelData {
  if (!record(value) || !Array.isArray(value.records) || !Array.isArray(value.deletedIds) || !value.deletedIds.every(id => typeof id === "string")) return false;
  if (!value.records.every(row => record(row) && typeof row.id === "string" && row.id.length > 0 && isSubscriptionDate(row.date) && amount(row.amount) && ["plan", "topup"].includes(String(row.kind)) && typeof row.notes === "string" && typeof row.source === "string" && typeof row.paidByOther === "boolean" && (row.status === undefined || ["success", "failed"].includes(String(row.status))) && (row.method === undefined || typeof row.method === "string") && (row.time === undefined || typeof row.time === "string") && (row.journalDate === undefined || isSubscriptionDate(row.journalDate)))) return false;
  if (new Set(value.records.map(row => row.id)).size !== value.records.length) return false;
  const plan = value.plan;
  if (record(plan)) {
    if (plan.dataPerDayGB !== undefined && !amount(plan.dataPerDayGB)) return false;
    if (plan.smsPerDay !== undefined && !amount(plan.smsPerDay)) return false;
    if (plan.calls !== undefined && typeof plan.calls !== "string") return false;
    if (plan.unlimited5G !== undefined && typeof plan.unlimited5G !== "boolean") return false;
    if (plan.benefits !== undefined && (!Array.isArray(plan.benefits) || !plan.benefits.every(benefit => record(benefit) && typeof benefit.name === "string" && typeof benefit.planName === "string" && typeof benefit.using === "boolean" && (benefit.verifiedOn === undefined || isSubscriptionDate(benefit.verifiedOn))))) return false;
  }
  return plan === null || (record(plan) && typeof plan.id === "string" && !!plan.id && typeof plan.provider === "string" && amount(plan.amount) && isSubscriptionDate(plan.paymentDate) && isSubscriptionDate(plan.startDate) && isSubscriptionDate(plan.endDate) && plan.endDate >= plan.startDate && Number.isInteger(plan.validityDays) && Number(plan.validityDays) > 0 && Number(plan.validityDays) === Math.round((Date.parse(plan.endDate) - Date.parse(plan.startDate)) / 86400000) + 1);
}
