import { createHash } from "node:crypto";
import { googleFetch } from "@/lib/google";
import { matchColorRule, type ColorSettings, type ColorChange } from "@/lib/calendarColorSettings";
export const COLOR_BATCH_LIMIT = 25;
export type ColorRange = { timeMin: string; timeMax: string };
export function validColorRange(range: unknown): range is ColorRange {
  if (!range || typeof range !== "object") return false;
  const value = range as ColorRange;
  const start = typeof value.timeMin === "string" ? Date.parse(value.timeMin) : NaN;
  const end = typeof value.timeMax === "string" ? Date.parse(value.timeMax) : NaN;
  return Number.isFinite(start) && Number.isFinite(end) && end > start && end - start <= 731 * 86400000;
}
export function defaultColorRange(): ColorRange {
  const start = new Date(); start.setDate(start.getDate()-14); start.setHours(0,0,0,0);
  const end = new Date(); end.setDate(end.getDate()+60); end.setHours(23,59,59,999);
  return { timeMin:start.toISOString(), timeMax:end.toISOString() };
}
export async function listColorCalendars() {
  const calendars: { id: string; name: string }[] = [];
  let calendarPage: string | undefined;
  do {
    const response = await googleFetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer${calendarPage ? `&pageToken=${encodeURIComponent(calendarPage)}` : ""}`);
    if (!response.ok) throw new Error("Could not read writable calendars. Check your Google Calendar connection and edit permission.");
    const result = await response.json();
    for (const calendar of result.items || []) if (["owner","writer"].includes(calendar.accessRole) && calendar.id && !calendars.some(item => item.id === calendar.id)) calendars.push({ id:calendar.id, name:calendar.summary || calendar.id });
    calendarPage = result.nextPageToken;
  } while(calendarPage);
  return calendars;
}
export async function scanCalendarColors(settings: ColorSettings, range: ColorRange) {
  const calendars = await listColorCalendars();
  const changes: ColorChange[] = []; const seen = new Set<string>(); let scanned = 0;
  for (const calendar of calendars) {
    if (settings.excludedCalendars.includes(calendar.id)) continue;
    let page: string | undefined;
    do {
      const params = new URLSearchParams({ ...range, singleEvents:"true", maxResults:"500" });
      if(page) params.set("pageToken",page);
      const response = await googleFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`);
      if(!response.ok) throw new Error("A calendar could not be read. No colors were changed; reconnect or retry preview.");
      const result = await response.json();
      for(const event of result.items || []) {
        if (++scanned > 15000) throw new Error("This range contains too many events. Choose a shorter date range.");
        const key = `${calendar.id}:${event.id}`;
        if(!event.id || seen.has(key) || !event.start?.dateTime || event.status === "cancelled" || settings.excludedEvents.includes(key)) continue;
        seen.add(key);
        const rule = matchColorRule(event.summary || "",settings);
        if(!rule || event.colorId === rule.colorId) continue;
        if(!event.etag) throw new Error("An event has no version marker. Preview cannot safely apply changes.");
        changes.push({ key,calendarId:calendar.id,eventId:event.id,title:event.summary || "Untitled event",start:event.start.dateTime,before:event.colorId || "",after:rule.colorId,etag:event.etag,status:"pending" });
      }
      page=result.nextPageToken;
    } while(page);
  }
  changes.sort((a,b)=>a.start.localeCompare(b.start)||a.key.localeCompare(b.key));
  const batch=changes.slice(0,COLOR_BATCH_LIMIT);
  const hash=createHash("sha256").update(JSON.stringify({settings,range,changes:batch})).digest("hex");
  return { changes:batch,totalChanges:changes.length,calendars,scanned,hash,range };
}
export async function patchCalendarColor(change: ColorChange, undo = false): Promise<{ etag?: string; status: "applied" | "undone" | "failed" | "conflict" }> {
  const expected = undo ? change.afterEtag : change.etag;
  if(!expected) return {status:"conflict"};
  for(let attempt=0;attempt<5;attempt++) {
    try {
      const response=await googleFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(change.calendarId)}/events/${encodeURIComponent(change.eventId)}`,{method:"PATCH",headers:{"Content-Type":"application/json","If-Match":expected},body:JSON.stringify({colorId:undo?(change.before||null):change.after})});
      if(response.ok) { const result=await response.json(); return {status:undo?"undone":"applied",etag:result.etag}; }
      if(response.status===412 || response.status===404) return {status:"conflict"};
      const error=await response.json().catch(()=>({}));
      const limited=response.status===429 || response.status>=500 || (response.status===403 && error.error?.errors?.some((item:{reason?:string})=>["rateLimitExceeded","userRateLimitExceeded"].includes(item.reason||"")));
      if(!limited) return {status:"failed"};
    } catch { /* Retry transient errors; the version precondition prevents duplicate writes. */ }
    if(attempt<4) await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)));
  }
  return {status:"failed"};
}
