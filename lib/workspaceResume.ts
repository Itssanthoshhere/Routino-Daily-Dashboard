export const resumeSections = ["Overview", "Calendar", "Time Audit", "Trackers", "Inbox", "Tasks", "Notes", "Recycle Bin"] as const;
export const resumeTrackers = ["airtel", "subscriptions", "eb", "expenses", "tokens", "investments", "placements", "life", "purchases"] as const;
export type WorkspacePosition = { section: string; tracker: string; scrollY: number };
export function readWorkspacePosition(raw: string | null): WorkspacePosition | null {
  try {
    const value = JSON.parse(raw || "null");
    if (!value || !resumeSections.includes(value.section) || !resumeTrackers.includes(value.tracker)
      || !Number.isFinite(value.scrollY) || value.scrollY < 0 || value.scrollY > 10_000_000) return null;
    return { section: value.section, tracker: value.tracker, scrollY: value.scrollY };
  } catch { return null; }
}
/** Explicit navigation and app shortcuts must never be redirected by saved position. */
export function mayResumeSection(search: string, hash: string): boolean {
  const params = new URLSearchParams(search);
  return !params.has("tab") && !params.has("action") && !params.has("setup") && !hash;
}
export function resumeScroll(saved: WorkspacePosition, current: WorkspacePosition, search: string, hash: string): number | null {
  const params = new URLSearchParams(search);
  if (params.has("action") || params.has("setup") || hash) return null;
  return saved.section === current.section && (current.section !== "Trackers" || saved.tracker === current.tracker) ? saved.scrollY : null;
}
