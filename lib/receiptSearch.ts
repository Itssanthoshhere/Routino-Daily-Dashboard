import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import type { ReceiptCandidate } from "@/lib/receiptPayments";
export type ReceiptFilters = { service?: string; from?: string; to?: string; offset?: number };
export function receiptQuery(kind: string, filters: ReceiptFilters = {}) {
  if (!["recharge", "subscription"].includes(kind)) throw new Error("Choose recharges or subscriptions.");
  const service = (filters.service || "").trim();
  if (service.length > 80 || (service && !/^[a-zA-Z0-9 .&'_-]+$/.test(service))) throw new Error("Use a service name with letters, numbers or spaces (up to 80 characters).");
  const { from, to } = filters;
  if ((from && !isSubscriptionDate(from)) || (to && !isSubscriptionDate(to)) || (from && to && from > to)) throw new Error("Choose a valid date range.");
  const offset = filters.offset ?? 0;
  if (!Number.isInteger(offset) || Math.abs(offset) > 840) throw new Error("Invalid timezone offset.");
  // Gmail accepts epoch seconds, avoiding its PST interpretation of calendar dates.
  // https://developers.google.com/workspace/gmail/api/guides/filtering
  const start = (day: string) => Date.parse(`${day}T00:00:00Z`) / 1000 + offset * 60;
  const period = [!from && !to ? "newer_than:1y" : "", from ? `after:${start(from) - 1}` : "", to ? `before:${start(to) + 86400}` : ""].filter(Boolean).join(" ");
  const merchant = service ? `"${service}"` : kind === "recharge" ? "airtel" : "{subscription membership netflix spotify apple google microsoft adobe hotstar}";
  return `${period} ${kind === "recharge" && service ? "airtel " : ""}${merchant} {receipt invoice "recharge successful" "payment received" "payment successful"}`;
}
export function suggestReceipt(receipt: ReceiptCandidate): { amount?: number; currency?: string; date?: string } {
  const text = `${receipt.subject} ${receipt.snippet}`.replace(/&(?:nbsp|#160);/g, " ").replace(/&#8377;/g, "₹");
  const amounts = Array.from(text.matchAll(/(?:\b(INR|USD|EUR|GBP|Rs\.?)\s*|([₹$€£])\s*)(\d[\d,]*(?:\.\d{1,2})?)(?![\d.])/gi)).map(m => {
    const currency = m[2] ? ({ "₹": "INR", "$": "USD", "€": "EUR", "£": "GBP" } as Record<string,string>)[m[2]] : /^rs/i.test(m[1]) ? "INR" : m[1].toUpperCase();
    return { amount: Number(m[3].replace(/,/g, "")), currency };
  }).filter(a => Number.isFinite(a.amount) && a.amount > 0);
  const unique = new Map(amounts.map(a => [`${a.currency}:${a.amount}`, a]));
  const dates = Array.from(text.matchAll(/\b(?:payment\s+date|transaction\s+date|paid\s+on|charged\s+on|recharged\s+on)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/gi)).map(m => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(m[1])) return isSubscriptionDate(m[1]) ? m[1] : "";
    const parts = m[1].match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (!parts) return "";
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(parts[2].slice(0, 3).toLowerCase()) + 1;
    const day = `${parts[3]}-${String(month).padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
    return isSubscriptionDate(day) ? day : "";
  }).filter(Boolean);
  return { ...(unique.size === 1 ? Array.from(unique.values())[0] : {}), ...(new Set(dates).size === 1 ? { date: dates[0] } : {}) };
}
