"use client";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { RecordDocuments } from "@/components/SubscriptionDocuments";
import { completeMaintenance, validAssetCare } from "@/lib/assetRecords";
import type { AssetRecord, WarrantyClaim, AssetMaintenance } from "@/types/assets";
const input = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs";
const action = "btn-theme rounded-lg border border-line px-3 py-2 text-xs disabled:opacity-50";
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function AssetCare({ record, onChange, disabled, receipts, assetName, section, embedded = false }: {
    section?: "claims" | "maintenance";
    embedded?: boolean;
    record: AssetRecord;
    onChange: (record: AssetRecord) => void;
    disabled: boolean;
    receipts: number;
    assetName: string;
}) {
    const [claim, setClaim] = useState<WarrantyClaim | null>(null);
    const [maintenance, setMaintenance] = useState<AssetMaintenance | null>(null);
    const [message, setMessage] = useState('');
    const [removing, setRemoving] = useState<{
        kind: 'claims' | 'maintenance';
        id: string;
    } | null>(null);
    const confirm = useRef<HTMLDialogElement>(null);
    useEffect(() => { if (removing)
        confirm.current?.showModal(); }, [removing]);
    const claims = record.claims || [], schedules = record.maintenance || [], today = localToday();
    const saveClaim = () => { if (!claim || disabled)
        return; const trimmed = { ...claim, documents: claims.find(c => c.id === claim.id)?.documents || claim.documents, title: claim.title.trim() }; if (!validAssetCare({ claims: [trimmed] })) {
        setMessage('Enter a claim title and non-empty checklist labels; keep notes within 5,000 characters.');
        return;
    } onChange({ ...record, claims: claims.some(c => c.id === trimmed.id) ? claims.map(c => c.id === trimmed.id ? trimmed : c) : [...claims, trimmed] }); setClaim(null); setMessage('Claim saved.'); };
    const saveMaintenance = () => { if (!maintenance || disabled)
        return; const previous = schedules.find(m => m.id === maintenance.id); const trimmed = { ...maintenance, title: maintenance.title.trim(), completedDates: previous?.completedDates || maintenance.completedDates, ...(previous && (previous.nextDue !== maintenance.nextDue || previous.repeatDays !== maintenance.repeatDays) ? { completed: false } : {}) }; if (!validAssetCare({ maintenance: [trimmed] })) {
        setMessage('Enter a title, valid due date, and repeat interval of 1–3,650 days, or leave repeat blank.');
        return;
    } onChange({ ...record, maintenance: schedules.some(m => m.id === trimmed.id) ? schedules.map(m => m.id === trimmed.id ? trimmed : m) : [...schedules, trimmed] }); setMaintenance(null); setMessage('Maintenance schedule saved.'); };
    return <div className={embedded ? "space-y-3" : "mt-3 space-y-3"}>
    {section !== "maintenance" && <details open={embedded || undefined} className={embedded ? "text-xs" : "rounded-xl border border-line p-3 text-xs"}>
    <summary hidden={embedded} className="cursor-pointer font-semibold">Warranty claims & checklist · {claims.length}</summary>
    <p className="mt-2 text-muted">{receipts} asset receipt{receipts === 1 ? '' : 's'} available {embedded ? 'in the Documents tab' : 'above'}. Keep provider contacts, claim references, evidence, and progress together. Status changes are your records; no claim is sent automatically.</p>
    <ul className="mt-2 divide-y divide-line">{claims.map(c => <li key={c.id} className="space-y-2 py-3">
        <p className="font-semibold">{c.title} · <span className="capitalize">{c.status.replace('-', ' ')}</span>
        </p>{c.contact && <p className="whitespace-pre-wrap break-words text-muted">Service contact: {c.contact}</p>}{c.reference && <p className="text-muted">Claim reference: {c.reference}</p>}{c.notes && <p className="whitespace-pre-wrap break-words text-muted">{c.notes}</p>}<p className="text-muted">{c.checklist.filter(s => s.done).length}/{c.checklist.length} steps complete</p>{c.checklist.map(step => <label key={step.id} className="flex items-center gap-2">
            <input type="checkbox" disabled={disabled} checked={step.done} onChange={() => onChange({ ...record, claims: claims.map(item => item.id === c.id ? { ...item, checklist: item.checklist.map(s => s.id === step.id ? { ...s, done: !s.done } : s) } : item) })}/>{step.label}</label>)}<RecordDocuments recordName={`${assetName} ${c.title}`} label="Claim receipts & evidence" documents={c.documents || []} disabled={disabled} onChange={documents => onChange({ ...record, claims: claims.map(item => item.id === c.id ? { ...item, documents } : item) })}/>
        <div className="flex gap-2">
        <button type="button" disabled={disabled} className={action} onClick={() => { setClaim(structuredClone(c)); setMessage(''); }}>Edit claim</button>
        <button type="button" disabled={disabled} aria-label={`Remove claim ${c.title}`} className={action} onClick={() => setRemoving({ kind: 'claims', id: c.id })}>
        <Trash2 size={14}/>
        </button>
        </div>
        </li>)}</ul>
    <button type="button" disabled={disabled || claims.length >= 200} className={action + ' mt-2'} onClick={() => { setClaim({ id: crypto.randomUUID(), title: '', status: 'draft', contact: '', reference: '', notes: '', checklist: ['Locate receipt', 'Check warranty terms', 'Contact service provider', 'Submit claim and evidence', 'Record resolution'].map(label => ({ id: crypto.randomUUID(), label, done: false })) }); setMessage(''); }}>Start warranty claim</button>{claim && <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
        <label>Claim title<input maxLength={180} className={input} value={claim.title} onChange={e => setClaim({ ...claim, title: e.target.value })}/>
        </label>
        <label>Claim status<select className={input} value={claim.status} onChange={e => setClaim({ ...claim, status: e.target.value as WarrantyClaim['status'] })}>{['draft', 'submitted', 'in-service', 'resolved', 'rejected'].map(status => <option key={status} value={status}>{status}</option>)}</select>
        </label>
        <label>Service contact<input maxLength={500} className={input} placeholder="Name, phone, email, or support URL" value={claim.contact} onChange={e => setClaim({ ...claim, contact: e.target.value })}/>
        </label>
        <label>Claim reference<input maxLength={180} className={input} value={claim.reference} onChange={e => setClaim({ ...claim, reference: e.target.value })}/>
        </label>
        </div>
        <label className="block">Claim notes<textarea maxLength={5000} className={input} value={claim.notes} onChange={e => setClaim({ ...claim, notes: e.target.value })}/>
        </label>{claim.checklist.map(step => <div key={step.id} className="flex items-center gap-2">
            <input aria-label={`Complete ${step.label}`} type="checkbox" checked={step.done} onChange={() => setClaim({ ...claim, checklist: claim.checklist.map(s => s.id === step.id ? { ...s, done: !s.done } : s) })}/>
            <input aria-label="Checklist step" maxLength={180} className={input} value={step.label} onChange={e => setClaim({ ...claim, checklist: claim.checklist.map(s => s.id === step.id ? { ...s, label: e.target.value } : s) })}/>
            <button type="button" aria-label={`Remove checklist step ${step.label}`} className={action} onClick={() => setClaim({ ...claim, checklist: claim.checklist.filter(s => s.id !== step.id) })}>
            <Trash2 size={14}/>
            </button>
            </div>)}<div className="flex flex-wrap gap-2">
        <button type="button" disabled={claim.checklist.length >= 50} className={action} onClick={() => setClaim({ ...claim, checklist: [...claim.checklist, { id: crypto.randomUUID(), label: 'New step', done: false }] })}>Add step</button>
        <button type="button" disabled={disabled} className={action} onClick={saveClaim}>Save claim</button>
        <button type="button" disabled={disabled} className={action} onClick={() => setClaim(null)}>Cancel</button>
        </div>
        <p className="text-muted">Save the claim, then attach evidence to its saved record.</p>
        </div>}</details>}
 {section !== "claims" && <details open={embedded || undefined} className={embedded ? "text-xs" : "rounded-xl border border-line p-3 text-xs"}>
    <summary hidden={embedded} className="cursor-pointer font-semibold">Maintenance schedules · {schedules.length}</summary>
    <p className="mt-2 text-muted">Plan servicing, cleaning, or replacements. Recurring schedules advance from the date you mark done. Dates appear here; no automatic calendar bookings or notifications are created.</p>
    <ul className="mt-2 divide-y divide-line">{[...schedules].sort((a, b) => a.nextDue.localeCompare(b.nextDue)).map(m => {
            const finished = !m.repeatDays && !!m.completed;
            return <li key={m.id} className="space-y-2 py-3">
            <p className="font-semibold">{m.title}</p>
            <p className={finished ? 'text-muted' : m.nextDue < today ? 'font-semibold text-amber-800' : 'text-muted'}>{finished ? 'Completed' : m.nextDue < today ? 'Overdue' : m.nextDue === today ? 'Due today' : 'Next due'} · {m.nextDue}{m.repeatDays ? ` · Every ${m.repeatDays} days` : ''}</p>{m.notes && <p className="whitespace-pre-wrap break-words text-muted">{m.notes}</p>}<div className="flex flex-wrap gap-2">
            <button type="button" disabled={disabled || finished || m.completedDates.includes(today) || maintenance?.id === m.id} className={action} onClick={() => onChange({ ...record, maintenance: schedules.map(item => item.id === m.id ? completeMaintenance(item, today) : item) })}>{m.completedDates.includes(today) ? 'Done today' : 'Mark done'}</button>
            <button type="button" disabled={disabled} className={action} onClick={() => { setMaintenance(structuredClone(m)); setMessage(''); }}>Edit schedule</button>
            <button type="button" disabled={disabled} aria-label={`Remove maintenance ${m.title}`} className={action} onClick={() => setRemoving({ kind: 'maintenance', id: m.id })}>
            <Trash2 size={14}/>
            </button>
            </div>{!!m.completedDates.length && <details>
                <summary className="cursor-pointer text-muted">Completion history · {m.completedDates.length}</summary>
                <p className="mt-1 text-muted">{[...m.completedDates].sort().reverse().join(' · ')}</p>
                </details>}</li>;
        })}</ul>
    <button type="button" disabled={disabled || schedules.length >= 200} className={action + ' mt-2'} onClick={() => { setMaintenance({ id: crypto.randomUUID(), title: '', nextDue: today, notes: '', completedDates: [] }); setMessage(''); }}>Add maintenance schedule</button>{maintenance && <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3">
        <label className="block">Maintenance title<input maxLength={180} className={input} value={maintenance.title} onChange={e => setMaintenance({ ...maintenance, title: e.target.value })}/>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
        <label>Next due<input type="date" className={input} value={maintenance.nextDue} onInput={e => setMaintenance({ ...maintenance, nextDue: e.currentTarget.value })}/>
        </label>
        <label>Repeat every (days, optional)<input type="number" min="1" max="3650" className={input} value={maintenance.repeatDays === undefined ? '' : Number.isFinite(maintenance.repeatDays) ? maintenance.repeatDays : ''} onChange={e => setMaintenance({ ...maintenance, repeatDays: e.target.value === '' ? undefined : e.target.valueAsNumber })}/>
        </label>
        </div>
        <label className="block">Maintenance notes<textarea maxLength={5000} className={input} value={maintenance.notes} onChange={e => setMaintenance({ ...maintenance, notes: e.target.value })}/>
        </label>
        <div className="flex gap-2">
        <button type="button" disabled={disabled} className={action} onClick={saveMaintenance}>Save schedule</button>
        <button type="button" className={action} onClick={() => setMaintenance(null)}>Cancel</button>
        </div>
        </div>}</details>}
    <p role="status" className="text-xs text-muted">{message}</p>
 {removing && <dialog ref={confirm} aria-label="Remove asset care record" onCancel={() => setRemoving(null)} className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-white p-5 backdrop:bg-black/40">
        <h4 className="font-semibold">Remove this {removing.kind === 'claims' ? 'claim' : 'schedule'}?</h4>
        <p className="mt-2 text-xs text-muted">Only the selected record and its history are removed. Asset receipts and service history remain unchanged. Private files remain in storage.</p>
        <div className="mt-4 flex gap-2">
        <button type="button" autoFocus className={action} onClick={() => setRemoving(null)}>Keep record</button>
        <button type="button" disabled={disabled} className={action + ' text-red-700'} onClick={() => { onChange({ ...record, [removing.kind]: (record[removing.kind] || []).filter(item => item.id !== removing.id) }); setRemoving(null); }}>Remove record</button>
        </div>
        </dialog>}</div>;
}
