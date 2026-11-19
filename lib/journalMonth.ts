import type { TrackerExpense } from "@/types/trackers";
/** Prefer explicit journal month fields; never interpret a year-only label as January. */
export function journalMonth(expense: TrackerExpense): number | null {
  if (Number.isInteger(expense.month) && expense.month! >= 1 && expense.month! <= 12) return expense.month!;
  const date = expense.dateStr.trim();
  const iso = date.match(/^\d{4}-(\d{2})-\d{2}$/);
  if (iso) { const month=Number(iso[1]); return month>=1&&month<=12?month:null; }
  const named = date.match(/^\d{1,2}[- ]([A-Za-z]{3,9})[- ]\d{4}$/);
  if (!named) return null;
  const month=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(named[1].slice(0,3).toLowerCase())+1;
  return month || null;
}
