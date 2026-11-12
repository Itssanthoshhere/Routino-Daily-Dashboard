import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOutlookClientId,
  getOutlookRedirectUri,
  getOutlookTenantId,
  hasOutlookCredentials,
} from "@/lib/outlook";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/dashboard?setup=google", request.url));
  }

  if (!hasOutlookCredentials()) {
    return NextResponse.redirect(new URL("/dashboard?setup=outlook", request.url));
  }

  const state = randomBytes(32).toString("hex");
  const tenant = getOutlookTenantId();
  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  );

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", getOutlookClientId());
  authorizeUrl.searchParams.set("redirect_uri", getOutlookRedirectUri());
  authorizeUrl.searchParams.set(
    "scope",
    "offline_access User.Read Mail.Read Calendars.Read"
  );
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("routino_outlook_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/outlook/callback",
    maxAge: 600,
  });

  return response;
}
