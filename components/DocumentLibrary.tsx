"use client";
import { useRef, useState } from "react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { searchDocuments, type LibraryDocument } from "@/lib/documentLibrary";
export function DocumentLibrary({ documents }: {
    documents: LibraryDocument[];
}) {
    const [query, setQuery] = useState('');
    const [kind, setKind] = useState('all');
    const [limit, setLimit] = useState(20);
    const [opened, setOpened] = useState<LibraryDocument | null>(null);
    const dialog = useRef<HTMLDialogElement>(null);
    const visible = searchDocuments(documents, query, kind);
    const href = (row: LibraryDocument) => row.document.pathname ? `/api/subscription-documents?path=${encodeURIComponent(row.document.pathname)}&name=${encodeURIComponent(row.document.name)}` : row.document.url;
    return <details className="rounded-2xl border border-line bg-white p-5">
    <summary className="cursor-pointer font-semibold">Document library · {documents.length}</summary>
    <p className="mt-2 text-xs text-muted">Search saved filenames, subscriptions, gadgets, service providers and warranty claims. Manage attachments on their original records. Private files require sign-in and an internet connection.</p>
    <div className="mt-3 flex flex-wrap gap-2">
    <input aria-label="Search document library" placeholder="Filename, service or gadget…" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm" value={query} onChange={e => { setQuery(e.target.value); setLimit(20); }}/>
    <select aria-label="Document source" className="rounded-xl border border-line px-3 py-2 text-sm" value={kind} onChange={e => { setKind(e.target.value); setLimit(20); }}>{['all', 'asset', 'service', 'claim', 'subscription'].map(value => <option key={value} value={value}>{value === 'all' ? 'All sources' : value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select>
    </div>
    <p role="status" className="mt-2 text-xs text-muted">{visible.length} matching document references</p>
    <ul className="mt-3 divide-y divide-line">{visible.slice(0, limit).map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
        <div className="min-w-0">
        <a href={href(row)} target="_blank" rel="noreferrer" className="break-words font-semibold text-forest hover:underline">{row.document.name}</a>
        <p className="mt-1 break-words text-muted">{row.owner} · {row.context}</p>
        </div>{row.document.pathname && ['application/pdf', 'image/png', 'image/jpeg'].includes(row.document.contentType || '') && <button type="button" className="btn-theme rounded-lg border border-line px-3 py-2" onClick={() => { setOpened(row); dialog.current?.showModal(); }}>Preview</button>}</li>)}</ul>{visible.length > limit && <button type="button" className="btn-theme mt-2 rounded-lg border border-line px-3 py-2 text-xs" onClick={() => setLimit(limit + 20)}>Show more</button>}<dialog ref={dialog} onClose={() => setOpened(null)} aria-label="Document library preview" className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-line bg-white p-5 backdrop:bg-black/40">
    <div className="mb-3 flex items-center justify-between gap-3">
    <h3 className="font-semibold">{opened?.document.name}</h3>
    <button type="button" autoFocus className="btn-theme rounded-lg border border-line px-3 py-2 text-xs" onClick={() => dialog.current?.close()}>Close</button>
    </div>{opened && <InvoicePreview url={`${href(opened)}&preview=1`} name={opened.document.name} contentType={opened.document.contentType}/>}</dialog>
    </details>;
}
