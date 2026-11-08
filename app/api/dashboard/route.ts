import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ connected: false }, { status: 401 });
  try {
    const now = new Date();
    const week = new Date(now);
    week.setDate(week.getDate() + 7);
    const timeMin = encodeURIComponent(now.toISOString());
    const timeMax = encodeURIComponent(week.toISOString());
    const [calendarListRes, mail] = await Promise.all([
      googleFetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader"),
      googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+-category:promotions+-category:social&maxResults=8"),
    ]);

    if (!mail.ok && !calendarListRes.ok) {
      return NextResponse.json({ connected: true, error: "Google returned an API error. Check that Calendar and Gmail APIs are enabled and reconnect if needed." }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let calendarEvents: any[] = [];

    if (calendarListRes.ok) {
      const calListData = await calendarListRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allCals: any[] = Array.isArray(calListData.items) ? calListData.items : [];
      // Pick selected or primary calendars (up to 8 calendars)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetCals = allCals.filter((c: any) => c.selected !== false).slice(0, 8);

      if (targetCals.length > 0) {
        const eventsPerCal = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          targetCals.map(async (cal: any) => {
            try {
              const res = await googleFetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`
              );
              if (!res.ok) return [];
              const data = await res.json();
              const items = Array.isArray(data.items) ? data.items : [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return items.map((item: any) => ({
                ...item,
                calendarId: cal.id,
                calendarSummary: cal.summary,
                calendarColor: cal.backgroundColor,
              }));
            } catch {
              return [];
            }
          })
        );
        calendarEvents = eventsPerCal.flat();
      }
    }

    // Fallback to primary if calendarList returned no events or failed
    if (calendarEvents.length === 0) {
      const primaryRes = await googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`
      );
      if (primaryRes.ok) {
        const primaryData = await primaryRes.json();
        calendarEvents = Array.isArray(primaryData.items) ? primaryData.items : [];
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

    const mailData = mail.ok ? await mail.json() : { messages: [] };
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
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ connected: true, error: "Could not retrieve dashboard data." }, { status: 502 });
  }
}
