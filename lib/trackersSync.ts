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
  process.env.TRACKERS_SPREADSHEET_ID ||
  process.env.NEXT_PUBLIC_TRACKERS_SPREADSHEET_ID ||
  "";
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

async function fetchGVizSheet(sheetName: string): Promise<GVizResponse | null> {
  if (!GOOGLE_SHEET_ID) return null;
  try {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start === -1 || end <= start) return null;
    return JSON.parse(text.slice(start, end)) as GVizResponse;
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

const SEED_2026_EXPENSES: TrackerExpense[] = [
  {
    id: "exp-1",
    year: 2026,
    item: "Cool drinks",
    amount: 50,
    dateStr: "31-Oct-2026",
    category: "Food and Grocery",
    balance: 1617,
  },
  {
    id: "exp-2",
    year: 2026,
    item: "Dinner",
    amount: 190,
    dateStr: "31-Oct-2026",
    category: "Dinner",
    balance: 1667,
  },
  {
    id: "exp-3",
    year: 2026,
    item: "Cab",
    amount: 1400,
    dateStr: "31-Oct-2026",
    category: "Commute",
    balance: 1857,
  },
  {
    id: "exp-4",
    year: 2026,
    item: "Cab",
    amount: 1440,
    dateStr: "31-Oct-2026",
    category: "Commute",
    balance: 3257,
  },
  {
    id: "exp-5",
    year: 2026,
    item: "Debited",
    amount: 500,
    dateStr: "30-Oct-2026",
    category: "Sent",
    balance: 4697,
  },
];

export const SEED_ANTIGRAVITY_TOKENS: TrackerAntigravityToken[] = [
  { id: "token-0", email: "token.drmf.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Dr MF", isAvailable: false },
  { id: "token-1", email: "token.feasto.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Feasto Admin", isAvailable: false },
  { id: "token-2", email: "token.feasto.02@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Feasto Admin", isAvailable: false },
  { id: "token-3", email: "token.santhosh.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Santhosh", isAvailable: false },
  { id: "token-4", email: "token.profile.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Unknown", isAvailable: false },
  { id: "token-5", email: "token.profile.02@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Unknow", isAvailable: false },
  { id: "token-6", email: "token.github.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Github", isAvailable: false },
  { id: "token-7", email: "token.profile.03@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Unknown", isAvailable: false },
  { id: "token-8", email: "token.github.02@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Github", isAvailable: false },
  { id: "token-9", email: "token.github.03@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-10", email: "token.github.04@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-11", email: "token.github.05@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-12", email: "token.github.06@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-13", email: "token.github.07@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-14", email: "token.santhosh.02@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-15", email: "token.santhosh.03@routino.dev", lastUsed: "4/11/26", cooldownDays: 7, availableAgain: "11-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-16", email: "token.feasto.03@routino.dev", lastUsed: "3/11/26", cooldownDays: 6, availableAgain: "09-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-17", email: "token.github.08@routino.dev", lastUsed: "1/11/26", cooldownDays: 7, availableAgain: "08-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-18", email: "token.santhosh.04@routino.dev", lastUsed: "1/11/26", cooldownDays: 7, availableAgain: "08-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-19", email: "token.santhosh.05@routino.dev", lastUsed: "1/11/26", cooldownDays: 7, availableAgain: "08-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-20", email: "token.feasto.04@routino.dev", lastUsed: "12/10/26", cooldownDays: 7, availableAgain: "19-Oct-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-21", email: "token.feasto.05@routino.dev", lastUsed: "25/9/26", cooldownDays: 7, availableAgain: "02-Oct-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-22", email: "token.profile.04@routino.dev", lastUsed: "19/9/26", cooldownDays: 7, availableAgain: "26-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-23", email: "token.github.09@routino.dev", lastUsed: "18/9/26", cooldownDays: 7, availableAgain: "25-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-24", email: "token.profile.05@routino.dev", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-25", email: "token.profile.06@routino.dev", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-26", email: "token.profile.07@routino.dev", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-27", email: "token.feasto.06@routino.dev", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-28", email: "token.feasto.07@routino.dev", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-29", email: "token.profile.08@routino.dev", lastUsed: "16/9/26", cooldownDays: 7, availableAgain: "23-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-30", email: "token.feasto.08@routino.dev", lastUsed: "30/6/26", cooldownDays: 7, availableAgain: "07-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-31", email: "token.profile.09@routino.dev", lastUsed: "7/7/26", cooldownDays: 7, availableAgain: "14-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknow", isAvailable: true },
  { id: "token-32", email: "token.github.10@routino.dev", lastUsed: "29/6/26", cooldownDays: 7, availableAgain: "06-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-33", email: "token.feasto.09@routino.dev", lastUsed: "29/6/26", cooldownDays: 7, availableAgain: "06-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-34", email: "token.feasto.10@routino.dev", lastUsed: "29/6/26", cooldownDays: 7, availableAgain: "06-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-35", email: "token.santhosh.06@routino.dev", lastUsed: "28/6/26", cooldownDays: 7, availableAgain: "05-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
];

export const SEED_ANTIGRAVITY_TOKEN_SUMMARY: TrackerAntigravityTokenSummary = {
  total: 36,
  available: 27,
  inCooldown: 9,
  nextAvailableDate: "13-Nov-2026",
  profiles: [
    { profile: "Dr MF", count: 1 },
    { profile: "Feasto Admin", count: 10 },
    { profile: "Santhosh", count: 7 },
    { profile: "Github", count: 10 },
    { profile: "Unknown", count: 8 },
  ],
};

/* ── Fallback Seed Data (from user's real sheet) ── */
export const SEED_TRACKERS_DATA: TrackersData = {
  spreadsheetId: GOOGLE_SHEET_ID,
  spreadsheetUrl: GOOGLE_SHEET_URL,
  lastSyncedAt: new Date().toISOString(),
  isLive: false,
  totalMonthlyBudget: 7500,
  categoryBudgets: [
    { category: "House Rent", budget: 0 },
    { category: "Investments", budget: 500 },
    { category: "Food & Grocery", budget: 500 },
    { category: "Commute", budget: 200 },
    { category: "Entertainment", budget: 500 },
    { category: "Insurance", budget: 0 },
    { category: "Mobile", budget: 900 },
    { category: "Internet", budget: 0 },
    { category: "Grooming", budget: 500 },
    { category: "Others", budget: 2400 },
    { category: "Utilities", budget: 2000 },
  ],
  expenses: SEED_2026_EXPENSES,
  journals: {
    "2026": {
      key: "2026",
      title: "2026 Journal",
      year: 2026,
      totalSpent: 3580,
      totalIncome: 0,
      latestBalance: 1617,
      expenses: SEED_2026_EXPENSES,
    },
    "2026-fampay": {
      key: "2026-fampay",
      title: "2026 Fam Pay",
      year: 2026,
      isFamPay: true,
      totalSpent: 2106,
      totalIncome: 0,
      latestBalance: null,
      expenses: [],
    },
    "2025": {
      key: "2025",
      title: "2025 Journal",
      year: 2025,
      totalSpent: 2615,
      totalIncome: 0,
      latestBalance: 2027,
      expenses: [],
    },
    "2025-fampay": {
      key: "2025-fampay",
      title: "2025 Fam Pay",
      year: 2025,
      isFamPay: true,
      totalSpent: 10,
      totalIncome: 200,
      latestBalance: null,
      expenses: [],
    },
    "2024": {
      key: "2024",
      title: "2024 Journal",
      year: 2024,
      totalSpent: 200,
      totalIncome: 200,
      latestBalance: null,
      expenses: [],
    },
    "2024-fampay": {
      key: "2024-fampay",
      title: "2024 Fam Pay",
      year: 2024,
      isFamPay: true,
      totalSpent: 10,
      totalIncome: 260,
      latestBalance: 9238,
      expenses: [],
    },
    "2023": {
      key: "2023",
      title: "2023 Journal",
      year: 2023,
      totalSpent: 456,
      totalIncome: 2100,
      latestBalance: 1971,
      expenses: [],
    },
    "pg": {
      key: "pg",
      title: "PG Expenses",
      year: 2026,
      isPG: true,
      totalSpent: 7490,
      totalIncome: 18000,
      latestBalance: 10281,
      expenses: [],
    },
  },
  ebMeta: {
    rateTillSep: 10,
    currentRate: 12,
    latestReading: 323.0,
    latestReadingDate: "07 Nov 2026, 9:40 AM",
  },
  ebReadings: [
    {
      id: "eb-r0",
      dateTimeStr: "07 Nov 2026, 9:40 AM",
      meterReading: 323.0,
      unitsUsed: 3.3,
      cost: 33.0,
      daysSincePrevious: 3.43,
      unitsPerDay: 0.96,
      billingCycle: "Nov",
    },
    {
      id: "eb-r0-b",
      dateTimeStr: "03 Nov 2026, 11:14 PM",
      meterReading: 319.7,
      unitsUsed: 1.3,
      cost: 13.0,
      daysSincePrevious: 1.37,
      unitsPerDay: 0.95,
      billingCycle: "Nov",
    },
    {
      id: "eb-r0-c",
      dateTimeStr: "02 Nov 2026, 2:21 PM",
      meterReading: 318.4,
      unitsUsed: 0.4,
      cost: 4.0,
      daysSincePrevious: 1.64,
      unitsPerDay: 0.24,
      billingCycle: "Nov",
    },
    {
      id: "eb-r1",
      dateTimeStr: "01 Nov 2026, 2:21 PM",
      meterReading: 318.06,
      unitsUsed: 0.06,
      cost: 0.6,
      daysSincePrevious: 0.64,
      unitsPerDay: 0.09,
      billingCycle: "Nov",
    },
    {
      id: "eb-r2",
      dateTimeStr: "31 Oct 2026, 10:59 PM",
      meterReading: 318.0,
      unitsUsed: 1.4,
      cost: 14.0,
      daysSincePrevious: 1.96,
      unitsPerDay: 0.71,
      billingCycle: "Oct",
    },
    {
      id: "eb-r3",
      dateTimeStr: "29 Oct 2026, 11:58 PM",
      meterReading: 316.6,
      unitsUsed: 12.0,
      cost: 120.0,
      daysSincePrevious: 10.96,
      unitsPerDay: 1.1,
      billingCycle: "Oct",
    },
  ],
  ebCycles: [
    {
      cycle: "Aug",
      unitsUsed: 69,
      computedCost: 690,
      billedAmount: 690,
      peopleSharing: 2,
      myShare: 420,
      status: "Paid",
      notes: "Billed Rs 690. I paid Rs 420, roommate paid Rs 270.",
    },
    {
      cycle: "Sep",
      unitsUsed: 147.6,
      computedCost: 1476,
      billedAmount: 1500,
      peopleSharing: 2,
      myShare: 750,
      status: "Paid",
      notes: "Billed as 150 units = Rs 1500. Split by 2, my share Rs 750.",
    },
    {
      cycle: "Oct",
      unitsUsed: 64,
      computedCost: 768,
      billedAmount: 768,
      peopleSharing: 2,
      myShare: 384,
      status: "Paid",
      notes: "Estimate from readings. Split by 2.",
    },
    {
      cycle: "Nov",
      unitsUsed: 0.06,
      computedCost: 0.72,
      billedAmount: 0.72,
      peopleSharing: 2,
      myShare: 0.36,
      status: "Running",
      notes: "Ongoing billing cycle.",
    },
  ],
  jobApplications: [
    {
      id: "job-1",
      company: "NyneOS Technologies",
      role: "Full Stack Developer / QA Automation Engineer / Client Lead",
      location: "Remote & Co-Located",
      appliedDate: "2026-01-27",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied (registration deadline 27 Jan 2026). Process: CV Shortlisting -> Assignment -> Situation discussion",
      notes: "Applied for Full Stack Developer track (also had QA Automation Engineer / Client Lead options). Remote & Co-location, Delhi NCR. Stipend Rs 25,000/month, PPO Rs 7-15L/yr. Resume used: Santhosh VS.",
      nextAction: "Wait",
    },
    {
      id: "job-2",
      company: "Hindustan Power",
      role: "IT Intern",
      location: "Delhi NCR",
      appliedDate: "2026-02-07",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied",
      notes: "Role: IT Intern, Delhi NCR, 12-month internship. Stipend Rs 20,000/month, CTC on conversion Rs 5.5-6.5L/yr. Resume used: Santhosh VS.",
      nextAction: "Wait",
    },
    {
      id: "job-3",
      company: "Reltio",
      role: "Software Engineering",
      location: "Bangalore (Hybrid)",
      appliedDate: "2026-03-01",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied. Process: OA (DSA/coding) -> 2 Technical Discussions -> Managerial Discussion -> HR Discussion (final round on-campus)",
      notes: "Role: Intern Software Engineering, Bangalore (Hybrid). Stipend Rs 60,000/month, 6-month internship (extendable), PPO CTC Rs 15-17L/yr. Expected start 1 Jul 2026. Registration deadline was 1 Mar 2026. Resume used: Santhosh VS.",
      nextAction: "Wait",
    },
    {
      id: "job-4",
      company: "Lokal",
      role: "React Native / Mobile App Developer",
      location: "Remote",
      appliedDate: "2026-03-12",
      source: "Company Careers / Job Portal",
      status: "Rejected",
      lastUpdate: "Applied -> Assessment Shortlist -> Interview Shortlist (11 Jun) -> Interview (16 Jun, Online) -> Rejected (18 Jun)",
      lastUpdatedDate: "2026-06-18",
      recruiter: "Lokal Talent Team (via workablemail)",
      interviewStage: "HR",
      notes: "Applied 12 Mar (React Native Intern). Shortlisted for assignment ~5 Jun. Shortlisted for interview 11 Jun (with Vansh Mehta, Shaurya Bansal, Abhay Chaudhary). Interview held online Tue 16 Jun. Rejection email received 18 Jun - process ended after interview, no offer. Role CTC (FT): Rs 12L/yr, stipend Rs 40,000/month. Resume used: VS_Santhosh_React_Native.",
      nextAction: "Archive",
    },
    {
      id: "job-5",
      company: "United Airlines",
      role: "Gen AI",
      location: "Gurgaon",
      appliedDate: "2026-04-07",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied (no update since)",
      notes: "Role: Gen AI Intern, Gurgaon (hybrid), 6-month internship for 2027 batch. Stipend Rs 25,000/month, PPO Rs 9L/yr (performance-based). CTC not disclosed by company. Resume used: Santhosh VS Python.",
      nextAction: "Wait",
    },
    {
      id: "job-6",
      company: "Centific",
      role: "Multiple Roles",
      location: "Hyderabad",
      appliedDate: "2026-04-07",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied - tied to Centific Premier Hackathon 2.0 (14-day residential, Hyderabad) + 1-week case study, 20 Apr-3 May 2026",
      notes: "Hyderabad (Raheja Mindspace). CTC/PPO Rs 12L/yr, hackathon stipend Rs 50k. Full attendance mandatory; completion required for internship/PPO evaluation. Resume used: Santhosh VS STAR Resume.",
      nextAction: "Wait",
    },
    {
      id: "job-7",
      company: "AFFORD Medical Technologies",
      role: "Full Stack Developer",
      location: "Hyderabad",
      appliedDate: "2026-05-03",
      source: "Superset",
      status: "Did Not Attend",
      lastUpdate: "Registered -> OA scheduled 11 May (on-campus only) -> Did Not Attend (travel distance) -> Process closed 4 Jun",
      lastUpdatedDate: "2026-06-04",
      recruiter: "Pallavi Mehta / Akshi Singh (Career Services)",
      interviewStage: "Application",
      notes: "Registered by 3 May deadline. OA held 11 May 2026, campus-only (lab-based), could not attend due to travel distance. Only students physically present at the 11 May OA advanced; on-campus interview round ran 2-4 Jun 2026 for a final shortlist of 7 candidates - confirmed not among them. Process fully concluded 4 Jun 2026. Role CTC: Rs 3L during probation -> Rs 8L/yr post-confirmation. Resume used: Santhosh VS STAR Resume.",
      nextAction: "Archive",
    },
    {
      id: "job-8",
      company: "Futuresoft Technologies",
      role: "AI Intern",
      location: "Noida",
      appliedDate: "2026-05-07",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied",
      notes: "Role: AI/Creative Intern (Photoshop retouching, AI image/video generation). Stipend Rs 10,000/month. Resume used: Santhosh VS.",
      nextAction: "Wait",
    },
    {
      id: "job-9",
      company: "Futures First",
      role: "Trainee - International Markets",
      location: "Gurgaon",
      appliedDate: "2026-07-28",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied. Process: Written Test (Quant/Analytical) -> Initial Interview -> HR Discussion -> Final Interview",
      notes: "Role: Trainee - International Markets. CTC ~Rs 18,30,000/yr (Fixed 13.8L + joining 1.5L + other benefits). Test was scheduled 28-29 Jul. Resume used: Santhosh VS STAR Resume.",
      nextAction: "Wait",
    },
    {
      id: "job-10",
      company: "Zenia Mobile",
      role: "Multiple Roles (Flutter / Full Stack)",
      location: "Remote",
      appliedDate: "2026-07-31",
      source: "Superset",
      status: "Did Not Attend",
      lastUpdate: "Applied -> Shortlisted for Interview 5 Aug (did not attend, not interested) -> Closed",
      lastUpdatedDate: "2026-08-05",
      recruiter: "Career Services / Zenia HR",
      interviewStage: "Application",
      notes: "Role listed as Remote, Full-Time, salary Rs 10,000/month with zero flexibility on comp. Interview invite received for Tue 5 Aug 2026; chose not to attend as role/compensation was not compelling. Process closed.",
      nextAction: "Archive",
    },
    {
      id: "job-11",
      company: "Vingo",
      role: "Software Engineering Intern",
      location: "Remote / Noida",
      appliedDate: "2026-08-04",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Application submitted. Awaiting updates.",
      notes: "Application submitted. Awaiting updates.",
      nextAction: "Wait",
    },
    {
      id: "job-12",
      company: "Curriculo Inc",
      role: "Technical Intern",
      location: "Remote",
      appliedDate: "2026-08-07",
      source: "Superset",
      status: "Rejected",
      lastUpdate: "Applied -> Video Interview invite sent (deadline 16 Aug, missed) -> Closed",
      lastUpdatedDate: "2026-08-25",
      recruiter: "Curriculo Hiring Team",
      interviewStage: "Interview",
      notes: "Recorded interview invite sent (link expired 16 Aug before submission). Process ended.",
      nextAction: "Archive",
    },
    {
      id: "job-13",
      company: "EVE Healthcare",
      role: "Software Development Intern",
      location: "Remote",
      appliedDate: "2026-08-07",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied. Awaiting OA / next round.",
      lastUpdatedDate: "2026-08-18",
      notes: "Internship (7 months) + PPO. Stipend Rs 10,000-15,000/month. Next step: OA.",
      nextAction: "Wait",
    },
    {
      id: "job-14",
      company: "Prodesk IT",
      role: "Full Stack / Java / React",
      location: "Coimbatore",
      appliedDate: "2026-08-13",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied via Superset.",
      lastUpdatedDate: "2026-08-13",
      notes: "Company also posted 5 other JDs (Full Stack Dev, Java Developer, DotNet Developer, ReactJS Developer, QA). Stipend Rs 10,000/month, CTC Rs 3.5L/yr.",
      nextAction: "Wait",
    },
    {
      id: "job-15",
      company: "Weekday (YC W21)",
      role: "Frontend Engineer Intern",
      location: "Remote / Bengaluru",
      appliedDate: "2026-08-20",
      source: "LinkedIn",
      status: "Applied",
      lastUpdate: "Applied via Weekday portal. Profile under review.",
      lastUpdatedDate: "2026-08-20",
      notes: "Role is for one of Weekday's clients (Weekday is a YC-backed recruiting/matching platform for engineers). Applied via referral.",
      nextAction: "Wait",
    },
    {
      id: "job-16",
      company: "KoinX",
      role: "Software Engineer Intern - Frontend",
      location: "Remote",
      appliedDate: "2026-08-23",
      source: "LinkedIn",
      status: "Applied",
      lastUpdate: "Applied via LinkedIn. Awaiting review.",
      lastUpdatedDate: "2026-08-23",
      notes: "Crypto tax platform (seed-funded fintech). Remote, stipend Rs 25,000-35,000/month. Stack: React, Next.js, TypeScript.",
      nextAction: "Wait",
    },
    {
      id: "job-17",
      company: "takeUforward",
      role: "Mobile App Developer Intern",
      location: "Remote",
      appliedDate: "2026-08-23",
      source: "Direct / Striver Team Outreach",
      status: "Applied",
      lastUpdate: "Applied. Awaiting assignment / screening.",
      lastUpdatedDate: "2026-08-23",
      notes: "Mobile engineering internship on takeUforward's in-house app. React Native/Flutter codebase. Stipend Rs 20,000-30,000/month.",
      nextAction: "Wait",
    },
    {
      id: "job-18",
      company: "Marsh",
      role: "AI Intern",
      location: "Gurgaon",
      appliedDate: "2026-08-25",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied via Superset. Registration submitted. Awaiting test / shortlist.",
      lastUpdatedDate: "2026-08-25",
      recruiter: "Bennett Placement Cell / Marsh HR",
      interviewStage: "Application",
      notes: "Final placement opportunity at Marsh (global insurance broker/risk advisor), for B.Tech AI batch 2027. Stipend Rs 30,000-35,000/month; CTC to be disclosed later. Resume used: marsh_resume.pdf.",
      nextAction: "Wait",
    },
    {
      id: "job-19",
      company: "MediNex Workforce",
      role: "Front End Developer Intern",
      location: "Remote",
      appliedDate: "2026-09-01",
      source: "LinkedIn (Easy Apply)",
      status: "Applied",
      lastUpdate: "Applied via LinkedIn Easy Apply. Caution: email asked for external personal details.",
      lastUpdatedDate: "2026-09-01",
      recruiter: "LinkedIn Recruiter",
      interviewStage: "Application",
      notes: "Entry-level/fresher front end internship, fully remote, flexible duration. Stipend Rs 14,500-15,900/month. Stack: HTML, CSS, JavaScript, React (component-level work, responsive layouts, cross-device testing). LinkedIn flagged profile as a high match. Over 100 applicants clicked apply. Resume used: MediNex_Workforce_Resume.pdf. CAUTION: Post-submission form asked to email personal details to unverified third-party external domains unrelated to 'Medinex'/'MediNex Workforce'. Classic sign of a recruitment scam/phishing pattern. Verify company legitimacy before sending any further personal info.",
      nextAction: "Verify Legitimacy",
    },
    {
      id: "job-20",
      company: "Codemonk",
      role: "Software Engineering Intern - Frontend (React.js)",
      location: "Bengaluru (On-site)",
      appliedDate: "2026-09-01",
      source: "LinkedIn -> Company Site (jobs.pyjamahr.com)",
      status: "Applied",
      lastUpdate: "Applied via PyjamaHR careers portal. Awaiting review.",
      lastUpdatedDate: "2026-09-01",
      recruiter: "Codemonk HR",
      interviewStage: "Application",
      notes: "6-month full-time internship, must relocate to Bangalore (on-site/hybrid). Stipend Rs 13,000-15,000/month, paid. Stack: React.js (hooks, context, state mgmt), JS ES6+, REST APIs, Webpack/Vite. Eligibility: Class of 2025/2026 grads (note: your passout year is 2027, slightly outside stated eligibility window - may be worth watching for an eligibility question). Over 2000 applicants on the post, company has ~66 employees. Resume used: Codemonk_Resume.pdf.",
      nextAction: "Wait",
    },
    {
      id: "job-21",
      company: "NyneOS Technologies (Sep Round)",
      role: "Full Stack Developer (ReactJS, GoLang)",
      location: "Delhi NCR / Remote",
      appliedDate: "2026-09-01",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied via Superset (fresh registration cycle, deadline 4 Sep 2026).",
      lastUpdatedDate: "2026-09-01",
      recruiter: "Bennett Placement Cell / NyneOS HR",
      interviewStage: "Application",
      notes: "NOTE: This is a separate/new NyneOS posting (fresh registration cycle, deadline 4 Sep 2026) - distinct from the earlier NyneOS application on 27 Jan 2026 (see that row), which never received a status update. Role: Full Stack Developer, ReactJS + GoLang, on-site with client teams, transitions into Go-Lang developer role. Hybrid (remote with biweekly in-person team meetings). Stipend Rs 25,000/month, PPO Rs 7-15L/yr (merit-based/variable). Resume used: NyneOS_Technologies_Resume.pdf.",
      nextAction: "Wait",
    },
    {
      id: "job-22",
      company: "Digiryte",
      role: "Software Engineer (role TBD - sourced via CTO outreach)",
      location: "India (Chennai/Coimbatore teams) / Remote, UK-linked",
      appliedDate: "2026-09-12",
      source: "LinkedIn (inbound recruiter outreach)",
      status: "Interviewing",
      lastUpdate: "CTO inbound outreach -> Round 3 Technical Challenge issued 12 Sep -> Follow-up call Fri 18 Sep 5:30 PM IST.",
      lastUpdatedDate: "2026-09-12",
      recruiter: "Digiryte CTO (via LinkedIn)",
      interviewStage: "Technical Challenge Round 3",
      notes: "Sourced directly by the CTO after he saw WaveChat project on GitHub/portfolio - inbound, not a job-board application. Digiryte operates Services (client project builds) + Products (own product launches); ~30 FTEs across Chennai/Coimbatore, ~5-10 in UK team; currently planning a healthcare product for the UK market. ROUND 3 TECHNICAL CHALLENGE issued 12 Sep, due within 5-6 days (~30-40 hrs total), AI tools permitted: (1) Secure/Scalable REST API; (2) Distributed Real-Time Sync. Submit GitHub repo + README for each, with live deployed URLs. Follow-up call to discuss solution: Fri 18 Sep, 5:30 PM IST.",
      nextAction: "Submit Challenge & Attend Call",
    },
    {
      id: "job-23",
      company: "Josh Talks",
      role: "Product Operations Intern",
      location: "Gurugram (On-site)",
      appliedDate: "2026-09-09",
      source: "LinkedIn -> Company Google Form",
      status: "Shortlisted",
      lastUpdate: "Shortlisted 9 Sep 2026 -> Take-home dataset assignment issued -> Deadline 14 Sep 2026 10:00 AM.",
      lastUpdatedDate: "2026-09-09",
      recruiter: "Josh Talks Dataset Team",
      interviewStage: "Task Assignment",
      notes: "Role on Josh Talks' Dataset team, building speech datasets (ASR) across Indian languages - blends ops + product work: managing speakers/raters/vendors, onboarding, QC checks, dataset/quality metrics, and workflow tooling with Product & Tech teams. Duration 3-6 months. Speech-AI focused company (State Space Models, targeting <200ms latency / <5% WER); ~987 employees, hired 1 person from Bennett University before. 356 applicants on the post already. Resume used: Santhosh_Josh_Talks_Resume.pdf. SHORTLISTED 9 Sep 2026: sent a task/assignment to assess approach and problem-solving ability. Task brief: https://drive.google.com/file/d/1UpNfc7Seo2AgU70hh1qOWNQbC_x3rpHu/view Submission form: https://forms.gle/d9U2Xqt13k9z8f6GA -- Deadline 14 Sep 2026, 10:00 AM.",
      nextAction: "Complete Dataset Task",
    },
    {
      id: "job-24",
      company: "Google",
      role: "Application Engineering Intern (Winter 2027)",
      location: "Bengaluru",
      appliedDate: "2026-09-12",
      source: "Google Careers (via Bennett Placement referral)",
      status: "Applied",
      lastUpdate: "Application submitted via referral link before 15 Sep deadline.",
      lastUpdatedDate: "2026-09-12",
      recruiter: "Google Campus Recruiting",
      interviewStage: "Application",
      notes: "6-month internship (26 weeks), starting Jan 2027 onwards. Stipend Rs 1-1.1 lakh/month. Requires strong general-purpose programming, SQL/Spring/REST-SOAP/JS-TS a plus. Application deadline was 15 Sep 2026. Confirmed on the form: legally eligible to work in India, no sponsorship needed. Resume used: Google_Resume.pdf.",
      nextAction: "Wait",
    },
    {
      id: "job-25",
      company: "GreyOrange",
      role: "Software Support Intern",
      location: "Gurugram (Hybrid)",
      appliedDate: "2026-09-24",
      source: "Superset / Google Form (via Bennett Placement Cell)",
      status: "OA Scheduled",
      lastUpdate: "Interview drive scheduled for Saturday 26 Sep at Gurugram office.",
      lastUpdatedDate: "2026-09-24",
      recruiter: "Bennett Placement Cell / GreyOrange HR",
      interviewStage: "In-Person Interview Drive",
      notes: "6-month internship, Customer Assistance Team, hybrid Gurugram, rotational shifts. Stipend Rs 25,000/month. No confirmed PPO/FT conversion currently. Skills required: Linux, SQL, Java/Python/C++, troubleshooting, technical support for warehouse management/automation tech. Eligible batches: 2026 passouts & 2027 ongoing. Bennett placement team noted strong HR discussion. INTERVIEW DRIVE 26 Sep 2026 (Saturday), in-person at Gurugram office. Arrive 10-15 min early. Confirmation form: https://forms.gle/jjXNdrUzUCS8mVeNA. Recommended prep: SQL queries, Linux commands, problem-solving.",
      nextAction: "Attend Drive on 26 Sep",
    },
    {
      id: "job-26",
      company: "Hireflux",
      role: "Front End Developer",
      location: "Bangalore / Remote",
      appliedDate: "2026-09-12",
      source: "Inbound Recruiter Email",
      status: "Applied",
      lastUpdate: "Unsolicited outreach received. Verification pending.",
      lastUpdatedDate: "2026-09-12",
      recruiter: "Hireflux Recruiter",
      interviewStage: "Application",
      notes: "Unsolicited outreach, not a self-initiated application. Compensation: up to Rs 5 LPA (unspecified exact figure). CAUTION: email does not name the actual hiring company beyond the sender domain - unclear if Hireflux is the employer or a staffing/recruiting agency working on behalf of an unnamed client. Generic 'came across your profile' framing and vague comp range are mild red flags typical of low-quality recruiting outreach. Proceed cautiously - verify company legitimacy before sharing further personal info.",
      nextAction: "Verify Legitimacy",
    },
    {
      id: "job-27",
      company: "The Wedding Company",
      role: "Frontend Engineering Intern",
      location: "Bengaluru",
      appliedDate: "2026-09-15",
      source: "Superset / Google Form",
      status: "Applied",
      lastUpdate: "Applied via Superset. Online Technical Assessment scheduled.",
      lastUpdatedDate: "2026-09-15",
      recruiter: "The Wedding Company Talent Team",
      interviewStage: "Online Technical Assessment",
      notes: "India's largest wedding planning/fulfillment company, $10M annual GMV, backed by Arash Ferdowsi (Dropbox co-founder) and Chaitanya Ramalingegowda (Wakefit co-founder). Full-year internship (Oct 2026-Jul 2027, spanning 7th & 8th semesters). Stipend Rs 30,000/month + up to Rs 10,000/month performance variable, PPO ~Rs 15L/yr based on performance. 100% online hiring process. Frontend stack: React.js, JS, HTML/CSS, Tailwind, REST APIs. Online Technical Assessment tomorrow evening, 16 Sep. Resume used: The_Wedding_Company_Resume.pdf.",
      nextAction: "Take OA",
    },
    {
      id: "job-28",
      company: "Spotter AI",
      role: "FullStack Engineer - React + Django (AI Systems)",
      location: "Fully Remote (India eligible)",
      appliedDate: "2026-09-17",
      source: "Inbound Email -> Company Careers (Teamtailor)",
      status: "Applied",
      lastUpdate: "Applied via careers.spotter.ai. Status: In process.",
      lastUpdatedDate: "2026-09-17",
      recruiter: "Alex (Spotter AI recruiting)",
      interviewStage: "Application",
      notes: "US-based trucking startup, fully remote, distributed team (hiring across Argentina, India, Colombia, Mexico, Pakistan, Philippines). Role: end-to-end feature ownership across React/MUI frontend and Python/Django (DRF) backend, implementing algorithmic/AI logic (scoring, ranking, decision rules). Bonus points for AI-assisted coding (Claude Code/Cursor), GCP/Redis/Docker, React Native. Process: resume review -> practical assessment ($100 bonus on successful completion). No compensation range disclosed in the posting. Resume used: Spotter_AI_Resume.pdf.",
      nextAction: "Wait for Assessment",
    },
    {
      id: "job-29",
      company: "Vahan.ai",
      role: "Software Engineer Intern (SDE Intern)",
      location: "Bengaluru - HSR (On-site, 5 days/week)",
      appliedDate: "2026-09-19",
      source: "LinkedIn -> Company Google Form",
      status: "Applied",
      lastUpdate: "Applied via LinkedIn, submitted company Google Form. Awaiting response.",
      lastUpdatedDate: "2026-09-19",
      recruiter: "Reena P (Talent, Vahan.ai)",
      interviewStage: "Application",
      notes: "YC-backed AI hiring marketplace for blue-collar workers; also backed by Khosla Ventures, Airtel, and Vijay Shekhar Sharma (Paytm CEO). ~359 employees. 6-month internship, in-office at HSR Bengaluru, 5 days/week. Stack: React + Node.js + PostgreSQL. Requires at least one prior SWE internship - satisfied (MF360 + HVF). Form confirmed: available for 6-month internship, available for in-office HSR role, prior internship experience yes. LinkedIn flagged profile as high match; 2,110 applicants clicked apply in the first day. Resume used: Vahan_ai_Resume.pdf.",
      nextAction: "Wait",
    },
    {
      id: "job-30",
      company: "Mercor (ChatGPT Data Project)",
      role: "ChatGPT Power User - Data Licensing Gig",
      location: "Remote (India-based)",
      appliedDate: "2026-09-21",
      source: "Inbound Recruiter Outreach (Mercor)",
      status: "Shortlisted",
      lastUpdate: "Selected 21 Sep -> Sign DocuSign Agreement -> Receive project invite -> $100 initial + $50/hr.",
      lastUpdatedDate: "2026-09-21",
      recruiter: "Mercor Talent Team",
      interviewStage: "Assessment / Contract",
      notes: "NOTE: This is NOT a software engineering role - it's freelance/gig work via Mercor on behalf of an undisclosed 'frontier AI lab' client. The actual ask is to LICENSE your personal ChatGPT conversation history for research/training data, paid $100 for the initial data license, then $50/hr for ongoing task work a few times/month. CONSIDER CAREFULLY before signing: this means handing over your actual ChatGPT conversation content to a third party - read the DocuSign agreement in full before signing. Eligibility: 40+ conversations Jan-Sep 2026, 1+ saved memory, account 3+ months old.",
      nextAction: "Review Agreement Carefully",
    },
    {
      id: "job-31",
      company: "Appreciate Platform",
      role: "Software Engineer Intern - Frontend",
      location: "Noida",
      appliedDate: "2026-09-24",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Applied via Superset. Registration deadline 24 Sep 2026, 10:00 AM. Awaiting shortlisting.",
      lastUpdatedDate: "2026-09-24",
      recruiter: "Pallavi Mehta (Bennett Career Services)",
      interviewStage: "Application",
      notes: "Wealth advisory fintech platform offering US stocks/ETFs to Indian residents. 12-month internship, stipend Rs 20,000/month, CTC post-internship Rs 7.20L (Fixed 6.5L + performance variable 70k). Hiring across Engineering (3: 2 Frontend + 1 Full Stack). Role wants JS/Dart, mobile dev exposure (React Native/Flutter/Android/iOS), pixel-perfect UI focus. Immediate joining, no travel required. Resume used: Appreciate_Resume.pdf.",
      nextAction: "Wait",
    },
  ],
  lifeStats: {
    birthdate: "June 2, 2005",
    ageYears: 21,
    totalDays: 7833,
    totalMonths: 257,
    totalWeeks: 1119,
    totalHours: 187992,
    totalMinutes: 11279520,
    totalSeconds: 676771200,
    daysUntilNextBirthday: 202,
    planetAges: {
      mercury: 89.01,
      venus: 34.81,
      mars: 11.4,
      jupiter: 1.77,
    },
  },
  purchases: [
    {
      sNo: 1,
      product: 'iPad Pro 12.9" (5th Gen)',
      brand: "Apple",
      model: "Wi-Fi, 256GB, Model 2021",
      orderDate: "2-Jan-2021",
      deliveryDate: "2-Jan-2021",
      seller: "Apple India Pvt Ltd",
      price: 99900,
      priceFormatted: "₹99,900.00",
      paymentMode: "Card",
      location: "Croma",
      daysSinceDelivery: 2140,
      timeSinceDelivery: "5 Years 10 Months 10 Days",
    },
    {
      sNo: 2,
      product: "Hard disk & Pendrive",
      brand: "SanDisk / Seagate",
      model: "External Storage",
      orderDate: "04-Jun-2023",
      deliveryDate: "05-Jun-2023",
      seller: "Amazon India",
      price: 4360,
      priceFormatted: "₹4,360.00",
      paymentMode: "UPI",
      location: "Amazon",
      daysSinceDelivery: 1252,
      timeSinceDelivery: "3 Years 5 Months 3 Days",
    },
    {
      sNo: 3,
      product: "Laptop",
      brand: "Dell",
      model: "Inspiron Core i5",
      orderDate: "03-Jun-2023",
      deliveryDate: "04-Jun-2023",
      seller: "Dell Authorized Store",
      price: 58000,
      priceFormatted: "₹58,000.00",
      paymentMode: "Card",
      location: "Dell Store",
      daysSinceDelivery: 1253,
      timeSinceDelivery: "3 Years 5 Months 4 Days",
    },
    {
      sNo: 4,
      product: "iPhone 15",
      brand: "Apple",
      model: "Blue, 128GB, Model MPWU3HN/A",
      orderDate: "05-Jul-2024",
      deliveryDate: "05-Jul-2024",
      seller: "Apple India Pvt Ltd",
      price: 72990,
      priceFormatted: "₹72,990.00",
      paymentMode: "UPI",
      location: "Aptronix - Ambattur",
      daysSinceDelivery: 860,
      timeSinceDelivery: "2 Years 4 Months 7 Days",
    },
    {
      sNo: 5,
      product: "USB-C Power Adapter",
      brand: "Apple",
      model: "20W USB-C Power Adapter",
      orderDate: "05-Jul-2024",
      deliveryDate: "05-Jul-2024",
      seller: "Apple India Pvt Ltd",
      price: 1900,
      priceFormatted: "₹1,900.00",
      paymentMode: "UPI",
      location: "Aptronix - Ambattur",
      daysSinceDelivery: 860,
      timeSinceDelivery: "2 Years 4 Months 7 Days",
    },
    {
      sNo: 6,
      product: "AppleCare+ Plan",
      brand: "Apple",
      model: "AppleCare+ for iPhone 15",
      orderDate: "31-Jul-2024",
      deliveryDate: "31-Jul-2024",
      seller: "Apple India Pvt Ltd",
      price: 14900,
      priceFormatted: "₹14,900.00",
      paymentMode: "UPI",
      location: "Apple India",
      daysSinceDelivery: 834,
      timeSinceDelivery: "2 Years 3 Months 12 Days",
    },
    {
      sNo: 7,
      product: "Gaming Monitor",
      brand: "LG",
      model: "UltraGear 24-inch IPS 144Hz",
      orderDate: "11-Jan-2025",
      deliveryDate: "12-Jan-2025",
      seller: "Amazon India",
      price: 9999,
      priceFormatted: "₹9,999.00",
      paymentMode: "Card",
      location: "Amazon",
      daysSinceDelivery: 670,
      timeSinceDelivery: "1 Years 10 Months 1 Days",
    },
    {
      sNo: 8,
      product: "MacBook Air",
      brand: "Apple",
      model: "13″, Midnight, 10-core, 512GB",
      orderDate: "26-Jun-2025",
      deliveryDate: "27-Jun-2025",
      seller: "Apple India Pvt Ltd",
      price: 109900,
      priceFormatted: "₹109,900.00",
      paymentMode: "Net Banking",
      location: "Apple India",
      daysSinceDelivery: 503,
      timeSinceDelivery: "1 Years 4 Months 16 Days",
    },
    {
      sNo: 9,
      product: "EarPods (USB-C)",
      brand: "Apple",
      model: "Wired EarPods with USB-C Connector",
      orderDate: "26-Jun-2025",
      deliveryDate: "27-Jun-2025",
      seller: "Apple India Pvt Ltd",
      price: 2000,
      priceFormatted: "₹2,000.00",
      paymentMode: "Net Banking",
      location: "Apple India",
      daysSinceDelivery: 503,
      timeSinceDelivery: "1 Years 4 Months 16 Days",
    },
    {
      sNo: 10,
      product: "Magic Mouse",
      brand: "Apple",
      model: "Wireless, Multi-Touch Surface",
      orderDate: "26-Jun-2025",
      deliveryDate: "27-Jun-2025",
      seller: "Apple India Pvt Ltd",
      price: 7500,
      priceFormatted: "₹7,500.00",
      paymentMode: "Net Banking",
      location: "Apple India",
      daysSinceDelivery: 503,
      timeSinceDelivery: "1 Years 4 Months 16 Days",
    },
    {
      sNo: 11,
      product: "AirPods Pro 2",
      brand: "Apple",
      model: "2nd Gen with USB-C MagSafe Case",
      orderDate: "27-Jun-2025",
      deliveryDate: "28-Jun-2025",
      seller: "Apple India Pvt Ltd",
      price: 7000,
      priceFormatted: "₹7,000.00",
      paymentMode: "UPI",
      location: "Apple India",
      daysSinceDelivery: 502,
      timeSinceDelivery: "1 Years 4 Months 15 Days",
    },
    {
      sNo: 12,
      product: "AirPods Pro 2 AppleCare+",
      brand: "Apple",
      model: "AppleCare+ 2 Years Coverage",
      orderDate: "27-Jun-2025",
      deliveryDate: "28-Jun-2025",
      seller: "Apple India Pvt Ltd",
      price: 2900,
      priceFormatted: "₹2,900.00",
      paymentMode: "UPI",
      location: "Apple India",
      daysSinceDelivery: 502,
      timeSinceDelivery: "1 Years 4 Months 15 Days",
    },
    {
      sNo: 13,
      product: "USB-C to USB Adapter",
      brand: "Apple",
      model: "USB-C to USB-A Female Dongle",
      orderDate: "01-Jul-2025",
      deliveryDate: "02-Jul-2025",
      seller: "Apple India Pvt Ltd",
      price: 1900,
      priceFormatted: "₹1,900.00",
      paymentMode: "UPI",
      location: "Apple India",
      daysSinceDelivery: 498,
      timeSinceDelivery: "1 Years 4 Months 10 Days",
    },
    {
      sNo: 14,
      product: "Laptop Sleeve",
      brand: "DailyObjects",
      model: "13-inch Neoprene Sleeve",
      orderDate: "20-Jul-2025",
      deliveryDate: "21-Jul-2025",
      seller: "DailyObjects Online",
      price: 1508,
      priceFormatted: "₹1,508.00",
      paymentMode: "UPI",
      location: "DailyObjects",
      daysSinceDelivery: 479,
      timeSinceDelivery: "1 Years 3 Months 22 Days",
    },
    {
      sNo: 15,
      product: "USB C to Displayport",
      brand: "UGREEN",
      model: "4K 60Hz Braided Cable",
      orderDate: "27-Jul-2025",
      deliveryDate: "28-Jul-2025",
      seller: "Amazon India",
      price: 3668,
      priceFormatted: "₹3,668.00",
      paymentMode: "Card",
      location: "Amazon",
      daysSinceDelivery: 472,
      timeSinceDelivery: "1 Years 3 Months 15 Days",
    },
    {
      sNo: 16,
      product: "KeyBoard Cover macbook",
      brand: "OJOS",
      model: "Ultra Thin TPU Silicone Guard",
      orderDate: "11-Oct-2025",
      deliveryDate: "12-Oct-2025",
      seller: "Amazon India",
      price: 238,
      priceFormatted: "₹238.00",
      paymentMode: "UPI",
      location: "Amazon",
      daysSinceDelivery: 396,
      timeSinceDelivery: "1 Years 1 Months 0 Days",
    },
    {
      sNo: 17,
      product: "20 in 1 Cleaning Kit",
      brand: "Elfora",
      model: "Multifunction Electronics Cleaner",
      orderDate: "12-Oct-2025",
      deliveryDate: "13-Oct-2025",
      seller: "Amazon India",
      price: 453,
      priceFormatted: "₹453.00",
      paymentMode: "UPI",
      location: "Amazon",
      daysSinceDelivery: 395,
      timeSinceDelivery: "1 Years 0 Months 30 Days",
    },
    {
      sNo: 18,
      product: "Green Soul Surface 2.0 Electric Sit Stand Desk",
      brand: "Green Soul",
      model: "Dual Motor Motorized Height Adjustable",
      orderDate: "04-Oct-2026",
      deliveryDate: "05-Oct-2026",
      seller: "Green Soul Online",
      price: 15990,
      priceFormatted: "₹15,990.00",
      paymentMode: "Card",
      location: "Green Soul Store",
      daysSinceDelivery: 38,
      timeSinceDelivery: "0 Years 1 Months 7 Days",
    },
    {
      sNo: 19,
      product: "Furniture Installation Service",
      brand: "Green Soul",
      model: "Professional On-site Assembly",
      orderDate: "05-Oct-2026",
      deliveryDate: "06-Oct-2026",
      seller: "Green Soul Online",
      price: 999,
      priceFormatted: "₹999.00",
      paymentMode: "Card",
      location: "Green Soul Store",
      daysSinceDelivery: 37,
      timeSinceDelivery: "0 Years 1 Months 6 Days",
    },
    {
      sNo: 20,
      product: "Multipurpose Runner",
      brand: "Saral Home",
      model: "Anti-skid Floor Mat",
      orderDate: "15-Sep-2026",
      deliveryDate: "16-Sep-2026",
      seller: "Amazon India",
      price: 899,
      priceFormatted: "₹899.00",
      paymentMode: "UPI",
      location: "Amazon",
      daysSinceDelivery: 57,
      timeSinceDelivery: "0 Years 1 Months 27 Days",
    },
  ],
  investments: {
    grandTotal: 2276000,
    grandTotalFormatted: "₹22,76,000",
    universityTotal: 2164500,
    schoolTotal: 112500,
    scholarshipEarned: 130000,
    depositFee: 45000,
    alumniFee: 1500,
    levels: [
      { level: "Pre-School (Pre-K to UKG)", totalExpense: 10500, years: "2008–2011", notes: "₹3,500/yr for 3 years" },
      { level: "Primary School (1st to 8th Grade)", totalExpense: 57600, years: "2011–2019", notes: "₹1,800/term × 4 terms = ₹7,200/yr" },
      { level: "Secondary School (9th & 10th Grade)", totalExpense: 19200, years: "2019–2021", notes: "₹2,400/term × 4 terms = ₹9,600/yr" },
      { level: "Higher Secondary (11th & 12th Grade)", totalExpense: 25200, years: "2021–2023", notes: "₹3,150/term × 4 terms = ₹12,600/yr" },
      { level: "University Degree (1st to 4th Year + Charges)", totalExpense: 2164500, years: "2023–2027", notes: "Tuition + Hostel + Exams + Deposit + Alumni" },
    ],
    universityYears: [
      {
        year: "2023–2024",
        grade: "1st Year",
        tuitionFee: 370000,
        scholarship: 130000,
        netTuition: 240000,
        hostelFee: 150000,
        examCharges: 12000,
        totalAnnualFee: 402000,
        cumulativeExpense: 402000,
      },
      {
        year: "2024–2025",
        grade: "2nd Year",
        tuitionFee: 370000,
        scholarship: 0,
        netTuition: 370000,
        hostelFee: 150000,
        examCharges: 12000,
        totalAnnualFee: 532000,
        cumulativeExpense: 934000,
      },
      {
        year: "2025–2026",
        grade: "3rd Year",
        tuitionFee: 370000,
        scholarship: 0,
        netTuition: 370000,
        hostelFee: 160250,
        examCharges: 12000,
        totalAnnualFee: 542250,
        cumulativeExpense: 1476250,
      },
      {
        year: "2026–2027",
        grade: "4th Year",
        tuitionFee: 370000,
        scholarship: 0,
        netTuition: 370000,
        hostelFee: 160250,
        examCharges: 12000,
        totalAnnualFee: 542250,
        cumulativeExpense: 2018500,
      },
    ],
    contributors: [
      { name: "Family Sponsor (Higher Ed Fund)", amount: 100000, status: "Paid" },
      { name: "Family Contributor (Semester Support)", amount: 60000, status: "Paid" },
      { name: "Parental Education Allocation", amount: 50000, status: "Paid" },
      { name: "Family Sponsor (Academic Grant)", amount: 40000, status: "Paid" },
      { name: "Supporter Pledge (Upcoming Cycle)", amount: 30000, status: "Pending" },
    ],
  },
  antigravityTokens: SEED_ANTIGRAVITY_TOKENS,
  antigravityTokenSummary: SEED_ANTIGRAVITY_TOKEN_SUMMARY,
};

/* ── Live Syncer ── */
export async function syncSpreadsheetTrackers(): Promise<TrackersData> {
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
    let totalMonthlyBudget = 7500;
    const categoryBudgets: TrackerCategoryBudget[] = [];
    if (budgetData?.table?.rows) {
      budgetData.table.rows.forEach((row, idx) => {
        const cat = parseString(row.c[0]);
        if (!cat) return;
        if (idx === 0) {
          const totalVal = row.c[3] ? parseNumber(row.c[3].v ?? row.c[3].f) : 7500;
          if (totalVal > 0) totalMonthlyBudget = totalVal;
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
      "2026": makeJournal("2026", "2026 Journal", 2026, j2026.length > 0 ? j2026 : SEED_2026_EXPENSES),
      "2026-fampay": makeJournal("2026-fampay", "2026 Fam Pay", 2026, j2026FamPay, { isFamPay: true }),
      "2025": makeJournal("2025", "2025 Journal", 2025, j2025),
      "2025-fampay": makeJournal("2025-fampay", "2025 Fam Pay", 2025, j2025FamPay, { isFamPay: true }),
      "2024": makeJournal("2024", "2024 Journal", 2024, j2024),
      "2024-fampay": makeJournal("2024-fampay", "2024 Fam Pay", 2024, j2024FamPay, { isFamPay: true }),
      "2023": makeJournal("2023", "2023 Journal", 2023, j2023),
      "pg": makeJournal("pg", "PG Expenses", 2026, jPg, { isPG: true }),
    };

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
      purchaseData.table.rows.forEach((row, idx) => {
        const prod = parseString(row.c[1]);
        if (!prod || prod.toLowerCase() === "product") return;
        const brand = parseString(row.c[2]);
        const model = parseString(row.c[3]);
        const oDate = parseString(row.c[4]) || parseGVizDate(row.c[4]);
        const dDate = parseString(row.c[5]) || parseGVizDate(row.c[5]);
        const seller = parseString(row.c[7]);
        const price = row.c[8] ? parseNumber(row.c[8].v ?? row.c[8].f) : 0;
        const priceFormatted = parseString(row.c[8]) || `₹${price.toLocaleString("en-IN")}`;
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

    // Parse Life Stats (Dynamically calculate live odometer from birthdate)
    const birthdate = new Date(2005, 5, 2); // June 2, 2005
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - birthdate.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const ageYears = Math.floor(diffDays / 365.25);
    const totalWeeks = Math.floor(diffDays / 7);
    const totalMonths = Math.floor(diffDays / 30.4375);
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalSeconds = Math.floor(diffMs / 1000);

    let nextBday = new Date(now.getFullYear(), 5, 2);
    if (nextBday.getTime() < now.getTime()) {
      nextBday = new Date(now.getFullYear() + 1, 5, 2);
    }
    const daysUntilNextBirthday = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const lifeStats: TrackerLifeStats = {
      birthdate: "June 2, 2005",
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
    };

    if (timeData?.table?.rows) {
      timeData.table.rows.forEach((row) => {
        const label = parseString(row.c[0]);
        const val = parseString(row.c[1]);
        if (label.includes("Birthdate")) lifeStats.birthdate = val || lifeStats.birthdate;
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
          // Check contributor names
          const contributor = investments.contributors.find((c) =>
            c0.toLowerCase().includes(c.name.toLowerCase())
          );
          if (contributor && amt > 0) {
            contributor.amount = amt;
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
      totalMonthlyBudget: totalMonthlyBudget || 7500,
      categoryBudgets: categoryBudgets.length > 0 ? categoryBudgets : SEED_TRACKERS_DATA.categoryBudgets,
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
