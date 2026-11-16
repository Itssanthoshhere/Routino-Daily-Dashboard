import type { AirtelData, AirtelPlan, AirtelRecharge } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { isAirtelData } from "@/lib/airtelValidation";
export function renewAirtel(airtel: AirtelData, subscriptions: Subscription[], plan: AirtelPlan, linkedIds: string[], today: string): { airtel: AirtelData; subscriptions: Subscription[] } {
  if (plan.paymentDate > today) throw new Error("Payment date cannot be in the future.");
  if (plan.startDate > today || plan.endDate < today) throw new Error("Record a plan once its validity has started and it is currently active.");
  if (airtel.plan?.id === plan.id || airtel.records.some(row => row.id === plan.id)) throw new Error("Use a new payment for a renewal. Edit an existing plan to correct its details.");
  const history = [...(airtel.planHistory || [])];
  if (airtel.plan && !history.some(item => item.id === airtel.plan!.id)) history.push(airtel.plan);
  const record: AirtelRecharge = { id: plan.id, date: plan.paymentDate, amount: plan.amount, kind: "plan", source: "Confirmed recharge renewal", status: "success", paidByOther: false, notes: `Validity ${plan.startDate}–${plan.endDate}` };
  if (airtel.records.some(row => row.date === record.date && row.amount === record.amount && row.status !== "failed")) throw new Error("A payment with this date and amount already exists. Edit or link the existing record instead.");
  const next = { ...airtel, plan, planHistory: history, records: [...airtel.records, record] };
  if (!isAirtelData(next)) throw new Error("Check the plan dates, amount and validity.");
  return { airtel: next, subscriptions: subscriptions.map(service => {
    if (service.cycle !== "bundled" || !linkedIds.includes(service.id)) return service;
    return { ...service, status: "active", planName: plan.benefits?.find(benefit => benefit.name === service.name)?.planName || service.planName, bundleRechargeId: plan.id, bundlePlan: plan, bundledSince: plan.startDate, bundleEndDate: plan.endDate };
  }) };
}
