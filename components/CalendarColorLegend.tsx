"use client";
import { useEffect, useState } from "react";
import { colorName, defaultColorSettings, EVENT_COLORS, type ColorSettings } from "@/lib/calendarColorSettings";

export function CalendarColorLegend({ connected }: { connected: boolean }) {
  const [settings, setSettings] = useState<ColorSettings | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!connected) { setSettings(defaultColorSettings()); setError(false); return; }
      try {
        const response = await fetch("/api/calendar/coloring?settingsOnly=1", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error();
        if (active) { setSettings(result.settings); setError(false); }
      } catch { if (active) setError(true); }
    };
    void load();
    window.addEventListener("routino:calendar-color-settings", load);
    return () => { active = false; window.removeEventListener("routino:calendar-color-settings", load); };
  }, [connected]);
  return <aside aria-label="Calendar colour legend" className="rounded-xl border border-line bg-white px-4 py-3"><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]"><span className="font-semibold text-ink">Colour guide</span>{error ? <span className="text-muted">Saved colour guide unavailable. Open Colour events to retry.</span> : !settings ? <span className="text-muted">Loading saved colours…</span> : <>{settings.rules.filter(rule => rule.enabled).map(rule => <span key={rule.id} className="inline-flex items-center gap-1.5 text-muted" title={colorName(rule.colorId)}><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: EVENT_COLORS.find(color => color.id === rule.colorId)?.hex }} />{rule.name}</span>)}{!settings.rules.some(rule => rule.enabled) && <span className="text-muted">No colour rules enabled</span>}</>}</div></aside>;
}
