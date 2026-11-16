import type { TrackerExpenseJournal } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";

// Only named service payments qualify; device purchases, phone top-ups and income do not.
const services = [
  { name: "Netflix", pattern: /^netflix$/i },
  { name: "Apple Music", pattern: /^apple music$/i },
  { name: "Spotify", pattern: /^spotify$/i },
  { name: "iCloud", pattern: /^icloud(?:\+)?$/i },
  { name: "Jio Hotstar", pattern: /^(?:jio\s*)?hotstar$/i },
  { name: "Canva Pro", pattern: /^canva pro$/i },
  { name: "Hostinger", pattern: /^hostinger$/i },
];

export function subscriptionsFromJournals(journals: Record<string, TrackerExpenseJournal>, today: string): Subscription[] {
  const results: Subscription[] = [];
  for (const service of services) {
    const payments = Object.entries(journals).filter(([key]) => /^20\d{2}(?:-fampay)?$/.test(key)).flatMap(([key, journal]) => journal.expenses.filter(row => row.amount > 0 && service.pattern.test(row.item.trim())).flatMap(row => {
      let date = "";
      if (row.year && row.month && row.day) date = `${row.year}-${String(row.month).padStart(2, "0")}-${String(row.day).padStart(2, "0")}`;
      else { const parsed = new Date(row.dateStr); if (!Number.isNaN(parsed.getTime()) && row.dateStr.length > 4) date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`; }
      return date ? [{ date, amount: row.amount, journal: key, rowId: row.id, notes: row.notes || "" }] : [];
    })).sort((a, b) => a.date.localeCompare(b.date));
    if (!payments.length) continue;
    const latest = payments[payments.length - 1];
    const recent = payments.slice(-4);
    const monthly = recent.length >= 3 && recent.slice(1).every((payment, index) => {
      const gap = (Date.parse(payment.date) - Date.parse(recent[index].date)) / 86400000;
      return gap >= 26 && gap <= 35;
    });
    const quarterly = /3 months|three months/i.test(latest.notes);
    const cycle = monthly ? "monthly" : quarterly ? "quarterly" : "unknown";
    const renewal = monthly || quarterly ? (() => {
      const [year, month, day] = latest.date.split("-").map(Number);
      const next = new Date(year, month - 1 + (quarterly ? 3 : 1), 1, 12);
      next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    })() : "";
    results.push({ id: `journal-subscription-${service.name.toLowerCase().replace(/\W+/g, "-")}`, name: service.name, amount: latest.amount, currency: "INR", cycle, renewalDate: renewal, status: monthly && renewal >= today ? "active" : "unconfirmed", category: service.name === "Hostinger" ? "Domain & hosting" : "Entertainment", startDate: payments[0].date, lastPaidDate: latest.date, payments, notes: `Imported from expense journals. Start date is the first recorded payment, not a confirmed signup date. ${monthly ? "Monthly billing inferred from repeated payments; renewal is estimated." : quarterly ? "Three-month term recorded in payment notes; current usage needs confirmation." : "Billing cycle and current usage need confirmation."}` });
  }
  return results;
}
