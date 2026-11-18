import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";
import { calendarColorRule } from "@/lib/calendarColors";

export const dynamic = "force-dynamic";
type GoogleEvent = { id: string; summary?: string; colorId?: string; start?: { dateTime?: string } };
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST() {
  if (!(await auth())?.user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  try {
    const past = new Date(); past.setDate(past.getDate() - 14); past.setHours(0, 0, 0, 0);
    const future = new Date(); future.setDate(future.getDate() + 60); future.setHours(23, 59, 59, 999);
    let updatedCount = 0, skippedCount = 0, failedCount = 0, needsReauth = false;
    const calendars = new Set<string>();
    let calendarPage: string | undefined;
    do {
      const response = await googleFetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer${calendarPage ? `&pageToken=${encodeURIComponent(calendarPage)}` : ""}`);
      if (!response.ok) {
        failedCount++;
        needsReauth = response.status === 401 || response.status === 403;
        if (!calendars.size) calendars.add("primary");
        break;
      }
      const result = await response.json();
      for (const calendar of result.items || []) if (["owner", "writer"].includes(calendar.accessRole) && calendar.id) calendars.add(calendar.id);
      calendarPage = result.nextPageToken;
    } while (calendarPage);
    const seen = new Set<string>();
    for (const calendar of Array.from(calendars)) {
      let pageToken: string | undefined;
      do {
        const query = new URLSearchParams({ timeMin: past.toISOString(), timeMax: future.toISOString(), singleEvents: "true", maxResults: "500" });
        if (pageToken) query.set("pageToken", pageToken);
        const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar)}/events`;
        const response = await googleFetch(`${base}?${query}`);
        if (!response.ok) { failedCount++; if ([401,403].includes(response.status)) needsReauth = true; break; }
        const result = await response.json();
        for (const event of (result.items || []) as GoogleEvent[]) {
          const identity = `${calendar}:${event.id}`;
          if (!event.id || !event.start?.dateTime || seen.has(identity)) continue;
          seen.add(identity);
          const rule = calendarColorRule(event.summary || "");
          if (!rule) continue;
          if (event.colorId === rule.colorId) { skippedCount++; continue; }
          let saved = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            try {
              const patch = await googleFetch(`${base}/${encodeURIComponent(event.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ colorId: rule.colorId }) });
              if (patch.ok) { saved = true; break; }
              if ([401,403].includes(patch.status)) {
                const error = await patch.json().catch(() => ({}));
                const limited = error.error?.errors?.some((item: { reason?: string }) => ["rateLimitExceeded", "userRateLimitExceeded"].includes(item.reason || ""));
                if (!limited) { needsReauth = true; break; }
              } else if (patch.status !== 429 && patch.status < 500) break;
            } catch { /* Retry transient network failures. */ }
            if (attempt < 4) await pause(2000 * (attempt + 1));
          }
          if (saved) updatedCount++; else failedCount++;
          await pause(300);
        }
        pageToken = result.nextPageToken;
      } while (pageToken);
    }
    const complete = failedCount === 0 && !needsReauth;
    return NextResponse.json({ success: complete, updatedCount, skippedCount, failedCount, needsReauth,
      message: complete ? (updatedCount ? `Auto-colored ${updatedCount} event${updatedCount === 1 ? "" : "s"}.` : "Matching events in the scanned window already have the correct colors.") : `Updated ${updatedCount} events; some calendars or events could not be updated. Retry or reconnect Google Calendar.`,
      error: complete ? undefined : `Updated ${updatedCount} events; ${failedCount} reads or updates failed. Retry or reconnect Google Calendar.`,
    });
  } catch { return NextResponse.json({ success: false, error: "Could not complete calendar coloring. Retry when connected." }, { status: 503 }); }
}
