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
    item: "Coffee & Snacks",
    amount: 150,
    dateStr: "31-Oct-2026",
    category: "Food & Grocery",
    balance: 2450,
  },
  {
    id: "exp-2",
    year: 2026,
    item: "Team Lunch",
    amount: 450,
    dateStr: "31-Oct-2026",
    category: "Food & Grocery",
    balance: 2600,
  },
  {
    id: "exp-3",
    year: 2026,
    item: "Metro Commute Pass",
    amount: 400,
    dateStr: "30-Oct-2026",
    category: "Commute",
    balance: 3050,
  },
  {
    id: "exp-4",
    year: 2026,
    item: "Cloud Hosting Subscription",
    amount: 1200,
    dateStr: "29-Oct-2026",
    category: "Utilities",
    balance: 3450,
  },
  {
    id: "exp-5",
    year: 2026,
    item: "Stationery & Notebooks",
    amount: 280,
    dateStr: "28-Oct-2026",
    category: "Others",
    balance: 4650,
  },
];

export const SEED_ANTIGRAVITY_TOKENS: TrackerAntigravityToken[] = [
  { id: "token-0", email: "token.dev.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Development", isAvailable: false },
  { id: "token-1", email: "token.prod.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Production", isAvailable: false },
  { id: "token-2", email: "token.stage.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Staging", isAvailable: false },
  { id: "token-3", email: "token.auto.01@routino.dev", lastUsed: "6/11/26", cooldownDays: 7, availableAgain: "13-Nov-2026", daysLeft: 1, status: "⏳ 1 days left", chromeProfile: "Automation", isAvailable: false },
  { id: "token-4", email: "token.work.01@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Workspace", isAvailable: true },
  { id: "token-5", email: "token.work.02@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Workspace", isAvailable: true },
  { id: "token-6", email: "token.dev.02@routino.dev", lastUsed: "5/11/26", cooldownDays: 7, availableAgain: "12-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Development", isAvailable: true },
  { id: "token-7", email: "token.prod.02@routino.dev", lastUsed: "4/11/26", cooldownDays: 7, availableAgain: "11-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Production", isAvailable: true },
  { id: "token-8", email: "token.stage.02@routino.dev", lastUsed: "4/11/26", cooldownDays: 7, availableAgain: "11-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Staging", isAvailable: true },
  { id: "token-9", email: "token.auto.02@routino.dev", lastUsed: "3/11/26", cooldownDays: 6, availableAgain: "09-Nov-2026", daysLeft: 0, status: "✅ Available", chromeProfile: "Automation", isAvailable: true },
];

export const SEED_ANTIGRAVITY_TOKEN_SUMMARY: TrackerAntigravityTokenSummary = {
  total: 10,
  available: 6,
  inCooldown: 4,
  nextAvailableDate: "13-Nov-2026",
  profiles: [
    { profile: "Development", count: 2 },
    { profile: "Production", count: 2 },
    { profile: "Staging", count: 2 },
    { profile: "Automation", count: 2 },
    { profile: "Workspace", count: 2 },
  ],
};

