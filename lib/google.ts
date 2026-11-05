import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

async function getGoogleToken() {
  const jar = await cookies();
  const allCookies = jar.getAll();
  const cookie = allCookies.map(({ name, value }) => `${name}=${value}`).join("; ");
  const sessionCookie = allCookies.find(({ name }) =>
    /^(?:__Secure-)?(?:authjs|next-auth)\.session-token$/.test(name)
  );

  const token = await getToken({
    req: { headers: { cookie } } as never,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookie?.name,
    secureCookie: sessionCookie ? sessionCookie.name.startsWith("__Secure-") : undefined,
  });

  if (!token?.googleAccessToken) throw new Error("Google account is not connected.");
  const expiresAt = token.googleExpiresAt ?? 0;
  if (expiresAt * 1000 > Date.now() + 60_000) return token.googleAccessToken;
  if (!token.googleRefreshToken) throw new Error("Google session expired. Reconnect your account.");
  const refresh = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", refresh_token: token.googleRefreshToken, grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const result = await refresh.json();
  if (!refresh.ok || !result.access_token) throw new Error("Google session expired. Reconnect your account.");
  return result.access_token as string;
}

export async function googleFetch(url: string) {
  const accessToken = await getGoogleToken();
  return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
}
