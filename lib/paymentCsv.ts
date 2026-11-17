import type { SpendingPayment } from "@/lib/monthlySpending";
/** Prefix formula-like text before CSV quoting to avoid spreadsheet execution. */
const cell = (value: string) => `"${(/^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`;
export function paymentCsv(rows: SpendingPayment[]): string {
  return '\uFEFF' + [['Date','Service','Amount','Currency'], ...rows.map(row => [row.date,row.name,row.amount.toFixed(2),row.currency])].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
