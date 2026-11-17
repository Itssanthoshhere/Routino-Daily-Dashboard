"use client";
import { useState } from "react";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { monthOffset, paymentCalendarEvents } from "@/lib/paymentCalendar";

export function SubscriptionInsights({ subscriptions, airtel, onChange, disabled }: { subscriptions: Subscription[]; airtel: AirtelData; onChange: (items: Subscription[]) => void; disabled: boolean }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [showAll, setShowAll] = useState(false);
  const events = [0, 1, 2].flatMap(offset => paymentCalendarEvents(subscriptions, airtel, monthOffset(today.slice(0, 7), offset))).filter(item => item.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const active = subscriptions.filter(item => item.status === "active");
  return <section className="rounded-2xl border border-line bg-white p-5"><h4 className="font-semibold">Upcoming payments & usage review</h4><p className="mt-1 text-xs text-muted">Next three months · projections are not payments. Bundled access has no separate charge.</p><ul className="mt-3 divide-y divide-line">{(showAll ? events : events.slice(0, 6)).map(item => <li key={`${item.id}:${item.kind}:${item.date}`} className="py-2 text-xs"><strong>{item.date} · {item.name}</strong><span className="ml-2 text-muted">{item.kind === "expiry" ? "Access ends" : `${item.projected ? "Projected" : "Recorded"} renewal · ${new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency }).format(item.amount || 0)}`}</span></li>)}</ul>{events.length > 6 && <button className="mt-2 text-xs text-forest" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : "Show all upcoming dates"}</button>}{!events.length && <p className="mt-3 text-xs text-muted">No upcoming recorded dates.</p>}<div className="mt-4 space-y-2 border-t border-line pt-3">{active.map(subscription => {
    const history = subscription.priceHistory || [];
    const latest = history[history.length - 1];
    const previous = latest?.amount === subscription.amount && latest.currency === subscription.currency && latest.cycle === subscription.cycle ? history[history.length - 2] : latest;
    const increase = previous && previous.currency === subscription.currency && previous.cycle === subscription.cycle && subscription.cycle !== "bundled" && subscription.amount > previous.amount ? subscription.amount - previous.amount : 0;
    return <div key={subscription.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fafbf8] p-3 text-xs"><div><strong>{subscription.name}</strong>{increase > 0 && <p className="mt-1 text-amber-800">Price increased by {new Intl.NumberFormat("en-IN", { style: "currency", currency: subscription.currency }).format(increase)} per billing cycle versus the previous recorded rate.</p>}<p className="mt-1 text-muted">{subscription.lastUsedDate ? `Last marked used · ${subscription.lastUsedDate}` : "Usage not recorded"}</p></div><button disabled={disabled || subscription.lastUsedDate === today} className="btn-theme rounded-lg border border-line px-3 py-2" onClick={() => onChange(subscriptions.map(item => item.id === subscription.id ? { ...item, lastUsedDate: today } : item))}>{subscription.lastUsedDate === today ? "Used today" : "Used recently"}</button></div>;
  })}</div></section>;
}
