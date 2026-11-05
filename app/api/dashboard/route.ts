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
    const [calendar, mail] = await Promise.all([
      googleFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=25`),
      googleFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+-category:promotions+-category:social&maxResults=8"),
    ]);
    if (!calendar.ok || !mail.ok) return NextResponse.json({ connected: true, error: "Google returned an API error. Check that Calendar and Gmail APIs are enabled and reconnect if needed." }, { status: 502 });
    const calendarData = await calendar.json();
    const mailData = await mail.json();
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
      events: calendarData.items ?? [],
      unread: messages.filter(Boolean),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ connected: true, error: "Could not retrieve dashboard data." }, { status: 502 });
  }
}
