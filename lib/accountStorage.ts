export type BrowserStorageFailure = "quota" | "unavailable";
let browserStorageFailure: BrowserStorageFailure | null = null;
export function getBrowserStorageFailure() { return browserStorageFailure; }
/** Report failed persistence without swallowing errors or exposing stored content. */
export function writeBrowserStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value); }
  catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    browserStorageFailure = name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED" ? "quota" : "unavailable";
    if (typeof window !== "undefined") window.dispatchEvent(new Event("routino:storage-failure"));
    throw error;
  }
}

const scopedKeys = new Set(["routino_workspace_position", "routino_tasks", "routino_notes", "routino_habits", "routino_events", "routino_links", "routino_focus", "routino_sound_enabled", "routino_active_nav", "routino_scratchpad", "routino_vault_verifier", "routino_starred_mail", "routino_read_later", "routino_read_mail", "routino_task_views", "routino_vault_autolock", "routino_vault_draft", "routino_workspace_preferences", "routino_subscription_budgets", "routino_focus_records", "routino_task_templates"]);
export const accountStorageKey = (key: string, account: string | null) => scopedKeys.has(key) ? `${key}:account:${account?.trim().toLowerCase() || "guest"}` : key;
export function scopedStorage(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, owner: () => string | null) {
  return {
    getItem: (key: string) => storage.getItem(accountStorageKey(key, owner())),
    setItem: (key: string, value: string) => storage.setItem(accountStorageKey(key, owner()), value),
    removeItem: (key: string) => storage.removeItem(accountStorageKey(key, owner())),
  };
}
/** Never attribute unowned legacy data to a new account; leave originals recoverable. */
export function migrateAccountCache(storage: Pick<Storage, "getItem" | "setItem">, account: string) {
  let owner = storage.getItem("routino_legacy_cache_owner");
  if (owner === null) { owner = storage.getItem("routino_verified_workspace_account")?.toLowerCase() || "__unassigned__"; storage.setItem("routino_legacy_cache_owner", owner); }
  if (owner !== account.toLowerCase()) return;
  for (const key of Array.from(scopedKeys)) {
    const target = accountStorageKey(key, account);
    const legacy = storage.getItem(key);
    if (storage.getItem(target) === null && legacy !== null) storage.setItem(target, legacy);
  }
}
