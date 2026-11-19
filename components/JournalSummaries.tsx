"use client";
import { journalReconciliation } from "@/lib/journalSummary";
import type { TrackerExpenseJournal } from "@/types/dashboard";

const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
function JournalFigures({ journal }: { journal: TrackerExpenseJournal }) {
  const reconciliation = journalReconciliation(journal);
  return <><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
    <div><dt className="text-muted">{journal.sheetSummary ? "Summary sheet spending" : "All journal debits"}</dt><dd className="mt-1 text-base font-bold text-ink">{money(journal.sheetSummary?.totalSpent ?? journal.totalSpent)}</dd></div>
    <div><dt className="text-muted">All journal income / credits</dt><dd className="mt-1 font-semibold text-forest">{money(journal.totalIncome)}</dd></div>
    <div><dt className="text-muted">Journal entries</dt><dd className="mt-1 font-semibold">{journal.expenses.length.toLocaleString("en-IN")}</dd></div>
    <div><dt className="text-muted">Latest recorded balance</dt><dd className="mt-1 font-semibold">{journal.latestBalance == null ? "Not recorded" : money(journal.latestBalance)}</dd></div>
  </dl>
  {journal.sheetSummary ? <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">Monthly summary & reconciliation</summary><p className="mt-2 text-muted">Source: {journal.sheetSummary.sheetName} · first spending pivot</p><ul className="mt-2 space-y-1">{journal.sheetSummary.months.map(m=><li key={m.month} className="flex justify-between gap-2"><span>{new Intl.DateTimeFormat("en",{month:"short",timeZone:"UTC"}).format(new Date(Date.UTC(2026,m.month-1,1)))}</span><strong>{money(m.amount)}</strong></li>)}</ul><p className="mt-3">All journal debits: {money(journal.totalSpent)}</p><p className="mt-1">Difference from Summary: {money(reconciliation?.difference||0)}</p>{!!reconciliation?.outsideCategories.length&&<><p className="mt-2 text-muted">Categories in the journal but outside this Summary pivot:</p><ul className="mt-1 space-y-1">{reconciliation.outsideCategories.map(c=><li key={c.category} className="flex justify-between gap-2"><span>{c.category}</span><span>{money(c.amount)}</span></li>)}</ul></>}<p className="mt-2 text-muted">Journal entries remain unchanged. Pivot filters or source ranges can differ from the full ledger; the Summary total is read directly from the sheet.</p></details> : <p className="mt-3 text-xs text-amber-800">Summary sheet unavailable. Showing the full journal debit total.</p>}
  </>;
}
export function JournalSummaries({ journals, isLive, onOpen }: {
  journals: Record<string, TrackerExpenseJournal>;
  isLive: boolean;
  onOpen: (key: string) => void;
}) {
  return <section className="rounded-2xl border border-line bg-white p-5" aria-labelledby="journal-summaries-title">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="journal-summaries-title" className="text-base font-bold">Journal summaries · 2023–2026</h3><span className="text-xs text-muted">{isLive ? "From your connected sheet" : "Preview / sample data"}</span></div>
    <p className="mt-2 text-xs text-muted">Spending matches each year’s Summary-tab pivot. Credits, balances and entry counts describe the full journal. FamPay stays separate; transfers between journals are not combined into a spending total.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[2023, 2024, 2025, 2026].map(year => {
      const key = String(year), journal = journals[key], famPay = journals[`${year}-fampay`];
      return <article key={year} className="rounded-xl border border-line bg-[#fafbf8] p-4">
        <h4 className="text-lg font-bold">{year} Journal</h4>
        {journal ? <><JournalFigures journal={journal}/><button type="button" onClick={() => onOpen(key)} className="btn-theme mt-4 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold">Open {year} journal</button></> : <p className="mt-4 text-xs text-muted">Journal data is not available. Sync your connected sheet to load it.</p>}
        {famPay && <details className="mt-4 border-t border-line pt-3"><summary className="cursor-pointer text-xs font-semibold">{year} FamPay · {money(famPay.sheetSummary?.totalSpent ?? famPay.totalSpent)} spent</summary><JournalFigures journal={famPay}/><button type="button" onClick={() => onOpen(`${year}-fampay`)} className="btn-theme mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold">Open {year} FamPay</button></details>}
      </article>;
    })}</div>
  </section>;
}
