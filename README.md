# Routino

Routino is an open-source personal dashboard for bringing a day’s schedule, messages, tasks, notes, routines, and focus tools into one workspace. It is built with Next.js, React, TypeScript, and Tailwind CSS.

[Live app](https://routino-daily-dashboard.vercel.app) · [Source code](https://github.com/Itssanthoshhere/Routino-Daily-Dashboard) · [Security policy](SECURITY.md)

> **Privacy for self-hosters:** Connect your own Google and Microsoft applications and use your own database. Do not put credentials, personal data, private spreadsheet IDs, or account-specific examples in source control. The optional Google Sheets tracker adapter currently uses Google Visualization and therefore requires a link-readable spreadsheet. Anyone with its URL may be able to read it; do not use this adapter with confidential sheets. A private Sheets API adapter has not been enabled.

## Features

- **Daily overview:** summary, schedule, focus timer, priorities, habits, weather, quick links, and a printable Daily Desk Sheet.
- **Calendar:** Google and Outlook events, a today view and week view, calendar health, overlap warnings, user-created events, and optional Google event colorization.
- **Email:** Gmail and Outlook previews, pagination, important-message triage, and reviewable email-to-task creation. Routino does not send or modify email.
- **Google Drive:** recent file metadata and links only (names, types, timestamps). File contents are not read. **Google Sites is not integrated.**
- **Tasks and routines:** tasks, subtasks, habits, links, focus settings, and workspace preferences with per-account database sync when configured.
- **Notes:** browser-side encryption with Web Crypto before persistence. Keep your passphrase safe; it is needed to decrypt notes.
- **Focus tools:** timer, synthesized ambient audio, keyboard shortcuts, command palette, and quick capture.
- **Trackers:** optional tracker views for budgets, utilities, applications, purchases, investments, and other user-configured records. Repository preview data is fictional.
- **Time audit:** optional Google Apps Script for categorizing calendar time and exporting a spreadsheet report. Its keyword lists are customizable in the script.
- **Responsive UI:** desktop sidebar, mobile navigation, accessible dialogs, and print layout.

## Integrations and access

| Integration | Access used | Behavior |
| --- | --- | --- |
| Google Calendar | Read events; `calendar.events` is also requested for the explicit auto-colorize feature | Colorization changes event colors only when the signed-in user runs it. |
| Gmail | Read-only message details | Does not send, archive, label, or delete messages. |
| Google Drive | `drive.metadata.readonly` | Lists file metadata and links; does not request file contents. |
| Microsoft Outlook | Delegated `User.Read`, `Mail.Read`, `Calendars.Read` | Read-only profile, mail, and calendar access through Microsoft Graph. |
| Google Sheets trackers | Link-readable Google Visualization endpoint (optional) | The current adapter does not use OAuth Sheets API. Treat the configured sheet as publicly readable to anyone with its URL. |
| Google Sites | None | Not connected or inspected. |

Google access tokens are handled by Auth.js on the server and are not copied into the browser-visible session object. Outlook credentials stored by Routino are encrypted at rest with AES-256-GCM using a key derived from `AUTH_SECRET`/`NEXTAUTH_SECRET`. Configure the same strong secret across instances and keep it private. Workspace data is scoped by the signed-in account. Do not use shared public demo accounts for real data.

## Run locally

### Requirements

- Node.js 20 or newer and npm
- A Google OAuth client for Google integrations
- Optional Microsoft Entra app registration for Outlook
- Optional Neon Postgres or Redis-compatible storage for cross-device workspace sync

### Install

```bash
git clone https://github.com/Itssanthoshhere/Routino-Daily-Dashboard.git
cd Routino-Daily-Dashboard
npm install
cp .env.example .env.local
```

Set the required values in `.env.local`; do not commit that file. Generate Auth.js secrets with `openssl rand -base64 32` and use a separate strong value for each environment. Add these Google callback URLs to your OAuth web client:

```text
http://localhost:3000/api/auth/callback/google
https://<your-production-domain>/api/auth/callback/google
```

Enable Gmail API, Google Calendar API, and Google Drive API in Google Cloud. Configure the consent screen and authorized test users as needed. For Outlook, register the redirect URI `/api/outlook/callback` on your own deployment and configure the Microsoft Graph delegated permissions listed above.

```bash
npm run dev
```

Open `http://localhost:3000`. The public landing page is `/`; the signed-in workspace is `/dashboard`.

## Environment variables

See [.env.example](.env.example) for the full template. Main server-side settings:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client. Server-side only. |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | Auth.js session signing/encryption and Outlook token encryption. Use a strong secret. |
| `NEXTAUTH_URL` | Canonical application URL for the environment. |
| `DATABASE_URL` | Optional Neon Postgres workspace storage. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional Redis-compatible workspace storage. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Alternative Vercel KV credentials. |
| `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` | Optional Outlook OAuth configuration. |
| `TRACKERS_SPREADSHEET_ID` | Optional Google Sheets tracker source. This sheet must be link-readable with the current adapter; do not use confidential data. |
| `TRACKERS_OWNER_EMAIL` | Exact account allowed to access the configured tracker source. Required for signed-in tracker access; requests fail closed when missing or mismatched. |

Never use `NEXT_PUBLIC_` for secrets, OAuth tokens, database credentials, or private source identifiers. Only variables intentionally meant for browser use should use that prefix.

## Data and storage behavior

- Without a signed-in account, API previews use clearly fictional sample records; they must never fetch a connected user's workspace or tracker source.
- Signing in loads that account’s stored workspace. An empty array is valid saved data; loading does not merge demo tasks or delete/replace the user’s records.
- Tasks, habits, quick links, custom events, notes, and preferences sync through `/api/user-data` when a supported database is configured. Browser storage is used for local behavior and fallback.
- Tracker values are fetched separately from the optional configured sheet and restricted to `TRACKERS_OWNER_EMAIL`. The current sheet adapter still requires link-readable access; prefer a private OAuth Sheets API integration before using sensitive tracker data.
- Do not share exported JSON backups: they can contain personal workspace information. Encrypted note ciphertext still should be treated as private data.
- Deleting a database or changing the OAuth encryption secret can make stored information unavailable. Back up data before infrastructure changes.

## Deploy to Vercel

1. Import your fork or repository into Vercel.
2. Add environment variables from the table above to the appropriate environments.
3. Configure Google and Microsoft redirect URIs to match the production deployment exactly.
4. Attach and configure a durable database for cross-device workspace sync.
5. Deploy and verify sign-in, data isolation, integrations, and persistence with a test account before using real data.

The Vercel project should not expose deployment environment variables to the client. Preview and production environments should use separate OAuth credentials and databases where practical.

## Project structure

```text
app/                  Next.js pages, server actions, and API routes
components/           Dashboard UI, modals, and views
lib/                  Auth, database, Google/Microsoft APIs, and utilities
scripts/              Optional Google Apps Script utilities
types/                Shared TypeScript models
public/               Static assets
```

## Development

```bash
npm run dev       # start local development server
npm run lint      # TypeScript check
npm run build     # production build
```

Please use fictional data in screenshots, issues, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Routino is distributed under the [MIT License](LICENSE).
