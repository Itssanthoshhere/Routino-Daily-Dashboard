export type RecycleEntry = { id: string; kind: 'tasks' | 'notes' | 'habits' | 'customEvents' | 'quickLinks' | 'subscriptions' | 'airtel'; record: Record<string, unknown> & { id: string }; deletedAt: string; journalOnly?: boolean };
type Workspace = Record<string, unknown> & { recycleBin?: RecycleEntry[] };
export function restoreDeletedRecord(workspace: Workspace, id: string): { success: true; data: Workspace } | { success: false; error: string } {
  const entry = workspace.recycleBin?.find(item => item.id === id);
  if (!entry) return { success: false, error: "Deleted record not found." };
  const { kind, record } = entry;
  if (!['tasks','notes','habits','customEvents','quickLinks','subscriptions','airtel'].includes(kind) || !record || typeof record.id !== 'string') return { success: false, error: "This deleted record needs manual recovery from a backup." };
  const data: Workspace = { ...workspace, recycleBin: workspace.recycleBin!.filter(item => item.id !== id) };
  if (kind === 'airtel') {
    const airtel = (workspace.airtel || { records: [], deletedIds: [], plan: null }) as { records: RecycleEntry['record'][]; deletedIds: string[] };
    if (!entry.journalOnly && airtel.records.some(item => item.id === record.id)) return { success: false, error: "A recharge with this ID already exists; it was not overwritten." };
    data.airtel = { ...airtel, records: entry.journalOnly ? airtel.records : [...airtel.records, record], deletedIds: airtel.deletedIds.filter(item => item !== record.id) };
  } else {
    const current = (Array.isArray(workspace[kind]) ? workspace[kind] : []) as RecycleEntry['record'][];
    if (current.some(item => item.id === record.id)) return { success: false, error: "This record already exists; newer data was not overwritten." };
    data[kind] = [...current, record];
  }
  return { success: true, data };
}
export function recycleLabel(entry: RecycleEntry) {
  return String(entry.record.title || entry.record.name || entry.record.summary || (entry.kind === 'airtel' ? `${entry.record.date || 'Journal recharge'} · ${entry.record.amount === undefined ? entry.record.id : `₹${entry.record.amount}`}` : entry.record.id));
}
