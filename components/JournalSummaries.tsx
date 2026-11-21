"use client";
import { journalYears } from "@/lib/journalCatalog";
import { useState } from "react";
import { journalReconciliation } from "@/lib/journalSummary";
import type { TrackerExpenseJournal } from "@/types/dashboard";

const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
export function JournalSourceNotice({ journal }: { journal: TrackerExpenseJournal }) {
  const status = (kind: "journal" | "summary") => {
    const state = kind === "journal" ? journal.journalSync : journal.summarySync;
    const date = kind === "journal" ? journal.journalUpdatedAt : journal.summaryUpdatedAt;
    if (state !== "stale" && state !== "unavailable") return null;
    return <p key={kind}>{kind === "journal" ? "Journal" : "Summary"} refresh failed. {state === "stale" ? `Showing last successful data${date ? ` from ${new Date(date).toLocaleString()}` : ""}.` : "No successful data is available yet. Retry sync."}</p>;
  };
  const journalNotice = status("journal"), summaryNotice = status("summary");
  return journalNotice || summaryNotice ? <div role="status" className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">{journalNotice}{summaryNotice}</div> : null;
}
function JournalFigures({ journal, onCategory, onMonth }: { journal: TrackerExpenseJournal; onCategory: (category:string)=>void; onMonth:(month:number)=>void }) {
  const reconciliation = journalReconciliation(journal);
  if (journal.journalSync === "unavailable") return <>
    <JournalSourceNotice journal={journal}/>
    {journal.sheetSummary && <p className="mt-3 text-xs">Summary sheet spending: <strong>{money(journal.sheetSummary.totalSpent)}</strong></p>}
  </>;
  return <><JournalSourceNotice journal={journal}/><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
    <div><dt className="text-muted">{journal.sheetSummary ? "Summary sheet spending" : "All journal debits"}</dt><dd className="mt-1 text-base font-bold text-ink">{money(journal.sheetSummary?.totalSpent ?? journal.totalSpent)}</dd></div>
    <div><dt className="text-muted">All journal income / credits</dt><dd className="mt-1 font-semibold text-forest">{money(journal.totalIncome)}</dd></div>
    <div><dt className="text-muted">Journal entries</dt><dd className="mt-1 font-semibold">{journal.expenses.length.toLocaleString("en-IN")}</dd></div>
    <div><dt className="text-muted">Latest recorded balance</dt><dd className="mt-1 font-semibold">{journal.latestBalance == null ? "Not recorded" : money(journal.latestBalance)}</dd></div>
  </dl>
  {!!journal.sheetSummary?.categoryTotals.length&&<details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">Spending by category · {journal.sheetSummary.categoryTotals.length}</summary><p className="mt-2 text-muted">Click a category to open its full journal entries. The amount below comes from the Summary pivot; journal filters or source ranges may differ.</p><ul className="mt-2 space-y-1">{journal.sheetSummary.categoryTotals.map(c=><li key={c.category}><button type="button" onClick={()=>onCategory(c.category)} aria-label={`View ${c.category} transactions in ${journal.title}`} className="btn-theme flex w-full items-start justify-between gap-3 rounded-lg border border-line bg-white p-2 text-left"><span>{c.category}</span><strong className="whitespace-nowrap">{money(c.amount)}</strong></button></li>)}</ul></details>}
  {journal.sheetSummary ? <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">Monthly summary & reconciliation</summary><p className="mt-2 text-muted">Source: {journal.sheetSummary.sheetName} · first spending pivot</p><ul className="mt-2 space-y-1">{journal.sheetSummary.months.map(m=><li key={m.month} className="flex justify-between gap-2"><button type="button" onClick={()=>onMonth(m.month)} aria-label={`View month ${m.month} transactions in ${journal.title}`} className="btn-theme flex w-full justify-between gap-2 rounded-lg border border-line bg-white p-2 text-left"><span>{new Intl.DateTimeFormat("en",{month:"short",timeZone:"UTC"}).format(new Date(Date.UTC(journal.year,m.month-1,1)))}</span><strong>{money(m.amount)}</strong></button></li>)}</ul><p className="mt-3">All journal debits: {money(journal.totalSpent)}</p><p className="mt-1">Difference from Summary: {money(reconciliation?.difference||0)}</p>{!!reconciliation?.outsideCategories.length&&<><p className="mt-2 text-muted">Categories in the journal but outside this Summary pivot:</p><ul className="mt-1 space-y-1">{reconciliation.outsideCategories.map(c=><li key={c.category} className="flex justify-between gap-2"><button type="button" onClick={()=>onCategory(c.category)} className="btn-theme flex w-full justify-between gap-2 rounded-lg p-1 text-left" aria-label={`View ${c.category} transactions in ${journal.title}`}><span>{c.category}</span><span>{money(c.amount)}</span></button></li>)}</ul></>}<p className="mt-2 text-muted">Journal entries remain unchanged. Pivot filters or source ranges can differ from the full ledger; the Summary total is read directly from the sheet.</p></details> : <p className="mt-3 text-xs text-amber-800">Summary sheet unavailable. Showing the full journal debit total.</p>}
  </>;
}
export function JournalSummaries({ journals, isLive, onOpen }: {
  journals: Record<string, TrackerExpenseJournal>;
  isLive: boolean;
  onOpen: (key: string, category?:string, month?:number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const years = journalYears(journals);
  const range = years.length ? ` · ${years[0]}${years.length > 1 ? `–${years[years.length - 1]}` : ""}` : "";
  return <section className="rounded-2xl border border-line bg-white p-5" aria-labelledby="journal-summaries-title">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="journal-summaries-title" className="text-base font-bold">Journal summaries{range}</h3><span className="text-xs text-muted">{isLive ? "From your connected sheet" : "Preview / sample data"}</span></div>
    <button type="button" aria-expanded={expanded} aria-controls="journal-summary-content" onClick={()=>setExpanded(value=>!value)} className="btn-theme mt-3 w-full rounded-xl border border-line px-3 py-2 text-xs font-semibold xl:hidden">{expanded ? "Hide yearly summaries" : "Show yearly summaries"}</button>
    <div id="journal-summary-content" className={`${expanded ? "block" : "hidden"} xl:block`}>
    <p className="mt-2 text-xs text-muted">Spending matches each year’s Summary-tab pivot. Credits, balances and entry counts describe the full journal. FamPay stays separate; transfers between journals are not combined into a spending total.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{years.map(year => {
      const key = String(year), journal = journals[key], famPay = journals[`${year}-fampay`];
      return <article key={year} className="rounded-xl border border-line bg-[#fafbf8] p-4">
        <h4 className="text-lg font-bold">{year} Journal</h4>
        {journal ? <><JournalFigures journal={journal} onCategory={category=>onOpen(key,category)} onMonth={month=>onOpen(key,undefined,month)}/><button type="button" onClick={() => onOpen(key)} className="btn-theme mt-4 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold">Open {year} journal</button></> : <p className="mt-4 text-xs text-muted">Journal data is not available. Sync your connected sheet to load it.</p>}
        {famPay && <details className="mt-4 border-t border-line pt-3"><summary className="cursor-pointer text-xs font-semibold">{year} FamPay · {famPay.journalSync === "unavailable" && !famPay.sheetSummary ? "Spending unavailable" : `${money(famPay.sheetSummary?.totalSpent ?? famPay.totalSpent)} spent`}</summary><JournalFigures journal={famPay} onCategory={category=>onOpen(`${year}-fampay`,category)} onMonth={month=>onOpen(`${year}-fampay`,undefined,month)}/><button type="button" onClick={() => onOpen(`${year}-fampay`)} className="btn-theme mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold">Open {year} FamPay</button></details>}
      </article>;
    })}</div>
    </div>
  </section>;
}
