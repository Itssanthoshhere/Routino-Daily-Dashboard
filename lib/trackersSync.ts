import "server-only";
import { parseJournalSummaryRows } from "@/lib/journalSummary";
import { SEED_TRACKERS_DATA, SEED_ANTIGRAVITY_TOKENS } from "@/lib/trackersSeed";
import type {
  TrackersData,
  TrackerCategoryBudget,
  TrackerExpense,
  TrackerEBReading,
  TrackerEBCycleSummary,
  TrackerEBMeta,
  TrackerJobApplication,
  TrackerLifeStats,
  TrackerPurchase,
  TrackerInvestmentJournal,
  TrackerExpenseJournal,
  TrackerAntigravityToken,
  TrackerAntigravityTokenSummary,
  UniversityYearFee,
  EducationLevelSummary,
  InvestmentContributor,
} from "@/types/dashboard";

export const GOOGLE_SHEET_ID =
  process.env.TRACKERS_SPREADSHEET_ID || "";
export const GOOGLE_SHEET_URL = GOOGLE_SHEET_ID
  ? `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`
  : "";

type GVizCell = {
  v?: string | number | boolean | null;
  f?: string | null;
};

type GVizRow = {
  c: (GVizCell | null)[];
};

type GVizResponse = {
  table: {
    cols: { label?: string; id?: string }[];
    rows: GVizRow[];
  };
};

async function fetchGVizSheet(sheetName: string, range?: string): Promise<GVizResponse | null> {
  if (!GOOGLE_SHEET_ID) return null;
  try {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}${range ? `&range=${encodeURIComponent(range)}&headers=0` : ""}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start === -1 || end <= start) return null;
    const data = JSON.parse(text.slice(start, end)) as GVizResponse;
    return Array.isArray(data?.table?.rows) ? data : null;
  } catch (err) {
    console.error(`Failed to fetch GViz sheet: ${sheetName}`, err);
    return null;
  }
}

function parseNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parsePurchasePrice(cell: GVizCell | null | undefined): { price: number; priceFormatted: string } {
  // Mixed-type Sheets columns can expose a blank raw value alongside formatted currency.
  const raw = cell?.v;
  const usableRaw = typeof raw === "number" ? Number.isFinite(raw) : typeof raw === "string" && /\d/.test(raw);
  const price = parseNumber(usableRaw ? raw : cell?.f);
  return { price, priceFormatted: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price) };
}

function parseString(cell: GVizCell | null | undefined): string {
  if (!cell) return "";
  if (cell.f) return cell.f.trim();
  if (cell.v !== null && cell.v !== undefined) return String(cell.v).trim();
  return "";
}

