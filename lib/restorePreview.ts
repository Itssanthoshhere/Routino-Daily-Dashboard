type Data = Record<string, unknown>;
export type RestoreChange = { section: string; label: string; action: "add" | "remove" | "change" | "reorder"; before?: unknown; after?: unknown; fields?: string[] };
export type RestorePreview = { changes: RestoreChange[]; unchanged: number; counts: Record<RestoreChange['action'],number> };
const object = (value: unknown): value is Data => !!value && typeof value === "object" && !Array.isArray(value);
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}
export const restoreFingerprint = (value: unknown) => JSON.stringify(canonical(value));
function display(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(display);
  if (!object(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key,entry])=>[key,value.isEncrypted && key === "content" ? "[Encrypted note content — remains encrypted]" : display(entry)]));
}
export function databaseRestoreTarget(current: Data, backup: Data): Data {
  const target = { ...backup };
  const color = backup.calendarColorState ?? current.calendarColorState;
  if (object(color)) {
    const { pendingRunId, operationStartedAt, revision, ...rest } = color;
    target.calendarColorState = rest;
  }
  return target;
}
function sections(value: Data): Data {
  const { updatedAt, coreRevision, trackerRevision, ...rest } = value;
  if (object(rest.calendarColorState)) {
    const { revision, ...color } = rest.calendarColorState;
    rest.calendarColorState = color;
  }
  if (object(rest.airtel)) {
    const { airtel, ...other } = rest;
    return { ...other, ...Object.fromEntries(Object.entries(airtel as Data).map(([key,entry])=>[`airtel.${key}`,entry])) };
  }
  return rest;
}
/** Compare replacement state by stable record identity, including same-count edits and deletions. */
export function buildRestorePreview(current: Data, target: Data): RestorePreview {
  const before=sections(current), after=sections(target);
  const changes:RestoreChange[]=[]; let unchanged=0;
  const add=(section:string,label:string,a:unknown,b:unknown,action?:RestoreChange['action'])=>{
    if(restoreFingerprint(a)===restoreFingerprint(b)){unchanged++;return;}
    const fields=object(a)&&object(b)?Array.from(new Set([...Object.keys(a),...Object.keys(b)])).filter(key=>restoreFingerprint(a[key])!==restoreFingerprint(b[key])):undefined;
    changes.push({section,label,action:action || (a===undefined?"add":b===undefined?"remove":"change"),before:display(a),after:display(b),fields});
  };
  const keyed=(values:unknown[])=>values.every(row=>object(row)&&typeof row.id==="string") && new Set(values.map(row=>(row as Data).id)).size===values.length;
  for(const section of Array.from(new Set([...Object.keys(before),...Object.keys(after)]))){
    const a=before[section],b=after[section];
    if((Array.isArray(a)||a===undefined)&&(Array.isArray(b)||b===undefined)&&keyed(a as unknown[]||[])&&keyed(b as unknown[]||[])){
      const oldRows=(a||[]) as Data[],newRows=(b||[]) as Data[];
      const oldMap=new Map(oldRows.map(row=>[String(row.id),row])),newMap=new Map(newRows.map(row=>[String(row.id),row]));
      for(const id of Array.from(new Set([...Array.from(oldMap.keys()),...Array.from(newMap.keys())]))){const old=oldMap.get(id),next=newMap.get(id),row=next||old!;add(section,String(row.title||row.name||row.summary||row.date||id),old,next);}
      const sharedOld=oldRows.map(row=>String(row.id)).filter(id=>newMap.has(id)),sharedNew=newRows.map(row=>String(row.id)).filter(id=>oldMap.has(id));
      if(restoreFingerprint(sharedOld)!==restoreFingerprint(sharedNew))add(section,"Record order",oldRows.map(row=>row.id),newRows.map(row=>row.id),"reorder");
      if((a===undefined)!==(b===undefined)&&!oldRows.length&&!newRows.length)add(section,"Empty collection",a,b);
    }else if(object(a)&&object(b)&&["assetRecords","assetDocuments"].includes(section)){
      for(const key of Array.from(new Set([...Object.keys(a),...Object.keys(b)])))add(section,key,a[key],b[key]);
    }else add(section,section,a,b);
  }
  return {changes,unchanged,counts:{add:changes.filter(c=>c.action==="add").length,remove:changes.filter(c=>c.action==="remove").length,change:changes.filter(c=>c.action==="change").length,reorder:changes.filter(c=>c.action==="reorder").length}};
}
