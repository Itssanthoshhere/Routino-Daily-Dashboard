import type { DashboardEvent, Task } from "@/types/dashboard";

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

  // 2. PROJECT / BUILD / PRODUCT (project, product, website, building app, portfolio, dev, coding)
  if (
    /\b(project|projects|product|products|website|building|portfolio|coding|code|dev|develop|design|redesign|dashboard|api|feature|prototype|mvp|frontend|backend|fullstack|github|repo)\b/i.test(
      summary
    ) ||
    /\b([a-z0-9_-]+\s+app|app\s+dev|build|spendo|ios\s+app|android\s+app|web\s+app)\b/i.test(summary) ||
    (/\b(project|projects|product|products|website|building|portfolio|coding|dev|dashboard|api)\b/i.test(cleanDesc) &&
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

/**
 * Automatically infers a task's category from its title and explicit selection.
 * Handles Project/Product work, Travel/Flights, Meetings, Urgent, Personal, and Work.
 */
export function inferTaskCategory(
  title: string,
  explicitCategory?: Task["category"]
): NonNullable<Task["category"]> {
  // If user explicitly picked project, travel, meeting, personal, urgent, keep it
  if (explicitCategory && explicitCategory !== "work") {
    return explicitCategory;
  }

  const clean = title.toLowerCase().trim();

  // 1. TRAVEL (highest priority: flights, trains, hotel bookings, airport, trips)
  if (
    /\b(flight|train|hotel|airport|airline|boarding|terminal|travel|trip|stay|vacation|departure|arrival|transit|ticket)\b/i.test(
      clean
    ) ||
    /\b(6e|ai|uk|sg|g8|ix|qp)\s*\d{2,4}\b/i.test(clean)
  ) {
    return "travel";
  }

  // 2. PROJECT / PRODUCT / BUILD
  if (
    /\b(project|projects|product|products|website|app|apps|building|build|portfolio|coding|code|dev|develop|developer|design|redesign|dashboard|api|feature|prototype|mvp|frontend|backend|fullstack|github|repo|spendo)\b/i.test(
      clean
    )
  ) {
    return "project";
  }

  // 3. MEETING
  if (/\b(meeting|sync|standup|1:1|call|interview|demo|huddle|discussion)\b/i.test(clean)) {
    return "meeting";
  }

  // 4. URGENT
  if (/\b(urgent|asap|priority|crucial|critical|emergency|due today)\b/i.test(clean)) {
    return "urgent";
  }

  // 5. PERSONAL
  if (/\b(doctor|dentist|gym|workout|dinner|lunch|groceries|shopping|movie|family|salon)\b/i.test(clean)) {
    return "personal";
  }

  return explicitCategory || "work";
}

export type ScheduleConflict = {
  id: string;
  eventA: DashboardEvent;
  eventB: DashboardEvent;
  conflictStart: Date;
  conflictEnd: Date;
  startTimeStr: string;
  endTimeStr: string;
  overlapMinutes: number;
};

/**
 * Detects overlapping or double-booked events for a given day.
 */
export function findScheduleConflicts(
  events: DashboardEvent[],
  targetDateStr?: string
): ScheduleConflict[] {
  const datePrefix = targetDateStr || new Intl.DateTimeFormat("en-CA").format(new Date());

  const timedEvents = events
    .filter((ev) => {
      const s = ev.start?.dateTime;
      const e = ev.end?.dateTime;
      return s && e && s.startsWith(datePrefix);
    })
    .map((ev) => ({
      event: ev,
      start: new Date(ev.start!.dateTime!).getTime(),
      end: new Date(ev.end!.dateTime!).getTime(),
    }))
    .filter((item) => !Number.isNaN(item.start) && !Number.isNaN(item.end) && item.end > item.start)
    .sort((a, b) => a.start - b.start);

  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < timedEvents.length; i++) {
    for (let j = i + 1; j < timedEvents.length; j++) {
      const a = timedEvents[i];
      const b = timedEvents[j];

      if (b.start >= a.end) break;

      const overlapStart = Math.max(a.start, b.start);
      const overlapEnd = Math.min(a.end, b.end);
      const overlapMinutes = Math.round((overlapEnd - overlapStart) / (60 * 1000));

      if (overlapMinutes > 0) {
        const startDate = new Date(overlapStart);
        const endDate = new Date(overlapEnd);
        conflicts.push({
          id: `conflict-${a.event.id}-${b.event.id}`,
          eventA: a.event,
          eventB: b.event,
          conflictStart: startDate,
          conflictEnd: endDate,
          startTimeStr: startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          endTimeStr: endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          overlapMinutes,
        });
      }
    }
  }

  return conflicts;
}

export type TravelInfo = {
  event: DashboardEvent;
  flightCode?: string;
  airline?: string;
  destination?: string;
  departureTimeStr: string;
  arrivalTimeStr: string;
  departureDate: Date;
  arrivalDate: Date;
  isDeparted: boolean;
  isArrived: boolean;
  minutesUntilDeparture: number;
};

const AIRLINE_CODES: Record<string, string> = {
  "6E": "IndiGo",
  AI: "Air India",
  UK: "Vistara",
  SG: "SpiceJet",
  QP: "Akasa Air",
  IX: "Air India Express",
  G8: "Go First",
  EK: "Emirates",
  QR: "Qatar Airways",
  BA: "British Airways",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  AA: "American Airlines",
  LH: "Lufthansa",
  AF: "Air France",
  SQ: "Singapore Airlines",
};

/**
 * Finds and extracts structured travel details (flights, trains, trips) for today.
 */
export function getTodayTravelInfo(
  events: DashboardEvent[],
  targetDateStr?: string
): TravelInfo | null {
  const datePrefix = targetDateStr || new Intl.DateTimeFormat("en-CA").format(new Date());

  const travelEvent = events.find((ev) => {
    const s = ev.start?.dateTime || ev.start?.date;
    if (!s || !s.startsWith(datePrefix)) return false;
    const cat = inferEventCategory(ev);
    return cat.tag === "TRAVEL";
  });

  if (!travelEvent) return null;

  const startStr = travelEvent.start?.dateTime || travelEvent.start?.date || "";
  const endStr = travelEvent.end?.dateTime || travelEvent.end?.date || "";
  const departureDate = new Date(startStr);
  const arrivalDate = endStr ? new Date(endStr) : new Date(departureDate.getTime() + 2 * 60 * 60 * 1000);

  const now = Date.now();
  const minutesUntilDeparture = Math.round((departureDate.getTime() - now) / (60 * 1000));
  const isDeparted = now >= departureDate.getTime();
  const isArrived = now >= arrivalDate.getTime();

  const summary = travelEvent.summary || "";
  const description = travelEvent.description || "";
  const fullText = `${summary} ${description}`;

  // Extract Flight Code (e.g. 6E 2336, AI 102)
  let flightCode: string | undefined;
  let airline: string | undefined;
  const flightMatch = fullText.match(/\b(6E|AI|UK|SG|QP|IX|G8|EK|QR|BA|DL|UA|AA|LH|AF|SQ)\s*(\d{2,4})\b/i);
  if (flightMatch) {
    const prefix = flightMatch[1].toUpperCase();
    const number = flightMatch[2];
    flightCode = `${prefix} ${number}`;
    airline = AIRLINE_CODES[prefix] || prefix;
  }

  // Extract Destination
  let destination: string | undefined;
  const destMatch = summary.match(/(?:flight|trip|travel)\s+to\s+([a-zA-Z\s]+?)(?:\s*\(|\s*-|\s*$)/i);
  if (destMatch && destMatch[1].trim()) {
    destination = destMatch[1].trim();
  } else if (travelEvent.location) {
    destination = travelEvent.location;
  }

  return {
    event: travelEvent,
    flightCode,
    airline,
    destination,
    departureTimeStr: departureDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    arrivalTimeStr: arrivalDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    departureDate,
    arrivalDate,
    isDeparted,
    isArrived,
    minutesUntilDeparture,
  };
}
