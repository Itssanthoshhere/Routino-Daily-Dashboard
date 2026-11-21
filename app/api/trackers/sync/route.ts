import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mergeTrackerSync } from "@/lib/trackerSyncState";
import { syncSpreadsheetTrackers, GOOGLE_SHEET_ID } from "@/lib/trackersSync";
import { SEED_TRACKERS_DATA } from "@/lib/trackersSeed";
import type { TrackersData } from "@/types/dashboard";

const cacheByAccount = new Map<string, { data: TrackersData; fetchedAt: number }>();
const pendingBySource = new Map<string, Promise<TrackersData>>();
async function fetchTrackerData(accountKey: string) {
  const key = `${accountKey}:${GOOGLE_SHEET_ID}`;
  const existing = pendingBySource.get(key);
  if (existing) return existing;
  const pending = syncSpreadsheetTrackers();
  pendingBySource.set(key, pending);
  try { return await pending; }
  finally { if (pendingBySource.get(key) === pending) pendingBySource.delete(key); }
}
const CACHE_TTL_MS = 15 * 1000; // 15 seconds cache for fast live updates

function jsonNoStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...init?.headers, "Cache-Control": "private, no-store" },
  });
}

function isTrackerOwner(email: string): boolean {
  const ownerEmail = process.env.TRACKERS_OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(ownerEmail && email.trim().toLowerCase() === ownerEmail);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    // When not logged in, NEVER fetch or expose private live Google Sheets!
    // Return completely anonymized, privacy-safe demo sample data.
    if (!session?.user?.email) {
      return jsonNoStore({
        success: true,
        source: "demo-sample",
        data: SEED_TRACKERS_DATA,
      });
    }

    const accountKey = session.user.email.toLowerCase().trim();
    if (!isTrackerOwner(accountKey)) {
      return jsonNoStore({ success: false, error: "Tracker access is not configured for this account." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const now = Date.now();

    const cached = cacheByAccount.get(accountKey);
    if (!force && cached && cached.data.spreadsheetId === GOOGLE_SHEET_ID && now - cached.fetchedAt < CACHE_TTL_MS) {
      return jsonNoStore({
        success: true,
        source: "cache",
        data: cached.data,
      });
    }

    const fetched = await fetchTrackerData(accountKey);
    if (!fetched.isLive) {
      return jsonNoStore({ success: false, error: "Could not refresh the spreadsheet. Previously loaded data is unchanged." }, { status: 503 });
    }
    const data = mergeTrackerSync(cacheByAccount.get(accountKey)?.data, { ...fetched, syncAccount: accountKey });
    cacheByAccount.set(accountKey, { data, fetchedAt: now });

    return jsonNoStore({
      success: true,
      source: "live",
      data,
    });
  } catch (error) {
    console.error("Error in trackers sync API:", error);
    return jsonNoStore(
      {
        success: false,
        error: "Could not load tracker data.",
        data: SEED_TRACKERS_DATA,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return jsonNoStore(
        { error: "Unauthorized. Please sign in to update trackers." },
        { status: 401 }
      );
    }
    const accountKey = session.user.email.toLowerCase().trim();
    if (!isTrackerOwner(accountKey)) {
      return jsonNoStore({ success: false, error: "Tracker access is not configured for this account." }, { status: 403 });
    }
    return jsonNoStore({ success: false, error: "Use the revision-checked tracker workspace save path. Spreadsheet sync is read-only." }, { status: 410 });
  } catch (error) {
    console.error("Error updating tracker data:", error);
    return jsonNoStore({ success: false, error: "Could not update tracker data." }, { status: 500 });
  }
}
