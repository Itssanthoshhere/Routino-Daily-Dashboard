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
 * - "PROJECT": hands-on build sessions (keywords: project, website, app, building, portfolio, dev, code, design)
 * - "MEETING": video calls, syncs, reviews, 1:1s
 * - "PERSONAL": travel, flights, doctor, workout, personal life
 * - "OUTLOOK": synced via Microsoft Outlook
 * - "WORK": default professional work
 */
export function inferEventCategory(event: DashboardEvent): { tag: string; color: string } {
  if (event.tag && event.tag !== "WORK") {
    return {
      tag: event.tag.toUpperCase(),
      color:
        event.color ||
        (event.tag === "PROJECT"
          ? "#7c3aed"
          : event.tag === "MEETING"
          ? "#2563eb"
          : event.tag === "PERSONAL"
          ? "#d97706"
          : "#16a34a"),
    };
  }

  if (event.source === "outlook") {
    return { tag: "OUTLOOK", color: "#0078d4" };
  }

  const text = `${event.summary || ""} ${event.description || ""}`.toLowerCase();

  // Project / Building keywords
  if (
    /\b(project|website|app|building|portfolio|coding|code|dev|develop|design|redesign|dashboard|api|feature|prototype|mvp|frontend|backend|fullstack|github|repo)\b/i.test(
      text
    )
  ) {
    return { tag: "PROJECT", color: "#7c3aed" };
  }

  // Meeting / Video call keywords
  if (
    /\b(sync|standup|1:1|one-on-one|interview|review|sync-up|check-in|catch-up|huddle|debrief|meeting|demo)\b/i.test(
      text
    ) ||
    !!event.meetLink
  ) {
    return { tag: "MEETING", color: "#2563eb" };
  }

  // Personal / Life keywords
  if (
    /\b(flight|hotel|dentist|doctor|gym|workout|personal|dinner|lunch|trip|vacation|birthday|errand|family)\b/i.test(
      text
    )
  ) {
    return { tag: "PERSONAL", color: "#d97706" };
  }

  return { tag: event.tag || "WORK", color: event.color || "#16a34a" };
}
