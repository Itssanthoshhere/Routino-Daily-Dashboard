export type AirtelPlan = {
  id: string;
  provider: string;
  amount: number;
  paymentDate: string;
  startDate: string;
  endDate: string;
  validityDays: number;
  dataPerDayGB?: number;
  calls?: string;
  smsPerDay?: number;
  unlimited5G?: boolean;
  benefits?: { name: string; planName: string; using: boolean; verifiedOn?: string }[];
};

export type AirtelRecharge = {
  id: string;
  date: string;
  amount: number;
  kind: "plan" | "topup";
  notes: string;
  source: string;
  paidByOther: boolean;
  status?: "success" | "failed";
  time?: string;
  method?: string;
  journalDate?: string;
};

export type AirtelData = {
  records: AirtelRecharge[];
  plan: AirtelPlan | null;
  deletedIds: string[];
};

export const emptyAirtelData = (): AirtelData => ({ records: [], plan: null, deletedIds: [] });
