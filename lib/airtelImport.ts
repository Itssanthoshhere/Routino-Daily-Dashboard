import type { AirtelRecharge } from "@/types/airtel";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";
export type RechargeImportRow = { record?: AirtelRecharge; label: string; excluded?: string };
const digits = (value: string) => value.replace(/\D/g, "").slice(-10);
function date(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isSubscriptionDate(value) ? value : "";
  const match = value.match(/^(\d{1,2})[\/ -](\d{1,2}|[A-Za-z]{3,9})[\/ ,-]+(\d{4})/);
  if (!match) return "";
  const month = /^\d+$/.test(match[2]) ? Number(match[2]) : ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
  const result = `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return isSubscriptionDate(result) ? result : "";
}
function csv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i <= text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if ((!quoted && (char === "," || char === "\n")) || char === undefined) { row.push(cell.trim()); cell = ""; if (char !== ",") { if (row.some(Boolean)) rows.push(row); row = []; } }
    else if (char !== "\r") cell += char;
  }
  if (quoted) throw new Error("CSV contains an unfinished quoted field.");
  return rows;
}
export function previewAirtelImport(text: string, ownerNumber: string, existing: AirtelRecharge[], deletedIds: string[] = []): RechargeImportRow[] {
  if (digits(ownerNumber).length !== 10) throw new Error("Enter your 10-digit Airtel number to exclude other numbers.");
  let input: Record<string, unknown>[];
  if (text.trim().startsWith("[")) { input = JSON.parse(text); if (!Array.isArray(input)) throw new Error("Use a JSON array of transactions."); }
  else if (/^\s*date\s*,/i.test(text)) {
    const [headers, ...rows] = csv(text); input = rows.map(row => Object.fromEntries(headers.map((key, index) => [key.toLowerCase(), row[index] || ""])));
  } else {
    input = text.split(/Recharge\s*[··]\s*PREPAID/i).slice(1).map(block => ({
      number: block.match(/\b\d{10}\b/)?.[0], date: block.match(/\d{1,2} [A-Za-z]+ \d{4}/)?.[0],
      amount: block.match(/₹\s*([\d,]+(?:\.\d+)?)/)?.[1], status: block.match(/\b(Success|Failed|Pending|Refund)\b/i)?.[1],
      method: block.match(/Paid via ([^\n\\]+)/i)?.[1]?.trim(), time: block.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0],
    }));
  }
  if (!input.length || input.length > 1000) throw new Error("Use 1–1,000 transactions: pasted Airtel history, CSV, or JSON.");
  const seen = new Set(existing.map(row => `${row.date}|${row.amount}|${row.status || "success"}`));
  return input.map((item, index) => {
    if (!item || typeof item !== "object") return { label: `Row ${index + 1}`, excluded: "Invalid transaction" };
    const value = (key: string) => String(item[key] ?? "").trim();
    const day = date(value("date")); const amount = Number(value("amount").replace(/[₹,\s]/g, ""));
    const status = value("status").toLowerCase();
    const label = `${day || value("date") || `Row ${index + 1}`} · ₹${value("amount")} · ${status || "unknown status"}`;
    if (digits(value("number")) !== digits(ownerNumber)) return { label, excluded: "Different or missing mobile number" };
    if (!day || !Number.isFinite(amount) || amount <= 0 || !["success", "failed"].includes(status)) return { label, excluded: "Invalid date/amount, or pending/refunded/unknown status" };
    const fingerprint = `${day}|${amount}|${status}`;
    const id = `airtel-import:${fingerprint}`;
    if (seen.has(fingerprint) || deletedIds.includes(id)) return { label, excluded: "Duplicate or previously removed transaction" };
    seen.add(fingerprint);
    return { label, record: { id, date: day, amount, status: status as "success" | "failed", kind: value("kind") === "plan" ? "plan" : "topup", notes: value("notes"), source: "Airtel transaction import", paidByOther: false, method: value("method"), time: value("time") }, excluded: status === "failed" ? "Failed payment — excluded from import" : undefined };
  });
}
