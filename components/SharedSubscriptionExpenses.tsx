"use client";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Subscription } from "@/types/subscriptions";
import { outstandingShares, validSharedExpense, type SharedExpense } from "@/lib/subscriptionPlanning";
import { formatBillingMoney as money } from "@/components/SubscriptionBudgets";
export function SharedSubscriptionExpenses({ subscription, onChange, disabled }: {
    subscription: Subscription;
    onChange: (next: Subscription) => void;
    disabled: boolean;
}) {
    const [draft, setDraft] = useState<SharedExpense | null>(null);
    const [message, setMessage] = useState('');
    const [removeId, setRemoveId] = useState<string | null>(null);
    const confirmDialog = useRef<HTMLDialogElement>(null);
    useEffect(() => { if (removeId)
        confirmDialog.current?.showModal(); }, [removeId]);
    const records = subscription.sharedExpenses || [];
    return <details className="mt-3 rounded-xl border border-line p-3">
    <summary className="cursor-pointer text-xs font-semibold">Shared expenses · {records.length}</summary>
    <p className="mt-2 text-xs text-muted">Record a payer and each person's share, including the payer. This is a reimbursement ledger; it adds no second subscription charge and sends no payment requests.</p>
    <ul className="mt-2 divide-y divide-line">{records.map(record => <li key={record.id} className="py-3 text-xs">
        <strong>{record.date} · {money(record.total, record.currency)} · Paid by {record.paidBy}</strong>
        <p className="mt-1 text-muted">{money(outstandingShares(record), record.currency)} still owed to {record.paidBy}</p>
        <ul className="mt-2 space-y-1">{record.shares.map(share => <li key={share.person} className="flex flex-wrap items-center gap-2">
            <span>{share.person}: {money(share.amount, record.currency)}</span>{share.person.trim().toLowerCase() === record.paidBy.trim().toLowerCase() ? <span className="text-muted">Payer's share</span> : <label className="flex items-center gap-1">
                <input disabled={disabled} type="checkbox" checked={share.settled} onChange={() => onChange({ ...subscription, sharedExpenses: records.map(r => r.id === record.id ? { ...r, shares: r.shares.map(s => s.person === share.person ? { ...s, settled: !s.settled } : s) } : r) })}/>Reimbursed</label>}</li>)}</ul>
        <div className="mt-2 flex gap-2">
        <button type="button" disabled={disabled} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => { setDraft(structuredClone(record)); setMessage(''); }}>Edit split</button>
        <button type="button" disabled={disabled} aria-label={`Remove shared expense ${record.date}`} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs text-red-700" onClick={() => setRemoveId(record.id)}>
        <Trash2 size={14}/>
        </button>
        </div>
        </li>)}</ul>
    <button type="button" disabled={disabled} className="btn-theme mt-2 rounded-lg border border-line px-3 py-2 text-xs" onClick={() => { const now = new Date(); setDraft({ id: crypto.randomUUID(), date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, currency: subscription.currency, total: subscription.amount, paidBy: 'Me', shares: [{ person: 'Me', amount: subscription.amount, settled: false }] }); setMessage(''); }}>Record shared expense</button>{draft && <div className="mt-3 space-y-3 rounded-xl border border-line bg-stone-50 p-3">
        <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs">Date<input type="date" className="mt-1 w-full rounded-lg border border-line p-2" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}/>
        </label>
        <label className="text-xs">Total ({draft.currency})<input type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border border-line p-2" value={Number.isFinite(draft.total) ? draft.total : ''} onChange={e => setDraft({ ...draft, total: e.target.valueAsNumber })}/>
        </label>
        <label className="text-xs">Paid by<input maxLength={100} className="mt-1 w-full rounded-lg border border-line p-2" value={draft.paidBy} onChange={e => setDraft({ ...draft, paidBy: e.target.value })}/>
        </label>
        </div>{draft.shares.map((share, index) => <div key={index} className="flex flex-wrap items-end gap-2">
            <label className="text-xs">Person<input maxLength={100} aria-label={`Share person ${index + 1}`} className="mt-1 w-full rounded-lg border border-line p-2" value={share.person} onChange={e => setDraft({ ...draft, shares: draft.shares.map((s, i) => i === index ? { ...s, person: e.target.value } : s) })}/>
            </label>
            <label className="text-xs">Share<input type="number" min="0" step="0.01" aria-label={`Share amount ${index + 1}`} className="mt-1 w-28 rounded-lg border border-line p-2" value={Number.isFinite(share.amount) ? share.amount : ''} onChange={e => setDraft({ ...draft, shares: draft.shares.map((s, i) => i === index ? { ...s, amount: e.target.valueAsNumber } : s) })}/>
            </label>
            <button type="button" aria-label={`Remove share ${index + 1}`} className="btn-theme rounded-lg border border-line p-2" onClick={() => setDraft({ ...draft, shares: draft.shares.filter((_, i) => i !== index) })}>
            <Trash2 size={14}/>
            </button>
            </div>)}<div className="flex flex-wrap gap-2">
        <button type="button" disabled={draft.shares.length >= 50} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => setDraft({ ...draft, shares: [...draft.shares, { person: '', amount: 0, settled: false }] })}>Add person</button>
        <button type="button" disabled={disabled} className="btn-theme-primary rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white" onClick={() => { if (!validSharedExpense(draft)) {
            setMessage('Use a valid date and positive total. Include the payer once, use unique names, and make shares add up exactly to the total (up to 2 decimals).');
            return;
        } onChange({ ...subscription, sharedExpenses: records.some(r => r.id === draft.id) ? records.map(r => r.id === draft.id ? draft : r) : [...records, draft] }); setDraft(null); setMessage('Shared expense saved.'); }}>Save split</button>
        <button type="button" className="btn-theme-quiet rounded-lg px-3 py-2 text-xs" onClick={() => setDraft(null)}>Cancel</button>
        </div>
        </div>}{removeId && <dialog ref={confirmDialog} aria-label="Remove shared expense" onCancel={() => setRemoveId(null)} className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-white p-5 shadow-xl backdrop:bg-black/40">
        <h4 className="font-semibold">Remove this shared expense?</h4>
        <p className="mt-2 text-xs text-muted">Only this reimbursement record is removed. Subscription payments stay unchanged.</p>
        <div className="mt-4 flex gap-2">
        <button type="button" autoFocus className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => setRemoveId(null)}>Keep expense</button>
        <button type="button" disabled={disabled} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs text-red-700" onClick={() => { onChange({ ...subscription, sharedExpenses: records.filter(r => r.id !== removeId) }); setRemoveId(null); }}>Remove expense</button>
        </div>
        </dialog>}<p role="status" className="mt-2 text-xs text-muted">{message}</p>
    </details>;
}
