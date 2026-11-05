import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinkedInRedirectUri, hasLinkedInCredentials } from "@/lib/linkedin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/?setup=google", request.url));
  }
  if (!hasLinkedInCredentials()) {
    return NextResponse.redirect(new URL("/?setup=linkedin", request.url));
  }

  const state = randomBytes(32).toString("hex");
  const authorizeUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", process.env.LINKEDIN_CLIENT_ID!);
  authorizeUrl.searchParams.set("redirect_uri", getLinkedInRedirectUri()!);
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("routino_linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/linkedin/callback",
    maxAge: 600,
  });
  return response;
}
