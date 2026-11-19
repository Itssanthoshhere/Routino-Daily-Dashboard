import type { AirtelRecharge } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { recordedPayments } from "@/lib/monthlySpending";
export type PaymentPriceChange = { id: string; name: string; currency: string; date: string; previousDate: string; current: number; previous: number; difference: number; percent: number | null };
export function paymentPriceChanges(recharges: AirtelRecharge[] = [], subscriptions: Subscription[] = []): PaymentPriceChange[] {
  const groups = [
    ...(["plan", "topup"] as const).map(kind=>({id:`airtel:${kind}`,name:kind==="plan"?"Airtel main plan":"Airtel data top-up",currency:"INR",payments:recharges.filter(r=>r.kind===kind&&r.status!=="failed"&&!r.paidByOther)})),
    ...subscriptions.map(s=>({id:`subscription:${s.id}`,name:s.name,currency:s.currency,payments:recordedPayments([s],{records:[],plan:null,deletedIds:[]})})),
  ];
  return groups.flatMap(group=>{
    const rows=[...group.payments].sort((a,b)=>b.date.localeCompare(a.date));
    const current=rows[0]; if(!current)return [];
    // Same-day payments have no reliable ordering. Do not guess which amount came last.
    if(rows.filter(r=>r.date===current.date).length!==1)return [];
    const older=rows.filter(r=>r.date<current.date);const previous=older[0];
    if(!previous||older.filter(r=>r.date===previous.date).length!==1||current.amount<=previous.amount)return [];
    const difference=Math.round((current.amount-previous.amount)*100)/100;
    return [{id:group.id,name:group.name,currency:group.currency,date:current.date,previousDate:previous.date,current:current.amount,previous:previous.amount,difference,percent:previous.amount>0?Math.round(difference/previous.amount*1000)/10:null}];
  });
}
