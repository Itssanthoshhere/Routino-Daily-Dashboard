import type {
  TrackersData,
  TrackerExpense,
  TrackerAntigravityToken,
  TrackerAntigravityTokenSummary,
} from "@/types/dashboard";

const SEED_2026_EXPENSES: TrackerExpense[] = [
  {
    id: "demo-expense-1",
    year: 2026,
    item: "Example purchase",
    amount: 12,
    dateStr: "01-Jan-2026",
    category: "Demo",
    notes: "Fictional preview data.",
    balance: 88,
  },
];

export const SEED_ANTIGRAVITY_TOKENS: TrackerAntigravityToken[] = [
  {
    id: "demo-token-1",
    email: "demo-01@example.test",
    lastUsed: "Not used",
    cooldownDays: 0,
    availableAgain: "Available",
    daysLeft: 0,
    status: "Demo",
    chromeProfile: "Example",
    isAvailable: true,
  },
  {
    id: "demo-token-2",
    email: "demo-02@example.test",
    lastUsed: "Not used",
    cooldownDays: 0,
    availableAgain: "Available",
    daysLeft: 0,
    status: "Demo",
    chromeProfile: "Example",
    isAvailable: true,
  },
];

export const SEED_ANTIGRAVITY_TOKEN_SUMMARY: TrackerAntigravityTokenSummary = {
  total: 2,
  available: 2,
  inCooldown: 0,
  nextAvailableDate: "Available",
  profiles: [{ profile: "Example", count: 2 }],
};

/* ── Fictional preview data. Never populated from a connected account. ── */
export const SEED_TRACKERS_DATA: TrackersData = {
  spreadsheetId: "",
  spreadsheetUrl: "",
  lastSyncedAt: new Date(0).toISOString(),
  isLive: false,
  totalMonthlyBudget: 100,
  categoryBudgets: [{ category: "Demo category", budget: 100, spent: 12 }],
  expenses: SEED_2026_EXPENSES,
  journals: {
    "2026": {
      key: "2026",
      title: "Example Journal",
      year: 2026,
      totalSpent: 12,
      totalIncome: 0,
      latestBalance: 88,
      expenses: SEED_2026_EXPENSES,
    },
  },
  ebMeta: {
    rateTillSep: 1,
    currentRate: 1,
    latestReading: 0,
    latestReadingDate: "",
  },
  ebReadings: [],
  ebCycles: [],
  jobApplications: [
    {
      id: "demo-job-1",
      company: "Example Company",
      role: "Sample role",
      location: "Remote",
      appliedDate: "2026-01-01",
      source: "Example",
      status: "Demo",
      lastUpdate: "Fictional preview record.",
      recruiter: "Example Recruiter",
      notes: "Fictional preview data.",
      nextAction: "Review the tracker",
    },
  ],
  lifeStats: {
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
  },
  purchases: [],
  investments: {
    grandTotal: 0,
    grandTotalFormatted: "₹0",
    universityTotal: 0,
    schoolTotal: 0,
    scholarshipEarned: 0,
    depositFee: 0,
    alumniFee: 0,
    levels: [],
    universityYears: [],
    contributors: [],
  },
  antigravityTokens: SEED_ANTIGRAVITY_TOKENS,
  antigravityTokenSummary: SEED_ANTIGRAVITY_TOKEN_SUMMARY,
};

