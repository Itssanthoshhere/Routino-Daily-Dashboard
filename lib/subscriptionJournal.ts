import type { TrackerExpenseJournal } from "@/types/dashboard";
import { CURRENT_AIRTEL_PLAN } from "@/lib/airtelRecharges";
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
    results.push({ id: `journal-subscription-${service.name.toLowerCase().replace(/\W+/g, "-")}`, name: service.name, amount: latest.amount, currency: "INR", cycle, renewalDate: renewal, status: monthly && renewal >= today ? "active" : "unconfirmed", category: service.name === "Hostinger" ? "Domain & hosting" : "Entertainment", startDate: payments[0].date, lastPaidDate: latest.date, payments, notes: `Imported from 2023–2026 journals. Start date is the first recorded payment, not a confirmed signup date. ${monthly ? "Monthly billing inferred from repeated payments; renewal is estimated." : quarterly ? "Three-month term recorded in payment notes; current usage needs confirmation." : "Billing cycle and current usage need confirmation."}` });
  }
  return applyJournalCorrections(results);
}

// User-confirmed context for this specific journal payment. Keep its audit history.
export function applyJournalCorrections(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.map(subscription => {
    if (subscription.id === "journal-subscription-netflix" && subscription.confirmedDetailsVersion !== 2) {
      return {
        ...subscription,
        cycle: "bundled",
        status: "active",
        renewalDate: "",
        bundledSince: "2026-11-11",
        bundleEndDate: "2027-02-02",
        planName: "Basic",
        confirmedDetailsVersion: 2,
        bundlePlan: CURRENT_AIRTEL_PLAN,
        billingHistory: Array.from({ length: 11 }, (_, index) => {
          const month = index === 0 ? "2025-12" : `2026-${String(index).padStart(2, "0")}`;
          const nextMonth = index === 0 ? "2026-01" : `2026-${String(index + 1).padStart(2, "0")}`;
          return { date: `${month}-25`, periodStart: `${month}-25`, periodEnd: `${nextMonth}-24`, amount: 199, subtotal: 168.64, tax: 30.36, source: "Netflix payment history supplied by you" };
        }),
        notes: "Netflix Basic is included with the ₹1,729 Airtel recharge from 11 Nov 2026 through 2 Feb 2027 (84 days). No separate Netflix charge during this bundle. The last direct Netflix payment was ₹199 on 25 Oct 2026, covering 25 Oct–24 Nov 2026. Bundle activation overlaps that paid period; no refund or credit is assumed. Netflix invoice dates are shown separately from unchanged journal entry dates. Review access when the Airtel recharge ends; no automatic paid renewal is assumed.",
      };
    }
    if (subscription.id !== "journal-subscription-jio-hotstar" || subscription.amount !== 60 || subscription.lastPaidDate !== "2026-09-02" || subscription.cycle === "one-time") return subscription;
    return {
      ...subscription,
      cycle: "one-time",
      renewalDate: "",
      notes: "Jio Hotstar Basic was included with the Airtel recharge plan. The ₹60 payment on 2 Sep 2026 was a one-time upgrade to Super, not a standalone recurring subscription. Confirmed by you. Current access expiry is not recorded.",
    };
  });
}
