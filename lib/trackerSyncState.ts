import type { TrackersData } from "@/types/trackers";

function newerThan(previous: string, incoming: string) {
  const oldTime = Date.parse(previous), nextTime = Date.parse(incoming);
  return Number.isFinite(oldTime) && Number.isFinite(nextTime) && oldTime > nextTime;
}

/** Retain failed or older sources only within the same authenticated account and sheet. */
export function mergeTrackerSync(previous: TrackersData | undefined, next: TrackersData): TrackersData {
  if (!previous?.isLive || !next.isLive || !next.syncAccount || previous.syncAccount !== next.syncAccount ||
      !next.spreadsheetId || previous.spreadsheetId !== next.spreadsheetId) return next;
  const journals = Object.fromEntries(Object.entries(next.journals).map(([key, incoming]) => {
    const old = previous.journals[key];
    if (!old) return [key, incoming];
    const journal = { ...incoming };
    const oldJournalTime = old.journalUpdatedAt || previous.lastSyncedAt;
    const oldSummaryTime = old.summaryUpdatedAt || previous.lastSyncedAt;
    if (old.journalSync !== "unavailable" && (incoming.journalSync === "unavailable" ||
        newerThan(oldJournalTime, incoming.journalUpdatedAt || next.lastSyncedAt))) {
      Object.assign(journal, {
        expenses: old.expenses, totalSpent: old.totalSpent, totalIncome: old.totalIncome,
        latestBalance: old.latestBalance,
        journalSync: incoming.journalSync === "unavailable" || incoming.journalSync === "stale" ? "stale" : old.journalSync || "fresh",
        journalUpdatedAt: oldJournalTime,
      });
    }
    if (old.summarySync !== "unavailable" && ((incoming.summarySync === "unavailable" && old.sheetSummary) ||
        newerThan(oldSummaryTime, incoming.summaryUpdatedAt || next.lastSyncedAt))) {
      journal.sheetSummary = old.sheetSummary;
      journal.summarySync = incoming.summarySync === "unavailable" || incoming.summarySync === "stale" ? "stale" : old.summarySync || "fresh";
      journal.summaryUpdatedAt = oldSummaryTime;
    }
    return [key, journal];
  }));
  const oldBudgetTime = previous.budgetUpdatedAt || previous.lastSyncedAt;
  const budget = previous.budgetSync !== "unavailable" && (next.budgetSync === "unavailable" ||
    newerThan(oldBudgetTime, next.budgetUpdatedAt || next.lastSyncedAt))
    ? {
      totalMonthlyBudget: previous.totalMonthlyBudget, categoryBudgets: previous.categoryBudgets,
      budgetSync: next.budgetSync === "unavailable" || next.budgetSync === "stale" ? "stale" as const : previous.budgetSync || "fresh" as const,
      budgetUpdatedAt: oldBudgetTime,
    } : {};
  return { ...next, ...budget, journals, expenses: journals["2026"]?.expenses || next.expenses };
}
