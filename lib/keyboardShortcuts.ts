/** Keep both in-app shortcut guides aligned with the dashboard key handler. */
export const KEYBOARD_SHORTCUTS = [
  { key: "1", description: "Open Overview", category: "Navigation" },
  { key: "2", description: "Open Calendar", category: "Navigation" },
  { key: "3", description: "Open Inbox", category: "Navigation" },
  { key: "4", description: "Open Tasks", category: "Navigation" },
  { key: "5", description: "Open Notes & Scratchpad", category: "Navigation" },
  { key: "6", description: "Open Trackers", category: "Navigation" },
  { key: "Q", description: "Quick capture a task, note, or scratchpad entry", category: "Actions" },
  { key: "F", description: "Open focus timer", category: "Actions" },
  { key: "T", description: "Create a task (including repeat options)", category: "Actions" },
  { key: "E", description: "Create a calendar event", category: "Actions" },
  { key: "H", description: "Manage habits", category: "Actions" },
  { key: "⌘ K / Ctrl K", description: "Toggle command palette / search", category: "General" },
  { key: "?", description: "Toggle keyboard shortcuts", category: "General" },
  { key: "Esc", description: "Dismiss supported dialogs and popovers", category: "General" },
] as const;
