import type { TrackerExpenseJournal } from "@/types/dashboard";

export const CURRENT_AIRTEL_PLAN = {
  provider: "Airtel", amount: 1729, paymentDate: "2026-11-10", startDate: "2026-11-11", endDate: "2027-02-02", validityDays: 84,
};

export type AirtelRecharge = {
  id: string; date: string; amount: number; kind: "plan" | "topup";
  notes: string; source: string; paidByOther: boolean;
  status?: "success" | "failed"; time?: string; method?: string; journalDate?: string;
};

export function airtelRecharges(journals: Record<string, TrackerExpenseJournal>): AirtelRecharge[] {
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
  // Verified on the signed-in Airtel transaction page. Only the user's own line is included.
  const verified: { date: string; amount: number; time: string; method: string; status: "success" | "failed" }[] = [
    { date: "2026-11-10", amount: 1729, time: "3:53 PM", method: "Euronet", status: "success" },
    { date: "2026-10-28", amount: 49, time: "3:47 AM", method: "UPI", status: "success" },
    { date: "2026-09-19", amount: 49, time: "2:05 AM", method: "UPI", status: "success" },
    { date: "2026-08-17", amount: 1029, time: "11:15 AM", method: "Euronet", status: "success" },
    { date: "2026-07-19", amount: 49, time: "7:15 AM", method: "UPI", status: "success" },
    { date: "2026-07-05", amount: 49, time: "5:08 PM", method: "UPI", status: "success" },
    { date: "2026-07-04", amount: 49, time: "9:43 AM", method: "UPI", status: "success" },
    { date: "2026-05-27", amount: 1029, time: "1:56 AM", method: "UPI", status: "success" },
    { date: "2026-03-02", amount: 1029, time: "6:08 PM", method: "UPI", status: "success" },
    { date: "2026-03-02", amount: 1029, time: "6:08 PM", method: "UPI", status: "failed" },
    { date: "2025-12-08", amount: 1029, time: "7:15 AM", method: "BillDesk", status: "success" },
  ];
  for (const transaction of verified) {
    const match = transaction.status === "success" ? rows.find(row => row.amount === transaction.amount && (row.date === transaction.date || (transaction.date === CURRENT_AIRTEL_PLAN.paymentDate && row.date === CURRENT_AIRTEL_PLAN.startDate))) : undefined;
    if (match) {
      match.journalDate = match.date;
      Object.assign(match, transaction, { source: `${match.source} · Airtel verified` });
    } else {
      rows.push({ ...transaction, id: `airtel-verified-${transaction.date}-${transaction.status}`, kind: transaction.amount < 100 ? "topup" : "plan", paidByOther: false, source: "Airtel transaction history", notes: transaction.date === CURRENT_AIRTEL_PLAN.paymentDate ? "84-day plan active 11 Nov 2026–2 Feb 2027; includes Netflix Basic." : "" });
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
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
