type Identified = { id: string };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Reverse only records touched by an action, preserving unrelated later edits. */
export function undoRecords<T extends Identified>(current: T[], before: T[], after: T[]): T[] | null {
  const previous = new Map(before.map(item => [item.id, item]));
  const expected = new Map(after.map(item => [item.id, item]));
  const actual = new Map(current.map(item => [item.id, item]));
  const changed = Array.from(new Set([...before.map(item => item.id), ...after.map(item => item.id)])).filter(id => !equal(previous.get(id), expected.get(id)));
  if (changed.some(id => !equal(actual.get(id), expected.get(id)))) return null;
  const touched = new Set(changed);
  const restored = current.flatMap(item => !touched.has(item.id) ? [item] : previous.has(item.id) ? [previous.get(item.id)!] : []);
  for (const item of before) if (touched.has(item.id) && !actual.has(item.id)) restored.splice(Math.min(before.indexOf(item), restored.length), 0, item);
  return restored;
}
export function undoMembership(current: string[], before: string[], after: string[]): string[] | null {
  const beforeSet = new Set(before), afterSet = new Set(after), currentSet = new Set(current);
  const touched = Array.from(new Set([...before, ...after])).filter(id => beforeSet.has(id) !== afterSet.has(id));
  if (touched.some(id => currentSet.has(id) !== afterSet.has(id))) return null;
  for (const id of touched) { if (beforeSet.has(id)) currentSet.add(id); else currentSet.delete(id); }
  return Array.from(currentSet);
}
