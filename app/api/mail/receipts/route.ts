import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receiptQuery } from "@/lib/receiptSearch";
import { googleFetch } from "@/lib/google";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return json({ error: "Sign in with Google to find receipts." }, 401);
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  if (kind !== "recharge" && kind !== "subscription") return json({ error: "Choose recharges or subscriptions." }, 400);
  const pageToken = params.get("pageToken") || "";
  if (pageToken.length > 2000) return json({ error: "Invalid page token." }, 400);
  let q: string;
  try { q = receiptQuery(kind, { service: params.get("service") || "", from: params.get("from") || "", to: params.get("to") || "", offset: Number(params.get("offset") || 0) }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid search filters." }, 400); }
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "15");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  try {
    const response = await googleFetch(url.toString());
    if (!response.ok) return json({ error: "Gmail search failed. Check your Google connection and try again." }, response.status === 401 || response.status === 403 ? response.status : 502);
    const page = await response.json();
    let unavailable = 0;
    const receipts = await Promise.all((page.messages || []).slice(0, 15).map(async ({ id }: { id: string }) => {
      const detail = await googleFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
      if (!detail.ok) { unavailable++; return null; }
      const message = await detail.json();
      const headers: { name: string; value: string }[] = message.payload?.headers || [];
      const header = (name: string) => headers.find(h => h.name.toLowerCase() === name)?.value || "";
      return { id, from: header("from"), subject: header("subject"), receivedOn: header("date"), snippet: message.snippet || "" };
    }));
    return json({ account: session.user.email.toLowerCase(), receipts: receipts.filter(Boolean), nextPageToken: page.nextPageToken || "", unavailable });
  } catch {
    return json({ error: "Could not search Gmail. Reconnect Google or try again." }, 502);
  }
}
