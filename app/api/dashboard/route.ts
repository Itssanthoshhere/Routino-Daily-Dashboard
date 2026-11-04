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
    return NextResponse.json({ connected: true, events: await calendar.json(), unread: await mail.json() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ connected: true, error: "Could not retrieve dashboard data." }, { status: 502 });
  }
}
