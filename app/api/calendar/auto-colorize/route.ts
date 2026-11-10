import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";

export const dynamic = "force-dynamic";

const COLOR_RULES = [
  {
    name: "Meals",
    colorId: "2", // Sage / Pale Green
    keywords: [
      "breakfast",
      "lunch",
      "dinner",
      "maggi",
      "yippee",
      "biryani",
      "soup",
      "snacks",
      "snack",
      "cooking",
      "food",
    ],
  },
  {
    name: "Routine & Social",
    colorId: "9", // Blueberry / Blue
    keywords: [
      "sleep",
      "instaa",
      "insta",
      "bath",
      "freshup",
      "fresh up",
      "youtube",
      "chit",
      "chit chat",
    ],
  },
  {
    name: "Typing & Notes",
    colorId: "8", // Graphite / Gray
    keywords: ["typing", "journal", "notes"],
  },
  {
    name: "Work & Tasks",
    colorId: "5", // Banana / Yellow
    keywords: [
      "mf360",
      "spendo",
      "routino",
      "cset",
      "project",
      "cs400",
      "fund disclosure",
    ],
  },
];

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Rolling window: 14 days ago to 60 days ahead
    const pastWindow = new Date(now);
    pastWindow.setDate(pastWindow.getDate() - 14);
    pastWindow.setHours(0, 0, 0, 0);

    const futureWindow = new Date(now);
    futureWindow.setDate(futureWindow.getDate() + 60);
    futureWindow.setHours(23, 59, 59, 999);

    const timeMin = encodeURIComponent(pastWindow.toISOString());
    const timeMax = encodeURIComponent(futureWindow.toISOString());

    // 1. Fetch calendar list
    const calendarListRes = await googleFetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer"
    );

    let calendarsToScan: Array<{ id: string }> = [{ id: "primary" }];
    if (calendarListRes.ok) {
      const calData = await calendarListRes.json();
      if (Array.isArray(calData.items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const writable = calData.items.filter((c: any) => c.accessRole === "writer" || c.accessRole === "owner");
        if (writable.length > 0) {
          calendarsToScan = writable.map((c: { id: string }) => ({ id: c.id }));
        }
      }
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let needsReauth = false;

    for (const cal of calendarsToScan.slice(0, 3)) {
      const eventsRes = await googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&maxResults=500`
      );

      if (!eventsRes.ok) {
        if (eventsRes.status === 403) needsReauth = true;
        continue;
      }

      const eventsData = await eventsRes.json();
      const events = Array.isArray(eventsData.items) ? eventsData.items : [];

      for (const event of events) {
        // Skip all-day events (holidays, birthdays)
        if (!event.start?.dateTime) continue;

        const title = (event.summary || "").toLowerCase();

        for (const rule of COLOR_RULES) {
          const matches = rule.keywords.some((k) => title.includes(k.toLowerCase()));

          if (matches) {
            // If already colored with this colorId, skip!
            if (event.colorId === rule.colorId) {
              skippedCount++;
              break;
            }

            try {
              const patchRes = await googleFetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events/${encodeURIComponent(event.id)}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ colorId: rule.colorId }),
                }
              );

              if (patchRes.ok) {
                updatedCount++;
                // Small throttle to avoid hitting Google API write rate limits
                await new Promise((r) => setTimeout(r, 120));
              } else if (patchRes.status === 403) {
                needsReauth = true;
              }
            } catch {
              // ignore single event error
            }
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      skippedCount,
      needsReauth,
      message: updatedCount > 0
        ? `Successfully auto-colored ${updatedCount} event${updatedCount > 1 ? "s" : ""} in Google Calendar!`
        : `All events are already up-to-date with their correct colors!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error colorizing events";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
