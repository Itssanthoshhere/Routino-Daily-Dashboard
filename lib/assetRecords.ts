import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import type { AssetRecords } from "@/types/assets";
import { isDocumentList } from "@/lib/assetDocuments";
export function isAssetRecords(value: unknown): value is AssetRecords {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).length <= 1000 && Object.entries(value).every(([key, record]) => {
    if (key.length > 2000 || !record || typeof record !== "object" || Array.isArray(record)) return false;
    const item = record as Record<string, unknown>;
    if (!validAssetCare(item)) return false;
    if (item.services !== undefined && (!Array.isArray(item.services) || item.services.length > 200 || new Set(item.services.map(service => service?.id)).size !== item.services.length || !item.services.every(service => service && typeof service.id === "string" && service.id.length > 0 && isSubscriptionDate(service.date) && typeof service.title === "string" && service.title.trim().length > 0 && service.title.length <= 180 && typeof service.provider === "string" && service.provider.length <= 180 && typeof service.cost === "number" && Number.isFinite(service.cost) && service.cost >= 0 && typeof service.notes === "string" && service.notes.length <= 5000 && (service.documents === undefined || isDocumentList(service.documents))))) return false;
    return [item.warrantyEnd, item.warrantyReminderDate].every(date => date === undefined || date === "" || isSubscriptionDate(date));
  });
}
export function warrantyReminderDate(end: string, today: string): string {
  const date = new Date(`${end}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().slice(0, 10) < today ? today : date.toISOString().slice(0, 10);
}

export function validAssetCare(item: Record<string, unknown>): boolean {
 const text=(v:unknown,max:number)=>typeof v==="string"&&v.length<=max;
 const rows=(v:unknown,check:(row:any)=>boolean)=>v===undefined||(Array.isArray(v)&&v.length<=200&&new Set(v.map(r=>r?.id)).size===v.length&&v.every(r=>r&&text(r.id,180)&&!!r.id&&check(r)));
 return rows(item.claims,claim=>text(claim.title,180)&&!!claim.title.trim()&&["draft","submitted","in-service","resolved","rejected"].includes(claim.status)&&text(claim.contact,500)&&text(claim.reference,180)&&text(claim.notes,5000)&&Array.isArray(claim.checklist)&&claim.checklist.length<=50&&new Set(claim.checklist.map((s:any)=>s?.id)).size===claim.checklist.length&&claim.checklist.every((s:any)=>s&&text(s.id,180)&&!!s.id&&text(s.label,180)&&!!s.label.trim()&&typeof s.done==="boolean")&&(claim.documents===undefined||isDocumentList(claim.documents))) && rows(item.maintenance,entry=>text(entry.title,180)&&!!entry.title.trim()&&isSubscriptionDate(entry.nextDue)&&(entry.repeatDays===undefined||(Number.isInteger(entry.repeatDays)&&entry.repeatDays>=1&&entry.repeatDays<=3650))&&text(entry.notes,5000)&&(entry.completed===undefined||typeof entry.completed==="boolean")&&Array.isArray(entry.completedDates)&&entry.completedDates.length<=2000&&new Set(entry.completedDates).size===entry.completedDates.length&&entry.completedDates.every(isSubscriptionDate));
}
export function completeMaintenance(entry: import("@/types/assets").AssetMaintenance, today: string): import("@/types/assets").AssetMaintenance {
 if ((!entry.repeatDays && entry.completed) || !isSubscriptionDate(today) || entry.completedDates.includes(today)) return entry;
 const date = new Date(`${today}T12:00:00Z`); if (entry.repeatDays) date.setUTCDate(date.getUTCDate()+entry.repeatDays);
 return {...entry,...(!entry.repeatDays?{completed:true}:{}),completedDates:[...entry.completedDates,today],...(entry.repeatDays?{nextDue:date.toISOString().slice(0,10)}:{})};
}
