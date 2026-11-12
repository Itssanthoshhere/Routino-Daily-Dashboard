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

export const GOOGLE_SHEET_ID = "1bGxy0pgNx0nlO09pqdhYi_ZwNVqBcX4z1rkPWoIpeSw";
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

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
  { id: "token-0", email: "doctormutualfund@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Dr MF", isAvailable: false },
  { id: "token-1", email: "ipadphotobackup03@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Feasto Admin", isAvailable: false },
  { id: "token-2", email: "minecraftbackup07@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Feasto Admin", isAvailable: false },
  { id: "token-3", email: "myashika2005@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Santhosh", isAvailable: false },
  { id: "token-4", email: "aptiwings08@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Unknown", isAvailable: false },
  { id: "token-5", email: "hereunknown07@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Unknow", isAvailable: false },
  { id: "token-6", email: "aptiwings03@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Github", isAvailable: false },
  { id: "token-7", email: "aptiwings05@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Unknown", isAvailable: false },
  { id: "token-8", email: "aptiwings04@gmail.com", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Github", isAvailable: false },
  { id: "token-9", email: "aptiwings02@gmail.com", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-10", email: "iamsanthu02@gmail.com", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-11", email: "iamsanthu07@gmail.com", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-12", email: "iamsanthu08@gmail.com", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-13", email: "kvigbuspass@gmail.com", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-14", email: "itssanthoo@gmail.com", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-15", email: "sundarjanane@gmail.com", lastUsed: "4/11/26", cooldownDays: 7, availableAgain: "11-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-16", email: "cpl.codechef@gmail.com", lastUsed: "3/11/26", cooldownDays: 6, availableAgain: "09-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-17", email: "githubmanger@gmail.com", lastUsed: "1/11/26", cooldownDays: 7, availableAgain: "08-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-18", email: "santhosh02vs@gmail.com", lastUsed: "1/11/26", cooldownDays: 7, availableAgain: "08-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-19", email: "vaniphonephotobackup@gmail.com", lastUsed: "1/11/26", cooldownDays: 7, availableAgain: "08-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
  { id: "token-20", email: "itssanthoshhere02@gmail.com", lastUsed: "12/10/26", cooldownDays: 7, availableAgain: "19-Oct-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-21", email: "ipadphotobackup04@gmail.com", lastUsed: "25/9/26", cooldownDays: 7, availableAgain: "02-Oct-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-22", email: "ranthuranthu66@gmail.com", lastUsed: "19/9/26", cooldownDays: 7, availableAgain: "26-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-23", email: "jananesundar09@gmail.com", lastUsed: "18/9/26", cooldownDays: 7, availableAgain: "25-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-24", email: "vani78678ssr@gmail.com", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-25", email: "aptiwings01@gmail.com", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-26", email: "aptiwings07@gmail.com", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-27", email: "iamsanthoshvs2005@gmail.com", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-28", email: "iphonephotobackupstorage@gmail.com", lastUsed: "17/9/26", cooldownDays: 7, availableAgain: "24-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-29", email: "photosaving07@gmail.com", lastUsed: "16/9/26", cooldownDays: 7, availableAgain: "23-Sep-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknown", isAvailable: true },
  { id: "token-30", email: "whatsapobackupaccstorage@gmail.com", lastUsed: "30/6/26", cooldownDays: 7, availableAgain: "07-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-31", email: "aptiwings09@gmail.com", lastUsed: "7/7/26", cooldownDays: 7, availableAgain: "14-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Unknow", isAvailable: true },
  { id: "token-32", email: "aptiwings03@gmail.com", lastUsed: "29/6/26", cooldownDays: 7, availableAgain: "06-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Github", isAvailable: true },
  { id: "token-33", email: "whatsappbackstorage@gmail.com", lastUsed: "29/6/26", cooldownDays: 7, availableAgain: "06-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-34", email: "vaniwhatsappback@gmail.com", lastUsed: "29/6/26", cooldownDays: 7, availableAgain: "06-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Feasto Admin", isAvailable: true },
  { id: "token-35", email: "vaniphonephotos@gmail.com", lastUsed: "28/6/26", cooldownDays: 7, availableAgain: "05-Jul-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Santhosh", isAvailable: true },
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
      role: "Full Stack Developer / QA Automation Engineer",
      location: "Remote & Co-Located",
      appliedDate: "2026-01-27",
      source: "Superset",
      status: "Applied",
      lastUpdate: "Process: CV Shortlisting -> Assignment -> Situation discussion",
      notes: "Stipend Rs 25,000/month, PPO Rs 7-15L/yr.",
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
      notes: "12-month internship.",
    },
    {
      id: "job-3",
      company: "Reltio",
      role: "Software Engineering Intern",
      location: "Bangalore (Hybrid)",
      appliedDate: "2026-03-01",
      source: "Superset",
      status: "Applied",
      notes: "OA (DSA/coding) on HackerEarth.",
    },
    {
      id: "job-4",
      company: "Lokal",
      role: "React Native / Mobile App Developer",
      location: "Remote",
      appliedDate: "2026-03-12",
      source: "Company Careers",
      status: "Rejected",
      interviewStage: "HR",
    },
    {
      id: "job-5",
      company: "United Airlines",
      role: "Gen AI Intern",
      location: "Gurgaon",
      appliedDate: "2026-04-07",
      source: "Superset",
      status: "Applied",
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
      { name: "Gopal", amount: 100000, status: "Paid" },
      { name: "Ganesh Uncle", amount: 60000, status: "Paid" },
      { name: "Vanitha", amount: 50000, status: "Paid" },
      { name: "Pavithra daddy", amount: 40000, status: "Paid" },
      { name: "Jayan", amount: 30000, status: "Pending" },
    ],
  },
  antigravityTokens: SEED_ANTIGRAVITY_TOKENS,
  antigravityTokenSummary: SEED_ANTIGRAVITY_TOKEN_SUMMARY,
};

