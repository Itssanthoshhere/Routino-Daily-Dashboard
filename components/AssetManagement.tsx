"use client";
import { RelatedNotes, useNoteConnections } from "@/components/NoteConnections";
import { useEffect, useId, useRef, useState } from "react";
import { FileText, ShieldCheck, Wrench, ClipboardCheck, CalendarClock, X, Settings2 } from "lucide-react";
import { RecordDocuments } from "@/components/SubscriptionDocuments";
import { AssetWarranty } from "@/components/AssetWarranty";
import { AssetServiceHistory } from "@/components/AssetServiceHistory";
import { AssetCare } from "@/components/AssetCare";
import type { AssetRecord } from "@/types/assets";
import type { SavedDocument } from "@/types/documents";
const tabs = [
    { id: "documents", label: "Documents", icon: FileText },
    { id: "warranty", label: "Warranty", icon: ShieldCheck },
    { id: "services", label: "Service history", icon: Wrench },
    { id: "claims", label: "Claims", icon: ClipboardCheck },
    { id: "maintenance", label: "Maintenance", icon: CalendarClock },
] as const;
type Tab = typeof tabs[number]["id"];
export function AssetManagement({ onOpenDetail, referenceId, name, model, record, documents, disabled, onRecordChange, onDocumentsChange, onReminder }: {
    onOpenDetail?:()=>void;
    referenceId?: string;
    name: string;
    model: string;
    record: AssetRecord;
    documents: SavedDocument[];
    disabled: boolean;
    onRecordChange?: (record: AssetRecord) => void;
    onDocumentsChange?: (documents: SavedDocument[]) => void;
    onReminder?: (date: string) => void;
}) {
    const {target,consume}=useNoteConnections();
    useEffect(()=>{if(target?.kind==="asset"&&target.id===referenceId){setActive("documents");setInitialized(true);setOpen(true);consume(target);}},[target,referenceId,consume]);
    const id = useId();
    const dialog = useRef<HTMLDialogElement>(null);
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const [open, setOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [active, setActive] = useState<Tab>('documents');
    useEffect(() => { if (open && !dialog.current?.open)
        dialog.current?.showModal();
    else if (!open && dialog.current?.open)
        dialog.current?.close(); }, [open]);
    const show = (tab: Tab) => { setActive(tab); setInitialized(true); setOpen(true); };
    const count = (tab: Tab) => tab === 'documents' ? documents.length : tab === 'services' ? (record.services?.length || 0) : tab === 'claims' ? (record.claims?.length || 0) : tab === 'maintenance' ? (record.maintenance?.length || 0) : undefined;
    const action = 'btn-theme inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium';
    return <div className="mt-3">
    <div className="flex flex-wrap items-center gap-2">
    <button type="button" className="btn-theme inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-[#fff7f7] px-3 py-2 text-xs font-semibold text-forest" onClick={() => show('documents')}>
    <Settings2 size={14}/>Manage asset</button>{onOpenDetail&&<button type="button" className={action} onClick={onOpenDetail}>View details</button>}{tabs.map(tab => <button type="button" key={tab.id} className={action} onClick={() => show(tab.id)} aria-label={`Open ${tab.label} for ${name}`}>
        <tab.icon size={12}/>
        <span>{tab.label}{tab.id === 'warranty' ? record.warrantyEnd ? ` · ${record.warrantyEnd}` : ' · Set expiry' : ` · ${count(tab.id)}`}</span>
        </button>)}</div>
 <dialog ref={dialog} onClose={event => { if (event.target === event.currentTarget)
        setOpen(false); }} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} className="asset-manager-dialog m-auto overflow-hidden border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm">
    <div className="asset-manager-layout flex flex-col">
    <header className="flex shrink-0 items-center justify-between gap-4 px-6 pb-4 pt-5">
    <div>
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Asset details</p>
    <h3 id={`${id}-title`} className="text-lg font-semibold tracking-tight">{name}</h3>
    <p id={`${id}-description`} className="mt-1 line-clamp-1 text-xs text-muted">{model}</p>
    </div>
    <button type="button" autoFocus aria-label="Close asset manager" className="btn-theme-quiet grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" onClick={() => dialog.current?.close()}>
    <X size={18}/>
    </button>
    </header>
    <div role="tablist" aria-label="Asset management sections" className="asset-manager-tabs flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4">{tabs.map((tab, index) => <button ref={element => { buttons.current[index] = element; }} type="button" key={tab.id} role="tab" id={`${id}-${tab.id}-tab`} aria-selected={active === tab.id} aria-controls={`${id}-${tab.id}-panel`} tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)} onKeyDown={event => { let next = index; if (event.key === 'ArrowRight')
            next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft')
            next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home')
            next = 0;
        else if (event.key === 'End')
            next = tabs.length - 1;
        else
            return; event.preventDefault(); setActive(tabs[next].id); buttons.current[next]?.focus(); }} className={`flex shrink-0 items-center gap-2 border-b-2 px-2.5 py-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${active === tab.id ? 'border-forest text-forest' : 'border-transparent text-muted hover:bg-stone-50 hover:text-ink'}`}>
        <tab.icon size={14}/>{tab.label}{count(tab.id) !== undefined && <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${active === tab.id ? "bg-red-50 text-forest" : "bg-stone-100 text-muted"}`}>{count(tab.id)}</span>}</button>)}</div>
    <div className="asset-manager-body min-h-0 overflow-y-auto px-6 py-5">{referenceId && <RelatedNotes kind="asset" id={referenceId} />}{disabled && <p role="status" className="mb-3 text-xs text-muted">Changes are temporarily disabled while tracker data loads or sync is resolved.</p>}{initialized && tabs.map(tab => <section key={tab.id} role="tabpanel" id={`${id}-${tab.id}-panel`} aria-labelledby={`${id}-${tab.id}-tab`} hidden={active !== tab.id} tabIndex={0} className="outline-none focus-visible:ring-2 focus-visible:ring-forest">{tab.id !== "documents" && <h4 className="mb-3 text-sm font-semibold">{tab.label}</h4>}{tab.id === 'documents' && (onDocumentsChange ? <RecordDocuments embedded recordName={`${name} ${model}`} documents={documents} disabled={disabled} onChange={onDocumentsChange}/> : <p className="text-xs text-muted">Document editing is unavailable.</p>)}{tab.id === 'warranty' && onRecordChange && <AssetWarranty embedded record={record} disabled={disabled} onChange={onRecordChange} onReminder={onReminder}/>} {tab.id === 'services' && onRecordChange && <AssetServiceHistory embedded record={record} disabled={disabled} onChange={onRecordChange}/>} {(tab.id === 'claims' || tab.id === 'maintenance') && onRecordChange && <AssetCare embedded section={tab.id} assetName={name} receipts={documents.length} record={record} disabled={disabled} onChange={onRecordChange}/>}</section>)}</div>
    </div>
    </dialog>
    </div>;
}
