export const coreCollections = ["notes", "habits", "customEvents", "quickLinks", "focusRecords", "taskTemplates"] as const;
export type CollectionName = typeof coreCollections[number];
export type RecordChange = { replaceIds: string[]; deletedIds: string[]; orderIds?: string[] };
export type CollectionChanges = Partial<Record<CollectionName, RecordChange>>;
type Row = {id:string};
export function mergeCollection<T extends Row>(existing: T[], incoming: T[], change: RecordChange): T[] {
  const removed = new Set(change.deletedIds), replaced = new Set(change.replaceIds);
  const merged = new Map(existing.filter(row=>!removed.has(row.id)).map(row=>[row.id,row]));
  for (const row of incoming) if (replaced.has(row.id) && !removed.has(row.id)) merged.set(row.id,row);
  const result = Array.from(merged.values());
  if (change.orderIds) { const order = new Map(change.orderIds.map((id,index)=>[id,index])); result.sort((a,b)=>(order.get(a.id) ?? Number.MAX_SAFE_INTEGER)-(order.get(b.id) ?? Number.MAX_SAFE_INTEGER)); }
  return result;
}
export function collectionDiff(previous: Row[], next: Row[]): RecordChange {
  const before=new Map(previous.map(row=>[row.id,JSON.stringify(row)])),after=new Set(next.map(row=>row.id));
  return { ...(previous.map(row=>row.id).join("\0") !== next.map(row=>row.id).join("\0") ? {orderIds:next.map(row=>row.id)} : {}), replaceIds:next.filter(row=>before.get(row.id)!==JSON.stringify(row)).map(row=>row.id),deletedIds:previous.filter(row=>!after.has(row.id)).map(row=>row.id)};
}
