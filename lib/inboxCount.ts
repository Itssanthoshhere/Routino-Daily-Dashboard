export function validInboxCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
export function inboxCountLabel(accounts: { connected: boolean; count?: number | null }[]): string | null {
  const connected = accounts.filter(account => account.connected);
  if (!connected.length) return null;
  if (connected.some(account => !validInboxCount(account.count))) return '—';
  return new Intl.NumberFormat('en-IN').format(connected.reduce((sum, account) => sum + account.count!, 0));
}
