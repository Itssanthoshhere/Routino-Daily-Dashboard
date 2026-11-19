"use client";
import type {UnifiedReminder} from "@/lib/unifiedReminders";
import { workspaceScrollBehavior } from "@/lib/workspacePreferences";

import { RelatedNotes, useNoteConnections } from "@/components/NoteConnections";
import { useEffect } from "react";
import { SubscriptionBudgets } from "@/components/SubscriptionBudgets";
import { RenewalDecisionQueue, PaymentReconciliation } from "@/components/SubscriptionPlanning";
import { SharedSubscriptionExpenses } from "@/components/SharedSubscriptionExpenses";
import { SubscriptionPriceHistory } from "@/components/SubscriptionPriceHistory";
import { SubscriptionInsights } from "@/components/SubscriptionInsights";
import { SubscriptionDocuments } from "@/components/SubscriptionDocuments";
import { renewalReminderStart } from "@/lib/reminderTiming";
import {SubscriptionFollowUp,DuplicateServiceReview} from "@/components/SubscriptionFollowUp";
import { CancellationChecklist } from "@/components/CancellationChecklist";
import { saveSubscriptionPrice } from "@/lib/subscriptionPriceHistory";
import {SpendingForecast} from "@/components/SpendingForecast";
import { PaymentCalendar } from "@/components/PaymentCalendar";
import { MonthlySpending } from "@/components/MonthlySpending";
import { useRef, useState } from "react";
import { CreditCard, Plus, Pencil, Trash2, Search } from "lucide-react";
import { subscriptionBundleView } from "@/lib/subscriptionBundles";
import { emptyAirtelData } from "@/types/airtel";
import { subscriptionExpenses } from "@/lib/subscriptionExpenses";
import type { AirtelData } from "@/types/airtel";
import { monthlyCost, nextRenewal, type Subscription } from "@/types/subscriptions";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
const localToday = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const blank = (): Subscription => ({ id: "", name: "", amount: 0, currency: "INR", cycle: "monthly", renewalDate: localToday(), status: "active", category: "Other", notes: "" });
const inputClass = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink";

