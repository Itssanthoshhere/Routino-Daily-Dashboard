import type { TaskRecurrence } from "@/lib/taskRecurrence";

export type Priority = "low" | "medium" | "high";

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
  link?: string;
};

export type Task = {
  activity?: import("@/lib/taskActivity").TaskActivity[];
  id: string;
  title: string;
  meta: string;
  checked: boolean;
  skipped?: boolean;
  priority: boolean;
  category?: "work" | "personal" | "meeting" | "urgent" | "project" | "travel";
  dueDate?: string;
  recurrence?: TaskRecurrence;
  recurrenceSeriesId?: string;
  recurrenceTemplate?: Omit<Task, "id" | "checked" | "createdAt" | "recurrenceTemplate" | "activity">;
  createdAt: number;
  subtasks?: SubTask[];
  link?: string;
};

export type Habit = {
  id: string;
  name: string;
  streak: number;
  completedDates: string[]; // ['YYYY-MM-DD']
  icon?: string;
};

export type DashboardEvent = {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  meetLink?: string;
  location?: string;
  attendees?: string[];
  tag?: string;
  color?: string;
  colorId?: string;
  calendarId?: string;
  calendarSummary?: string;
  calendarColor?: string;
  isCustom?: boolean;
  source?: "google" | "outlook" | "custom";
};

export type EmailActionCategory =
  | "security"
  | "finance"
  | "infra"
  | "career"
  | "reply"
  | "payment"
  | "update"
  | "general"
  | "outlook";

export type DashboardMail = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  read?: boolean;
  starred?: boolean;
  category?: EmailActionCategory;
  href?: string;
  source?: "google" | "outlook";
  actionBadge?: {
    label: string;
    variant: "security" | "finance" | "infra" | "career" | "urgent" | "info";
  };
};

export type QuickLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  iconName: "calendar" | "mail" | "drive" | "keep" | "sites" | "link" | "file" | "github" | "portfolio" | "globe" | "outlook";
  available: boolean;
};

export type KeepNoteChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type KeepNotePriority = "high" | "medium" | "low" | "none";

export type KeepNote = {
  id: string;
  title: string;
  content: string;
  color?: "default" | "yellow" | "green" | "blue" | "peach" | "purple";
  pinned?: boolean;
  priority?: KeepNotePriority;
  imageUrl?: string;
  images?: string[];
  checklist?: KeepNoteChecklistItem[];
  isEncrypted?: boolean;
  order?: number;
  updatedAt: number;
  createdAt?: number;
};

export type OutlookProfile = {
  email: string;
  name: string;
  connectedAt: string;
};

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  time: string;
  type: "calendar" | "task" | "mail" | "system";
  read: boolean;
  actionText?: string;
  openPreferences?: boolean;
  trackerTab?: "airtel" | "subscriptions";
  taskId?: string;
  navTarget?: "Overview" | "Calendar" | "Inbox" | "Tasks" | "Notes" | "Time Audit" | "Trackers";
};

export type TimeAuditCategory = {
  id: string;
  name: string;
  color: string;
  keys: string[];
};

export type AuditedEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  durationMinutes: number;
  category: TimeAuditCategory;
  calendarName?: string;
  isAllDay?: boolean;
};

export type CalendarCheckInfo = {
  id: string;
  summary: string;
  color?: string;
  status: "connected" | "checked" | "failed";
  error?: string;
  eventCount?: number;
};

export type SourcesStatus = {
  gmail: "checked" | "failed";
  calendarList: "checked" | "failed";
  calendarsTotal: number;
  calendarsChecked: number;
  calendarsFailed: number;
  drive?: "checked" | "needs_consent" | "permission_denied" | "failed" | "not_connected";
  outlook?: "checked" | "failed" | "partial" | "unknown" | "not_connected";
};

export type DashboardData = {
  connected: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  events: DashboardEvent[];
  unread: DashboardMail[];
  recentUnreadCount?: number | null;
  unreadEstimate?: number;
  unread48hEstimate?: number | null;
  unread48hStatus?: "ok" | "failed" | "not_queried";
  nextPageToken?: string | null;
  lastSyncedAt?: string;
  calendarsChecked?: CalendarCheckInfo[];
  sourcesStatus?: SourcesStatus;
  error?: string;
};

export * from "./trackers";
