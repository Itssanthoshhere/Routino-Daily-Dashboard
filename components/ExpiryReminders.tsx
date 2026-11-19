"use client";
import { useState } from "react";
import type { AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import type { AssetRecords } from "@/types/assets";
import { unifiedReminders, type UnifiedReminder } from "@/lib/unifiedReminders";
import { isReminderSnoozed, type ReminderSnooze } from "@/lib/reminderSnooze";

export function ExpiryReminders({ subscriptions, airtel, assets = {}, snoozes = [], onOpen }: {
  subscriptions: Subscription[];
  airtel: AirtelData;
  assets?: AssetRecords;
  snoozes?: ReminderSnooze[];
  onOpen: (reminder: UnifiedReminder) => void;
}) {
  const [daysAhead, setDaysAhead] = useState(30);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const reminders = unifiedReminders([], subscriptions, airtel, assets, today, daysAhead)
    .filter(item => ["renewal", "expiry", "warranty"].includes(item.kind)
      && Math.round((Date.parse(item.date) - Date.parse(today)) / 86400000) >= -30
      && !isReminderSnoozed(snoozes, item.id, item.date, now.getTime()));
  return <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-ink">Upcoming renewals & warranties</h3>
      <label className="text-xs">Show<select aria-label="Upcoming renewals period" className="ml-2 rounded-lg border border-line bg-white p-2" value={daysAhead} onChange={e => setDaysAhead(Number(e.target.value))}>
        {[7, 30, 90].map(days => <option key={days} value={days}>Next {days} days</option>)}
      </select></label>
    </div>
    <p className="mt-2 text-xs text-muted">Your recharge expiry, subscription renewals and gadget warranties. Includes overdue dates from the last 30 days; snoozed reminders stay in the reminders inbox.</p>
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">{reminders.map(reminder => {
      const daysLeft = Math.round((Date.parse(reminder.date) - Date.parse(today)) / 86400000);
      return <li key={reminder.id}><button type="button" onClick={() => onOpen(reminder)} className="w-full rounded-xl bg-white p-3 text-left text-sm">
        <span className="font-semibold">{reminder.title}</span>
        <span className="ml-2 text-xs text-amber-800">{daysLeft < 0 ? `${-daysLeft} ${daysLeft === -1 ? "day" : "days"} overdue` : daysLeft === 0 ? "Today" : `In ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}</span>
        <p className="mt-1 text-xs text-muted">{reminder.date} · {reminder.kind} · {reminder.detail}</p>
      </button></li>;
    })}</ul>
    {!reminders.length && <p className="mt-3 text-sm text-muted">No recorded renewals or warranties due in this period.</p>}
  </section>;
}
