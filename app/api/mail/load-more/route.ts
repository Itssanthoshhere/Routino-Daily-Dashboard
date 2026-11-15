import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";
import { getOutlookAccount, saveOutlookAccount } from "@/lib/db";
import {
  fetchOutlookMessages,
  getOutlookRedirectUri,
  refreshOutlookToken,
} from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "google";
  const pageToken = searchParams.get("pageToken") || "";
  const outlookNextLink = searchParams.get("nextLink") || "";

  // ─── Microsoft Outlook ───
  if (source === "outlook") {
    if (!outlookNextLink) {
      return NextResponse.json({ messages: [], hasMore: false, error: "Missing Outlook paging link" }, { status: 400 });
    }
    const userEmail = session.user?.email;
    if (!userEmail) return NextResponse.json({ messages: [], hasMore: false });
    const account = await getOutlookAccount(userEmail);
    if (!account || !account.accessToken) {
      return NextResponse.json({ messages: [], hasMore: false });
    }

    let accessToken = account.accessToken;
    const isExpired = account.expiresAt && Date.now() >= account.expiresAt - 60_000;
    if (isExpired && account.refreshToken) {
      try {
        const refreshed = await refreshOutlookToken(
          account.refreshToken,
          getOutlookRedirectUri()
        );
        accessToken = refreshed.access_token;
        await saveOutlookAccount(userEmail, {
          ...account,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || account.refreshToken,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
        });
      } catch (err) {
        console.error("[outlook] Load more token refresh failed:", err);
      }
    }

    try {
      const page = await fetchOutlookMessages(accessToken, 10, outlookNextLink);
      return NextResponse.json({
        messages: page.messages,
        nextLink: page.nextLink,
        hasMore: Boolean(page.nextLink),
      });
    } catch (err) {
      console.error("[outlook] Load more error:", err);
      return NextResponse.json(
        { messages: [], hasMore: false, error: "Failed to load more Outlook messages" },
        { status: 500 }
      );
    }
  }

  // ─── Google Gmail ───
  try {
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+-category:promotions+-category:social&maxResults=10${pageParam}`;
    const res = await googleFetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { messages: [], hasMore: false, error: "Gmail API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const messageList = data.messages ?? [];
    const nextPageToken = data.nextPageToken || null;

    const messages = await Promise.all(
      messageList.map(async ({ id }: { id: string }) => {
        const detailRes = await googleFetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
        );
        if (!detailRes.ok) return null;
        const msg = await detailRes.json();
        const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
        const header = (name: string) =>
          headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? "";
        return {
          id: msg.id,
          threadId: msg.threadId,
          from: header("From"),
          subject: header("Subject"),
          date: header("Date"),
          snippet: msg.snippet ?? "",
          source: "google" as const,
          href: `https://mail.google.com/mail/u/0/#all/${msg.id}`,
        };
      })
    );

    return NextResponse.json({
      messages: messages.filter(Boolean),
      nextPageToken,
      hasMore: Boolean(nextPageToken),
    });
  } catch (err: any) {
    console.error("[gmail] Load more error:", err);
    return NextResponse.json(
      { messages: [], hasMore: false, error: err?.message || "Could not retrieve messages." },
      { status: 502 }
    );
  }
}
