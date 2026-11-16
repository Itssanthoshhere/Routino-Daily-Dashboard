"use client";

import { AirtelImport } from "@/components/AirtelImport";
import { useState } from "react";
import type { TrackerExpenseJournal } from "@/types/dashboard";
import { airtelRecharges, airtelTotals } from "@/lib/airtelRecharges";
import { isAirtelData } from "@/lib/airtelValidation";
import type { AirtelData, AirtelPlan, AirtelRecharge } from "@/types/airtel";

const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const localToday = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const control = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink";
const button = "rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-forest disabled:opacity-50";

export function AirtelRechargeTracker({ journals, isLive, saved, onChange, disabled = false }: { journals: Record<string, TrackerExpenseJournal>; isLive: boolean; saved: AirtelData; onChange?: (data: AirtelData) => void; disabled?: boolean }) {
  const [year, setYear] = useState("all");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<AirtelRecharge | null>(null);
  const [planDraft, setPlanDraft] = useState<AirtelPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const today = localToday();
  const rows = airtelRecharges(isLive ? journals : {}, saved);
  const totals = airtelTotals(rows);
  const filtered = rows.filter(row => (status === "all" || (row.status || "success") === status) && (year === "all" || row.date.startsWith(year)) && (kind === "all" || row.kind === kind) && `${row.date} ${row.amount} ${row.notes} ${row.source}`.toLowerCase().includes(search.toLowerCase()));
  const filteredPaid = filtered.filter(row => row.status !== "failed").reduce((sum, row) => sum + row.amount, 0);
  const plan = saved.plan;
  const daysLeft = plan ? Math.max(0, Math.round((Date.parse(plan.endDate) - Date.parse(today)) / 86400000) + 1) : 0;
  const persist = (next: AirtelData) => {
    if (disabled || !onChange) return false;
    if (!isAirtelData(next)) { setError("Check the amounts, dates, and validity before saving."); return false; }
    onChange(next); setError(""); return true;
  };
  const saveRecord = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const values = new FormData(event.currentTarget as HTMLFormElement);
    const record = { ...draft, date: String(values.get("rechargeDate") || draft.date), id: draft.id || crypto.randomUUID() };
    const records = [...rows.filter(row => row.id !== record.id), record];
    if (persist({ ...saved, records })) setDraft(null);
  };
  const savePlan = (event: React.FormEvent) => {
    event.preventDefault();
    if (!planDraft) return;
    const values = new FormData(event.currentTarget as HTMLFormElement);
    const submitted = { ...planDraft, paymentDate: String(values.get("paymentDate") || planDraft.paymentDate), startDate: String(values.get("startDate") || planDraft.startDate), endDate: String(values.get("endDate") || planDraft.endDate) };
    const validityDays = Math.round((Date.parse(submitted.endDate) - Date.parse(submitted.startDate)) / 86400000) + 1;
    const existing = rows.find(row => row.id === planDraft.id) || rows.find(row => row.date === submitted.paymentDate && row.amount === submitted.amount && row.status !== "failed");
    const id = existing?.id || planDraft.id || crypto.randomUUID();
    const nextPlan = { ...submitted, id, validityDays };
    const record: AirtelRecharge = { ...existing, id, date: nextPlan.paymentDate, amount: nextPlan.amount, kind: "plan", status: "success", source: existing?.source || "Saved recharge", paidByOther: existing?.paidByOther || false, notes: existing?.notes || "" };
    if (persist({ ...saved, plan: nextPlan, records: [...rows.filter(row => row.id !== id), record] })) setPlanDraft(null);
  };
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-xl font-bold text-ink">Airtel Recharge</h3><p className="mt-1 text-xs text-muted">Editable recharge history, saved with your account. Main plans and small data top-ups stay separate.</p></div>
      <div className="flex gap-2"><button disabled={disabled} className={button} onClick={() => { setDraft({ id: "", date: today, amount: 0, kind: "topup", notes: "", source: "Saved recharge", paidByOther: false, status: "success" }); setPlanDraft(null); }}>Add recharge</button><button disabled={disabled} className={button} onClick={() => { setPlanDraft({ id: "", provider: "Airtel", amount: 0, paymentDate: today, startDate: today, endDate: today, validityDays: 1 }); setDraft(null); }}>New plan</button></div>
    </div>
    <AirtelImport existing={rows} deletedIds={saved.deletedIds} disabled={disabled} onImport={records => persist({ ...saved, records: [...rows, ...records] })} />
    {!isLive && <p className="text-xs text-muted">Showing saved records. Journal history will join them when the connected sheet is available.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {draft && <form onSubmit={saveRecord} className="rounded-2xl border border-line bg-white p-5"><h4 className="mb-4 font-semibold">{draft.id ? "Edit recharge" : "Add recharge"}</h4><div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">Payment date<input name="rechargeDate" required type="date" className={control} value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} /></label>
      <label className="text-xs">Amount (INR)<input required type="number" min="0" step="0.01" className={control} value={Number.isFinite(draft.amount) ? draft.amount : ""} onChange={event => setDraft({ ...draft, amount: event.target.valueAsNumber })} /></label>
      <label className="text-xs">Type<select className={control} value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value as AirtelRecharge["kind"] })}><option value="plan">Main plan</option><option value="topup">Data top-up</option></select></label>
      <label className="text-xs">Status<select className={control} value={draft.status || "success"} onChange={event => setDraft({ ...draft, status: event.target.value as AirtelRecharge["status"] })}><option value="success">Success</option><option value="failed">Failed</option></select></label>
      <label className="text-xs">Payment method<input className={control} value={draft.method || ""} onChange={event => setDraft({ ...draft, method: event.target.value })} /></label>
      <label className="text-xs">Notes<input className={control} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} /></label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.paidByOther} onChange={event => setDraft({ ...draft, paidByOther: event.target.checked })} />Paid by someone else</label>
    </div><div className="mt-4 flex gap-3"><button disabled={disabled} className={button}>Save recharge</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div></form>}
    {planDraft && <form onSubmit={savePlan} className="rounded-2xl border border-line bg-white p-5"><h4 className="mb-4 font-semibold">Recharge plan</h4><div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">Amount (INR)<input required type="number" min="0" step="0.01" className={control} value={Number.isFinite(planDraft.amount) ? planDraft.amount : ""} onChange={event => setPlanDraft({ ...planDraft, amount: event.target.valueAsNumber })} /></label>
      {(["paymentDate", "startDate", "endDate"] as const).map(field => <label key={field} className="text-xs">{field === "paymentDate" ? "Payment date" : field === "startDate" ? "Validity starts" : "Validity ends"}<input name={field} required type="date" className={control} value={planDraft[field]} onChange={event => setPlanDraft({ ...planDraft, [field]: event.target.value })} /></label>)}
      <label className="text-xs">Data per day (GB)<input type="number" min="0" step="0.1" className={control} value={planDraft.dataPerDayGB ?? ""} onChange={event => setPlanDraft({ ...planDraft, dataPerDayGB: event.target.value === "" ? undefined : event.target.valueAsNumber })} /></label>
      <label className="text-xs">SMS per day<input type="number" min="0" className={control} value={planDraft.smsPerDay ?? ""} onChange={event => setPlanDraft({ ...planDraft, smsPerDay: event.target.value === "" ? undefined : event.target.valueAsNumber })} /></label>
      <label className="text-xs">Calls<input className={control} value={planDraft.calls || ""} onChange={event => setPlanDraft({ ...planDraft, calls: event.target.value })} /></label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!planDraft.unlimited5G} onChange={event => setPlanDraft({ ...planDraft, unlimited5G: event.target.checked })} />Unlimited 5G included</label>
    </div><p className="mt-3 text-xs text-muted">Validity days are calculated from the inclusive start/end dates. Saving a new plan preserves earlier recharges.</p><div className="mt-4 flex gap-3"><button disabled={disabled} className={button}>Save plan</button><button type="button" onClick={() => setPlanDraft(null)}>Cancel</button></div></form>}
    {plan ? <div className="rounded-2xl border border-line bg-white p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase text-muted">{daysLeft ? "Current plan" : "Last saved plan"}</p><p className="mt-2 text-2xl font-bold">{money(plan.amount)} <span className="text-sm font-normal text-muted">/ {plan.validityDays} days</span></p><p className="mt-2 text-sm">{dateLabel(plan.startDate)} – {dateLabel(plan.endDate)}</p><p className="mt-2 text-xs text-muted">Paid {dateLabel(plan.paymentDate)} · validity is separate from payment date</p></div><div><p className="text-sm">{daysLeft ? `${daysLeft} days including today` : "Expired · review plan"}</p><button className={button + " mt-3"} disabled={disabled} onClick={() => { setPlanDraft({ ...plan }); setDraft(null); }}>Edit plan</button></div></div></div> : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">No current plan saved. Add one to track its validity and payment.</p>}
    {plan && <div className="rounded-2xl border border-line bg-white p-5"><h4 className="font-semibold">Plan allowance and included benefits</h4><p className="mt-2 text-sm text-muted">{[plan.dataPerDayGB !== undefined ? `${plan.dataPerDayGB} GB/day` : "", plan.calls ? `${plan.calls} calls` : "", plan.smsPerDay !== undefined ? `${plan.smsPerDay} SMS/day` : "", plan.unlimited5G ? "Unlimited 5G" : ""].filter(Boolean).join(" · ") || "Add allowance details by editing your plan."}</p>{plan.benefits?.length ? <ul className="mt-3 space-y-2">{plan.benefits.map(benefit => <li key={benefit.name} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{benefit.name} · {benefit.planName}</span><span className="text-xs text-muted">{benefit.using ? "Using · included" : "Available · usage not confirmed"}</span></li>)}</ul> : null}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Total recorded", value: totals.total, detail: `${totals.count} successful payments · ${totals.failedCount} failed attempts excluded` }, { label: "Main plans", value: totals.plans, detail: "Main recharge history" }, { label: "Data top-ups", value: totals.topups, detail: "Separate from plan renewals" }, { label: "Excluding others’ payments", value: totals.total - totals.paidByOthers, detail: `${money(totals.paidByOthers)} paid by others` }].map(card => <div key={card.label} className="rounded-2xl border border-line bg-white p-4"><p className="text-xs text-muted">{card.label}</p><p className="mt-2 text-xl font-bold">{money(card.value)}</p><p className="mt-1 text-xs text-muted">{card.detail}</p></div>)}</div>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Yearly spending</caption><thead className="border-y border-line text-xs text-muted"><tr>{["Year", "Main plans", "Top-ups", "Total"].map(label => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{totals.years.map(row => <tr className="border-b border-line last:border-0" key={row.year}><th className="px-4 py-3">{row.year}</th><td className="px-4 py-3">{money(row.plans)}</td><td className="px-4 py-3">{money(row.topups)}</td><td className="px-4 py-3 font-semibold">{money(row.total)}</td></tr>)}</tbody></table></div>
    <div className="flex flex-wrap gap-3"><input aria-label="Search recharge history" placeholder="Search dates, costs or notes…" className={control + " min-w-0 flex-1"} value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter recharge year" className={button} value={year} onChange={event => setYear(event.target.value)}><option value="all">All years</option>{totals.years.map(row => <option key={row.year}>{row.year}</option>)}</select><select aria-label="Filter payment status" className={button} value={status} onChange={event => setStatus(event.target.value)}><option value="all">All attempts</option><option value="success">Successful payments</option><option value="failed">Failed attempts</option></select><select aria-label="Filter recharge type" className={button} value={kind} onChange={event => setKind(event.target.value)}><option value="all">All recharges</option><option value="plan">Main plans</option><option value="topup">Top-ups</option></select></div>
    <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left"><span className="font-semibold">Complete recorded history</span><span className="ml-2 text-xs text-muted">{filtered.length} records · {money(filteredPaid)} paid</span></caption><thead className="border-y border-line text-xs text-muted"><tr>{["Date", "Amount", "Type / status", "Notes / source", "Actions"].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{filtered.map(row => <tr className="border-b border-line last:border-0" key={row.id}><td className="whitespace-nowrap px-4 py-3">{dateLabel(row.date)}{row.time && <p className="mt-1 text-xs text-muted">{row.time}</p>}</td><td className="px-4 py-3 font-semibold">{money(row.amount)}</td><td className="px-4 py-3 text-xs">{row.kind === "plan" ? "Main plan" : "Top-up"}<p className="mt-1 text-muted">{row.status === "failed" ? "Failed · excluded from totals" : row.status === "success" ? "Success" : "Journal payment"}</p></td><td className="min-w-48 px-4 py-3 text-xs"><p>{row.notes || "No additional notes recorded"}</p>{row.method && <p className="mt-1 text-muted">Paid via {row.method}</p>}{row.journalDate && row.journalDate !== row.date && <p className="mt-1 text-muted">Original journal date: {dateLabel(row.journalDate)}</p>}<p className="mt-1 text-muted">{row.source}{row.paidByOther ? " · Paid by someone else" : ""}</p></td><td className="px-4 py-3"><div className="flex gap-2"><button disabled={disabled} className={button} onClick={() => { setDraft({ ...row }); setPlanDraft(null); }}>Edit</button><button disabled={disabled} className={button} onClick={() => setDeleteId(row.id)}>Remove</button></div></td></tr>)}</tbody></table>{!filtered.length && <p className="p-5 text-sm text-muted">No matching recharges.</p>}</div>
    {deleteId && <div className="rounded-xl border border-line p-4 text-sm"><p>Remove this saved recharge? The original journal row will stay unchanged.</p><div className="mt-3 flex gap-3"><button disabled={disabled} className={button} onClick={() => { if (persist({ ...saved, plan: saved.plan?.id === deleteId ? null : saved.plan, records: rows.filter(row => row.id !== deleteId), deletedIds: Array.from(new Set([...saved.deletedIds, deleteId])) })) setDeleteId(null); }}>Remove record</button><button onClick={() => setDeleteId(null)}>Keep record</button></div></div>}
    <p className="text-xs text-muted">Original journal rows are never modified. Saved edits take precedence; removed journal rows stay hidden. Only recorded payments count, and failed attempts are excluded.</p>
  </section>;
}