/* ── Fallback Demo Seed Data (Safe sample data for unauthenticated preview) ── */
export const SEED_TRACKERS_DATA: TrackersData = {
  spreadsheetId: "",
  spreadsheetUrl: "",
  lastSyncedAt: new Date().toISOString(),
  isLive: false,
  totalMonthlyBudget: 7500,
  categoryBudgets: [
    { category: "House Rent", budget: 0 },
    { category: "Investments", budget: 500 },
    { category: "Food & Grocery", budget: 1500 },
    { category: "Commute", budget: 600 },
    { category: "Entertainment", budget: 500 },
    { category: "Insurance", budget: 0 },
    { category: "Mobile", budget: 499 },
    { category: "Internet", budget: 799 },
    { category: "Grooming", budget: 500 },
    { category: "Others", budget: 1602 },
    { category: "Utilities", budget: 1000 },
  ],
  expenses: SEED_2026_EXPENSES,
  journals: {
    "2026": {
      key: "2026",
      title: "2026 Journal",
      year: 2026,
      totalSpent: 2480,
      totalIncome: 0,
      latestBalance: 2450,
      expenses: SEED_2026_EXPENSES,
    },
    "2025": {
      key: "2025",
      title: "2025 Journal",
      year: 2025,
      totalSpent: 2150,
      totalIncome: 0,
      latestBalance: 1850,
      expenses: [],
    },
  },
  ebMeta: {
    rateTillSep: 10,
    currentRate: 10,
    latestReading: 450.0,
    latestReadingDate: "07 Nov 2026, 10:00 AM",
  },
  ebReadings: [
    {
      id: "eb-r0",
      dateTimeStr: "07 Nov 2026, 10:00 AM",
      meterReading: 450.0,
      unitsUsed: 3.5,
      cost: 35.0,
      daysSincePrevious: 3.0,
      unitsPerDay: 1.16,
      billingCycle: "Nov",
    },
    {
      id: "eb-r1",
      dateTimeStr: "04 Nov 2026, 10:00 AM",
      meterReading: 446.5,
      unitsUsed: 2.5,
      cost: 25.0,
      daysSincePrevious: 2.0,
      unitsPerDay: 1.25,
      billingCycle: "Nov",
    },
    {
      id: "eb-r2",
      dateTimeStr: "02 Nov 2026, 10:00 AM",
      meterReading: 444.0,
      unitsUsed: 4.0,
      cost: 40.0,
      daysSincePrevious: 2.0,
      unitsPerDay: 2.0,
      billingCycle: "Nov",
    },
  ],
  ebCycles: [
    {
      cycle: "Sep",
      unitsUsed: 65,
      computedCost: 650,
      billedAmount: 650,
      peopleSharing: 2,
      myShare: 325,
      status: "Paid",
      notes: "Sample utility cycle - split equally.",
    },
    {
      cycle: "Oct",
      unitsUsed: 72,
      computedCost: 720,
      billedAmount: 720,
      peopleSharing: 2,
      myShare: 360,
      status: "Paid",
      notes: "Sample utility cycle - split equally.",
    },
    {
      cycle: "Nov",
      unitsUsed: 10,
      computedCost: 100,
      billedAmount: 100,
      peopleSharing: 2,
      myShare: 50,
      status: "Running",
      notes: "Current ongoing billing cycle.",
    },
  ],
  jobApplications: [
    {
      id: "job-1",
      company: "Acme Corp",
      role: "Full Stack Engineer",
      location: "San Francisco, CA (Remote)",
      appliedDate: "2026-10-15",
      source: "Company Careers",
      status: "Interview",
      lastUpdate: "Technical round scheduled for next week.",
      lastUpdatedDate: "2026-11-05",
      recruiter: "Acme Talent Team",
      interviewStage: "Technical",
      notes: "System architecture and live coding session. Prepared portfolio demos and test suites.",
      nextAction: "Review system design concepts",
    },
    {
      id: "job-2",
      company: "CloudScale Systems",
      role: "Frontend Developer",
      location: "Austin, TX (Hybrid)",
      appliedDate: "2026-10-22",
      source: "LinkedIn",
      status: "Applied",
      lastUpdate: "Application received and under review.",
      notes: "Focus on React 19, Next.js, and TypeScript frontend development.",
      nextAction: "Follow up next Monday",
    },
    {
      id: "job-3",
      company: "NovaLabs AI",
      role: "AI / ML Solutions Engineer",
      location: "Remote",
      appliedDate: "2026-10-28",
      source: "AngelList / Wellfound",
      status: "Applied",
      lastUpdate: "Screening assignment completed.",
      notes: "Prompt orchestration, streaming LLM interfaces, and vector index evaluation.",
      nextAction: "Awaiting assignment feedback",
    },
    {
      id: "job-4",
      company: "Apex Financial",
      role: "Software Engineer",
      location: "New York, NY",
      appliedDate: "2026-10-10",
      source: "Referral",
      status: "Offer",
      lastUpdate: "Offer letter extended.",
      lastUpdatedDate: "2026-11-08",
      recruiter: "Apex People Team",
      interviewStage: "Offer",
      notes: "Competitive package with health benefits and remote equipment allowance.",
      nextAction: "Evaluate offer terms",
    },
    {
      id: "job-5",
      company: "Pulse Media",
      role: "Mobile App Developer",
      location: "Remote",
      appliedDate: "2026-09-18",
      source: "Hacker News",
      status: "Archived",
      lastUpdate: "Process concluded.",
      notes: "Position filled internally.",
      nextAction: "Archived",
    },
  ],
  lifeStats: {
    birthdate: "January 1, 2002",
    ageYears: 24,
    totalDays: 8760,
    totalMonths: 288,
    totalWeeks: 1251,
    totalHours: 210240,
    totalMinutes: 12614400,
    totalSeconds: 756864000,
    daysUntilNextBirthday: 49,
    planetAges: {
      mercury: 99.5,
      venus: 39.0,
      mars: 12.7,
      jupiter: 2.02,
    },
  },
  purchases: [
    {
      sNo: 1,
      product: "Mechanical Keyboard",
      brand: "Keychron",
      model: "Wireless Custom Mechanical Keyboard",
      orderDate: "15-Jan-2025",
      deliveryDate: "17-Jan-2025",
      seller: "Authorized Store",
      price: 7499,
      priceFormatted: "₹7,499.00",
      paymentMode: "Card",
      location: "Online",
      daysSinceDelivery: 665,
      timeSinceDelivery: "1 Year 9 Months",
    },
    {
      sNo: 2,
      product: "4K UHD Monitor 27\"",
      brand: "Dell",
      model: "UltraSharp 4K USB-C Hub Monitor",
      orderDate: "10-Mar-2025",
      deliveryDate: "12-Mar-2025",
      seller: "Dell Direct",
      price: 34999,
      priceFormatted: "₹34,999.00",
      paymentMode: "Card",
      location: "Online Store",
      daysSinceDelivery: 611,
      timeSinceDelivery: "1 Year 8 Months",
    },
    {
      sNo: 3,
      product: "Wireless Noise-Canceling Headphones",
      brand: "Sony",
      model: "WH-1000XM5 Wireless",
      orderDate: "20-May-2025",
      deliveryDate: "21-May-2025",
      seller: "Electronics Retail",
      price: 26990,
      priceFormatted: "₹26,990.00",
      paymentMode: "UPI",
      location: "Authorized Retailer",
      daysSinceDelivery: 540,
      timeSinceDelivery: "1 Year 5 Months",
    },
    {
      sNo: 4,
      product: "Ergonomic Standing Desk",
      brand: "ErgoDesk",
      model: "Dual-Motor Electric Sit-Stand Desk",
      orderDate: "15-Aug-2025",
      deliveryDate: "18-Aug-2025",
      seller: "Furniture Co",
      price: 21999,
      priceFormatted: "₹21,999.00",
      paymentMode: "Card",
      location: "Online",
      daysSinceDelivery: 452,
      timeSinceDelivery: "1 Year 2 Months",
    },
  ],
  investments: {
    grandTotal: 1500000,
    grandTotalFormatted: "₹15,00,000",
    universityTotal: 1200000,
    schoolTotal: 300000,
    scholarshipEarned: 100000,
    depositFee: 30000,
    alumniFee: 2000,
    levels: [
      { level: "Pre-School (Pre-K to UKG)", totalExpense: 15000, years: "Early Years", notes: "Foundation years" },
      { level: "Primary School (1st to 8th Grade)", totalExpense: 120000, years: "Primary School", notes: "Elementary education" },
      { level: "Secondary School (9th & 10th Grade)", totalExpense: 75000, years: "Secondary School", notes: "Secondary certification" },
      { level: "Higher Secondary (11th & 12th Grade)", totalExpense: 90000, years: "Higher Secondary", notes: "Pre-university coursework" },
      { level: "University Degree (1st to 4th Year + Charges)", totalExpense: 1200000, years: "Undergraduate", notes: "Tuition, lab facilities & coursework" },
    ],
    universityYears: [
      { year: "Year 1", grade: "1st Year", tuitionFee: 300000, scholarship: 100000, netTuition: 200000, hostelFee: 100000, examCharges: 10000, totalAnnualFee: 310000, cumulativeExpense: 310000 },
      { year: "Year 2", grade: "2nd Year", tuitionFee: 300000, scholarship: 0, netTuition: 300000, hostelFee: 100000, examCharges: 10000, totalAnnualFee: 410000, cumulativeExpense: 720000 },
      { year: "Year 3", grade: "3rd Year", tuitionFee: 300000, scholarship: 0, netTuition: 300000, hostelFee: 100000, examCharges: 10000, totalAnnualFee: 410000, cumulativeExpense: 1130000 },
      { year: "Year 4", grade: "4th Year", tuitionFee: 300000, scholarship: 0, netTuition: 300000, hostelFee: 100000, examCharges: 10000, totalAnnualFee: 410000, cumulativeExpense: 1540000 },
    ],
    contributors: [
      { name: "Academic Merit Grant", amount: 100000, status: "Paid" },
      { name: "Education Loan Facility", amount: 500000, status: "Paid" },
      { name: "Internship & Freelance Savings", amount: 250000, status: "Paid" },
      { name: "Family Education Fund", amount: 650000, status: "Paid" },
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
        let model = parseString(row.c[3]);
        const oDate = parseString(row.c[4]) || parseGVizDate(row.c[4]);
        const dDate = parseString(row.c[5]) || parseGVizDate(row.c[5]);
        const seller = parseString(row.c[7]);
        let price = row.c[8] ? parseNumber(row.c[8].v ?? row.c[8].f) : 0;
        let priceFormatted = parseString(row.c[8]);

        const prodLower = prod.toLowerCase();
        // Exact price correction for Green Soul Surface 2.0 Electric Sit Stand Desk
        if ((price === 0 || !price) && prodLower.includes("green soul") && (prodLower.includes("surface") || prodLower.includes("desk"))) {
          price = 23009;
          priceFormatted = "₹23,009.00";
          if (!model) {
            model = "Electric height-adjustable desk, Digital Display, Memory Preset, Sedentary Alarm, Carbon Fibre, Black, 3 Yr Warranty + Desk Mat";
          }
        } else if ((price === 0 || !price) && prodLower.includes("furniture installation")) {
          price = 0;
          priceFormatted = "Free (Included)";
          if (!model) {
            model = "Furniture Installation Service for Green Soul Surface 2.0 Electric Sit Stand Desk";
          }
        } else if ((price === 0 || !price) && prodLower.includes("multipurpose runner")) {
          price = 899;
          priceFormatted = "₹899.00";
        }

        if (!priceFormatted && price > 0) {
          priceFormatted = `₹${price.toLocaleString("en-IN")}`;
        } else if (!priceFormatted) {
          priceFormatted = "₹0.00";
        }
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
