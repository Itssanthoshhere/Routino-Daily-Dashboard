export type TrackerCategoryBudget = {
  category: string;
  budget: number;
  spent?: number;
};

export type TrackerExpense = {
  id: string;
  year: number;
  item: string;
  amount: number;
  income?: number | null;
  cash?: number | null;
  day?: number;
  month?: number;
  dateStr: string;
  category: string;
  notes?: string;
  balance?: number | null;
  rawDate?: string;
};

export type TrackerEBReading = {
  id: string;
  dateTimeStr: string;
  meterReading: number;
  unitsUsed?: number | null;
  cost?: number | null;
  daysSincePrevious?: number | null;
  unitsPerDay?: number | null;
  billingCycle: string;
};

export type TrackerEBCycleSummary = {
  cycle: string;
  unitsUsed: number;
  computedCost: number;
  billedAmount?: number | null;
  peopleSharing: number;
  myShare: number;
  status: "Paid" | "Running" | "Pending";
  notes?: string;
};

export type TrackerEBMeta = {
  rateTillSep: number;
  currentRate: number;
  latestReading: number;
  latestReadingDate?: string;
};

export type TrackerJobApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  appliedDate: string;
  source: string;
  status: string;
  lastUpdate?: string;
  recruiter?: string;
  interviewStage?: string;
  notes?: string;
  nextAction?: string;
};

export type TrackerLifeStats = {
  birthdate: string;
  ageYears: number;
  totalDays: number;
  totalMonths: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  daysUntilNextBirthday: number;
  planetAges: {
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
  };
};

export type TrackerPurchase = {
  sNo: number;
  product: string;
  brand: string;
  model: string;
  orderDate: string;
  deliveryDate: string;
  seller: string;
  price: number;
  priceFormatted: string;
  paymentMode: string;
  location: string;
  daysSinceDelivery: number;
  timeSinceDelivery: string;
};

export type UniversityYearFee = {
  year: string;
  grade: string;
  tuitionFee: number;
  scholarship: number;
  netTuition: number;
  hostelFee: number;
  examCharges: number;
  totalAnnualFee: number;
  cumulativeExpense: number;
};

export type EducationLevelSummary = {
  level: string;
  totalExpense: number;
  years: string;
  notes?: string;
};

export type InvestmentContributor = {
  name: string;
  amount: number;
  status: "Paid" | "Pending";
};

export type TrackerInvestmentJournal = {
  grandTotal: number;
  grandTotalFormatted: string;
  universityTotal: number;
  schoolTotal: number;
  scholarshipEarned: number;
  depositFee: number;
  alumniFee: number;
  levels: EducationLevelSummary[];
  universityYears: UniversityYearFee[];
  contributors: InvestmentContributor[];
};

export type TrackersData = {
  spreadsheetId: string;
  spreadsheetUrl: string;
  lastSyncedAt: string;
  isLive: boolean;
  error?: string | null;
  categoryBudgets: TrackerCategoryBudget[];
  totalMonthlyBudget: number;
  expenses: TrackerExpense[];
  ebMeta: TrackerEBMeta;
  ebReadings: TrackerEBReading[];
  ebCycles: TrackerEBCycleSummary[];
  jobApplications: TrackerJobApplication[];
  lifeStats: TrackerLifeStats;
  purchases: TrackerPurchase[];
  investments: TrackerInvestmentJournal;
};
