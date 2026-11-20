export type ResumeSyncInput = {
  online: boolean;
  signedIn: boolean;
  checking: boolean;
  saving: boolean;
  pending: boolean;
  error: boolean;
  localOnly: boolean;
  checkedAt: number | null;
  trackerCheckedAt: number | null;
};

/** Read only the active account's queues; unreadable queues must never mean synced. */
export function pendingResumeChanges(storage: { getItem(key: string): string | null }, account?: string | null) {
  if (!account) return { pending: false, unreadable: false };
  try {
    const email = account.trim().toLowerCase();
    const core = JSON.parse(storage.getItem(`routino_workspace_pending:${email}`) || '{}');
    const tracker = JSON.parse(storage.getItem(`routino_trackers_v2:${email}`) || '{}');
    if (!core || typeof core !== 'object' || Array.isArray(core) || !tracker || typeof tracker !== 'object' || Array.isArray(tracker)) throw new Error('Invalid local queue');
    return { pending: Object.keys(core).length > 0 || tracker.pending === true, unreadable: false };
  } catch { return { pending: false, unreadable: true }; }
}

export function resumeSyncStatus(input: ResumeSyncInput, now: number) {
  if (!input.online) return { tone: 'warning', label: 'Offline · showing this device’s saved data' };
  if (input.error) return { tone: 'warning', label: 'Sync needs attention · open Sync Center' };
  if (input.saving) return { tone: 'busy', label: 'Saving changes…' };
  if (input.pending) return { tone: 'warning', label: 'Changes waiting to sync' };
  if (input.checking) return { tone: 'busy', label: 'Checking updates…' };
  if (!input.signedIn || input.localOnly) return { tone: 'neutral', label: 'Saved on this device · cloud sync unavailable' };
  if (!input.checkedAt || !input.trackerCheckedAt) return { tone: 'neutral', label: 'Waiting for workspace sync' };
  const age = Math.max(0, now - Math.min(input.checkedAt, input.trackerCheckedAt));
  const minutes = Math.floor(age / 60000);
  return { tone: 'success', label: minutes < 1 ? 'Workspace synced just now' : `Workspace last checked ${minutes} min ago` };
}
