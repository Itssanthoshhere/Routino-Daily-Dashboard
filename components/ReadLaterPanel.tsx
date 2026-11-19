"use client";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ExternalLink, Trash2, Star } from "lucide-react";
import type { QuickLink } from "@/types/dashboard";
import { AccountStorageContext, useAccountStorage } from "@/components/AccountStorage";
import { isReadingLink, readingStatus, readingTags } from "@/lib/noteOrganization";
const action = "btn-theme rounded-lg border border-line px-2.5 py-1.5 text-[11px]";
export function ReadLaterPanel({ links, onAdd, onUpdate, onDelete }: {
    links: QuickLink[];
    onAdd: () => void;
    onUpdate: (link: QuickLink) => void;
    onDelete: (id: string) => void;
}) {
    const account = useContext(AccountStorageContext);
    const storage = useAccountStorage();
    const [legacyRead, setLegacyRead] = useState<string[]>([]);
    const [editing, setEditing] = useState<QuickLink | null>(null);
    const [tagDraft, setTagDraft] = useState('');
    const [deleting, setDeleting] = useState<QuickLink | null>(null);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('all');
    const [tag, setTag] = useState('all');
    const [favouritesOnly, setFavouritesOnly] = useState(false);
    const [search, setSearch] = useState('');
    const confirm = useRef<HTMLDialogElement>(null);
    useEffect(() => { try {
        const value = JSON.parse(storage.getItem('routino_read_later') || '[]');
        if (Array.isArray(value))
            setLegacyRead(value.filter(id => typeof id === 'string'));
    }
    catch { } }, [account]);
    useEffect(() => { if (deleting)
        confirm.current?.showModal(); }, [deleting]);
    const readingLinks = useMemo(() => links.filter(isReadingLink), [links]);
    const tags = Array.from(new Set(readingLinks.flatMap(link => link.readingTags || []))).sort();
    const visible = readingLinks.filter(link => (status === 'all' || readingStatus(link, legacyRead.includes(link.id)) === status) && (tag === 'all' || link.readingTags?.includes(tag)) && (!favouritesOnly || link.readingFavourite) && `${link.title} ${link.subtitle} ${(link.readingTags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => Number(!!b.readingFavourite) - Number(!!a.readingFavourite));
    const updateStatus = (link: QuickLink, value: 'unread' | 'reading' | 'read') => onUpdate({ ...link, readLater: true, readingStatus: value, read: value === 'read' });
    return <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
    <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-2">
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eef5ee] text-forest">
    <BookOpen size={16}/>
    </span>
    <div>
    <h3 className="text-sm font-semibold">Tech radar · Read later</h3>
    <p className="mt-1 text-[11px] text-muted">{readingLinks.length} saved articles, docs, and repositories</p>
    </div>
    </div>
    <button type="button" onClick={onAdd} className={action}>Save link</button>
    </div>
 <div className="mt-4 flex flex-wrap gap-2">
    <input aria-label="Search Read Later" placeholder="Search title or tags…" className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-xs" value={search} onChange={e => setSearch(e.target.value)}/>
    <select aria-label="Reading status filter" className="rounded-lg border border-line px-2 py-2 text-xs" value={status} onChange={e => setStatus(e.target.value)}>{['all', 'unread', 'reading', 'read'].map(value => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value === 'reading' ? 'Reading' : value === 'read' ? 'Read' : 'Unread'}</option>)}</select>
    <select aria-label="Reading tag filter" className="rounded-lg border border-line px-2 py-2 text-xs" value={tag} onChange={e => setTag(e.target.value)}>
    <option value="all">All tags</option>{tags.map(value => <option key={value} value={value}>#{value}</option>)}</select>
    <button type="button" aria-pressed={favouritesOnly} className={action + (favouritesOnly ? ' bg-red-50 text-forest' : '')} onClick={() => setFavouritesOnly(!favouritesOnly)}>Favourites</button>
    </div>
 <div className="mt-3 space-y-2">{visible.length ? visible.map(link => {
            const currentStatus = readingStatus(link, legacyRead.includes(link.id));
            const done = currentStatus === 'read';
            const minutes = link.readingText?.trim() ? Math.max(1, Math.ceil(link.readingText.trim().split(/\s+/).length / 200)) : null;
            return <article key={link.id} className={`rounded-xl border p-3 ${done ? 'border-[#dce8dc] bg-[#f5faf5]' : 'border-line'}`}>
            <div className="flex items-start gap-2">
            <button type="button" onClick={() => updateStatus(link, done ? 'unread' : 'read')} aria-label={`Mark ${link.title} ${done ? 'unread' : 'as read'}`} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${done ? 'border-forest bg-forest text-white' : 'border-line text-transparent'}`}>
            <Check size={13}/>
            </button>
            <div className="min-w-0 flex-1">
            <a href={link.url} target="_blank" rel="noreferrer" className={`break-words text-xs font-semibold hover:underline ${done ? 'text-muted line-through' : 'text-ink'}`}>{link.title}<ExternalLink size={11} className="ml-1 inline"/>
            </a>
            <p className="mt-1 text-[10px] text-muted">{minutes ? `${minutes} min estimated` : 'Add article text to estimate reading time'}</p>
            <div className="mt-2 flex flex-wrap gap-1">{(link.readingTags || []).map(value => <button type="button" key={value} className="rounded-md bg-stone-100 px-2 py-1 text-[10px] text-muted" onClick={() => setTag(value)}>#{value}</button>)}</div>
            </div>
            <button type="button" aria-label={`${link.readingFavourite ? 'Unfavourite' : 'Favourite'} ${link.title}`} aria-pressed={!!link.readingFavourite} className={action + (link.readingFavourite ? ' text-amber-700' : ' text-muted')} onClick={() => onUpdate({ ...link, readingFavourite: !link.readingFavourite })}>
            <Star size={14} fill={link.readingFavourite ? 'currentColor' : 'none'}/>
            </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <select aria-label={`Reading status for ${link.title}`} value={currentStatus} onChange={e => updateStatus(link, e.target.value as 'unread' | 'reading' | 'read')} className="mr-auto rounded-lg border border-line bg-white px-2 py-1.5 text-[11px]">
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
            </select>
            <button type="button" className={action} onClick={() => { setEditing(link); setTagDraft((link.readingTags || []).join(', ')); setMessage(''); }}>Edit</button>
            <button type="button" aria-label={`Delete ${link.title}`} className={action + ' text-red-700'} onClick={() => setDeleting(link)}>
            <Trash2 size={14}/>
            </button>
            </div>
            </article>;
        }) : <p className="rounded-xl bg-stone-50 p-4 text-xs text-muted">{readingLinks.length ? 'No links match these filters.' : 'Save a developer article or link to start your list.'}</p>}</div>
 {editing && <form className="mt-4 space-y-3 rounded-xl border border-line p-4" onSubmit={event => { event.preventDefault(); try {
            const parsed = new URL(editing.url);
            if (!['http:', 'https:'].includes(parsed.protocol) || !editing.title.trim())
                throw new Error();
            const current = links.find(link => link.id === editing.id);
            if (!current)
                throw new Error();
            onUpdate({ ...current, title: editing.title.trim(), url: parsed.href, readingText: editing.readingText, readLater: true, readingTags: readingTags(tagDraft) });
            setEditing(null);
            setMessage('Reading link saved.');
        }
        catch {
            setMessage('Enter a title and valid HTTP or HTTPS URL.');
        } }}>
        <label className="block text-xs">Title<input required className="mt-1 w-full rounded-lg border border-line p-2" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}/>
        </label>
        <label className="block text-xs">URL<input required type="url" className="mt-1 w-full rounded-lg border border-line p-2" value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })}/>
        </label>
        <label className="block text-xs">Tags (comma separated)<input className="mt-1 w-full rounded-lg border border-line p-2" value={tagDraft} onChange={e => setTagDraft(e.target.value)} placeholder="react, learning, reference"/>
        </label>
        <label className="block text-xs">Article text (optional, for reading time)<textarea className="mt-1 w-full rounded-lg border border-line p-2" rows={4} value={editing.readingText || ''} onChange={e => setEditing({ ...editing, readingText: e.target.value })}/>
        </label>
        <div className="flex gap-2">
        <button className={action}>Save changes</button>
        <button type="button" className={action} onClick={() => setEditing(null)}>Cancel</button>
        </div>
        </form>}
 <p role="status" className="mt-2 text-xs text-muted">{message}</p>{deleting && <dialog ref={confirm} aria-label="Delete saved link" onCancel={() => setDeleting(null)} className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-white p-5 backdrop:bg-black/40">
        <h3 className="font-semibold">Delete saved link?</h3>
        <p className="mt-2 text-xs text-muted">{deleting.title} will be removed from Read Later and Quick links.</p>
        <div className="mt-4 flex justify-end gap-2">
        <button autoFocus type="button" className={action} onClick={() => setDeleting(null)}>Cancel</button>
        <button type="button" className={action + ' text-red-700'} onClick={() => { onDelete(deleting.id); if (editing?.id === deleting.id)
            setEditing(null); setDeleting(null); }}>Delete link</button>
        </div>
        </dialog>}</section>;
}
