export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  meta: string;
  checked: boolean;
  priority: boolean;
  category?: "work" | "personal" | "meeting" | "urgent";
  dueDate?: string;
  createdAt: number;
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
};

export type DashboardMail = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  read?: boolean;
  starred?: boolean;
  category?: "reply" | "payment" | "update" | "general";
  href?: string;
};

export type QuickLink = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  iconName: "calendar" | "mail" | "drive" | "sites" | "link" | "file" | "linkedin" | "github" | "portfolio" | "globe";
  available: boolean;
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
