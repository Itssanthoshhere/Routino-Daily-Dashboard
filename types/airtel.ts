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

export type AirtelFamilyObservation = {
  id:string;recordedOn:string;capturedOn?:string;expiresOn?:string;source:'screenshot'|'airtel-website'|'manual';
  planAmount:number;planLabel:string;reportedDaysLeft?:number;remainingDataGB?:number;dailyDataGB?:number;notes:string;
};
export type AirtelFamilyMember = {
  id:string;name:string;relationship:'mother'|'sister'|'father'|'brother'|'other';phone:string;archived?:boolean;
  observations:AirtelFamilyObservation[];
  recharge:Omit<AirtelData,'familyMembers'>;
};
export type AirtelData = {
  familyMembers?: AirtelFamilyMember[];
  records: AirtelRecharge[];
  planHistory?: AirtelPlan[];
  plan: AirtelPlan | null;
  deletedIds: string[];
};

export const emptyAirtelData = (): AirtelData => ({ records: [], plan: null, deletedIds: [] });
