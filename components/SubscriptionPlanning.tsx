"use client";
import { useState } from "react";
import type { Subscription } from "@/types/subscriptions";
import { matchingPlan, parsePaymentCsv, paymentAlreadyRecorded, reconcilePayments, renewalQueue, type ImportedPayment } from "@/lib/subscriptionPlanning";
import { formatBillingMoney as money } from "@/components/SubscriptionBudgets";
export function RenewalDecisionQueue({ subscriptions, onChange, disabled, today }: {
    subscriptions: Subscription[];
    onChange: (next: Subscription[]) => void;
    disabled: boolean;
    today: string;
}) {
    const rows = renewalQueue(subscriptions, today);
    return <details className="rounded-2xl border border-line bg-white p-5" open>
    <summary className="cursor-pointer font-semibold">Renewal decision queue · {rows.length}</summary>
    <p className="mt-2 text-xs text-muted">Overdue and next 30 days. Keep, Cancel, or Decide later records your intention; cancel directly with the provider. Decisions are linked to the current renewal date.</p>{rows.length ? <ul className="mt-3 divide-y divide-line">{rows.map(({ subscription: s, date }) => {
                const current = s.renewalDecisionDate === s.renewalDate;
                return <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="text-sm">
                <strong>{s.name}</strong>
                <p className="mt-1 text-xs text-muted">{date < today ? 'Overdue review' : 'Review by'} {date} · {money(s.amount, s.currency)}{s.renewalDecision && !current ? ' · Previous decision; review this renewal' : ''}</p>
                </div>
                <div className="flex flex-wrap gap-1">{(['keep', 'cancel', 'later'] as const).map(choice => <button type="button" key={choice} disabled={disabled} aria-pressed={current && s.renewalDecision === choice} className={`rounded-lg border px-3 py-2 text-xs ${current && s.renewalDecision === choice ? 'border-forest bg-forest text-white' : 'border-line hover:bg-stone-50'}`} onClick={() => onChange(subscriptions.map(item => item.id === s.id ? { ...item, renewalDecision: choice, renewalDecisionDate: s.renewalDate } : item))}>{choice === 'keep' ? 'Keep' : choice === 'cancel' ? 'Cancel' : 'Decide later'}</button>)}</div>
                </li>;
            })}</ul> : <p className="mt-3 text-xs text-muted">No plans need review in this window.</p>}</details>;
}
type ReviewRow = {
    payment: ImportedPayment;
    subscriptionId: string;
    selected: boolean;
};
export function PaymentReconciliation({ subscriptions, onChange, disabled }: {
    subscriptions: Subscription[];
    onChange: (next: Subscription[]) => void;
    disabled: boolean;
}) {
    const [csv, setCsv] = useState('');
    const [rows, setRows] = useState<ReviewRow[]>([]);
    const [message, setMessage] = useState('');
    const duplicateAt = (row: ReviewRow, index: number) => {
        const plan = subscriptions.find(s => s.id === row.subscriptionId);
        return !!plan && (paymentAlreadyRecorded(row.payment, plan) || rows.slice(0, index).some(previous => previous.selected && previous.subscriptionId === row.subscriptionId && ((previous.payment.date === row.payment.date && previous.payment.amount === row.payment.amount) || (!!row.payment.reference && previous.payment.reference === row.payment.reference))));
    };
    const ready = rows.filter((row, index) => row.selected && subscriptions.some(s => s.id === row.subscriptionId) && !duplicateAt(row, index));
    return <details className="rounded-2xl border border-line bg-white p-5">
    <summary className="cursor-pointer font-semibold">Import & reconcile payments</summary>
    <p className="mt-2 text-xs text-muted">Upload or paste CSV with name,date,amount,currency and optional reference. Dates use YYYY-MM-DD; amounts use a decimal point without currency symbols. Review matches before saving. Matching date/amount or reference is skipped to prevent double counting. No new plans are created.</p>
    <label className="mt-3 block text-xs">CSV file<input disabled={disabled} type="file" accept=".csv,text/csv" className="mt-1 block text-xs" onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
        return; try {
        if (file.size > 500000)
            throw new Error('Use a CSV smaller than 500 KB.');
        setCsv(await file.text());
        setRows([]);
        setMessage('File loaded. Preview matches before saving.');
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not read CSV.');
    } }}/>
    </label>
    <label className="mt-3 block text-xs">Payment CSV<textarea disabled={disabled} className="mt-1 min-h-28 w-full rounded-xl border border-line p-3 font-mono text-xs" placeholder={'name,date,amount,currency,reference\nNetflix,2026-11-01,199,INR,receipt-123'} value={csv} onChange={e => { setCsv(e.target.value); setRows([]); }}/>
    </label>
    <button type="button" disabled={disabled || !csv.trim()} className="btn-theme mt-2 rounded-lg border border-line px-3 py-2 text-xs" onClick={() => { try {
        const payments = parsePaymentCsv(csv);
        setRows(payments.map(payment => ({ payment, subscriptionId: matchingPlan(payment, subscriptions), selected: true })));
        setMessage(`${payments.length} rows loaded for review. Nothing saved yet.`);
    }
    catch (error) {
        setRows([]);
        setMessage(error instanceof Error ? error.message : 'Invalid CSV.');
    } }}>Preview matches</button>{!!rows.length && <>
        <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto">{rows.map((row, index) => {
                const plan = subscriptions.find(s => s.id === row.subscriptionId);
                const duplicate = duplicateAt(row, index);
                return <li key={row.payment.id} className="space-y-2 py-3 text-xs">
                <label className="flex gap-2">
                <input type="checkbox" disabled={disabled || !!duplicate} checked={row.selected && !duplicate} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, selected: e.target.checked } : r))}/>
                <span>{row.payment.name} · {row.payment.date} · {money(row.payment.amount, row.payment.currency)}</span>
                </label>
                <label className="block">Match to plan<select disabled={disabled} aria-label={`Match payment ${index + 1}`} className="ml-2 max-w-full rounded-lg border border-line p-2" value={row.subscriptionId} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, subscriptionId: e.target.value } : r))}>
                <option value="">Choose existing plan</option>{subscriptions.filter(s => s.currency === row.payment.currency && s.cycle !== 'bundled').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </label>
                <p className="text-muted">{duplicate ? 'Duplicate payment — skipped' : !plan ? 'Unmatched — choose a plan or deselect' : 'Matched — ready for your approval'}</p>
                </li>;
            })}</ul>
        <button type="button" className="btn-theme-primary mt-3 rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white" disabled={disabled || !ready.length || rows.some(r => r.selected && !r.subscriptionId)} onClick={() => { try {
            const next = reconcilePayments(subscriptions, ready);
            onChange(next);
            setRows([]);
            setCsv('');
            setMessage(`Import approved. Payment history saved; duplicate rows skipped. Existing invoices retained.`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Import could not be saved.');
        } }}>Approve matched payments</button>
        </>}<p role="status" className="mt-2 text-xs text-muted">{message}</p>
    </details>;
}
