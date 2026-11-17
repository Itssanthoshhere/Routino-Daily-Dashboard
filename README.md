<div align="center">

  <h1>☀️ Routino</h1>

  <p align="center">
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Repository-Routino--Daily--Dashboard-8b6b3f?style=for-the-badge&logo=github&logoColor=white" alt="GitHub repository" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Stack-Next.js_·_TypeScript_·_Tailwind-1f2937?style=for-the-badge" alt="Next.js, TypeScript, and Tailwind CSS" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Google-Gmail,_Calendar_%26_Drive_Metadata-6f8a61?style=for-the-badge&logo=google&logoColor=white" alt="Google Gmail, Calendar, and Drive metadata integrations" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Trackers-Subscriptions_%26_Airtel_History-059669?style=for-the-badge&logo=googlesheets&logoColor=white" alt="Subscription management and Airtel recharge history" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
    </a>
    <a href="CONTRIBUTING.md">
      <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" />
    </a>
  </p>

  <a href="https://routino-daily-dashboard.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🚀_OPEN_LIVE_DASHBOARD-routino--daily--dashboard.vercel.app-a4161a?style=for-the-badge&logo=vercel&logoColor=white" alt="Open Live Dashboard" />
  </a>


  <p align="center">
    <em>A calm, responsive workspace for your schedule, messages, tasks, notes, routines, and focus. Bring Google Calendar, Gmail, Drive file metadata, and Microsoft Outlook together with subscription management and recharge history.</em>
  </p>

  <p align="center">
    <code>nextjs</code> · <code>react</code> · <code>typescript</code> · <code>tailwindcss</code> · <code>dashboard</code> · <code>productivity</code> · <code>daily-planner</code> · <code>desk-sheet</code> · <code>google-calendar</code> · <code>gmail-api</code> · <code>outlook</code> · <code>microsoft-graph</code> · <code>google-keep</code> · <code>subscription-manager</code> · <code>recharge-tracker</code> · <code>zero-knowledge</code> · <code>aes-256-gcm</code> · <code>focus-timer</code> · <code>habit-tracker</code> · <code>open-source</code>
  </p>

</div>

---

## 📌 Overview

**Routino** is an open-source personal dashboard built with Next.js, React, TypeScript, and Tailwind CSS. The public landing page lives at `/`; the daily workspace is at `/dashboard`.

Plan your day, check your messages, manage tasks and routines, keep encrypted notes, and track recurring costs in one workspace. Google and Microsoft integrations are optional; cross-device workspace sync requires a configured durable database.

