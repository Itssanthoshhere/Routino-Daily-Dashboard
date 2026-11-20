import { journalMonth } from "@/lib/journalMonth";
import type { TrackerExpenseJournal } from "@/types/trackers";

/** Compare one calendar month with one monthly limit; never use annual totals. */
export function journalBudgetUsage(journal: TrackerExpenseJournal, month: number, limit: number) {
  const validMonth = Number.isInteger(month) && month >= 1 && month <= 12;
  const rows = validMonth ? journal.expenses.filter(row => row.year === journal.year && journalMonth(row) === month) : [];
  const summary = validMonth && journal.summarySync !== "unavailable" ? journal.sheetSummary?.months.find(row => row.month === month) : undefined;
  const available = validMonth && (Boolean(summary) || journal.journalSync !== "unavailable");
  const spent = summary?.amount ?? rows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);
  const hasLimit = Number.isFinite(limit) && limit > 0;
  return {
    available,
    spent: available ? spent : null,
    source: summary ? "Summary sheet" : "Full journal debits",
    entries: rows.length,
    percent: available && hasLimit ? Math.round(spent / limit * 100) : null,
    remaining: available && hasLimit ? Math.max(0, limit - spent) : null,
    stale: summary ? journal.summarySync === "stale" : journal.journalSync === "stale",
  };
}
