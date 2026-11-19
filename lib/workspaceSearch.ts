import {emptySearchFilters,matchesSearchFilters,searchDate,type SearchFilters} from "@/lib/searchFilters";
import type { KeepNote } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelRecharge } from "@/types/airtel";

export type WorkspaceSearchResult = { id: string; title: string; detail: string; kind: "note" | "subscription" | "recharge" };
export function searchWorkspace(query: string, notes: KeepNote[], subscriptions: Subscription[], recharges: AirtelRecharge[], filters: SearchFilters = emptySearchFilters): WorkspaceSearchResult[] {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length && filters === emptySearchFilters) return [];
  const rows: (WorkspaceSearchResult & {date?:string;tags?:string[];status?:string;attachment?:boolean})[] = [
    // Never index encrypted text, including ciphertext or locked note titles.
    ...notes.filter(note => !note.isEncrypted).map(note => ({ id: note.id, title: note.title || "Untitled note", detail: [note.content, ...(note.checklist || []).map(item => item.text)].join(" "), date:searchDate(note.updatedAt),status:note.pinned?"pinned":"unpinned",attachment:!!(note.imageUrl||note.images?.length),kind: "note" as const })),
    ...subscriptions.map(item => ({ id: item.id, title: item.name, detail: `${item.planName || ""} ${item.amount} ${item.currency} ${item.category} ${item.notes} ${item.renewalDate} ${item.status}`, date:item.renewalDate,tags:[item.category],status:item.status,attachment:!!item.documents?.length,kind: "subscription" as const })),
    ...recharges.map(item => ({ id: item.id, title: `Airtel · ${item.amount} · ${item.date}`, detail: `${item.notes} ${item.method || ""} ${item.kind} ${item.status || "success"}`, date:item.date,tags:[item.kind],status:item.status||"success",kind: "recharge" as const })),
  ];
  return rows.filter(row => matchesSearchFilters(row,filters) && tokens.every(token => `${row.title} ${row.detail}`.toLocaleLowerCase().includes(token)));
}
