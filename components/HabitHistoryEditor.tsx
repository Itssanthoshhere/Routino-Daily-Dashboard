"use client";
import { useState } from "react";
import { completionStreak } from "@/lib/habitHistory";
import { monthOffset } from "@/lib/paymentCalendar";

export function HabitHistoryEditor({ dates, onChange }: { dates: string[]; onChange: (dates: string[], streak: number) => void }) {
  const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [month, setMonth] = useState(today.slice(0, 7));
  const start = new Date(`${month}-01T12:00:00Z`); const count = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (start.getUTCDay() + 6) % 7;
  return <fieldset className="rounded-xl border border-line bg-white p-3"><legend className="px-1 text-xs font-semibold">Completion history</legend><div className="mb-2 flex items-center justify-between text-xs"><button type="button" aria-label="Previous habit month" onClick={() => setMonth(monthOffset(month, -1))}>←</button><input aria-label="Habit history month" type="month" max={today.slice(0, 7)} value={month} onChange={e => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) setMonth(e.target.value); }} /><button type="button" aria-label="Next habit month" disabled={month >= today.slice(0, 7)} onClick={() => setMonth(monthOffset(month, 1))}>→</button></div><div className="grid grid-cols-7 gap-1 text-center text-xs">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={index}>{day}</span>)}{Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: count }, (_, i) => { const date = `${month}-${String(i + 1).padStart(2, "0")}`; const done = dates.includes(date); return <button key={date} type="button" aria-label={`${date} ${done ? "completed" : "not completed"}`} aria-pressed={done} disabled={date > today} onClick={() => { const next = done ? dates.filter(value => value !== date) : [...dates, date].sort(); onChange(next, completionStreak(next, today)); }} className={`rounded border p-1.5 disabled:opacity-30 ${done ? "border-forest bg-forest text-white" : "border-line"}`}>{i + 1}</button>; })}</div><p className="mt-2 text-[10px] text-muted">Select dates to correct history. Save the habit to apply changes. The current streak is recalculated from consecutive completed days.</p></fieldset>;
}
