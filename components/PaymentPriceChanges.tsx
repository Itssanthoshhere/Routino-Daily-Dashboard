import type { AirtelRecharge } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { paymentPriceChanges } from "@/lib/paymentPriceChanges";
const money=(value:number,currency:string)=>new Intl.NumberFormat("en-IN",{style:"currency",currency}).format(value);
export function PaymentPriceChanges({recharges=[],subscriptions=[]}:{recharges?:AirtelRecharge[];subscriptions?:Subscription[]}) {
  const changes=paymentPriceChanges(recharges,subscriptions);
  if(!changes.length)return null;
  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h4 className="text-sm font-semibold">Higher recorded payments</h4><ul className="mt-3 space-y-3">{changes.map(change=><li key={change.id} className="text-sm"><strong>{change.name} · +{money(change.difference,change.currency)}{change.percent!==null?` (${change.percent}%)`:""}</strong><p className="mt-1 text-xs text-muted">{money(change.previous,change.currency)} on {change.previousDate} → {money(change.current,change.currency)} on {change.date}</p></li>)}</ul><p className="mt-3 text-xs text-muted">Compares the latest payment with the previous dated payment for the same service or recharge type. Plan benefits, billing periods or taxes may differ; this does not confirm a provider price increase.</p></section>;
}