/* ── Live Syncer ── */
export async function syncSpreadsheetTrackers(): Promise<TrackersData> {
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
        const appliedDate = parseString(row.c[3]) || parseGVizDate(row.c[3]);
        const source = parseString(row.c[4]) || "Superset";
        const status = parseString(row.c[5]) || "Applied";
        const lastUpdate = parseString(row.c[6]);
        const recruiter = parseString(row.c[8]);
        const stage = parseString(row.c[9]);
        const notes = parseString(row.c[10]);
        const nextAction = parseString(row.c[11]);

        jobApplications.push({
          id: `job-${idx}`,
          company: comp,
          role,
          location: loc,
          appliedDate,
          source,
          status,
          lastUpdate,
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

    // Parse Life Stats
    const lifeStats: TrackerLifeStats = {
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
    };

    if (timeData?.table?.rows) {
      timeData.table.rows.forEach((row) => {
        const label = parseString(row.c[0]);
        const val = parseString(row.c[1]);
        if (label.includes("Birthdate")) lifeStats.birthdate = val || lifeStats.birthdate;
        else if (label.includes("Current Age")) lifeStats.ageYears = parseNumber(val) || lifeStats.ageYears;
        else if (label.includes("Total Days")) lifeStats.totalDays = parseNumber(val) || lifeStats.totalDays;
        else if (label.includes("Months")) lifeStats.totalMonths = parseNumber(val) || lifeStats.totalMonths;
        else if (label.includes("Weeks")) lifeStats.totalWeeks = parseNumber(val) || lifeStats.totalWeeks;
        else if (label.includes("Hours")) lifeStats.totalHours = parseNumber(val) || lifeStats.totalHours;
        else if (label.includes("Minutes")) lifeStats.totalMinutes = parseNumber(val) || lifeStats.totalMinutes;
        else if (label.includes("Seconds")) lifeStats.totalSeconds = parseNumber(val) || lifeStats.totalSeconds;
        else if (label.includes("Next Birthday")) lifeStats.daysUntilNextBirthday = parseNumber(val) || lifeStats.daysUntilNextBirthday;
        else if (label.includes("Mercury")) lifeStats.planetAges.mercury = parseNumber(val) || lifeStats.planetAges.mercury;
        else if (label.includes("Venus")) lifeStats.planetAges.venus = parseNumber(val) || lifeStats.planetAges.venus;
        else if (label.includes("Mars")) lifeStats.planetAges.mars = parseNumber(val) || lifeStats.planetAges.mars;
        else if (label.includes("Jupiter")) lifeStats.planetAges.jupiter = parseNumber(val) || lifeStats.planetAges.jupiter;
      });
    }

    // Parse Investment Journal
    const investments: TrackerInvestmentJournal = {
      ...SEED_TRACKERS_DATA.investments,
    };

    if (investmentData?.table?.rows) {
      investmentData.table.rows.forEach((row) => {
        const c0 = parseString(row.c[0]);
        const c1 = parseString(row.c[1]);
        if (c0.includes("Grand Total (School + University")) {
          const amt = parseNumber(row.c[1]?.v ?? row.c[1]?.f);
          if (amt > 0) {
            investments.grandTotal = amt;
            investments.grandTotalFormatted = `₹${amt.toLocaleString("en-IN")}`;
          }
        }
      });
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

    const cooldownTokens = tokensList.filter((t) => !t.isAvailable && t.availableAgain);
    const nextAvailableDate = cooldownTokens.length > 0 ? cooldownTokens[0].availableAgain : undefined;

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
