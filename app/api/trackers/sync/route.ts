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
    const cachedData = cacheByAccount.get(accountKey)?.data;
    const body = await request.json();
    const { action, payload } = body;

    if (!cachedData || cachedData.spreadsheetId !== GOOGLE_SHEET_ID) {
      const fetched = await fetchTrackerData(accountKey);
      if (!fetched.isLive) return jsonNoStore({ success: false, error: "Could not load the spreadsheet." }, { status: 503 });
      cacheByAccount.set(accountKey, { data: { ...fetched, syncAccount: accountKey }, fetchedAt: Date.now() });
    }
    const accountData = cacheByAccount.get(accountKey)!.data;

    if (action === "add_eb_reading" && payload) {
      const prevReading = accountData.ebReadings[0]?.meterReading ?? accountData.ebMeta.latestReading;
      const readingVal = Number(payload.meterReading);
      const unitsUsed = Math.max(0, readingVal - prevReading);
      const rate = accountData.ebMeta.currentRate || 12;
      const cost = Math.round(unitsUsed * rate * 100) / 100;

      const newReading = {
        id: `reading-local-${Date.now()}`,
        dateTimeStr: payload.dateTimeStr || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        meterReading: readingVal,
        unitsUsed,
        cost,
        daysSincePrevious: 1,
        unitsPerDay: unitsUsed,
        billingCycle: payload.billingCycle || "Running",
      };

      accountData.ebReadings = [newReading, ...accountData.ebReadings];
      accountData.ebMeta.latestReading = readingVal;
      accountData.ebMeta.latestReadingDate = newReading.dateTimeStr;

      return jsonNoStore({ success: true, data: accountData });
    }

    if (action === "add_expense" && payload) {
      const newExp = {
        id: `exp-local-${Date.now()}`,
        year: new Date().getFullYear(),
        item: payload.item || "Expense",
        amount: Number(payload.amount) || 0,
        dateStr: payload.dateStr || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        category: payload.category || "General",
        notes: payload.notes || "",
        balance: null,
      };

      accountData.expenses = [newExp, ...accountData.expenses];
      return jsonNoStore({ success: true, data: accountData });
    }

    return jsonNoStore({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating tracker data:", error);
    return jsonNoStore({ success: false, error: "Could not update tracker data." }, { status: 500 });
  }
}
