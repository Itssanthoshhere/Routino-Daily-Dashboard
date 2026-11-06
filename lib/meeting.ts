import type { DashboardEvent } from "@/types/dashboard";

/**
 * Checks if a URL is a genuine video conferencing link (Google Meet, Zoom, Teams, Webex, Skype)
 */
export function isVideoConferenceUrl(url?: string | null): boolean {
  if (!url) return false;
  return /https?:\/\/(?:meet\.google\.com|[\w-]+\.zoom\.us\/[jw]|teams\.microsoft\.com|teams\.live\.com|[\w-]+\.webex\.com\/|join\.skype\.com)/i.test(
    url
  );
}

/**
 * Extracts a genuine video call link from an event.
 * Returns null if the event has no video conferencing link (e.g. In-person flights, meetings, appointments).
 * Note: Does NOT fall back to event.htmlLink (Google Calendar web link).
 */
export function getMeetingUrl(event: DashboardEvent): string | null {
  // Direct meet link
  if (event.meetLink && isVideoConferenceUrl(event.meetLink)) {
    return event.meetLink;
  }

  // Google Calendar raw property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHangout = (event as any).hangoutLink;
  if (rawHangout && isVideoConferenceUrl(rawHangout)) {
    return rawHangout;
  }

  // Scan location or description for video link
  const textToScan = `${event.location || ""} ${event.description || ""}`;
  const meetMatch = textToScan.match(
    /https?:\/\/(?:meet\.google\.com\/[a-z0-9-]+|[\w-]+\.zoom\.us\/[jw]\/[a-z0-9?=_&-]+|teams\.microsoft\.com\/[^\s"'>]+|teams\.live\.com\/[^\s"'>]+|[\w-]+\.webex\.com\/[^\s"'>]+)/i
  );
  if (meetMatch) {
    return meetMatch[0];
  }

  return null;
}

/**
 * Automatically infers an event's category/tag and theme color from its title,
 * description, and properties.
 * Identifies:
 * - "TRAVEL": flights, trains, hotel bookings, airport, trips
 * - "PROJECT": hands-on build sessions (project, website, building app, portfolio, dev, code)
 * - "MEETING": video calls, syncs, reviews, 1:1s
 * - "PERSONAL": doctor, dentist, gym, dinner, personal life
 * - "OUTLOOK": synced via Microsoft Outlook
 * - "WORK": default professional work
 */
export function inferEventCategory(event: DashboardEvent): { tag: string; color: string } {
  if (event.tag && event.tag !== "WORK") {
    const t = event.tag.toUpperCase();
    return {
      tag: t,
      color:
        event.color ||
        (t === "TRAVEL"
          ? "#0284c7"
          : t === "PROJECT"
          ? "#7c3aed"
          : t === "MEETING"
          ? "#2563eb"
          : t === "PERSONAL"
          ? "#d97706"
          : "#16a34a"),
    };
  }

  if (event.source === "outlook") {
    return { tag: "OUTLOOK", color: "#0078d4" };
  }

  const summary = (event.summary || "").toLowerCase();

  // Strip Google Calendar boilerplate from description
  const cleanDesc = (event.description || "")
    .replace(/use the official Google Calendar app/gi, "")
    .replace(/automatically created events/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, "")
    .toLowerCase();

  const titleAndDesc = `${summary} ${cleanDesc}`;

  // 1. TRAVEL (highest priority: flights, trains, hotels, transit, airport, flight numbers)
  if (
    /\b(flight|train|hotel|airport|airline|boarding|terminal|travel|trip|stay|vacation|departure|arrival|transit|indigo|air india|vistara|spicejet|emirates|qatar|delta|united|lufthansa)\b/i.test(
      summary
    ) ||
    /\b(6e|ai|uk|sg|g8|ix|qp)\s*\d{2,4}\b/i.test(summary) ||
    /\b(flight|airport|terminal|hotel booking|boarding pass)\b/i.test(cleanDesc)
  ) {
    return { tag: "TRAVEL", color: "#0284c7" };
  }

  // 2. PROJECT / BUILD (project, website, building app, portfolio, dev, coding)
  if (
    /\b(project|website|building|portfolio|coding|code|dev|develop|design|redesign|dashboard|api|feature|prototype|mvp|frontend|backend|fullstack|github|repo)\b/i.test(
      summary
    ) ||
    /\b([a-z0-9_-]+\s+app|app\s+dev|build|spendo)\b/i.test(summary) ||
    (/\b(project|website|building|portfolio|coding|dev|dashboard|api)\b/i.test(cleanDesc) &&
      !/\bcalendar\b/i.test(cleanDesc))
  ) {
    return { tag: "PROJECT", color: "#7c3aed" };
  }

  // 3. MEETING (syncs, standups, 1:1, interviews, calls, video conferences)
  if (
    /\b(sync|standup|1:1|one-on-one|interview|review|sync-up|check-in|catch-up|huddle|debrief|meeting|demo|call)\b/i.test(
      summary
    ) ||
    !!event.meetLink ||
    (event.attendees && event.attendees.length > 1)
  ) {
    return { tag: "MEETING", color: "#2563eb" };
  }

  // 4. PERSONAL (doctor, dentist, gym, dinner, birthday, personal life)
  if (
    /\b(doctor|dentist|gym|workout|personal|dinner|lunch|birthday|errand|family|movie|concert|spa|salon)\b/i.test(
      titleAndDesc
    )
  ) {
    return { tag: "PERSONAL", color: "#d97706" };
  }

  return { tag: event.tag || "WORK", color: event.color || "#16a34a" };
}
