import type {Subscription} from '@/types/subscriptions';
export type CancellationEntry={id:string;kind:'request'|'confirmation'|'final-charge'|'refund';date:string;reference:string;notes:string;amount?:number;currency:Subscription['currency']};
export type SubscriptionExpiry={id:string;kind:'domain'|'certificate'|'licence';name:string;expiryDate:string;provider:string;notes:string};
const date=(v:unknown)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(`${v}T12:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;};
const text=(v:unknown,max:number,required=false)=>typeof v==='string'&&v.length<=max&&(!required||!!v.trim());
const currency=(v:unknown)=>['INR','USD','EUR','GBP'].includes(String(v));
export function validSubscriptionFollowUp(record:Record<string,unknown>){
 const entries=record.cancellationFollowUp as CancellationEntry[]|undefined;
 if(entries!==undefined&&(!Array.isArray(entries)||entries.length>200||new Set(entries.map(e=>e?.id)).size!==entries.length||!entries.every(e=>e&&text(e.id,100,true)&&['request','confirmation','final-charge','refund'].includes(e.kind)&&date(e.date)&&text(e.reference,200)&&text(e.notes,2000)&&currency(e.currency)&&(['final-charge','refund'].includes(e.kind)?typeof e.amount==='number'&&Number.isFinite(e.amount)&&e.amount>=0:e.amount===undefined))))return false;
 const expiry=record.expiryRecords as SubscriptionExpiry[]|undefined;
 return expiry===undefined||Array.isArray(expiry)&&expiry.length<=100&&new Set(expiry.map(e=>e?.id)).size===expiry.length&&expiry.every(e=>e&&text(e.id,100,true)&&['domain','certificate','licence'].includes(e.kind)&&text(e.name,200,true)&&date(e.expiryDate)&&text(e.provider,200)&&text(e.notes,2000));
}
const normal=(text:string)=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function duplicateServicePairs(subscriptions:Subscription[]){const active=subscriptions.filter(s=>s.status==='active');const pairs:{first:Subscription;second:Subscription;reason:string}[]=[];for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j];const sameName=normal(a.name)===normal(b.name);const category=normal(a.category);const overlap=category&& !['other','general','uncategorized'].includes(category)&&category===normal(b.category);if(sameName||overlap)pairs.push({first:a,second:b,reason:sameName?'Matching service name':`Shared category: ${a.category}`});}return pairs;}
export function expiryCountdown(expiry:string,today:string){const days=Math.round((Date.parse(`${expiry}T12:00:00Z`)-Date.parse(`${today}T12:00:00Z`))/86400000);return days<0?`Expired ${-days} days ago`:days===0?'Expires today':`Expires in ${days} days`;}
