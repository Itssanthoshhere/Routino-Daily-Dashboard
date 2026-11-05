import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveLinkedInProfile } from "@/lib/db";
import { getLinkedInRedirectUri, hasLinkedInCredentials } from "@/lib/linkedin";

export const runtime = "nodejs";

function redirectHome(request: NextRequest, result: string) {
  const response = NextResponse.redirect(new URL(`/?linkedin=${result}`, request.url));
  response.cookies.set("routino_linkedin_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/linkedin/callback",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const googleEmail = session?.user?.email;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const receivedState = url.searchParams.get("state");
  const savedState = request.cookies.get("routino_linkedin_oauth_state")?.value;

  if (!googleEmail || !hasLinkedInCredentials()) return redirectHome(request, "error");
  if (!receivedState || !savedState || receivedState !== savedState) return redirectHome(request, "error");
  if (url.searchParams.has("error") || !code) return redirectHome(request, "error");

  try {
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getLinkedInRedirectUri()!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return redirectHome(request, "error");
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) return redirectHome(request, "error");

    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) return redirectHome(request, "error");
    const claims = (await profileResponse.json()) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };
    if (!claims.sub || !claims.name) return redirectHome(request, "error");

    await saveLinkedInProfile(googleEmail, {
      subject: claims.sub,
      name: claims.name,
      email: claims.email,
      picture: claims.picture,
      linkedAt: new Date().toISOString(),
    });
    return redirectHome(request, "connected");
  } catch {
    return redirectHome(request, "error");
  }
}
