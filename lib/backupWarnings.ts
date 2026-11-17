export type BackupHealth = { snapshots: { supported: boolean; reachable: boolean; latestAt: string | null }; external: { configured: boolean; reachable: boolean; latestAt: string | null }; checkedAt: string };
export type BackupWarning = { id: string; title: string; detail: string };
export function backupWarnings(health: BackupHealth | null, now: number): BackupWarning[] {
  if (!health) return [];
  const result: BackupWarning[] = [];
  const inspect = (key: 'snapshots' | 'external', enabled: boolean, name: string) => {
    const state = health[key]; if (!enabled) return;
    if (!state.reachable) { result.push({ id: `backup:${key}:unavailable`, title: `${name} status unavailable`, detail: 'Open Database & Sync to check again.' }); return; }
    const time = state.latestAt ? Date.parse(state.latestAt) : NaN;
    if (!Number.isFinite(time)) result.push({ id: `backup:${key}:missing`, title: `No ${name.toLowerCase()} recorded`, detail: 'Open Database & Sync to create and verify a backup.' });
    else if (now - time > 48 * 3600000) result.push({ id: `backup:${key}:stale:${state.latestAt}`, title: `${name} is over 48 hours old`, detail: `Last recorded: ${state.latestAt}. Check the backup schedule.` });
  };
  inspect('snapshots', health.snapshots.supported, 'Database snapshot'); inspect('external', health.external.configured, 'External backup');
  return result;
}
