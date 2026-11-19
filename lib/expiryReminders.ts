import type { AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
export type ExpiryReminder = { id: string; name: string; date: string; daysLeft: number; tab: "airtel" | "subscriptions"; detail: string; subscriptionId?:string; expiryId?:string; planId?:string };
export function expiryReminders(subscriptions: Subscription[], airtel: AirtelData, today: string, daysAhead = 7): ExpiryReminder[] {
  const results: ExpiryReminder[] = [];
  const add = (reminder: Omit<ExpiryReminder, "daysLeft">) => {
    const daysLeft = Math.round((Date.parse(reminder.date) - Date.parse(today)) / 86400000);
    if (Number.isFinite(daysLeft) && daysLeft <= daysAhead && daysLeft >= -30) results.push({ ...reminder, daysLeft });
  };
  if (airtel.plan) add({ id: `airtel:${airtel.plan.id}`, name: "Airtel recharge", planId:airtel.plan.id, date: airtel.plan.endDate, tab: "airtel", detail: "Review your recharge and its included services." });
  for (const subscription of subscriptions) {
    for (const entry of subscription.expiryRecords || []) add({id:`document:${subscription.id}:${entry.id}`,subscriptionId:subscription.id,expiryId:entry.id,name:`${entry.name} · ${entry.kind}`,date:entry.expiryDate,tab:"subscriptions",detail:`${subscription.name} · ${entry.provider || "Review expiry with the provider."}`});
    if (subscription.status !== "active" || ["one-time", "unknown"].includes(subscription.cycle)) continue;
    if (subscription.cycle === "bundled" && airtel.plan && subscription.bundleRechargeId === airtel.plan.id) continue;
    const date = subscription.cycle === "bundled" ? subscription.bundleEndDate : subscription.renewalDate;
    if (date) add({ id: subscription.id, name: subscription.name, subscriptionId:subscription.id, date, tab: "subscriptions", detail: subscription.cycle === "bundled" ? "Included access ends; no paid renewal is assumed." : "Upcoming recorded renewal date." });
  }
  return results.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}
