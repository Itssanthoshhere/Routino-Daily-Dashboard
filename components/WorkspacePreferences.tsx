"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Settings2 } from "lucide-react";
import { defaultDisplay, orderedOverview, overviewWidgets, reorderOverview, type WorkspacePreference, type DisplayPreference, type OverviewPreference, type OverviewWidgetId } from "@/lib/workspacePreferences";
const Context = createContext<{
    records: WorkspacePreference[];
    save: (records: WorkspacePreference[]) => void;
}>({ records: [], save: () => { } });
export function WorkspacePreferencesProvider({ records, onChange, children }: {
    records: WorkspacePreference[];
    onChange: (records: WorkspacePreference[]) => void;
    children: React.ReactNode;
}) { const display = records.find((p): p is DisplayPreference => p.id === 'display') || defaultDisplay; useEffect(() => { const root = document.documentElement; root.dataset.routinoText = display.textSize; root.dataset.routinoMotion = display.reduceMotion ? 'reduced' : 'system'; root.dataset.routinoContrast = display.contrast; return () => { delete root.dataset.routinoText; delete root.dataset.routinoMotion; delete root.dataset.routinoContrast; }; }, [display.textSize, display.reduceMotion, display.contrast]); return <Context.Provider value={{ records, save: onChange }}>{children}</Context.Provider>; }
const action = 'btn-theme rounded-lg border border-line px-3 py-2 text-xs disabled:opacity-40';
export function AccessibleDisplaySettings() {
    const { records, save } = useContext(Context);
    const display = records.find((p): p is DisplayPreference => p.id === 'display') || defaultDisplay;
    const [message, setMessage] = useState('');
    const update = (next: DisplayPreference) => { try {
        save([...records.filter(r => r.id !== 'display'), next]);
        setMessage('Display preference saved.');
    }
    catch {
        setMessage('Could not save display preference.');
    } };
    return <section className="rounded-2xl border border-line bg-white p-4">
    <h4 className="text-sm font-semibold">Accessible display</h4>
    <div className="mt-3 space-y-3 text-xs">
    <label className="flex flex-wrap items-center justify-between gap-2">Text & control size<select aria-label="Text and control size" className="rounded-lg border border-line p-2" value={display.textSize} onChange={e => update({ ...display, textSize: e.target.value as DisplayPreference['textSize'] })}>
    <option value="standard">Standard · 100%</option>
    <option value="large">Large · 112.5%</option>
    <option value="larger">Larger · 125%</option>
    </select>
    </label>
    <p className="text-muted">Scales text and controls together. Browser zoom remains available.</p>
    <label className="flex items-center gap-2">
    <input type="checkbox" checked={display.reduceMotion} onChange={e => update({ ...display, reduceMotion: e.target.checked })}/>Reduce motion</label>
    <p className="text-muted">Limits decorative animation and smooth scrolling. Your device's reduced-motion setting is also respected.</p>
    <label className="flex items-center gap-2">
    <input type="checkbox" checked={display.contrast === 'strong'} onChange={e => update({ ...display, contrast: e.target.checked ? 'strong' : 'standard' })}/>Stronger contrast</label>
    <p className="text-muted">Darkens secondary text and strengthens borders and keyboard focus.</p>
    <button type="button" className={action} onClick={() => update(defaultDisplay)}>Reset display</button>
    <p role="status" className="text-muted">{message}</p>
    </div>
    </section>;
}
export function OverviewSettings() {
    const { records, save } = useContext(Context);
    const preference = records.find((p): p is OverviewPreference => p.id === 'overview');
    const order = orderedOverview(records);
    const [message, setMessage] = useState('');
    const update = (next: OverviewPreference) => { try {
        save([...records.filter(r => r.id !== 'overview'), next]);
        setMessage('Overview layout saved.');
    }
    catch {
        setMessage('Could not save layout.');
    } };
    return <div className="space-y-3 text-xs">
    <p className="text-muted">Choose visible widgets and use the arrows to change their order. Hiding a widget keeps its saved data. Navigation and sync alerts remain available.</p>
    <ol className="max-h-80 divide-y divide-line overflow-y-auto">{order.map((id, index) => <li key={id} className="flex items-center justify-between gap-2 py-2">
        <label className="flex min-w-0 items-center gap-2">
        <input type="checkbox" checked={!preference?.hidden.includes(id)} onChange={e => update({ id: 'overview', order, hidden: e.target.checked ? (preference?.hidden || []).filter(item => item !== id) : [...(preference?.hidden || []), id] })}/>
        <span>{overviewWidgets.find(w => w.id === id)?.label}</span>
        </label>
        <div className="flex gap-1">
        <button type="button" disabled={index === 0} aria-label={`Move ${overviewWidgets.find(w => w.id === id)?.label} up`} className={action} onClick={() => update({ id: 'overview', order: reorderOverview(order, id, -1), hidden: preference?.hidden || [] })}>
        <ArrowUp size={13}/>
        </button>
        <button type="button" disabled={index === order.length - 1} aria-label={`Move ${overviewWidgets.find(w => w.id === id)?.label} down`} className={action} onClick={() => update({ id: 'overview', order: reorderOverview(order, id, 1), hidden: preference?.hidden || [] })}>
        <ArrowDown size={13}/>
        </button>
        </div>
        </li>)}</ol>
    <button type="button" className={action} onClick={() => update({ id: 'overview', order: overviewWidgets.map(w => w.id), hidden: [] })}>Reset Overview layout</button>
    <p role="status" className="text-muted">{message}</p>
    </div>;
}
export function OverviewLayout({ widgets }: {
    widgets: {
        id: OverviewWidgetId;
        content: React.ReactNode;
    }[];
}) {
    const { records } = useContext(Context);
    const preference = records.find((p): p is OverviewPreference => p.id === 'overview');
    const order = orderedOverview(records);
    const [editing, setEditing] = useState(false);
    const span = (id: OverviewWidgetId) => { const style = overviewWidgets.find(w => w.id === id)?.span; return style === 'summary' ? 'col-span-12 sm:col-span-6 lg:col-span-3' : style === 'full' ? 'col-span-12' : style === 'wide' ? 'col-span-12 lg:col-span-6 xl:col-span-7' : style === 'narrow' ? 'col-span-12 lg:col-span-6 xl:col-span-5' : 'col-span-12 lg:col-span-6'; };
    return <>
    <div className="mb-4 flex justify-end">
    <button type="button" className={action + ' inline-flex items-center gap-2'} aria-expanded={editing} onClick={() => setEditing(!editing)}>
    <Settings2 size={14}/>{editing ? 'Close customisation' : 'Customise Overview'}</button>
    </div>{editing && <section className="mb-4 rounded-2xl border border-line bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Overview widgets</h3>
        <OverviewSettings />
        </section>}<div className="overview-widget-grid grid grid-cols-12 gap-4">{order.map(id => { const widget = widgets.find(w => w.id === id); return widget ? <div key={id} data-overview-widget={id} hidden={preference?.hidden.includes(id)} className={span(id) + ' min-w-0'}>{widget.content}</div> : null; })}</div>{order.every(id => preference?.hidden.includes(id)) && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">All Overview widgets are hidden. Use Customise Overview to show them again.</p>}</>;
}

export const useWorkspacePreferences = () => useContext(Context);
