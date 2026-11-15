import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ connected: false }, { status: 401 });
  try {
    const now = new Date();
    // Allow viewing previous days (past 60 days) and upcoming days (next 60 days)
    const pastWindow = new Date(now);
    pastWindow.setDate(pastWindow.getDate() - 60);
    pastWindow.setHours(0, 0, 0, 0);

    const futureWindow = new Date(now);
    futureWindow.setDate(futureWindow.getDate() + 60);
    futureWindow.setHours(23, 59, 59, 999);

    const timeMin = encodeURIComponent(pastWindow.toISOString());
    const timeMax = encodeURIComponent(futureWindow.toISOString());
    const [calendarListRes, mail, mail48hRes, driveRes] = await Promise.all([
      googleFetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader"),
      googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+-category:promotions+-category:social&maxResults=8"),
      googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+newer_than:2d+-category:promotions+-category:social&maxResults=1"),
      googleFetch("https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)&spaces=drive").catch(() => null),
    ]);

    if (!mail.ok && !calendarListRes.ok) {
      return NextResponse.json({ connected: true, error: "Google returned an API error. Check that Calendar and Gmail APIs are enabled and reconnect if needed." }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let calendarEvents: any[] = [];

    // Build unique list of calendars to query. Always include "primary" calendar!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calendarMap = new Map<string, { id: string; summary?: string; backgroundColor?: string }>();
    calendarMap.set("primary", { id: "primary", summary: "Primary Calendar" });

    if (calendarListRes.ok) {
      const calListData = await calendarListRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allCals: any[] = Array.isArray(calListData.items) ? calListData.items : [];
      allCals.forEach((cal: any) => {
        if (cal && cal.id) {
          calendarMap.set(cal.id, {
            id: cal.id,
            summary: cal.summary,
            backgroundColor: cal.backgroundColor,
          });
        }
      });
    }

    const targetCals = Array.from(calendarMap.values()).slice(0, 20);
    const calendarResults: Array<{
      id: string;
      summary: string;
      color?: string;
      status: "connected" | "checked" | "failed";
      error?: string;
      eventCount?: number;
    }> = [];

    if (targetCals.length > 0) {
      const eventsPerCal = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetCals.map(async (cal: any) => {
          try {
            const res = await googleFetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=2500`
            );
            if (!res.ok) {
              calendarResults.push({
                id: cal.id,
                summary: cal.summary || (cal.id === "primary" ? "Primary Calendar" : cal.id),
                color: cal.backgroundColor || "#4a6741",
                status: "failed",
                error: `HTTP ${res.status}`,
              });
              return [];
            }
            const data = await res.json();
            const items = Array.isArray(data.items) ? data.items : [];
            calendarResults.push({
              id: cal.id,
              summary: cal.summary || (cal.id === "primary" ? "Primary Calendar" : cal.id),
              color: cal.backgroundColor || "#4a6741",
              status: "checked",
              eventCount: items.length,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return items.map((item: any) => ({
              ...item,
              calendarId: cal.id,
              calendarSummary: cal.summary,
              calendarColor: cal.backgroundColor,
            }));
          } catch (err: any) {
            calendarResults.push({
              id: cal.id,
              summary: cal.summary || (cal.id === "primary" ? "Primary Calendar" : cal.id),
              color: cal.backgroundColor || "#4a6741",
              status: "failed",
              error: err?.message || "Network error",
            });
            return [];
          }
        })
      );
      calendarEvents = eventsPerCal.flat();
    }

    // Fallback to primary if calendarList returned no events or failed
    if (calendarEvents.length === 0) {
      const primaryRes = await googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=2500`
      );
      if (primaryRes.ok) {
        const primaryData = await primaryRes.json();
        calendarEvents = Array.isArray(primaryData.items) ? primaryData.items : [];
        if (!calendarResults.some(c => c.id === "primary")) {
          calendarResults.push({
            id: "primary",
            summary: "Primary Calendar",
            status: "checked",
            eventCount: calendarEvents.length,
          });
        }
      }
    }

    // Deduplicate by event id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueMap = new Map<string, any>();
    calendarEvents.forEach((item) => {
      if (item && item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalEvents = Array.from(uniqueMap.values()).sort((a: any, b: any) => {
      const aTime = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
      const bTime = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
      return aTime - bTime;
    });

    const mailData = mail.ok ? await mail.json() : { messages: [], resultSizeEstimate: 0 };
    let unread48hEstimate: number | null = null;
    let unread48hStatus: "ok" | "failed" | "not_queried" = "not_queried";

    if (mail48hRes) {
      if (mail48hRes.ok) {
        try {
          const d48 = await mail48hRes.json();
          if (typeof d48.resultSizeEstimate === "number") {
            unread48hEstimate = d48.resultSizeEstimate;
            unread48hStatus = "ok";
          } else {
            unread48hStatus = "failed";
          }
        } catch {
          unread48hStatus = "failed";
        }
      } else {
        unread48hStatus = "failed";
      }
    }

    let driveStatus: "checked" | "needs_consent" | "permission_denied" | "failed" = "failed";
    if (driveRes) {
      if (driveRes.ok) {
        driveStatus = "checked";
      } else if (driveRes.status === 401 || driveRes.status === 403) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errData: any = await driveRes.json();
          const errors: any[] = errData?.error?.errors || [];
          const errorMsg = String(errData?.error?.message || "").toLowerCase();
          const reasons = errors.map((e: any) => String(e?.reason || "").toLowerCase());

          const isScopeOrAuthIssue =
            reasons.includes("autherror") ||
            reasons.includes("insufficientpermissions") ||
            reasons.includes("insufficient_scope") ||
            errorMsg.includes("insufficient authentication scopes") ||
            errorMsg.includes("insufficientpermissions") ||
            errorMsg.includes("invalid credentials") ||
            errorMsg.includes("missing authorization scope") ||
            driveRes.status === 401;

          const isApiDisabled =
            reasons.includes("accessnotconfigured") ||
            reasons.includes("servicedisabled") ||
            errorMsg.includes("has not been used in project") ||
            errorMsg.includes("is not enabled");

          if (isScopeOrAuthIssue && !isApiDisabled) {
            driveStatus = "needs_consent";
          } else {
            driveStatus = "permission_denied";
          }
        } catch {
          driveStatus = driveRes.status === 401 ? "needs_consent" : "permission_denied";
        }
      } else {
        driveStatus = "failed";
      }
    }

    const messages = await Promise.all((mailData.messages ?? []).slice(0, 8).map(async ({ id }: { id: string }) => {
      const response = await googleFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
      if (!response.ok) return null;
      const message = await response.json();
      const headers: Array<{ name: string; value: string }> = message.payload?.headers ?? [];
      const header = (name: string) => headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? "";
      return { id: message.id, threadId: message.threadId, from: header("From"), subject: header("Subject"), date: header("Date"), snippet: message.snippet ?? "" };
    }));

    return NextResponse.json({
      connected: true,
      user: {
        name: session.user?.name ?? null,
        email: session.user?.email ?? null,
        image: session.user?.image ?? null,
      },
      events: finalEvents,
      unread: messages.filter(Boolean),
      unreadEstimate: typeof mailData.resultSizeEstimate === "number" ? mailData.resultSizeEstimate : messages.filter(Boolean).length,
      unread48hEstimate,
      unread48hStatus,
      lastSyncedAt: new Date().toISOString(),
      calendarsChecked: calendarResults,
      sourcesStatus: {
        gmail: mail.ok ? "checked" : "failed",
        calendarList: calendarListRes.ok ? "checked" : "failed",
        calendarsTotal: targetCals.length,
        calendarsChecked: calendarResults.filter(c => c.status === "checked").length,
        calendarsFailed: calendarResults.filter(c => c.status === "failed").length,
        drive: driveStatus,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ connected: true, error: "Could not retrieve dashboard data." }, { status: 502 });
  }
}
