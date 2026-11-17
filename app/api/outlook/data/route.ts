import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOutlookAccount, saveOutlookAccount } from "@/lib/db";
import {
  fetchOutlookRecentUnreadCount,
  fetchOutlookEvents,
  fetchOutlookMessages,
  getOutlookRedirectUri,
  refreshOutlookToken,
} from "@/lib/outlook";

export async function GET() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({
      authenticated: false,
      connected: false,
      events: [],
      unread: [],
      syncStatus: {
        calendar: "not_connected",
        mail: "not_connected",
        overall: "not_connected",
      },
    });
  }

  try {
    const account = await getOutlookAccount(userEmail);
    if (!account || !account.accessToken) {
      return NextResponse.json({
        authenticated: true,
        connected: false,
        events: [],
        unread: [],
        syncStatus: {
          calendar: "not_connected",
          mail: "not_connected",
          overall: "not_connected",
        },
      });
    }

    let accessToken = account.accessToken;
    const isExpired = account.expiresAt && Date.now() >= account.expiresAt - 60_000;

    // Refresh token if expired or about to expire
    if (isExpired && account.refreshToken) {
      try {
        const refreshed = await refreshOutlookToken(
          account.refreshToken,
          getOutlookRedirectUri()
        );
        accessToken = refreshed.access_token;
        const updatedAccount = {
          ...account,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || account.refreshToken,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
        };
        await saveOutlookAccount(userEmail, updatedAccount);
      } catch (refreshErr) {
        console.error("[outlook] Failed to refresh token:", refreshErr);
      }
    }

    const [eventsResult, messagesResult, inboxCountResult] = await Promise.allSettled([
      fetchOutlookEvents(accessToken),
      fetchOutlookMessages(accessToken),
      fetchOutlookRecentUnreadCount(accessToken),
    ]);

    const eventsOk = eventsResult.status === "fulfilled";
    const messagesOk = messagesResult.status === "fulfilled";

    const events = eventsOk ? eventsResult.value : [];
    const unreadPage = messagesOk
      ? messagesResult.value
      : { messages: [], nextLink: null };
    const unread = unreadPage.messages;

    const syncStatus = {
      calendar: eventsOk ? ("checked" as const) : ("failed" as const),
      mail: messagesOk ? ("checked" as const) : ("failed" as const),
      overall:
        eventsOk && messagesOk
          ? ("checked" as const)
          : !eventsOk && !messagesOk
          ? ("failed" as const)
          : ("partial" as const),
    };

    return NextResponse.json({
      authenticated: true,
      connected: true,
      profile: {
        email: account.email,
        name: account.name,
      },
      events,
      unread,
      unreadNextLink: unreadPage.nextLink,
      recentUnreadCount: inboxCountResult.status === "fulfilled" ? inboxCountResult.value : null,
      syncStatus,
    });
  } catch (error) {
    console.error("[outlook] Failed to load data:", error);
    return NextResponse.json(
      {
        authenticated: true,
        connected: false,
        events: [],
        unread: [],
        syncStatus: {
          calendar: "failed",
          mail: "failed",
          overall: "failed",
        },
        error: "Failed to load Outlook data",
      },
      { status: 500 }
    );
  }
}
