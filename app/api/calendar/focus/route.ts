import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";

export async function POST(request: Request) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Sign in to Google first." }, { status: 401 });
  try {
    const body = await request.json();
    const start = new Date(body.start);
    const end = new Date(body.end);
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 1000 || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || start.getTime() < Date.now() || end.getTime() - start.getTime() > 6 * 3600000) {
      return NextResponse.json({ error: "Choose a valid future focus session." }, { status: 400 });
    }
    const response = await googleFetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: `Focus: ${body.title.trim()}`, description: typeof body.description === "string" ? body.description.slice(0, 8000) : "Scheduled from Routino", start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, colorId: "10" }),
    });
    if (!response.ok) return NextResponse.json({ error: response.status === 403 ? "Reconnect Google to allow calendar event creation." : "Google could not create this event. Please try again." }, { status: response.status === 403 ? 403 : 502 });
    const event = await response.json();
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Could not schedule with Google. Check your connection and Google sign-in." }, { status: 502 });
  }
}
