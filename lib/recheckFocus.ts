import { googleFetch } from "@/lib/google";
import { calendarPages } from "@/lib/calendarPages";
import { getUserWorkspace, getOutlookAccount, saveOutlookAccount } from "@/lib/db";
import { fetchOutlookEvents, refreshOutlookToken, getOutlookRedirectUri } from "@/lib/outlook";
import { hasFocusConflict } from "@/lib/focusAvailability";
import type { DashboardEvent } from "@/types/dashboard";
export async function recheckFocus(email: string, start: Date, end: Date, timeZone: string) {
  const calendars = await calendarPages("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader", googleFetch, "google") as {id:string}[];
  const ids = new Set(["primary",...calendars.map(calendar=>calendar.id)]);
  const events: DashboardEvent[] = [];
  // Sequential requests avoid launching an unbounded burst for accounts with many calendars.
  for (const id of Array.from(ids)) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?singleEvents=true&timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=2500`;
    events.push(...await calendarPages(url,googleFetch,"google") as DashboardEvent[]);
  }
  const workspace = await getUserWorkspace(email);
  events.push(...workspace?.customEvents || []);
  const outlook = await getOutlookAccount(email, true);
  if (outlook) {
    if (outlook.expiresAt <= Date.now() + 60000) {
      if (!outlook.refreshToken) throw new Error("Reconnect Outlook before checking focus availability.");
      const refreshed = await refreshOutlookToken(outlook.refreshToken, getOutlookRedirectUri());
      outlook.accessToken=refreshed.access_token;outlook.refreshToken=refreshed.refresh_token || outlook.refreshToken;outlook.expiresAt=Date.now()+refreshed.expires_in*1000;
      await saveOutlookAccount(email,outlook);
    }
    events.push(...await fetchOutlookEvents(outlook.accessToken));
  }
  return !hasFocusConflict(events,start,end,timeZone);
}
