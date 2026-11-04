# Daily Dashboard

A private, responsive personal dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Google integration setup

1. Create an OAuth 2.0 Web application client in Google Cloud Console and configure the OAuth consent screen.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI for local development. For production, add `https://YOUR_DOMAIN/api/auth/callback/google`.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` as environment variables. Never commit `.env.local` or actual credentials.
4. Enable the Gmail API and Google Calendar API. The app requests read-only scopes. Drive and Google Sites are intentionally not connected.

OAuth tokens are held in an encrypted, HTTP-only NextAuth JWT cookie and consumed by server-only route handlers. Access tokens are never returned to browser JavaScript or written to local storage. This starter does not persist refresh tokens in a database.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```
