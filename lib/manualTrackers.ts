import type { TrackerExpense, TrackersData } from "@/types/trackers";
import { primaryJournalKey } from "@/lib/journalCatalog";
export type ManualTrackerRecords = {
  expenses: (TrackerExpense & { journalKey: string })[];
  readings: { id: string; takenAt: string; meterReading: number; previousReading?: number; unitRate?: number; billingCycle: string }[];
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const validDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0,10) === v;
const text = (v: unknown): v is string => typeof v === "string" && v.length <= 4000;
export function isManualTrackerRecords(value: unknown): value is ManualTrackerRecords {
  if (!object(value) || !Array.isArray(value.expenses) || !Array.isArray(value.readings) || value.expenses.length > 10000 || value.readings.length > 10000) return false;
  const ids = new Set<string>();
  const id = (v: unknown) => typeof v === "string" && /^manual-[\w-]+$/.test(v) && !ids.has(v) && !!ids.add(v);
  return value.expenses.every(v => object(v) && id(v.id) && typeof v.journalKey === "string" && /^(20\d{2})(-fampay)?$|^pg$/.test(v.journalKey) && Number.isInteger(v.year) && Number(v.year) >= 2000 && Number(v.year) <= 2099 && Number.isFinite(v.amount) && Number(v.amount) > 0 && Number(v.amount) <= 1e10 && text(v.item) && !!v.item.trim() && text(v.category) && text(v.notes) && validDay(v.dateStr) && (v.journalKey === "pg" || v.year === Number(v.journalKey.slice(0,4))) && v.year === Number(v.dateStr.slice(0,4)) && v.month === Number(v.dateStr.slice(5,7)) && v.day === Number(v.dateStr.slice(8,10)))
    && value.readings.every(v => object(v) && id(v.id) && typeof v.takenAt === "string" && Number.isFinite(Date.parse(v.takenAt)) && Number.isFinite(v.meterReading) && Number(v.meterReading) >= 0 && Number(v.meterReading) <= 1e12 && (v.previousReading === undefined || Number.isFinite(v.previousReading) && Number(v.previousReading) >= 0 && Number(v.previousReading) <= Number(v.meterReading)) && (v.unitRate === undefined || Number.isFinite(v.unitRate) && Number(v.unitRate) >= 0) && text(v.billingCycle) && !!v.billingCycle.trim());
}
/** Add device/account records for display without modifying spreadsheet data or pivots. */
export function withManualTrackers(source: TrackersData, records?: ManualTrackerRecords): TrackersData {
  if (!records || (!records.expenses.length && !records.readings.length)) return source;
  const journals = { ...source.journals };
  for (const row of records.expenses) {
    const base = journals[row.journalKey] || { key: row.journalKey, title: `${row.journalKey} Journal`, year: row.year, totalSpent: 0, totalIncome: 0, expenses: [], isPG: row.journalKey === "pg", isFamPay: row.journalKey.endsWith("-fampay"), journalSync: "fresh" as const };
    if (base.expenses.some(e => e.id === row.id)) continue;
    journals[row.journalKey] = { ...base, totalSpent: base.totalSpent + row.amount, expenses: [row, ...base.expenses] };
  }
  const manualReadings = records.readings.map(reading => ({ id: reading.id, dateTimeStr: new Date(reading.takenAt).toLocaleString(), meterReading: reading.meterReading, unitsUsed: reading.previousReading === undefined ? null : reading.meterReading - reading.previousReading, cost: reading.previousReading === undefined || reading.unitRate === undefined ? null : Math.round((reading.meterReading-reading.previousReading)*reading.unitRate*100)/100, billingCycle: reading.billingCycle }));
  const ebReadings = [...manualReadings, ...source.ebReadings.filter(row => !manualReadings.some(manual => manual.id === row.id))].sort((a,b) => b.meterReading - a.meterReading);
  return { ...source, journals, expenses: journals[primaryJournalKey(journals)]?.expenses || source.expenses, ebReadings, ebMeta: { ...source.ebMeta, ...(ebReadings.length && ebReadings[0].meterReading > source.ebMeta.latestReading ? { latestReading: ebReadings[0].meterReading, latestReadingDate: ebReadings[0].dateTimeStr } : {}) } };
}
