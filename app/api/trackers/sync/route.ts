import { NextResponse } from "next/server";
import { syncSpreadsheetTrackers, SEED_TRACKERS_DATA } from "@/lib/trackersSync";
import type { TrackersData } from "@/types/dashboard";

let cachedData: TrackersData | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const now = Date.now();

    if (!force && cachedData && now - lastFetchTime < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        source: "cache",
        data: cachedData,
      });
    }

    const data = await syncSpreadsheetTrackers();
    cachedData = data;
    lastFetchTime = now;

    return NextResponse.json({
      success: true,
      source: "live",
      data,
    });
  } catch (error) {
    console.error("Error in trackers sync API:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        data: cachedData || SEED_TRACKERS_DATA,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (!cachedData) {
      cachedData = await syncSpreadsheetTrackers();
    }

    if (action === "add_eb_reading" && payload) {
      const prevReading = cachedData.ebReadings[0]?.meterReading ?? cachedData.ebMeta.latestReading;
      const readingVal = Number(payload.meterReading);
      const unitsUsed = Math.max(0, readingVal - prevReading);
      const rate = cachedData.ebMeta.currentRate || 12;
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

      cachedData.ebReadings = [newReading, ...cachedData.ebReadings];
      cachedData.ebMeta.latestReading = readingVal;
      cachedData.ebMeta.latestReadingDate = newReading.dateTimeStr;

      return NextResponse.json({ success: true, data: cachedData });
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

      cachedData.expenses = [newExp, ...cachedData.expenses];
      return NextResponse.json({ success: true, data: cachedData });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
