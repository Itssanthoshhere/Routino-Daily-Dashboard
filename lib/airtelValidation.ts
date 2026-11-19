import type { AirtelData } from "@/types/airtel";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function isAirtelData(value: unknown): value is AirtelData {
  if (!record(value) || !Array.isArray(value.records) || !Array.isArray(value.deletedIds) || !value.deletedIds.every(id => typeof id === "string")) return false;
  if(value.familyMembers!==undefined){
    const members=value.familyMembers;
    if(!Array.isArray(members)||members.length>20||new Set(members.map(m=>m?.id)).size!==members.length||new Set(members.map(m=>m?.phone)).size!==members.length||!members.every(m=>record(m)&&typeof m.id==='string'&&!!m.id&&m.id.length<=180&&typeof m.name==='string'&&!!m.name.trim()&&m.name.length<=120&&['mother','sister','father','brother','other'].includes(String(m.relationship))&&typeof m.phone==='string'&&/^[6-9]\d{9}$/.test(m.phone)&&(m.archived===undefined||typeof m.archived==='boolean')&&record(m.recharge)&&m.recharge.familyMembers===undefined&&isAirtelData(m.recharge)&&Array.isArray(m.observations)&&m.observations.length<=100&&new Set(m.observations.map(o=>o?.id)).size===m.observations.length&&m.observations.every(o=>record(o)&&typeof o.id==='string'&&!!o.id&&o.id.length<=180&&isSubscriptionDate(o.recordedOn)&&(o.capturedOn===undefined||isSubscriptionDate(o.capturedOn))&&(o.expiresOn===undefined||isSubscriptionDate(o.expiresOn))&&['screenshot','airtel-website','manual'].includes(String(o.source))&&amount(o.planAmount)&&typeof o.planLabel==='string'&&o.planLabel.length<=180&&(o.reportedDaysLeft===undefined||Number.isInteger(o.reportedDaysLeft)&&Number(o.reportedDaysLeft)>=0&&Number(o.reportedDaysLeft)<=5000)&&(o.remainingDataGB===undefined||amount(o.remainingDataGB))&&(o.dailyDataGB===undefined||amount(o.dailyDataGB))&&typeof o.notes==='string'&&o.notes.length<=2000)))return false;
  }
  if (!value.records.every(row => record(row) && typeof row.id === "string" && row.id.length > 0 && isSubscriptionDate(row.date) && amount(row.amount) && ["plan", "topup"].includes(String(row.kind)) && typeof row.notes === "string" && typeof row.source === "string" && typeof row.paidByOther === "boolean" && (row.status === undefined || ["success", "failed"].includes(String(row.status))) && (row.method === undefined || typeof row.method === "string") && (row.time === undefined || typeof row.time === "string") && (row.journalDate === undefined || isSubscriptionDate(row.journalDate)))) return false;
  if (new Set(value.records.map(row => row.id)).size !== value.records.length) return false;
  if (value.planHistory !== undefined && (!Array.isArray(value.planHistory) || !value.planHistory.every(plan => record(plan) && isAirtelData({ records: [], deletedIds: [], plan })) || new Set(value.planHistory.map(plan => plan.id)).size !== value.planHistory.length)) return false;
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
