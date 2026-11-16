"use client";
import { useRef, useState } from "react";
import { offsetDate } from "@/lib/taskSnooze";
export function TaskSnooze({ title, onSnooze }: { title: string; onSnooze: (date: string) => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const move = (date: string) => { onSnooze(date); if (menu.current) menu.current.open = false; };
  const [date, setDate] = useState("");
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());
  return <details ref={menu} className="relative text-xs"><summary className="cursor-pointer rounded-lg border border-line px-2 py-1" aria-label={`Snooze ${title}`}>Snooze</summary><div className="absolute right-0 z-20 mt-1 w-56 space-y-2 rounded-xl border border-line bg-white p-3 shadow-xl"><p>Move only this occurrence</p><button type="button" className="block text-forest" onClick={() => move(offsetDate(today, 1))}>Tomorrow</button><button type="button" className="block text-forest" onClick={() => move(offsetDate(today, 7))}>In one week</button><label className="block">Choose date<input className="mt-1 w-full rounded border border-line p-1" type="date" min={offsetDate(today, 1)} value={date} onChange={event => setDate(event.target.value)} /></label><button type="button" disabled={!date || date <= today} className="text-forest disabled:opacity-50" onClick={() => move(date)}>Move to chosen date</button></div></details>;
}
