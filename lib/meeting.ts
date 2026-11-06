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
