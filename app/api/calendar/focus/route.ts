import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";

async function update(request: Request, deleted: boolean) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(body.id)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(body.id)}`;
    const existing = await googleFetch(url); const event = await existing.json();
    if (!existing.ok || !event.summary?.startsWith("Focus: ")) return NextResponse.json({ error: "Focus event not found" }, { status: 404 });
    if (body.expectedStart && (new Date(event.start?.dateTime).getTime() !== new Date(body.expectedStart).getTime() || new Date(event.end?.dateTime).getTime() !== new Date(body.expectedEnd).getTime())) return NextResponse.json({ error: "Session changed since that action; undo skipped." }, { status: 409 });
    const start = new Date(body.start); const end = new Date(body.end);
    if (!deleted && (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start)) return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
    const response = await googleFetch(url, { method: deleted ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json", ...(event.etag ? { "If-Match": event.etag } : {}) }, ...(!deleted ? { body: JSON.stringify({ start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }) } : {}) });
    if (deleted && response.status === 410) return NextResponse.json({ success: true });
    const failure = response.ok ? null : await response.json().catch(() => null);
    return NextResponse.json(response.ok ? { success: true } : { error: `Google could not update this event (${response.status}${failure?.error?.errors?.[0]?.reason ? `: ${failure.error.errors[0].reason}` : ""})` }, { status: response.ok ? 200 : 502 });
  } catch { return NextResponse.json({ error: "Calendar update failed" }, { status: 502 }); }
}
export const PATCH = (request: Request) => update(request, false);
export const DELETE = (request: Request) => update(request, true);

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
