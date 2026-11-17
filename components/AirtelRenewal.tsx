"use client";
import { useState } from "react";
import type { AirtelData, AirtelPlan } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { renewAirtel } from "@/lib/airtelRenewal";
export function AirtelRenewal({ airtel, subscriptions, disabled, onSave }: { airtel: AirtelData; subscriptions: Subscription[]; disabled: boolean; onSave: (patch: { airtel: AirtelData; subscriptions: Subscription[] }) => boolean | void }) {
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());
  const [open, setOpen] = useState(false); const [error, setError] = useState("");
  const candidates = subscriptions.filter(service => service.cycle === "bundled" && !["cancelled", "completed"].includes(service.status));
  const input = "mt-1 w-full rounded-lg border border-line p-2";
  return <div className="rounded-xl border border-line bg-white p-4"><button type="button" disabled={disabled} className="btn-theme-quiet text-sm font-semibold text-forest disabled:opacity-50" onClick={() => setOpen(!open)}>{open ? "Close renewal" : "Record next recharge"}</button>{open && <form className="mt-3 space-y-3 text-xs" onSubmit={event => {
    event.preventDefault(); if (disabled) return;
    try {
      const data = new FormData(event.currentTarget); const start = String(data.get("start")); const end = String(data.get("end"));
      const linked = data.getAll("service").map(String);
      const plan: AirtelPlan = { id: crypto.randomUUID(), provider: "Airtel", amount: Number(data.get("amount")), paymentDate: String(data.get("payment")), startDate: start, endDate: end, validityDays: Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1,
        benefits: candidates.filter(service => linked.includes(service.id)).map(service => ({ name: service.name, planName: String(data.get(`plan:${service.id}`) || service.planName || "Included"), using: true, verifiedOn: today })) };
      const patch = renewAirtel(airtel, subscriptions, plan, linked, today);
      if (onSave(patch) !== false) { setOpen(false); setError(""); }
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save renewal."); }
  }}><p className="text-muted">Record a paid plan when it becomes active. Previous payments and full plan details are retained. Confirm the services included in this recharge; nothing is carried forward automatically.</p><div className="grid gap-3 sm:grid-cols-2"><label>Amount (INR)<input required name="amount" type="number" min="0.01" step="0.01" className={input} /></label><label>Payment date<input required name="payment" type="date" max={today} defaultValue={today} className={input} /></label><label>Validity starts<input required name="start" type="date" max={today} defaultValue={today} className={input} /></label><label>Validity ends<input required name="end" type="date" min={today} className={input} /></label></div>{!!candidates.length && <fieldset className="space-y-2"><legend className="mb-2 font-semibold">Which services are confirmed included and used?</legend>{candidates.map(service => <label key={service.id} className="flex flex-wrap items-center gap-2"><input type="checkbox" name="service" value={service.id} />{service.name}<input name={`plan:${service.id}`} aria-label={`${service.name} included plan`} className="rounded border border-line p-1" defaultValue={service.planName || ""} placeholder="Plan name" /></label>)}</fieldset>}{error && <p role="alert" className="text-red-700">{error}</p>}<button disabled={disabled} className="btn-theme-primary rounded-lg bg-forest px-3 py-2 text-white disabled:opacity-50">Save recharge and confirmed benefits</button></form>}{!!airtel.planHistory?.length && <details className="mt-3 text-xs"><summary>Previous plan details ({airtel.planHistory.length})</summary><ul className="mt-2 space-y-2">{airtel.planHistory.map(plan => <li key={plan.id}>₹{plan.amount} · {plan.startDate}–{plan.endDate} · {plan.validityDays} days{plan.benefits?.length ? ` · ${plan.benefits.map(benefit => `${benefit.name} ${benefit.planName}`).join(", ")}` : ""}</li>)}</ul></details>}</div>;
}