[Source code](https://github.com/Itssanthoshhere/Routino-Daily-Dashboard) · [Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md)

**Explore:** [Features](#-features) · [Dashboard sections](#-dashboard-sections--data-sources) · [Run locally](#-run-locally) · [Environment](#-environment-variables) · [Trackers](#-subscription-and-airtel-trackers) · [Deployment](#-deploy-to-vercel)

---

> **Privacy for self-hosters:** Connect your own Google and Microsoft applications and use your own database. Do not put credentials, personal data, private spreadsheet IDs, or account-specific examples in source control. The optional Google Sheets tracker adapter currently uses Google Visualization and therefore requires a link-readable spreadsheet. Anyone with its URL may be able to read it; do not use this adapter with confidential sheets. A private Sheets API adapter has not been enabled.

## ✨ Features

- **Daily overview:** summary, schedule, focus timer, priorities, habits, weather, quick links, and a printable Daily Desk Sheet.
- **Calendar:** Google and Outlook events, a today view and week view, calendar health, overlap warnings, user-created events, and optional Google event colorization.
- **Email:** Gmail and Outlook previews, pagination, important-message triage, and reviewable email-to-task creation. Routino does not send or modify email.
- **Google Drive:** recent file metadata and links only (names, types, timestamps). File contents are not read. **Google Sites is not integrated.**
- **Tasks and routines:** tasks, subtasks, habits, links, focus settings, and workspace preferences with per-account database sync when configured. Repeating tasks support daily, weekday, weekly, monthly, and yearly schedules, custom intervals, and an optional end date.
- **Notes:** browser-side encryption with Web Crypto before persistence. Keep your passphrase safe; it is needed to decrypt notes.
- **Focus tools:** timer, synthesized ambient audio, keyboard shortcuts, command palette, and quick capture.
- **Trackers:** Subscription Manager, Airtel Recharge history, budgets, utilities, applications, purchases, investments, and other configured records. Repository preview data is fictional.
- **Time audit:** optional Google Apps Script for categorizing calendar time and exporting a spreadsheet report. Its keyword lists are customizable in the script.
- **Responsive UI:** desktop sidebar, mobile navigation, accessible dialogs, and print layout.

### 🆕 Latest tracker updates

- **Subscription Manager:** add, edit, search, and filter plans, with active subscriptions shown first. Move finished plans from **Needs review** to **Completed** while retaining their payment history.
- **Costs and renewals:** review monthly/yearly projections and a **Total expense** modal with payment breakdowns, separate currencies, and shared-bundle deduplication. Completed plans do not contribute to active projections.
- **Airtel Recharge:** a dedicated tab with recorded history, yearly totals, main-plan and data-top-up filters, payment methods, and successful/failed status. Failed attempts and other-number transactions stay out of totals.
- **Plan context:** distinguish recharge payment dates from activation dates, show the confirmed 84-day validity, and represent included Netflix access and the one-time Hotstar upgrade without adding recurring charges.
- **Saved workspace:** subscription backup/restore and validation preserve unrelated records. Cross-device sync uses the configured database, with account-scoped caches, visible save states, retryable local copies, and stale-write protection.

## 📊 Dashboard sections & data sources

| Section | What it shows | Data source |
| :--- | :--- | :--- |
| **Daily overview** | Schedule, summary, habits, weather, quick links, and Daily Desk Sheet | Connected calendars, weather service, and workspace data |
| **Calendar** | Today/week views, event details, overlap warnings, and custom events | Google Calendar, Outlook Calendar, and workspace events |
| **Inbox** | Message previews, search, pagination, and email-to-task actions | Read-only Gmail and Outlook access |
| **Tasks & routines** | Priorities, subtasks, habits, and focus preferences | Browser storage and per-account database when configured |
| **Notes & scratchpad** | Notes, checklists, and an encrypted notes vault | Browser storage, Web Crypto, and configured workspace database |
| **Focus tools** | Timer and synthesized ambient soundscapes | Browser state and Web Audio API |
| **Google Drive files** | Recent file names, types, timestamps, and links | Drive metadata access; no file contents |
| **Trackers Hub** | Expenses, electricity, career, purchases, investments, and other configured records | Owner-restricted Google Sheets tracker adapter |
| **Subscription Manager** | Active-first plans, Needs review/Completed statuses, renewals, payment history, and total expense | Journal imports and editable account workspace records |
| **Airtel Recharge** | Main plans, data top-ups, yearly totals, and successful/failed transaction history | Journal records and editable account recharge records |
| **Time audit** | Categorized calendar time and spreadsheet reports | Optional Google Apps Script |

---

## 🔌 Integrations and access

| Integration | Access used | Behavior |
| --- | --- | --- |
| Google Calendar | Read events; `calendar.events` is also requested for the explicit auto-colorize feature | Colorization changes event colors only when the signed-in user runs it. |
| Gmail | Read-only message details | Does not send, archive, label, or delete messages. |
| Google Drive | `drive.metadata.readonly` | Lists file metadata and links; does not request file contents. |
| Microsoft Outlook | Delegated `User.Read`, `Mail.Read`, `Calendars.Read` | Read-only profile, mail, and calendar access through Microsoft Graph. |
| Google Sheets trackers | Link-readable Google Visualization endpoint (optional) | The current adapter does not use OAuth Sheets API. Treat the configured sheet as publicly readable to anyone with its URL. |
| Google Sites | None | Not connected or inspected. |

Google access tokens are handled by Auth.js on the server and are not copied into the browser-visible session object. Outlook credentials stored by Routino are encrypted at rest with AES-256-GCM using a key derived from `AUTH_SECRET`/`NEXTAUTH_SECRET`. Configure the same strong secret across instances and keep it private. Workspace data is scoped by the signed-in account. Do not use shared public demo accounts for real data.

## 🚀 Run locally

### Prerequisites

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

## ⚙️ Environment variables

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

## 🔐 Data and storage behavior

- Without a signed-in account, API previews use clearly fictional sample records; they must never fetch a connected user's workspace or tracker source.
- Signing in loads that account’s stored workspace. An empty array is valid saved data; loading does not merge demo tasks or delete/replace the user’s records.
- Tasks, habits, quick links, custom events, notes, and preferences sync through `/api/user-data`; subscriptions and Airtel records use the revision-checked `/api/tracker-workspace` endpoint when a supported database is configured. Browser storage is used for local behavior and fallback.
- Tracker values are fetched separately from the optional configured sheet and restricted to `TRACKERS_OWNER_EMAIL`. The current sheet adapter still requires link-readable access; prefer a private OAuth Sheets API integration before using sensitive tracker data.
- Do not share exported JSON backups: they can contain personal workspace information. Encrypted note ciphertext still should be treated as private data.
- Deleting a database or changing the OAuth encryption secret can make stored information unavailable. Back up data before infrastructure changes.

## ☁️ Deploy to Vercel

1. Import your fork or repository into Vercel.
2. Add environment variables from the table above to the appropriate environments.
3. Configure Google and Microsoft redirect URIs to match the production deployment exactly.
4. Attach and configure a durable database for cross-device workspace sync.
5. Deploy and verify sign-in, data isolation, integrations, and persistence with a test account before using real data.

The Vercel project should not expose deployment environment variables to the client. Preview and production environments should use separate OAuth credentials and databases where practical.

## 🛟 Backups, reminders, and repeating tasks

Signed-in core workspace records refresh every 30 seconds and when the browser regains focus. Pending local edits are merged before applying a refresh, and older reads cannot replace newer edits. Tracker writes retain revision checks; conflicting changes still require review.

**Settings → Data → Database backups** provides manual snapshots, a record-count preview, JSON download, and restore. Neon saves capture the first pre-change state each UTC day. Production also schedules a daily snapshot at **02:30 IST** through `vercel.json`; this requires the server-only `CRON_SECRET` and deployment of this version. The scheduled job retains up to 30 days. Restores require an unchanged workspace version and create a safety snapshot atomically before replacement. Pending local changes must be saved or exported first. Snapshots live in a separate table in the **same Neon database**; download copies for protection outside that database. Other storage providers do not support this backup history.

Expiry reminders appear in Overview and Trackers for the next seven days and up to 30 days overdue. Bundled services linked to the current recharge share its reminder. These are dashboard reminders; they do not send push notifications or assume a renewal payment.

When editing a repeating task, choose **Only this occurrence** or **This and future occurrences**. An occurrence-only edit keeps the original template for the next task. Future edits update open later occurrences in the same series, preserving their scheduled dates and checklist progress; completed history stays intact. Repeat settings control newly generated occurrences.

**Airtel Recharge → Import Airtel transactions** previews pasted Airtel history or CSV/JSON before saving selected successful payments. Enter your number to exclude other numbers. Duplicates, previously removed import records, failed payments, and unsupported statuses are excluded. Choose main plan or data top-up for each imported payment; the saved current plan is not replaced. CSV begins with `date` and supports `number,amount,status,kind,method,time,notes`; JSON accepts an array with the same keys. Dates accept ISO or day/month/year. Same-date, same-amount, same-status transactions are conservatively treated as duplicates and can be entered manually if they are distinct.

## 📬 Live 48-hour Inbox badge

The desktop/mobile Inbox badge counts unread messages from the **last 48 hours**, matching the app's Gmail query (excluding Promotions/Social) and Outlook Inbox messages received in that window. It counts paginated message IDs instead of substituting Gmail's search estimate, a full-mailbox total, or the size of the loaded preview. It refreshes with account sync/focus. Zero is valid; failed/incomplete pagination shows unavailable (`—`), and the badge is hidden when no account is connected. Count requests are bounded to ten 500-ID pages per provider to avoid unbounded API work; reaching the limit reports unavailable rather than a partial total. Filtered previews and separately labelled estimates are unchanged.

## 🗑️ Recovery, payment dates, and backup alerts

**Recycle Bin** in the desktop/mobile sidebar opens a dedicated workspace page at `/dashboard?tab=recycle-bin`. The same recovery controls remain available in **Database & Sync → Recycle Bin**. It retains individual deleted tasks, notes, habits, custom events, quick links, subscriptions, and recharge records until restored. An additive PostgreSQL trigger captures removals inside the same write transaction; old deletions cannot be reconstructed retroactively. The bin is stored within the account workspace and included in database/external snapshots. It requires Neon Postgres; other storage providers keep their existing save behavior but do not provide this database bin. Ordinary local workspace exports still contain active records only.

Restoring one item checks the exact database row version, refuses existing IDs, preserves unrelated records, and refreshes the workspace without discarding local drafts. Sync/export pending edits first. Restoring a recharge payment does not activate an old plan or purchase anything. Journal-only records are unhidden by removing their tombstone. Undo may leave a historical deletion whose ID is already active; the bin refuses to overwrite it. No permanent-purge action is provided.

**Subscriptions → Payments calendar** shows recorded renewal dates, projected monthly/quarterly/yearly dates, and recharge/bundle expiry. Month-end and leap-year days are clamped from the original renewal anchor. Projections are labelled and never recorded as paid. Linked bundle expiries share one Airtel item, with no assumed recharge price. Select a day to view its entries.

Recurring tasks offer **Skip this occurrence**, **Pause series**, and **Resume series**. Skip records a distinct skipped history entry, does not count it as completed work, and generates the next valid occurrence. Pause affects open tasks in the series and prevents new occurrences when they are completed; resume continues the original cadence and skips missed dates. Completed history is preserved. These actions also offer short-lived Undo.

**Monthly report → Search all payment history → Export rows as CSV** downloads every filtered result, including rows beyond the visible page. CSV uses UTF-8, quoted fields, separate currencies, and formula-like text escaping for spreadsheet safety.

The notification bell and Sync health panel flag missing/unreadable backups and backups older than **48 hours**. Automatic health checks are cached per account/browser for six hours, with a 15-minute retry delay after failures. Opening Sync health or selecting Check now updates the alert cache immediately. These are in-app alerts, not email/push messages. Configuration and schedule checks still matter; a recent timestamp alone does not guarantee a future backup will succeed.

`scripts/verify-recycle-bin.cjs` verifies transactional capture, task/recharge/journal restoration, encrypted-note preservation, stale-version rejection and account isolation using disposable database records. The script also verifies the owner's source workspace remains unchanged.

## ↩️ Undo, search, and sync health

Task completion/deletion, subscription completion/deletion, and recharge removal offer an **Undo** toast for 15 seconds. Undo reverses only records touched by that action, keeps unrelated later changes, and refuses to replace records that have changed again. Undo also checks the signed-in account. Completing a repeating task and undoing it removes the generated next occurrence only if that occurrence is still unchanged. Tracker restores use the existing revision-checked save path; offline task reversals stay in the pending-save queue. Undo is a short-lived browser action, not permanent trash or a replacement for backups.

**Monthly report** compares recorded spending with the preceding month, per currency. It shows the amount difference and a percentage only when the previous month has recorded spending. **Search all payment history** filters across months by service/text, date range, currency, and amount, with a paginated result list. Missing records are never treated as proof that no spending occurred.

**Database & Sync → Sync health** shows online status, pending local fields, tracker save/conflict state, the latest database update, and database/external backup timestamps. Local draft counts refresh without network calls. Server/storage checks happen when the panel opens or when requested, avoiding constant Blob list operations. A failed backup check is displayed separately from a database connection failure. Use **Retry pending saves** to retry; conflicts still require review.

Shared `btn-theme`, `btn-theme-primary`, and `btn-theme-quiet` styles keep action hover/focus states consistent across task forms, trackers, reports, notifications, and backup settings. Native inputs/selects use a crimson keyboard-focus outline. Destructive actions retain their distinct styling. Overview task Edit controls use compact 11px text.

## 🔔 Notifications, payment reports, and recovery

The notification bell brings together overdue open tasks, seven-day subscription/recharge expiry reminders, mail and calendar notices. Selecting a reminder opens its tracker or task. Clearing notifications dismisses the current items for the rest of the local day in that browser and account; it does not complete tasks or renew services.

The Tasks board offers **Snooze → Tomorrow / In one week / Choose date**. This changes only the chosen open occurrence, preserves its time and checklist, and keeps the original repeating template for subsequent occurrences.

**Subscriptions → Monthly report** groups recorded subscription and Airtel payments by month and service, with currencies separate. Recharge bundles are counted through the actual Airtel payment, not again for each included service. Invoice history is a fallback when journal payments are absent; failed recharges and payments by others are excluded. The report does not estimate missing payments.

**Airtel Recharge → Record next recharge** saves a paid, currently active renewal, archives the previous plan's complete details, and links only the bundled services explicitly confirmed in the form. It saves recharge and subscription changes together through tracker revision checks. Existing payments remain intact. Future queued plans must be recorded when their validity starts; allowances can then be filled in through Edit plan. The app never initiates an Airtel purchase.

**Database & Sync → Encrypted external backups** stores gzip-compressed, AES-256-GCM encrypted snapshots in a **private Vercel Blob store**, outside Neon. The daily cron also creates and reads back these copies to verify decryption. Each account gets one immutable snapshot per UTC day, capped at 2 MB, with a 30-day Blob TTL. Manual requests verify an existing daily copy instead of replacing it. A snapshot contains database-saved records; pending browser edits must sync first. Failure leaves live data and database snapshots untouched.

Set server-only `BLOB_READ_WRITE_TOKEN` (or a connected `BLOB_STORE_ID` with Vercel OIDC) and a dedicated `WORKSPACE_BACKUP_KEY` containing 32 cryptographically random bytes encoded as base64. Retain this key securely: changing or losing it makes previous encrypted snapshots unreadable. Keep a key copy outside Vercel for account-level disaster recovery. Never use a `NEXT_PUBLIC_` variable for either credential. Download recovery JSON after signing in and import through **Restore Workspace**; encrypted notes still need the notes password. External copies have their own storage, operation and transfer allowances; these limits are shared with other usage and are not a billing guarantee.

Local verification can load ignored `.env.backup.local` using `node scripts/verify-external-backup.cjs`; it creates or verifies the owner's daily copy, tests account isolation, and confirms the source database was unchanged. Never commit environment files or private recovery exports. Deploy the new code before expecting the production cron to write external copies.

## 💳 Subscription and Airtel trackers

Trackers includes a Subscription Manager and a separate Airtel Recharge history view. Subscriptions support editing, status filters, active-first ordering, renewal dates, recorded payment history, and a total-expense dialog. Plans marked **Needs review** can be marked **Completed**; completed plans retain their payment history and stay out of active spending projections. Workspace backups include subscriptions and Airtel records; older backups and API writes that omit subscriptions leave the saved records intact.

Journal imports detect named service payments and infer a monthly cycle only from repeated payments. An imported start date is the first recorded payment, not a verified signup date. Expense totals keep currencies separate, count invoice/journal representations of the same payment once, and count shared recharge bundles once. Airtel history separates main plans from small top-ups, excludes failed attempts from totals, and keeps payment dates separate from activation dates without modifying journal rows.

Subscription and recharge records are editable account data, not personal constants in the browser bundle. The tracker API validates records and uses revision checks to reject stale device writes. Local copies are account-scoped; pending changes retry when connected, and conflicts offer download/reload actions. Other workspace saves patch submitted fields, preserving unrelated tracker records. Neon task writes merge touched IDs atomically so two devices can add tasks without losing one another’s changes.

Recharge plans include separate payment/validity dates, allowances, and available/used benefits. A subscription may link to a saved recharge; expiry moves the displayed active bundle to **Needs review** without assuming paid renewal. Backup/restore includes Airtel records alongside subscriptions. `scripts/migrate-tracker-records.cjs` imports a private export with a pre-migration backup and a compare-and-swap guard. Private exports stay in the ignored `.data/` directory.

**Current limitations:** Airtel is not automatically connected; future recharge details must be edited or imported. The linked sheet still provides journal rows. Cross-device sync requires the same signed-in account and a configured durable database. Browser/filesystem storage alone cannot provide cross-device sync. A concurrent conflicting tracker edit needs review rather than silently overwriting the other device.

Run `node scripts/verify-tracker-database.cjs` against a configured database to check independent reads, conflict protection, concurrent task saves, and preservation of a backed-up owner workspace. Its write tests use a temporary account that is removed afterward.

Run the tracker regression checks with `node scripts/test-trackers.cjs`, type-check with `npx tsc --noEmit`, and build with `npm run build`. If the environment blocks Turbopack's local process, `npx next build --webpack` verifies the production build through Webpack.

## 🔁 Repeating tasks

Use **Edit** on an existing task to change its details, due date, priority, checklist, or repeat settings while retaining its identity and completion state. Choose **Repeat** when creating a task, or use the repeat selector on an active task. Daily, weekday, weekly, monthly, and yearly schedules are supported; the create form also accepts an interval and optional end date. A repeating task needs a due date.

Completing an occurrence keeps it in history and creates one next occurrence with reset checklist steps. Missed dates are skipped to the next scheduled date after today. Monthly schedules retain their original day where possible (for example, 31 Jan → 28 Feb → 31 Mar). Choosing **Does not repeat** on the active occurrence stops future generation. Recurrence does not create an operating-system notification or an external reminder.

## 🗂️ Project structure

```text
app/                  Next.js pages, server actions, and API routes
components/           Dashboard UI, modals, and views
lib/                  Auth, database, Google/Microsoft APIs, and utilities
scripts/              Google Apps Script utilities and tracker regression checks
types/                Shared TypeScript models
public/               Static assets
```

## 🛠️ Development

```bash
npm run dev       # start local development server
npm run lint      # TypeScript check
npm run build     # production build
```

Please use fictional data in screenshots, issues, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Routino is distributed under the [MIT License](LICENSE).
