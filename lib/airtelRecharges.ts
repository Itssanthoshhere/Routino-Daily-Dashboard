import type { TrackerExpenseJournal } from "@/types/dashboard";

import type { AirtelRecharge, AirtelData } from "@/types/airtel";
export type { AirtelRecharge } from "@/types/airtel";

export function airtelRecharges(journals: Record<string, TrackerExpenseJournal>, saved?: AirtelData): AirtelRecharge[] {
  const rows: AirtelRecharge[] = Object.entries(journals).filter(([key]) => /^20\d{2}(?:-fampay)?$/.test(key)).flatMap(([key, journal]) => journal.expenses.flatMap(row => {
    if (!/^airtel$/i.test(row.item.trim()) || row.amount <= 0) return [];
    let date = "";
    if (row.year && row.month && row.day) date = `${row.year}-${String(row.month).padStart(2, "0")}-${String(row.day).padStart(2, "0")}`;
    else if (row.dateStr.length > 4) {
      const parsed = new Date(row.dateStr);
      if (!Number.isNaN(parsed.getTime())) date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
    if (!date) return [];
    return [{ id: `${key}:${row.id}`, date, amount: row.amount, kind: row.amount < 100 ? "topup" as const : "plan" as const, notes: row.notes || "", source: `${key} journal`, paidByOther: /\bby\s+\w+/i.test(row.notes || "") }];
  }));
  const merged = new Map(rows.map(row => [row.id, row]));
  for (const row of saved?.records || []) merged.set(row.id, row);
  const deleted = new Set(saved?.deletedIds || []);
  return Array.from(merged.values()).filter(row => !deleted.has(row.id)).sort((a, b) => b.date.localeCompare(a.date));
}

export function airtelTotals(history: AirtelRecharge[]) {
  const rows = history.filter(row => row.status !== "failed");
  const sum = (entries: AirtelRecharge[]) => entries.reduce((total, row) => total + row.amount, 0);
  return {
    count: rows.length, failedCount: history.filter(row => row.status === "failed").length, total: sum(rows), plans: sum(rows.filter(row => row.kind === "plan")), topups: sum(rows.filter(row => row.kind === "topup")), paidByOthers: sum(rows.filter(row => row.paidByOther)),
    years: Array.from(new Set(rows.map(row => row.date.slice(0, 4)))).sort().reverse().map(year => {
      const entries = rows.filter(row => row.date.startsWith(year));
      return { year, total: sum(entries), plans: sum(entries.filter(row => row.kind === "plan")), topups: sum(entries.filter(row => row.kind === "topup")), count: entries.length };
    }),
  };
}
