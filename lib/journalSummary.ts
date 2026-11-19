import type { TrackerExpenseJournal, TrackerJournalSummary } from "@/types/trackers";
type Cell = { v?: string | number | boolean | null; f?: string | null } | null;
type Row = { c: Cell[] };
const label = (cell: Cell | undefined) => String(cell?.f ?? cell?.v ?? "").trim();
const numeric = (cell: Cell | undefined): number | null => {
  const raw = cell?.v === "" || cell?.v == null ? cell?.f : cell.v;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string" || !/[0-9]/.test(raw)) return null;
  const value = Number(raw.replace(/[₹,\s]/g, ""));
  return Number.isFinite(value) ? value : null;
};
/** Read the pivot's own grand total; never sum its detail and subtotal rows together. */
export function parseJournalSummaryRows(rows: Row[] | undefined, sheetName: string): TrackerJournalSummary | undefined {
  if (!rows) return;
  const headerIndex = rows.findIndex(row => row.c.slice(0,2).some(cell=>/^(category|item)$/i.test(label(cell))) && row.c.some(cell => /^(?:[1-9]|1[0-2])$/.test(label(cell))));
  if (headerIndex < 0) return;
  const header = rows[headerIndex];
  const explicitTotalColumn = header.c.findIndex(cell => /^grand total$/i.test(label(cell)));
  const lastMonthColumn = header.c.reduce((last,cell,index)=>/^(?:[1-9]|1[0-2])$/.test(label(cell))?index:last,-1);
  // GViz drops text headings in numeric columns. The pivot total follows its month columns.
  const totalColumn = explicitTotalColumn >= 0 ? explicitTotalColumn : lastMonthColumn + 1;
  const totalIndex = rows.findIndex((row,index) => index > headerIndex && /^grand total$/i.test(label(row.c[0])));
  if (totalIndex < 0) return;
  const total = rows[totalIndex];
  const totalSpent = numeric(total.c[totalColumn]);
  if (totalSpent === null) return;
  const months = header.c.flatMap((cell,index) => /^(?:[1-9]|1[0-2])$/.test(label(cell)) ? [{ month: Number(label(cell)), amount: numeric(total.c[index]) ?? 0 }] : []);
  if (Math.abs(months.reduce((sum,m)=>sum+m.amount,0)-totalSpent)>0.01) return;
  const categoryTotals = rows.slice(headerIndex+1,totalIndex).flatMap(row => {
    const name = label(row.c[0]);
    const value = numeric(row.c[totalColumn]);
    return / total$/i.test(name) && !/^grand total$/i.test(name) && value !== null ? [{ category: name.replace(/ total$/i,""), amount:value }] : [];
  });
  return { sheetName, totalSpent, months, categoryTotals };
}
export function journalReconciliation(journal: TrackerExpenseJournal) {
  if (!journal.sheetSummary) return null;
  const categories = new Set(journal.sheetSummary.categoryTotals.map(c=>c.category.trim().toLowerCase()));
  const outside = new Map<string,number>();
  for (const row of journal.expenses) if (categories.size > 0 && row.amount && !categories.has(row.category.trim().toLowerCase())) outside.set(row.category,(outside.get(row.category)||0)+row.amount);
  return { difference: Math.round((journal.totalSpent-journal.sheetSummary.totalSpent)*100)/100, outsideCategories: Array.from(outside,([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount) };
}