export function SubscriptionManager({ reminderTarget,onReminderHandled,subscriptions: storedSubscriptions, onChange, disabled = false, airtel, onRenewalTask }: { reminderTarget?:UnifiedReminder|null;onReminderHandled?:()=>void;airtel?: AirtelData; subscriptions: Subscription[]; onChange: (next: Subscription[]) => void; disabled?: boolean; onRenewalTask?: (subscription: Subscription, date: string) => void }) {
  const {target,consume}=useNoteConnections();
  const [expiryFocus,setExpiryFocus]=useState<{subscriptionId:string;expiryId:string}|null>(null);
  useEffect(()=>{if(reminderTarget?.target!=="subscriptions"||!reminderTarget.subscriptionId)return;setSearch("");setStatus("all");const id=reminderTarget.subscriptionId;const source=storedSubscriptions.find(s=>s.id===id);if(!source||(reminderTarget.expiryId&&!source.expiryRecords?.some(e=>e.id===reminderTarget.expiryId))){setAlertMessage("This reminder source is no longer available. Saved records were not changed.");onReminderHandled?.();return;}if(reminderTarget.expiryId)setExpiryFocus({subscriptionId:id,expiryId:reminderTarget.expiryId});else setExpiryFocus(null);const timer=setTimeout(()=>{if(!reminderTarget.expiryId)document.getElementById(`subscription-${id}`)?.scrollIntoView({block:"center",behavior:workspaceScrollBehavior()});onReminderHandled?.();},150);return()=>clearTimeout(timer);},[reminderTarget,onReminderHandled,storedSubscriptions]);
  useEffect(()=>{if(target?.kind!=="subscription")return;setSearch("");setStatus("all");requestAnimationFrame(()=>document.getElementById(`subscription-${target.id}`)?.scrollIntoView({block:"center",behavior:workspaceScrollBehavior()}));consume(target);},[target,consume]);
  const [alertMessage, setAlertMessage] = useState("");
  const [creatingAlert, setCreatingAlert] = useState(false);
  const countdown = (date: string) => { const days = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${localToday()}T12:00:00`).getTime()) / 86400000); return days < 0 ? `${-days} days overdue` : days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`; };
  const calendarAlert = async (subscription: Subscription, date: string) => {
    setCreatingAlert(true); setAlertMessage("");
    try {
      const start = renewalReminderStart(date);
      const adjusted = new Date(`${date}T09:00:00`).getTime() <= Date.now();
      const response = await fetch("/api/calendar/focus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `Review renewal: ${subscription.name}`, description: `Review before autopay. Recorded renewal: ${subscription.renewalDate}`, start: start.toISOString(), end: new Date(start.getTime() + 15 * 60000).toISOString() }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Calendar alert failed");
      onChange(storedSubscriptions.map(item => item.id === subscription.id ? { ...item, renewalCalendarDate: date } : item));
      setAlertMessage(adjusted ? "The original reminder time has passed. Review scheduled in Google Calendar for 15 minutes from now." : "Renewal review added to Google Calendar.");
    } catch (error) { setAlertMessage(error instanceof Error ? error.message : "Calendar alert failed"); } finally { setCreatingAlert(false); }
  };
  const today = localToday();
  const subscriptions = subscriptionBundleView(storedSubscriptions, airtel || emptyAirtelData(), today);
  const expenseDialog = useRef<HTMLDialogElement>(null);
  const expenses = subscriptionExpenses(subscriptions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [draft, setDraft] = useState<Subscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const active = subscriptions.filter(s => s.status === "active" && s.cycle !== "one-time");
  const totals = Array.from(new Set(active.map(s => s.currency))).map(currency => ({ currency, monthly: active.filter(s => s.currency === currency).reduce((sum, s) => sum + monthlyCost(s), 0) }));
  const upcoming = active.filter(s => s.cycle !== "bundled" && s.renewalDate >= today).sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));
  const visible = subscriptions.filter(s => (status === "all" || s.status === status) && `${s.name} ${s.category} ${s.notes}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const statusOrder = { active: 0, unconfirmed: 1, paused: 2, completed: 3, cancelled: 4 };
    const statusDifference = statusOrder[a.status] - statusOrder[b.status];
    const aDate = a.renewalDate || a.bundleEndDate || "9999-12-31";
    const bDate = b.renewalDate || b.bundleEndDate || "9999-12-31";
    return statusDifference || aDate.localeCompare(bDate) || a.name.localeCompare(b.name);
  });
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled || !draft || !draft.name.trim() || !Number.isFinite(draft.amount) || draft.amount < 0) return;
    const previous = storedSubscriptions.find(item => item.id === draft.id);
    const statusHistory = previous && previous.status !== draft.status ? [...(previous.statusHistory || []), { date: today, status: draft.status }] : draft.statusHistory;
    const saved = saveSubscriptionPrice(previous, { ...draft, statusHistory, name: draft.name.trim(), id: draft.id || crypto.randomUUID() }, today);
    onChange(draft.id ? subscriptions.map(s => s.id === draft.id ? saved : s) : [...subscriptions, saved]);
    setDraft(null);
  };
  return <section className="space-y-5">
    <RenewalDecisionQueue subscriptions={storedSubscriptions} onChange={onChange} disabled={disabled} today={today} />
    <DuplicateServiceReview subscriptions={storedSubscriptions}/>
    <SubscriptionBudgets subscriptions={subscriptions} disabled={disabled} />
    <PaymentReconciliation subscriptions={storedSubscriptions} onChange={onChange} disabled={disabled} />
    <SubscriptionInsights subscriptions={storedSubscriptions} airtel={airtel || emptyAirtelData()} onChange={onChange} disabled={disabled} />
    {alertMessage && <p role="status" className="rounded-xl border border-line p-3 text-sm">{alertMessage}</p>}
    <div className="flex flex-wrap gap-2">{Array.from(new Set(active.map(item => `${item.category}|${item.currency}`))).map(key => { const [category, currency] = key.split("|"); const total = active.filter(item => item.category === category && item.currency === currency).reduce((sum, item) => sum + monthlyCost(item), 0); return <span key={key} className="rounded-xl border border-line bg-white px-3 py-2 text-xs">{category}: {money(total, currency)} / month</span>; })}</div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-xl font-bold text-ink">Subscription Manager</h3><p className="mt-1 text-xs text-muted">Keep recurring costs and renewal dates in one place. Saved with your workspace.</p></div>
      <div className="flex flex-wrap gap-2"><SpendingForecast subscriptions={storedSubscriptions} airtel={airtel||emptyAirtelData()}/><PaymentCalendar subscriptions={storedSubscriptions} airtel={airtel || emptyAirtelData()} /><MonthlySpending subscriptions={storedSubscriptions} airtel={airtel || emptyAirtelData()} /><button onClick={() => expenseDialog.current?.showModal()} className="btn-theme rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">Total expense</button>
      <button disabled={disabled} onClick={() => setDraft(blank())} className="btn-theme-primary inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus size={16} />Add subscription</button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-line bg-white p-5"><p className="text-xs text-muted">Monthly equivalent</p><p className="mt-2 text-xl font-bold text-ink">{totals.length ? totals.map(t => money(t.monthly, t.currency)).join(" + ") : "₹0"}</p><p className="mt-1 text-xs text-muted">Active plans · currencies kept separate</p></div>
      <div className="rounded-2xl border border-line bg-white p-5"><p className="text-xs text-muted">Annual projection</p><p className="mt-2 text-xl font-bold text-ink">{totals.length ? totals.map(t => money(t.monthly * 12, t.currency)).join(" + ") : "₹0"}</p><p className="mt-1 text-xs text-muted">{active.length} active subscription{active.length === 1 ? "" : "s"}</p></div>
      <div className="rounded-2xl border border-line bg-white p-5"><p className="text-xs text-muted">Next renewal</p><p className="mt-2 text-lg font-bold text-ink">{upcoming[0]?.name || "No upcoming renewals"}</p><p className="mt-1 text-xs text-muted">{upcoming[0] ? `${upcoming[0].renewalDate} · ${money(upcoming[0].amount, upcoming[0].currency)}` : "Add a plan to get started"}</p></div>
    </div>
    <div className="flex flex-wrap gap-3"><label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3"><Search size={16} /><input aria-label="Search subscriptions" placeholder="Search subscriptions…" className="w-full bg-transparent py-2 text-sm outline-none" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filter by status" className={inputClass + " sm:w-auto"} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option><option value="unconfirmed">Needs review</option><option value="completed">Completed</option></select></div>
    {disabled && <p role="status" className="text-sm text-muted">Loading saved workspace before enabling changes…</p>}
    {!visible.length ? <div className="rounded-2xl border border-dashed border-line p-12 text-center"><CreditCard className="mx-auto mb-3 text-muted" /><p className="font-semibold text-ink">{subscriptions.length ? "No matching subscriptions" : "Your subscriptions, organized"}</p><p className="mt-2 text-sm text-muted">{subscriptions.length ? "Try another search or status." : "Add your first plan to track spending and upcoming renewals."}</p></div> : <div className="space-y-3">{visible.map(s => <article id={`subscription-${s.id}`} key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="min-w-0"><h4 className="font-semibold text-ink">{s.name}{s.planName ? ` · ${s.planName}` : ""} <span className="ml-2 rounded-full bg-[#f0f2eb] px-2 py-1 text-xs font-medium capitalize">{s.status === "unconfirmed" ? "Needs review" : s.status}</span></h4><p className="mt-2 text-xs text-muted">{s.category} · {s.cycle === "bundled" ? "Included with Airtel recharge" : s.cycle === "one-time" ? "One-time upgrade · not recurring" : s.cycle === "unknown" ? "Billing cycle unconfirmed" : `${s.cycle === "yearly" ? "Annual" : s.cycle === "quarterly" ? "Quarterly" : "Monthly"} billing`}</p>{s.startDate && <p className="mt-2 text-xs text-muted">First recorded payment · {s.startDate} {s.lastPaidDate ? `· Last paid ${s.lastPaidDate}` : ""}</p>}
      {s.cycle === "bundled" && <p className="mt-2 text-xs text-muted">Included since {s.bundledSince || "date unconfirmed"} · {s.bundleEndDate ? `Recharge ends ${s.bundleEndDate}${s.bundleEndDate < today ? " · Bundle expired; review access" : ""}` : "Valid only until current recharge ends · End date needed"}</p>}
      <p className="mt-2 text-xs text-muted">Renewal decision · {s.renewalDecision === "keep" ? "Keep" : s.renewalDecision === "cancel" ? "Cancel before renewal (provider action still required)" : "Decide later"}</p>
      <RelatedNotes kind="subscription" id={s.id} />
      <SubscriptionPriceHistory subscription={s} />
      <SharedSubscriptionExpenses subscription={storedSubscriptions.find(item=>item.id===s.id)!} disabled={disabled} onChange={updated=>onChange(storedSubscriptions.map(item=>item.id===updated.id?updated:item))} />
      <SubscriptionFollowUp focusExpiryId={expiryFocus?.subscriptionId===s.id?expiryFocus.expiryId:undefined} subscription={storedSubscriptions.find(item=>item.id===s.id)!} today={today} disabled={disabled} onChange={updated=>onChange(storedSubscriptions.map(item=>item.id===updated.id?updated:item))}/>
      <CancellationChecklist subscription={s} disabled={disabled} onChange={next => onChange(subscriptions.map(item => item.id === next.id ? next : item))} />
      {s.bundlePlan && <p className="mt-2 text-xs text-muted">{s.bundlePlan.provider} recharge · {money(s.bundlePlan.amount, s.currency)} paid · {s.bundlePlan.validityDays} days · {s.bundlePlan.startDate}–{s.bundlePlan.endDate}. Shared recharge cost; not an additional subscription payment.</p>}
      {s.billingHistory && <details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Netflix invoices · {s.billingHistory.length} payments · {money(s.billingHistory.reduce((sum, invoice) => sum + invoice.amount, 0), s.currency)} total (same payments as journal)</summary><ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">{s.billingHistory.map(invoice => <li key={invoice.date}>{invoice.date} · {money(invoice.amount, s.currency)} · Membership {invoice.periodStart}–{invoice.periodEnd} · {money(invoice.subtotal, s.currency)} + {money(invoice.tax, s.currency)} IGST</li>)}</ul></details>}
      {s.payments && <details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">{s.payments.length} recorded payments · {money(s.payments.reduce((sum, payment) => sum + payment.amount, 0), s.currency)} paid</summary><ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">{s.payments.map(payment => <li key={`${payment.journal}-${payment.rowId}`}>{payment.date} · {money(payment.amount, s.currency)} · {payment.journal} journal{payment.notes ? ` · ${payment.notes}` : ""}</li>)}</ul></details>}
      {s.notes && <p className="mt-2 max-w-xl whitespace-pre-wrap break-words text-xs text-muted">{s.notes}</p>}
      <SubscriptionDocuments subscription={s} disabled={disabled} onChange={updated => onChange(storedSubscriptions.map(item => item.id === updated.id ? updated : item))} />
      {s.renewalDate && <p className="mt-2 text-xs text-muted">Renews {countdown(s.renewalDate)}</p>}
      {s.trialEndDate && <p className="mt-2 text-xs text-muted">Trial ends {countdown(s.trialEndDate)}</p>}
      {s.cancellationDeadline && <p className="mt-2 text-xs text-muted">Cancel by {s.cancellationDeadline} · {countdown(s.cancellationDeadline)}</p>}
      {!!s.statusHistory?.length && <details className="mt-2 text-xs text-muted"><summary>Status history</summary>{s.statusHistory.map((entry, index) => <p key={`${entry.date}-${index}`}>{entry.date} · {entry.status}</p>)}</details>}
      {s.status === "active" && s.cycle !== "bundled" && s.cycle !== "one-time" && (s.cancellationDeadline || s.trialEndDate || s.renewalDate) && <div className="mt-3 flex flex-wrap gap-2">{(() => { const deadline = s.cancellationDeadline || s.trialEndDate || s.renewalDate; const reminder = new Date(`${deadline}T12:00:00`); reminder.setDate(reminder.getDate() - (s.reminderDaysBefore ?? 3)); const date = `${reminder.getFullYear()}-${String(reminder.getMonth() + 1).padStart(2, "0")}-${String(reminder.getDate()).padStart(2, "0")}`; return <><button disabled={disabled || creatingAlert || s.renewalCalendarDate === date} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => void calendarAlert(s, date)}>{s.renewalCalendarDate === date ? "Calendar alert added" : "Add Google Calendar alert"}</button>{onRenewalTask && <button disabled={disabled || s.renewalTaskDate === date} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => { onRenewalTask(s, date); onChange(storedSubscriptions.map(item => item.id === s.id ? { ...item, renewalTaskDate: date } : item)); }}>{s.renewalTaskDate === date ? "Review task added" : "Add review task"}</button>}</>; })()}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-4"><div><p className="font-bold text-ink">{s.cycle === "bundled" ? "Included" : money(s.amount, s.currency)}<span className="text-xs font-normal text-muted">{s.cycle === "bundled" ? " · no separate charge" : s.cycle === "one-time" ? " one-time" : s.cycle === "unknown" ? " last paid" : ` / ${s.cycle === "yearly" ? "year" : s.cycle === "quarterly" ? "3 months" : "month"}`}</span></p><p className={`mt-1 text-xs ${s.status === "active" && !!s.renewalDate && s.renewalDate < today ? "text-amber-700" : "text-muted"}`}>{s.cycle === "bundled" ? "Ends with current Airtel recharge" : s.cycle === "one-time" ? "No recurring renewal" : <>{s.status === "active" && !!s.renewalDate && s.renewalDate < today ? "Overdue · " : "Renewal · "}{s.renewalDate || "Unconfirmed"}</>}</p></div>
      {s.status === "active" && s.renewalDate && s.cycle !== "unknown" && s.cycle !== "one-time" && s.cycle !== "bundled" && <button disabled={disabled} className="btn-theme-primary rounded-lg border border-line px-3 py-2 text-xs text-forest transition-colors enabled:hover:border-forest enabled:hover:bg-forest enabled:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 disabled:opacity-50" onClick={() => onChange(subscriptions.map(item => item.id === s.id ? { ...item, renewalDate: nextRenewal(item, today), lastPaidDate: today, payments: [...(item.payments || []), { date: today, amount: item.amount, journal: "Recorded payment", rowId: crypto.randomUUID(), notes: "Renewal recorded by you" }] } : item))}>Mark renewed</button>}
      {s.status === "unconfirmed" && <button disabled={disabled} onClick={() => onChange(subscriptions.map(item => item.id === s.id ? { ...item, status: "completed" } : item))} className="btn-theme-primary rounded-lg border border-line px-3 py-2 text-xs text-forest transition-colors enabled:hover:border-forest enabled:hover:bg-forest enabled:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 disabled:opacity-50">Mark completed</button>}
      <button disabled={disabled} aria-label={`Edit ${s.name}`} onClick={() => setDraft({ ...s })} className="btn-theme-quiet p-2 text-muted"><Pencil size={16} /></button><button disabled={disabled} aria-label={`Delete ${s.name}`} onClick={() => setDeleteId(s.id)} className="p-2 text-red-700"><Trash2 size={16} /></button></div>
    </article>)}</div>}
    {deleteId && <div role="alertdialog" aria-modal="true" aria-label="Delete subscription" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm"><p>Delete {subscriptions.find(s => s.id === deleteId)?.name}? This removes the record; it does not cancel billing with the provider.</p><div className="mt-3 flex gap-3"><button disabled={disabled} onClick={() => { onChange(subscriptions.filter(s => s.id !== deleteId)); setDeleteId(null); }} className="rounded-lg bg-red-700 px-3 py-2 text-white">Delete subscription</button><button className="btn-theme-quiet rounded-lg px-2 py-1" onClick={() => setDeleteId(null)}>Keep subscription</button></div></div>}
    {draft && <form onSubmit={save} className="rounded-2xl border border-line bg-white p-5"><div className="mb-4 flex items-center justify-between"><h4 className="font-bold">{draft.id ? "Edit subscription" : "New subscription"}</h4><button type="button" onClick={() => setDraft(null)} className="btn-theme-quiet text-sm text-muted">Cancel</button></div><div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1 text-xs">Name<input autoFocus required maxLength={120} className={inputClass} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
      <label className="space-y-1 text-xs">Remind before deadline<select className={inputClass} value={draft.reminderDaysBefore ?? 3} onChange={event => setDraft({ ...draft, reminderDaysBefore: Number(event.target.value) })}>{[1,3,7].map(days => <option key={days} value={days}>{days} days before</option>)}</select></label>
      <label className="space-y-1 text-xs">Trial ends (optional)<input type="date" className={inputClass} value={draft.trialEndDate || ""} onChange={e => setDraft({ ...draft, trialEndDate: e.target.value })} /></label>
      <label className="space-y-1 text-xs">Cancellation deadline (optional)<input type="date" className={inputClass} value={draft.cancellationDeadline || ""} onChange={e => setDraft({ ...draft, cancellationDeadline: e.target.value })} /></label>
      <label className="space-y-1 text-xs">Cost per billing cycle<input type="number" required min="0" step="0.01" className={inputClass} value={Number.isFinite(draft.amount) ? draft.amount : ""} onChange={e => setDraft({ ...draft, amount: e.target.valueAsNumber })} /></label>
      <label className="space-y-1 text-xs">Currency<select className={inputClass} value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value as Subscription["currency"] })}>{["INR", "USD", "EUR", "GBP"].map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="space-y-1 text-xs">Billing cycle<select className={inputClass} value={draft.cycle} onChange={e => setDraft({ ...draft, cycle: e.target.value as Subscription["cycle"] })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="quarterly">Every 3 months</option><option value="unknown">Unconfirmed</option><option value="one-time">One-time upgrade / payment</option><option value="bundled">Included with Airtel recharge</option></select></label>
      <label className="space-y-1 text-xs">Next renewal<input type="date" required={draft.status === "active" && draft.cycle !== "unknown" && draft.cycle !== "one-time" && draft.cycle !== "bundled"} min="1900-01-01" max="9999-12-31" className={inputClass} value={draft.renewalDate} onChange={e => setDraft({ ...draft, renewalDate: e.target.value })} /></label>
      {draft.cycle === "bundled" && <label className="space-y-1 text-xs">Airtel recharge end date<input type="date" className={inputClass} value={draft.bundleEndDate || ""} onChange={e => setDraft({ ...draft, bundleEndDate: e.target.value })} /></label>}
      {draft.cycle === "bundled" && airtel?.plan && <button type="button" className="btn-theme-quiet text-left text-xs font-semibold text-forest" onClick={() => setDraft({ ...draft, bundleRechargeId: airtel.plan!.id, bundledSince: airtel.plan!.startDate, bundleEndDate: airtel.plan!.endDate, bundlePlan: { ...airtel.plan! } })}>Link current Airtel plan ({airtel.plan.startDate}–{airtel.plan.endDate})</button>}
      <label className="space-y-1 text-xs">Plan name<input className={inputClass} value={draft.planName || ""} onChange={e => setDraft({ ...draft, planName: e.target.value })} /></label>
      <label className="space-y-1 text-xs">Renewal decision<select className={inputClass} value={draft.renewalDecision || "later"} onChange={e => setDraft({ ...draft, renewalDecisionDate: draft.renewalDate, renewalDecision: e.target.value as Subscription["renewalDecision"] })}><option value="later">Decide later</option><option value="keep">Keep</option><option value="cancel">Cancel before renewal</option></select><span className="block text-muted">Planning only; cancel directly with the provider.</span></label>
      {draft.renewalDecision === "cancel" && <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs sm:col-span-2"><p className="font-semibold text-amber-900">Cancellation steps</p><div className="mt-2 space-y-1">{(draft.cancellationChecklist || []).map(item => <label key={item.id} className="flex items-center gap-2"><input type="checkbox" checked={item.done} onChange={() => setDraft({ ...draft, cancellationChecklist: (draft.cancellationChecklist || []).map(step => step.id === item.id ? { ...step, done: !step.done } : step) })} /><span>{item.label}</span></label>)}</div><button type="button" className="btn-theme mt-2 rounded-lg border border-line px-2 py-1" onClick={() => setDraft({ ...draft, cancellationChecklist: [...(draft.cancellationChecklist || []), { id: crypto.randomUUID(), label: "Cancel or downgrade with provider", done: false }] })}>Add step</button></div>}
      <label className="space-y-1 text-xs">Status<select className={inputClass} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Subscription["status"] })}>{["active", "paused", "cancelled", "unconfirmed", "completed"].map(s => <option key={s} value={s}>{s === "unconfirmed" ? "Needs review" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></label>
      <label className="space-y-1 text-xs">Start date / first recorded payment<input type="date" className={inputClass} value={draft.startDate || ""} onChange={e => setDraft({ ...draft, startDate: e.target.value })} /></label>
      <label className="space-y-1 text-xs">Category<input maxLength={80} className={inputClass} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} /></label>
      <label className="space-y-1 text-xs">Notes<textarea maxLength={2000} className={inputClass} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
    </div><button disabled={disabled} className="btn-theme-primary mt-4 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save subscription</button></form>}
    <dialog ref={expenseDialog} aria-labelledby="subscription-expenses-title" aria-describedby="subscription-expenses-description" className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-white p-6 text-ink shadow-xl backdrop:bg-black/40">
      <div className="flex items-center justify-between gap-4"><h3 id="subscription-expenses-title" className="text-lg font-bold">Total subscription expense</h3><button autoFocus type="button" onClick={() => expenseDialog.current?.close()} className="btn-theme rounded-lg border border-line px-3 py-1.5 text-sm">Close</button></div>
      <p id="subscription-expenses-description" className="mt-3 text-xs text-muted">All recorded payments across active, paused, completed, cancelled, and review-needed plans. Includes confirmed Airtel recharge costs once. Search and status filters do not affect this total.</p>
      <div className="mt-5 rounded-xl bg-[#f0f2eb] p-4"><p className="text-xs text-muted">Total paid · all recorded history</p><p className="mt-1 text-2xl font-bold">{expenses.totals.length ? expenses.totals.map(total => money(total.amount, total.currency)).join(" + ") : "₹0"}</p><p className="mt-2 text-xs text-muted">Currencies stay separate. Future renewals and spending projections are excluded.</p></div>
      {expenses.rows.length ? <ul className="mt-4 divide-y divide-line">{expenses.rows.map(row => <li key={row.id} className="flex items-start justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{row.name}</p><p className="mt-1 text-xs text-muted">{row.kind === "recharge" ? "Shared bundle cost · counted once" : `${row.count} recorded payment${row.count === 1 ? "" : "s"}`}</p></div><span className="shrink-0 text-sm font-semibold">{money(row.amount, row.currency)}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted">No recorded payments yet.</p>}
      <p className="mt-4 text-xs text-muted">Netflix invoices and journal entries describe the same payments and are counted once. Plans without payment history are excluded.</p>
    </dialog>
  </section>;
}
