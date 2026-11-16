"use client";
import type { AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { expiryReminders } from "@/lib/expiryReminders";
export function ExpiryReminders({ subscriptions, airtel, onOpen }: { subscriptions: Subscription[]; airtel: AirtelData; onOpen: (tab: "airtel" | "subscriptions") => void }) {
  const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const reminders = expiryReminders(subscriptions, airtel, today);
  if (!reminders.length) return null;
  return <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="text-sm font-semibold text-ink">Renewals & expiry · next 7 days</h3><ul className="mt-3 grid gap-3 sm:grid-cols-2">{reminders.map(reminder => <li key={reminder.id}><button onClick={() => onOpen(reminder.tab)} className="w-full rounded-xl bg-white p-3 text-left text-sm"><span className="font-semibold">{reminder.name}</span><span className="ml-2 text-xs text-amber-800">{reminder.daysLeft < 0 ? `${-reminder.daysLeft} ${reminder.daysLeft === -1 ? "day" : "days"} overdue` : reminder.daysLeft === 0 ? "Today" : `In ${reminder.daysLeft} ${reminder.daysLeft === 1 ? "day" : "days"}`}</span><p className="mt-1 text-xs text-muted">{reminder.date} · {reminder.detail}</p></button></li>)}</ul></section>;
}
