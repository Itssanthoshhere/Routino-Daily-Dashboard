# Daily Dashboard

A polished, responsive personal dashboard for planning the day. The app is built with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**. Its Google integration reads Calendar and Gmail data only after the user signs in with Google.

## What’s included

- A daily overview with the current date, calendar count, inbox count, and focus time.
- Today’s upcoming Calendar events and a rolling seven-day calendar view.
- Unread Gmail messages with sender, subject, date, and a short snippet.
- A task and follow-up list, daily plan, deadline examples, and shortcuts to Calendar and Gmail.
- Responsive layouts for mobile, tablet, and desktop.
- Clear preview labels when Google is not connected. The sample tasks, focus plan, deadlines, and preview emails are illustrative; tasks currently live in browser memory and are not saved to an account.
- Google Drive and Google Sites are **not integrated**.

## Tech stack

- Next.js App Router and React
- TypeScript
- Tailwind CSS
- Auth.js (NextAuth v5) with the Google provider
- Gmail API and Google Calendar API, accessed from a server route

## Google access and security

The app asks for the basic Google sign-in identity scopes plus these read-only scopes:

- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/gmail.readonly`

OAuth access and refresh tokens are stored in the encrypted, HTTP-only Auth.js JWT session cookie. They are not returned in the browser-visible session, placed in local storage, or committed to this repository. The `/api/dashboard` route reads the session server-side, calls Google APIs, and returns only calendar event details and limited email metadata/snippets. The app does not store dashboard data or OAuth tokens in a database. Access tokens are refreshed server-side when needed.

Google’s OAuth consent screen may show an unverified-app warning while the OAuth app is in testing. Add the intended Google account as a test user in Google Cloud Console. Only approve the scopes you expect to grant.

## Create Google OAuth credentials

1. In [Google Cloud Console](https://console.cloud.google.com/), create or choose a project.
2. Enable **Gmail API** and **Google Calendar API** for that project.
3. Configure the Google Auth Platform consent screen. Choose **External** for a personal Google account, complete the required app details, and add your account under **Test users** while the app is in testing.
4. Create an OAuth client ID with application type **Web application**.
5. Add the following **Authorized redirect URIs**:

   ```text
   http://localhost:3000/api/auth/callback/google
   https://YOUR_VERCEL_DOMAIN/api/auth/callback/google
   ```

   Replace `YOUR_VERCEL_DOMAIN` with the deployed Vercel hostname. Redirect URIs must match exactly.

6. Copy the client ID and client secret into your local environment and the Vercel project environment settings. Never commit real credentials.

## Environment variables

Copy the example file and fill it in locally:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth web client secret |
| `NEXTAUTH_SECRET` | Random secret used to encrypt/sign Auth.js session data |
| `NEXTAUTH_URL` | Base URL for this app, such as `http://localhost:3000` locally |

Generate a strong local secret with:

```bash
openssl rand -base64 32
```

For production, set all four variables in the Vercel project's **Production** environment and set `NEXTAUTH_URL` to the production URL. Add them to Preview or Development only if you want Google sign-in in those environments. Restart or redeploy after changing environment variables.

> Keep `.env.local`, OAuth client secrets, and session secrets private. The repository ignores `.env*` files except `.env.example`.

## Run locally

Requirements: Node.js compatible with the Next.js version in `package.json`, npm, and valid Google OAuth credentials for sign-in.

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Google OAuth values and a generated secret.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Google credentials, the dashboard stays in preview mode. After setting up credentials and signing in, `/api/dashboard` supplies live Calendar and Gmail data.

Production build and run:

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Import the private `Itssanthoshhere/Daily-Dashboard` GitHub repository into Vercel (or use the existing connected project).
2. Select **Next.js** as the framework and keep the project root at the repository root.
3. Add the environment variables above to the Vercel environment(s) you intend to use.
4. Add the production domain’s exact callback URI in the Google OAuth client.
5. Deploy. Later pushes to the connected production branch will create deployments automatically.

## API behavior

`GET /api/dashboard` is a server-only, authenticated route. It returns `401` when the browser has no Google session. When connected, it requests up to 25 Calendar events over the next seven days and up to eight unread, non-social/non-promotional Gmail messages. The returned email fields are limited to sender, subject, date, and snippet; full message content is not loaded. API responses are marked private and non-cacheable.

If the route returns an API error, confirm that both Google APIs are enabled, the consent screen includes the signed-in account as a test user, and the OAuth client has the correct redirect URI. Reconnect Google after changing granted scopes.

## Project structure

```text
app/
  api/auth/[...nextauth]/   Auth.js route handlers
  api/dashboard/            Authenticated Calendar and Gmail data route
  page.tsx                  Responsive dashboard UI
lib/
  auth.ts                    Google provider and server-side session callbacks
  google.ts                  Server-only Google token refresh and API requests
types/
  next-auth.d.ts             Auth.js token type declarations
```

## Current integration limits

- Google Calendar and Gmail are read-only.
- Google Drive and Google Sites are not integrated.
- Tasks, follow-ups, deadlines, and the daily plan are front-end examples; they are not currently synced to Google Tasks or persisted in a database.
- The OAuth consent screen may remain in Google testing mode until you complete any review Google requires for broader public use.
