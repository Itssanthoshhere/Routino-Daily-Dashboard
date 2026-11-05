import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOutlookAccount, saveOutlookAccount } from "@/lib/db";
import {
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

    const [eventsResult, messagesResult] = await Promise.allSettled([
      fetchOutlookEvents(accessToken),
      fetchOutlookMessages(accessToken),
    ]);

    const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
    const unread = messagesResult.status === "fulfilled" ? messagesResult.value : [];

    return NextResponse.json({
      authenticated: true,
      connected: true,
      profile: {
        email: account.email,
        name: account.name,
      },
      events,
      unread,
    });
  } catch (error) {
    console.error("[outlook] Failed to load data:", error);
    return NextResponse.json(
      {
        authenticated: true,
        connected: false,
        events: [],
        unread: [],
        error: "Failed to load Outlook data",
      },
      { status: 500 }
    );
  }
}
