import { DashboardEvent, DashboardMail } from "@/types/dashboard";

export const OUTLOOK_CALLBACK_PATH = "/api/outlook/callback";

export function getOutlookClientId(): string {
  return process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || "";
}

export function getOutlookClientSecret(): string {
  return process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || "";
}

export function getOutlookTenantId(): string {
  return process.env.AZURE_AD_TENANT_ID || "common";
}

export function getOutlookRedirectUri(): string {
  if (process.env.OUTLOOK_REDIRECT_URI) {
    return process.env.OUTLOOK_REDIRECT_URI;
  }
  const appUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${appUrl.replace(/\/$/, "")}${OUTLOOK_CALLBACK_PATH}`;
}

export function hasOutlookCredentials(): boolean {
  return Boolean(getOutlookClientId() && getOutlookClientSecret());
}

/**
 * Exchange OAuth authorization code for Microsoft Graph tokens.
 */
export async function exchangeOutlookCode(code: string, redirectUri: string) {
  const tenant = getOutlookTenantId();
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: getOutlookClientId(),
    client_secret: getOutlookClientSecret(),
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: "offline_access User.Read Mail.Read Calendars.Read",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to exchange Microsoft code: ${errorText}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  };
}

/**
 * Refresh an expired Microsoft Graph access token.
 */
export async function refreshOutlookToken(refreshToken: string, redirectUri: string) {
  const tenant = getOutlookTenantId();
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: getOutlookClientId(),
    client_secret: getOutlookClientSecret(),
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
    grant_type: "refresh_token",
    scope: "offline_access User.Read Mail.Read Calendars.Read",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to refresh Microsoft token: ${errorText}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

/**
 * Fetch authenticated Microsoft user profile details.
 */
export async function fetchOutlookUser(accessToken: string) {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Microsoft profile");
  }

  const json = await res.json();
  return {
    id: json.id,
    displayName: json.displayName || "Outlook User",
    email: json.mail || json.userPrincipalName || "",
  };
}

/**
 * Fetch upcoming events from Microsoft Outlook Calendar via Microsoft Graph.
 */
export async function fetchOutlookEvents(accessToken: string): Promise<DashboardEvent[]> {
  const now = new Date();
  const week = new Date(now);
  week.setDate(week.getDate() + 7);

  const startStr = now.toISOString();
  const endStr = week.toISOString();

  const url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startStr)}&endDateTime=${encodeURIComponent(endStr)}&$top=25&$orderby=start/dateTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[outlook] Error fetching calendar events:", await res.text());
    return [];
  }

  const json = await res.json();
  const items = json.value || [];

  return items.map((item: any): DashboardEvent => ({
    id: `outlook-${item.id}`,
    summary: item.subject || "Untitled meeting",
    description: item.bodyPreview || "",
    htmlLink: item.webLink || "https://outlook.live.com/calendar",
    start: {
      dateTime: item.start?.dateTime ? `${item.start.dateTime}Z` : undefined,
    },
    end: {
      dateTime: item.end?.dateTime ? `${item.end.dateTime}Z` : undefined,
    },
    meetLink: item.onlineMeeting?.joinUrl,
    location: item.location?.displayName,
    tag: "OUTLOOK",
    color: "#0078d4", // Microsoft Blue
    source: "outlook",
  }));
}

/**
 * Fetch unread inbox messages from Microsoft Outlook via Microsoft Graph.
 */
export async function fetchOutlookMessages(accessToken: string): Promise<DashboardMail[]> {
  const url = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=8&$orderby=receivedDateTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[outlook] Error fetching unread messages:", await res.text());
    return [];
  }

  const json = await res.json();
  const items = json.value || [];

  return items.map((msg: any): DashboardMail => {
    const sender = msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || "Outlook";
    return {
      id: `outlook-${msg.id}`,
      from: sender,
      subject: msg.subject || "No subject",
      date: msg.receivedDateTime || new Date().toISOString(),
      snippet: msg.bodyPreview || "",
      read: false,
      starred: msg.importance === "high",
      category: "outlook",
      href: msg.webLink || "https://outlook.live.com/mail",
      source: "outlook",
    };
  });
}