function parseGVizDate(cell: GVizCell | null | undefined): string {
  if (!cell) return "";
  if (cell.f) return cell.f.trim();
  const raw = String(cell.v || "");
  if (raw.startsWith("Date(")) {
    const parts = raw.slice(5, -1).split(",").map((n) => parseInt(n.trim(), 10));
    const year = parts[0] || 2026;
    const month = (parts[1] ?? 0) + 1;
    const day = parts[2] ?? 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return raw;
}

export function parseExpenseJournalRows(
  rows: GVizRow[] | undefined,
  journalKey: string,
  is2023 = false
): TrackerExpense[] {
  const result: TrackerExpense[] = [];
  if (!rows) return result;

  rows.forEach((row, idx) => {
    const item = parseString(row.c[1]);
    const amt = row.c[2] ? parseNumber(row.c[2].v ?? row.c[2].f) : 0;
    const inc = row.c[3] ? parseNumber(row.c[3].v ?? row.c[3].f) : null;
    if (!item && !amt && !inc) return;

    const year = row.c[0] ? parseNumber(row.c[0].v ?? row.c[0].f) : parseInt(journalKey.slice(0, 4), 10) || 2026;
    const day = is2023
      ? (row.c[4] ? parseNumber(row.c[4].v ?? row.c[4].f) : undefined)
      : (row.c[5] ? parseNumber(row.c[5].v ?? row.c[5].f) : undefined);
    const month = is2023
      ? (row.c[5] ? parseNumber(row.c[5].v ?? row.c[5].f) : undefined)
      : (row.c[6] ? parseNumber(row.c[6].v ?? row.c[6].f) : undefined);
    const dateStr = is2023
      ? (parseString(row.c[6]) || parseGVizDate(row.c[6]))
      : (parseString(row.c[7]) || parseGVizDate(row.c[7]));
    const cat = is2023
      ? (parseString(row.c[7]) || "General")
      : (parseString(row.c[8]) || "General");
    const notes = is2023 ? parseString(row.c[8]) : parseString(row.c[9]);
    const bal = is2023
      ? (row.c[9] ? parseNumber(row.c[9].v ?? row.c[9].f) : null)
      : (row.c[10] ? parseNumber(row.c[10].v ?? row.c[10].f) : null);

    result.push({
      id: `${journalKey}-${idx}`,
      year,
      day,
      month,
      item: item || (inc ? "Income" : "Expense"),
      amount: amt,
      income: inc,
      dateStr: dateStr || String(year),
      category: cat,
      notes,
      balance: bal,
    });
  });

  // Recent entries on top
  result.reverse();
  return result;
}

/* ── Live Syncer ── */
export async function syncSpreadsheetTrackers(): Promise<TrackersData> {
  const syncStartedAt = new Date().toISOString();
  if (!GOOGLE_SHEET_ID) {
    return {
      ...SEED_TRACKERS_DATA,
      spreadsheetId: "",
      spreadsheetUrl: "",
      lastSyncedAt: new Date().toISOString(),
      isLive: false,
    };
  }

  try {
    const [
      budgetData,
      exp2026Data,
      exp2026FamPayData,
      exp2025Data,
      exp2025FamPayData,
      exp2024Data,
      exp2024FamPayData,
      exp2023Data,
      expPgData,
      summaryData,
      readingsData,
      placementData,
      purchaseData,
      timeData,
      investmentData,
      tokenExpiryData,
    ] = await Promise.all([
      fetchGVizSheet("Category Budget"),
      fetchGVizSheet("2026 Expense Journal"),
      fetchGVizSheet("2026 Fam Pay Expense Journal"),
      fetchGVizSheet("2025 Expense Journal"),
      fetchGVizSheet("2025 Fam Pay Expense Journal"),
      fetchGVizSheet("2024 Expense Journal"),
      fetchGVizSheet("2024 Fam Pay Expense Journal"),
      fetchGVizSheet("2023 Expense Journal"),
      fetchGVizSheet("PG Expense Journal"),
      fetchGVizSheet("Summary"),
      fetchGVizSheet("Readings"),
      fetchGVizSheet("Placement Tracker"),
      fetchGVizSheet("Purchase Summary"),
      fetchGVizSheet("Time Spent on Earth"),
      fetchGVizSheet("Investment Journal"),
      fetchGVizSheet("Antigravity Token Expiry"),
    ]);

    // Parse Category Budget
    let totalMonthlyBudget = 0;
    const categoryBudgets: TrackerCategoryBudget[] = [];
    if (budgetData?.table?.rows) {
      budgetData.table.rows.forEach((row, idx) => {
        const cat = parseString(row.c[0]);
        if (!cat) return;
        if (idx === 0) {
          const totalVal = row.c[3] ? parseNumber(row.c[3].v ?? row.c[3].f) : 0;
          if (totalVal >= 0) totalMonthlyBudget = totalVal;
          return;
        }
        if (cat.toLowerCase() === "category" || cat.toLowerCase() === "income") return;
        const amt = row.c[1] ? parseNumber(row.c[1].v ?? row.c[1].f) : 0;
        categoryBudgets.push({ category: cat, budget: amt });
      });
    }

    // Parse All Expense Journals (2023 to 2026, FamPay, PG)
    const j2026 = parseExpenseJournalRows(exp2026Data?.table?.rows, "2026");
    const j2026FamPay = parseExpenseJournalRows(exp2026FamPayData?.table?.rows, "2026-fampay");
    const j2025 = parseExpenseJournalRows(exp2025Data?.table?.rows, "2025");
    const j2025FamPay = parseExpenseJournalRows(exp2025FamPayData?.table?.rows, "2025-fampay");
    const j2024 = parseExpenseJournalRows(exp2024Data?.table?.rows, "2024");
    const j2024FamPay = parseExpenseJournalRows(exp2024FamPayData?.table?.rows, "2024-fampay");
    const j2023 = parseExpenseJournalRows(exp2023Data?.table?.rows, "2023", true);
    const jPg = parseExpenseJournalRows(expPgData?.table?.rows, "pg");

    const makeJournal = (
      key: string,
      title: string,
      year: number,
      expList: TrackerExpense[],
      extra?: { isFamPay?: boolean; isPG?: boolean }
    ): TrackerExpenseJournal => {
      const totalSpent = expList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const totalIncome = expList.reduce((acc, curr) => acc + (curr.income || 0), 0);
      const latestBalance = expList.find((e) => e.balance !== null && e.balance !== undefined)?.balance ?? null;
      return {
        key,
        title,
        year,
        totalSpent,
        totalIncome,
        latestBalance,
        expenses: expList,
        ...extra,
      };
    };

    const journals: Record<string, TrackerExpenseJournal> = {
      "2026": makeJournal("2026", "2026 Journal", 2026, j2026),
      "2026-fampay": makeJournal("2026-fampay", "2026 Fam Pay", 2026, j2026FamPay, { isFamPay: true }),
      "2025": makeJournal("2025", "2025 Journal", 2025, j2025),
      "2025-fampay": makeJournal("2025-fampay", "2025 Fam Pay", 2025, j2025FamPay, { isFamPay: true }),
      "2024": makeJournal("2024", "2024 Journal", 2024, j2024),
      "2024-fampay": makeJournal("2024-fampay", "2024 Fam Pay", 2024, j2024FamPay, { isFamPay: true }),
      "2023": makeJournal("2023", "2023 Journal", 2023, j2023),
      "pg": makeJournal("pg", "PG Expenses", 2026, jPg, { isPG: true }),
    };

    const journalSources = { "2026": exp2026Data, "2026-fampay": exp2026FamPayData,
      "2025": exp2025Data, "2025-fampay": exp2025FamPayData, "2024": exp2024Data,
      "2024-fampay": exp2024FamPayData, "2023": exp2023Data, pg: expPgData };
    const journalUpdatedAt = syncStartedAt;
    for (const [key, source] of Object.entries(journalSources)) {
      journals[key].journalSync = source ? "fresh" : "unavailable";
      if (source) journals[key].journalUpdatedAt = journalUpdatedAt;
    }

    const summarySheets: Record<string,string> = {
      "2023":"2023 Summary", "2024":"2024 Summary", "2025":"2025 Summary", "2026":"2026 Summary",
      "2024-fampay":"2024 Fam Pay Summary ", "2025-fampay":"2025 Fam Pay Summary ", "2026-fampay":"2026 Fam Pay Summary ",
    };
    await Promise.all(Object.entries(summarySheets).map(async ([key,sheet])=>{
      const pivot = await fetchGVizSheet(sheet,"A1:Z900");
      const summary = parseJournalSummaryRows(pivot?.table?.rows,sheet);
      journals[key].summarySync = summary || (pivot && pivot.table.rows.length === 0) ? "fresh" : "unavailable";
      if (journals[key].summarySync === "fresh") journals[key].summaryUpdatedAt = syncStartedAt;
      if (summary) journals[key].sheetSummary = summary;
    }));

    const expenses = journals["2026"].expenses;

    // Parse EB Summary & Meta
    const ebMeta: TrackerEBMeta = {
      rateTillSep: 10,
      currentRate: 12,
      latestReading: 0,
      latestReadingDate: "",
    };
    const ebCycles: TrackerEBCycleSummary[] = [];

    if (summaryData?.table?.rows) {
      summaryData.table.rows.forEach((row) => {
        const label = parseString(row.c[0]);
        if (label.includes("Rate (Rs per unit) till Sep")) {
          ebMeta.rateTillSep = parseNumber(row.c[1]?.v ?? row.c[1]?.f) || 10;
        } else if (label.includes("Rate (Rs per unit)")) {
          ebMeta.currentRate = parseNumber(row.c[1]?.v ?? row.c[1]?.f) || 12;
        } else if (label.includes("Latest reading (units)")) {
          ebMeta.latestReading = parseNumber(row.c[1]?.v ?? row.c[1]?.f) || 0;
        } else if (label.toLowerCase().includes("reading taken at") || label.toLowerCase().includes("latest reading taken")) {
          const dt = parseString(row.c[1]) || parseGVizDate(row.c[1]);
          if (dt) ebMeta.latestReadingDate = dt;
        } else if (["Aug", "Sep", "Oct", "Nov"].includes(label)) {
          const units = row.c[1] ? parseNumber(row.c[1].v ?? row.c[1].f) : 0;
          const computed = row.c[2] ? parseNumber(row.c[2].v ?? row.c[2].f) : 0;
          const billed = row.c[3] ? parseNumber(row.c[3].v ?? row.c[3].f) : computed;
          const people = row.c[4] ? parseNumber(row.c[4].v ?? row.c[4].f) : 2;
          const share = row.c[5] ? parseNumber(row.c[5].v ?? row.c[5].f) : (billed || computed) / (people || 2);
          const status = (parseString(row.c[6]) as "Paid" | "Running" | "Pending") || (label === "Nov" ? "Running" : "Paid");
          const notes = parseString(row.c[7]);

          ebCycles.push({
            cycle: label,
            unitsUsed: units,
            computedCost: computed,
            billedAmount: billed,
            peopleSharing: people,
            myShare: share,
            status,
            notes,
          });
        }
      });
    }

    // Parse EB Meter Readings
    const ebReadings: TrackerEBReading[] = [];
    if (readingsData?.table?.rows) {
      readingsData.table.rows.forEach((row, idx) => {
        const dt = parseString(row.c[0]) || parseGVizDate(row.c[0]);
        const reading = row.c[1] ? parseNumber(row.c[1].v ?? row.c[1].f) : 0;
        if (!dt && !reading) return;
        const units = row.c[2] ? parseNumber(row.c[2].v ?? row.c[2].f) : null;
        const cost = row.c[3] ? parseNumber(row.c[3].v ?? row.c[3].f) : null;
        const days = row.c[4] ? parseNumber(row.c[4].v ?? row.c[4].f) : null;
        const perDay = row.c[5] ? parseNumber(row.c[5].v ?? row.c[5].f) : null;
        const cycle = parseString(row.c[6]) || "Running";

        ebReadings.push({
          id: `reading-${idx}`,
          dateTimeStr: dt,
          meterReading: reading,
          unitsUsed: units,
          cost,
          daysSincePrevious: days,
          unitsPerDay: perDay,
          billingCycle: cycle,
        });
      });

      // Ensure recent readings are on top
      ebReadings.reverse();

      if (ebReadings.length > 0) {
        // Dynamic derivation of latest reading and date from readings data
        const sortedByReading = [...ebReadings].sort((a, b) => b.meterReading - a.meterReading);
        const latestItem = sortedByReading[0];
        if (latestItem) {
          if (!ebMeta.latestReading || latestItem.meterReading >= ebMeta.latestReading) {
            ebMeta.latestReading = latestItem.meterReading;
          }
          if (latestItem.dateTimeStr && (!ebMeta.latestReadingDate || latestItem.meterReading >= ebMeta.latestReading)) {
            ebMeta.latestReadingDate = latestItem.dateTimeStr;
          }
        }
      }

      // Safe fallback if sheet summary and readings had no values
      if (!ebMeta.latestReading) {
        ebMeta.latestReading = SEED_TRACKERS_DATA.ebMeta.latestReading;
      }
      if (!ebMeta.latestReadingDate) {
        ebMeta.latestReadingDate = SEED_TRACKERS_DATA.ebMeta.latestReadingDate;
      }
    }

    // Parse Placement Tracker
    const jobApplications: TrackerJobApplication[] = [];
    if (placementData?.table?.rows) {
      placementData.table.rows.forEach((row, idx) => {
        const comp = parseString(row.c[0]);
        if (!comp || comp.toLowerCase() === "company") return;
        const role = parseString(row.c[1]);
        const loc = parseString(row.c[2]);
        let appliedDate = parseGVizDate(row.c[3]) || parseString(row.c[3]);
        const source = parseString(row.c[4]) || "Superset";
        const status = parseString(row.c[5]) || "Applied";
        const lastUpdate = parseString(row.c[6]);
        const lastUpdatedDate = parseGVizDate(row.c[7]) || parseString(row.c[7]);
        const recruiter = parseString(row.c[8]);
        const stage = parseString(row.c[9]);
        const notes = parseString(row.c[10]);
        const nextAction = parseString(row.c[11]);

        // Fallback: If Column D (Applied Date) was left empty in sheet, use Column H (Last Updated Date)
        if (!appliedDate && lastUpdatedDate) {
          appliedDate = lastUpdatedDate;
        }

        // Clean up any remaining Date(...) pattern
        if (appliedDate && appliedDate.startsWith("Date(")) {
          appliedDate = parseGVizDate({ v: appliedDate });
        }

        jobApplications.push({
          id: `job-${idx}`,
          company: comp,
          role,
          location: loc,
          appliedDate,
          source,
          status,
          lastUpdate,
          lastUpdatedDate,
          recruiter,
          interviewStage: stage,
          notes,
          nextAction,
        });
      });
    }

    // Parse Purchases
    const purchases: TrackerPurchase[] = [];
    if (purchaseData?.table?.rows) {
      // GViz discards minority string values in otherwise numeric columns.
      // Read missing prices in isolation, verifying the row identity before using them.
      const recoveredPrices = new Map<number, GVizCell>();
      await Promise.all(purchaseData.table.rows.map(async (row, idx) => {
        if (!parseString(row.c[1]) || row.c[8]?.v != null || row.c[8]?.f) return;
        const sheetRow = idx + 2;
        const isolated = await fetchGVizSheet("Purchase Summary", `A${sheetRow}:M${sheetRow}`);
        const candidate = isolated?.table.rows[0];
        if (candidate && [0, 1, 2, 3, 4, 7].every(column => parseString(candidate.c[column]) === parseString(row.c[column])) && candidate.c[8]) {
          recoveredPrices.set(idx, candidate.c[8]);
        }
      }));
      purchaseData.table.rows.forEach((row, idx) => {
        const prod = parseString(row.c[1]);
        if (!prod || prod.toLowerCase() === "product") return;
        const brand = parseString(row.c[2]);
        let model = parseString(row.c[3]);
        const oDate = parseString(row.c[4]) || parseGVizDate(row.c[4]);
        const dDate = parseString(row.c[5]) || parseGVizDate(row.c[5]);
        const seller = parseString(row.c[7]);
        const { price, priceFormatted } = parsePurchasePrice(recoveredPrices.get(idx) ?? row.c[8]);
        const mode = parseString(row.c[9]);
        const loc = parseString(row.c[10]);
        const days = row.c[11] ? parseNumber(row.c[11].v ?? row.c[11].f) : 0;
        const timeSince = parseString(row.c[12]);

        purchases.push({
          sNo: idx + 1,
          product: prod,
          brand,
          model,
          orderDate: oDate,
          deliveryDate: dDate,
          seller,
          price,
          priceFormatted,
          paymentMode: mode,
          location: loc,
          daysSinceDelivery: days,
          timeSinceDelivery: timeSince,
        });
      });
    }

    // Calculate life stats only when a birthday is supplied in the connected sheet.
    const now = new Date();
    const lifeStats: TrackerLifeStats = {
      birthdate: "",
      ageYears: 0,
      totalDays: 0,
      totalMonths: 0,
      totalWeeks: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      daysUntilNextBirthday: 0,
      planetAges: { mercury: 0, venus: 0, mars: 0, jupiter: 0 },
    };

    const birthdayRow = timeData?.table?.rows?.find((row) =>
      parseString(row.c[0]).toLowerCase().includes("birthdate")
    );
    const birthdateValue = birthdayRow ? parseString(birthdayRow.c[1]) : "";
    const birthdate = birthdateValue ? new Date(birthdateValue) : null;
    if (birthdate && !Number.isNaN(birthdate.getTime())) {
      const diffMs = Math.max(0, now.getTime() - birthdate.getTime());
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const ageYears = Math.floor(diffDays / 365.25);
      const totalWeeks = Math.floor(diffDays / 7);
      const totalMonths = Math.floor(diffDays / 30.4375);
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalSeconds = Math.floor(diffMs / 1000);

      let nextBday = new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      if (nextBday.getTime() < now.getTime()) {
        nextBday = new Date(now.getFullYear() + 1, birthdate.getMonth(), birthdate.getDate());
      }
      const daysUntilNextBirthday = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      Object.assign(lifeStats, {
        birthdate: birthdateValue,
        ageYears,
        totalDays: diffDays,
        totalMonths,
        totalWeeks,
        totalHours,
        totalMinutes,
        totalSeconds,
        daysUntilNextBirthday,
        planetAges: {
          mercury: Math.round((diffDays / 87.97) * 100) / 100,
          venus: Math.round((diffDays / 224.7) * 100) / 100,
          mars: Math.round((diffDays / 686.98) * 100) / 100,
          jupiter: Math.round((diffDays / (11.86 * 365.25)) * 100) / 100,
        },
      });
    }

    if (timeData?.table?.rows) {
      timeData.table.rows.forEach((row) => {
        const label = parseString(row.c[0]);
        const val = parseString(row.c[1]);
        if (label.toLowerCase().includes("birthdate")) lifeStats.birthdate = val;
        else if (label.includes("Current Age")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.ageYears = num;
        } else if (label.includes("Total Days")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.totalDays = num;
        } else if (label.includes("Months")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.totalMonths = num;
        } else if (label.includes("Weeks")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.totalWeeks = num;
        } else if (label.includes("Hours")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.totalHours = num;
        } else if (label.includes("Minutes")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.totalMinutes = num;
        } else if (label.includes("Seconds")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.totalSeconds = num;
        } else if (label.includes("Next Birthday")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.daysUntilNextBirthday = num;
        } else if (label.includes("Mercury")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.planetAges.mercury = num;
        } else if (label.includes("Venus")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.planetAges.venus = num;
        } else if (label.includes("Mars")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.planetAges.mars = num;
        } else if (label.includes("Jupiter")) {
          const num = parseNumber(val);
          if (num > 0) lifeStats.planetAges.jupiter = num;
        }
      });
    }

    // Parse Investment Journal
    const investments: TrackerInvestmentJournal = {
      ...SEED_TRACKERS_DATA.investments,
      levels: [...SEED_TRACKERS_DATA.investments.levels.map((l) => ({ ...l }))],
      contributors: [...SEED_TRACKERS_DATA.investments.contributors.map((c) => ({ ...c }))],
    };

    if (investmentData?.table?.rows) {
      investmentData.table.rows.forEach((row) => {
        const c0 = parseString(row.c[0]);
        const amt = parseNumber(row.c[1]?.v ?? row.c[1]?.f);

        if (c0.includes("Grand Total (School + University")) {
          if (amt > 0) {
            investments.grandTotal = amt;
            investments.grandTotalFormatted = `₹${amt.toLocaleString("en-IN")}`;
          }
        } else if (c0.includes("Pre-School")) {
          if (amt > 0 && investments.levels[0]) investments.levels[0].totalExpense = amt;
        } else if (c0.includes("Primary (1st to 8th)")) {
          if (amt > 0 && investments.levels[1]) investments.levels[1].totalExpense = amt;
        } else if (c0.includes("Secondary (9th to 10th)")) {
          if (amt > 0 && investments.levels[2]) investments.levels[2].totalExpense = amt;
        } else if (c0.includes("Higher Secondary")) {
          if (amt > 0 && investments.levels[3]) investments.levels[3].totalExpense = amt;
        } else if (c0.includes("University (1st to 4th Year")) {
          if (amt > 0) {
            investments.universityTotal = amt;
            if (investments.levels[4]) investments.levels[4].totalExpense = amt;
          }
        } else {
          // Check contributor names from sheet
          const contributor = investments.contributors.find((c) =>
            c0.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(c0.toLowerCase())
          );
          if (contributor && amt > 0) {
            contributor.amount = amt;
            contributor.status = "Paid";
          }
        }
      });

      // Recalculate school total dynamically
      const schoolLevelsTotal = investments.levels
        .slice(0, 4)
        .reduce((acc, curr) => acc + (curr.totalExpense || 0), 0);
      if (schoolLevelsTotal > 0) {
        investments.schoolTotal = schoolLevelsTotal;
      }

      if (!investments.grandTotal && investments.universityTotal && investments.schoolTotal) {
        investments.grandTotal = investments.universityTotal + investments.schoolTotal;
        investments.grandTotalFormatted = `₹${investments.grandTotal.toLocaleString("en-IN")}`;
      }
    }

    // Parse Antigravity Token Expiry
    const antigravityTokens: TrackerAntigravityToken[] = [];
    if (tokenExpiryData?.table?.rows) {
      tokenExpiryData.table.rows.forEach((row, idx) => {
        let email = parseString(row.c[0]);
        if (!email) return;
        email = email.replace(/^[-\s]+/, "").trim();
        if (!email.includes("@")) return;

        const lastUsed = parseString(row.c[1]) || parseGVizDate(row.c[1]);
        const cooldownDays = parseNumber(row.c[2]?.v ?? row.c[2]?.f) || 7;
        const availableAgain = parseString(row.c[3]) || parseGVizDate(row.c[3]);
        const daysLeft = parseNumber(row.c[4]?.v ?? row.c[4]?.f);
        const status = parseString(row.c[5]) || (daysLeft <= 0 ? "✅ Available" : `⏳ ${daysLeft} days left`);
        const chromeProfile = parseString(row.c[6]) || "Unknown";
        const isAvailable = daysLeft <= 0 || status.toLowerCase().includes("available");

        antigravityTokens.push({
          id: `token-${idx}`,
          email,
          lastUsed,
          cooldownDays,
          availableAgain,
          daysLeft,
          status,
          chromeProfile,
          isAvailable,
        });
      });
    }

    const tokensList = antigravityTokens.length > 0 ? antigravityTokens : SEED_ANTIGRAVITY_TOKENS;
    const availableCount = tokensList.filter((t) => t.isAvailable).length;
    const inCooldownCount = tokensList.length - availableCount;

    const profileMap = new Map<string, number>();
    tokensList.forEach((t) => {
      const p = t.chromeProfile || "Unknown";
      profileMap.set(p, (profileMap.get(p) || 0) + 1);
    });
    const profileDist = Array.from(profileMap.entries()).map(([profile, count]) => ({ profile, count }));

    const cooldownTokens = tokensList.filter((t) => !t.isAvailable);
    const sortedCooldown = [...cooldownTokens]
      .filter((t) => t.daysLeft > 0 && t.availableAgain)
      .sort((a, b) => a.daysLeft - b.daysLeft);
    const nextAvailableDate = sortedCooldown[0]?.availableAgain || (cooldownTokens[0]?.availableAgain ?? "All Available");

    const antigravityTokenSummary: TrackerAntigravityTokenSummary = {
      total: tokensList.length,
      available: availableCount,
      inCooldown: inCooldownCount,
      nextAvailableDate,
      profiles: profileDist,
    };

    return {
      spreadsheetId: GOOGLE_SHEET_ID,
      spreadsheetUrl: GOOGLE_SHEET_URL,
      lastSyncedAt: new Date().toISOString(),
      isLive: true,
      totalMonthlyBudget,
      budgetSync: budgetData ? "fresh" : "unavailable",
      budgetUpdatedAt: budgetData ? syncStartedAt : undefined,
      categoryBudgets,
      expenses,
      journals,
      ebMeta,
      ebReadings: ebReadings.length > 0 ? ebReadings : SEED_TRACKERS_DATA.ebReadings,
      ebCycles: ebCycles.length > 0 ? ebCycles : SEED_TRACKERS_DATA.ebCycles,
      jobApplications: jobApplications.length > 0 ? jobApplications : SEED_TRACKERS_DATA.jobApplications,
      lifeStats,
      purchases: purchases.length > 0 ? purchases : SEED_TRACKERS_DATA.purchases,
      investments,
      antigravityTokens: tokensList,
      antigravityTokenSummary,
    };
  } catch (err) {
    console.error("Error syncing spreadsheet trackers:", err);
    return {
      ...SEED_TRACKERS_DATA,
      lastSyncedAt: new Date().toISOString(),
      isLive: false,
      error: String(err),
    };
  }
}
