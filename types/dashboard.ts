export type Priority = "low" | "medium" | "high";

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  meta: string;
  checked: boolean;
  priority: boolean;
  category?: "work" | "personal" | "meeting" | "urgent";
  dueDate?: string;
  createdAt: number;
  subtasks?: SubTask[];
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
  isCustom?: boolean;
  source?: "google" | "outlook" | "custom";
};

export type DashboardMail = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  read?: boolean;
  starred?: boolean;
  category?: "reply" | "payment" | "update" | "general" | "outlook";
  href?: string;
  source?: "google" | "outlook";
};

export type QuickLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  iconName: "calendar" | "mail" | "drive" | "sites" | "link" | "file" | "linkedin" | "github" | "portfolio" | "globe" | "outlook";
  available: boolean;
};

export type OutlookProfile = {
  email: string;
  name: string;
  connectedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  time: string;
  type: "calendar" | "task" | "mail" | "system";
  read: boolean;
  actionText?: string;
  navTarget?: "Overview" | "Calendar" | "Inbox" | "Tasks";
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
  error?: string;
};
