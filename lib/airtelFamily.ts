import type {AirtelData,AirtelFamilyMember,AirtelFamilyObservation} from '@/types/airtel';
import {airtelTotals} from '@/lib/airtelRecharges';
/** Replace only the selected profile; the personal ledger and all other profiles are retained. */
export function saveFamilyMember(saved:AirtelData,member:AirtelFamilyMember):AirtelData{const members=saved.familyMembers||[];return {...saved,familyMembers:members.some(m=>m.id===member.id)?members.map(m=>m.id===member.id?member:m):[...members,member]};}
export function familyRecordedTotals(members:AirtelFamilyMember[]){return members.reduce((sum,m)=>sum+airtelTotals(m.recharge.records.filter(r=>!m.recharge.deletedIds.includes(r.id))).total,0);}
export function addFamilyObservation(member:AirtelFamilyMember,observation:AirtelFamilyObservation){return {...member,observations:member.observations.some(o=>o.id===observation.id)?member.observations.map(o=>o.id===observation.id?observation:o):[...member.observations,observation]};}
export function maskedFamilyPhone(phone:string){return `••••••${phone.slice(-4)}`;}
