import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  exchangeOutlookCode,
  fetchOutlookUser,
  getOutlookRedirectUri,
} from "@/lib/outlook";
import { saveOutlookAccount } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/?setup=google", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("routino_outlook_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?error=outlook_state_mismatch", request.url));
  }

  try {
    const redirectUri = getOutlookRedirectUri();
    const tokenData = await exchangeOutlookCode(code, redirectUri);
    const profile = await fetchOutlookUser(tokenData.access_token);

    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    await saveOutlookAccount(session.user.email, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      email: profile.email,
      name: profile.displayName,
      connectedAt: new Date().toISOString(),
    });

    const response = NextResponse.redirect(new URL("/?connected=outlook", request.url));
    response.cookies.delete("routino_outlook_oauth_state");
    return response;
  } catch (error) {
    console.error("[outlook/callback] Error:", error);
    return NextResponse.redirect(new URL("/?error=outlook_auth_failed", request.url));
  }
}
