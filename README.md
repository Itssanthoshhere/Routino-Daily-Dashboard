<div align="center">

  # ☀️ Routino

  <p align="center">
    <a href="https://daily-dashboard-tau-five.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/🟢_LIVE_DASHBOARD-daily--dashboard--tau--five.vercel.app-315b49?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Daily Dashboard" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Daily-Dashboard">
      <img src="https://img.shields.io/badge/Repository-Private-8b6b3f?style=for-the-badge&logo=github&logoColor=white" alt="Private GitHub repository" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Daily-Dashboard">
      <img src="https://img.shields.io/badge/Stack-Next.js_·_TypeScript_·_Tailwind-1f2937?style=for-the-badge" alt="Next.js, TypeScript, and Tailwind CSS" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Daily-Dashboard">
      <img src="https://img.shields.io/badge/Google_Access-Gmail_&_Calendar_Read--Only-6f8a61?style=for-the-badge&logo=google&logoColor=white" alt="Read-only Gmail and Google Calendar access" />
    </a>
  </p>

  <h3>
    🌐 <strong>Live Dashboard:</strong>
    <a href="https://daily-dashboard-tau-five.vercel.app" target="_blank">
      daily-dashboard-tau-five.vercel.app
    </a>
  </h3>

  <p align="center">
    <em>A calm, responsive workspace for your daily routine, schedule, unread email, personal priorities, and the week ahead. Google Calendar and Gmail data are fetched server-side after sign-in. Google Drive and Google Sites are not integrated.</em>
  </p>

</div>

---

## 📌 Executive Summary

**Routino** brings the parts of a busy day into one calm view: upcoming meetings, unread messages, tasks, focus time, deadlines, and frequently used links. The responsive interface is built with Next.js, TypeScript, and Tailwind CSS, and is deployed on Vercel.

Google sign-in uses Auth.js. When the account holder signs in and approves access, the app reads Calendar events and limited Gmail message details. Until then, the page shows clearly identified sample content. The app never writes to Gmail or Calendar.

## 📊 Dashboard Sections & Data Sources

| Section | What it shows | Data source |
| :--- | :--- | :--- |
| **Daily summary** | Date, today’s event count, unread email count, and focus-time card | Calendar and Gmail after sign-in; some sample summary content remains illustrative |
| **Today’s schedule** | Upcoming events with start and end times | Google Calendar or labeled preview events |
| **The week ahead** | A rolling seven-day calendar view | Google Calendar or labeled preview events |
| **Worth a look** | Sender, subject, date, and short snippet for unread messages | Gmail or labeled preview messages |
| **Priorities & follow-ups** | Checkable tasks and completion progress | Sample tasks held in browser memory; not synced or persisted |
| **Focus plan & deadlines** | Focus blocks, breaks, and deadline examples | Illustrative dashboard content |
| **Quick links** | Shortcuts to Calendar and Gmail | Google services; Drive and Sites are marked unavailable |

## ✨ Features & Capabilities

1. **Responsive daily overview**
   - Layouts adapt for mobile, tablet, and desktop.
   - Clear summary cards surface calendar and inbox counts.
   - A seven-day view starts with the current day and updates its dates automatically.

2. **Google Calendar connection**
   - Uses Google OAuth with the `calendar.readonly` scope.
   - Requests up to 25 events between now and seven days from now.
   - Shows event titles, time, and optional short descriptions.

3. **Gmail unread messages**
   - Uses Google OAuth with the `gmail.readonly` scope.
   - Requests up to eight unread messages, excluding social and promotional categories.
   - Displays sender, subject, date, and snippet; full message bodies are not loaded.

4. **Tasks and daily planning**
   - Check off priorities and see completion progress.
   - Sample tasks, focus blocks, follow-ups, and deadlines are examples only. They currently remain in browser memory and are not connected to Google Tasks or a database.

5. **Preview mode**
   - Shows sample data before Google is connected.
   - Labels preview information so it is not mistaken for real account data.

## 🔐 Google Access & Security

The app requests basic Google sign-in identity scopes and these read-only scopes:

- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/gmail.readonly`

OAuth access and refresh tokens are kept in the encrypted, HTTP-only Auth.js JWT session cookie. Tokens are not exposed through the browser-visible session, placed in local storage, or committed to this repository. The authenticated `/api/dashboard` route calls Google from the server and returns only the event data and limited email metadata needed by the page. The app does not persist OAuth tokens or dashboard data in a database. Access-token refreshes happen server-side.

Google’s OAuth consent screen may display an unverified-app warning while the app is in testing. Add the intended account as a test user in Google Cloud Console. The account holder must sign in and approve the requested scopes before personal Calendar or Gmail data can appear.

**Not integrated:** Google Drive and Google Sites.

## 🧩 Google OAuth Setup

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Gmail API** and **Google Calendar API**.
3. Configure the Google Auth Platform consent screen. For a personal Google account, choose **External**, complete the required app details, and add the account under **Test users** while the app is in testing.
4. Create an OAuth client ID with application type **Web application**.
5. Add these exact **Authorized redirect URIs**:

   ```text
   http://localhost:3000/api/auth/callback/google
   https://daily-dashboard-tau-five.vercel.app/api/auth/callback/google
   ```

6. Set the client ID, client secret, Auth.js secret, and base URL as environment variables. Never commit actual credentials.

## ⚙️ Environment Variables

Copy the example file for local development:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth web client secret |
| `NEXTAUTH_SECRET` | Secret used to protect Auth.js session data |
| `NEXTAUTH_URL` | App base URL, such as `http://localhost:3000` locally |

Generate a strong local secret with:

```bash
openssl rand -base64 32
```

For production, configure the values in the Vercel project’s **Production** environment and set `NEXTAUTH_URL` to the production URL. Add Preview or Development values only for environments where Google sign-in is needed. Redeploy after environment changes.

> Keep `.env.local`, OAuth credentials, and session secrets private. `.gitignore` excludes `.env*` files except `.env.example`.

## 🛠️ Repository Structure

```text
Daily-Dashboard/
├── app/
│   ├── actions.ts                 # Auth.js Google sign-in server action
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Auth.js route handlers
│   │   └── dashboard/             # Authenticated Calendar and Gmail data route
│   ├── auth/
│   │   └── signout/               # Custom Routino sign-out confirmation page
│   ├── page.tsx                   # Responsive dashboard interface
│   └── globals.css                # Global styles and Tailwind layers
├── components/                    # Interactive UI modules, modals, and tabs
├── lib/
│   ├── auth.ts                    # Google provider and session callbacks
│   ├── config.ts                  # Centralized typed configuration
│   ├── google.ts                  # Server-side token refresh and Google requests
│   └── sound.ts                   # Web Audio synthesizers for timer feedback
├── types/
│   ├── dashboard.ts               # Core domain types (Tasks, Events, Mail)
│   └── next-auth.d.ts             # Auth.js token type declarations
├── .env.example                   # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Running Locally

Requirements: Node.js and npm compatible with the versions used by this project. Google credentials are needed for sign-in; without them, the dashboard remains in preview mode.

1. Clone the repository and enter its folder:

   ```bash
   git clone https://github.com/Itssanthoshhere/Daily-Dashboard.git
   cd Daily-Dashboard
   ```

2. Install dependencies and create your local environment file:

   ```bash
   npm install
   cp .env.example .env.local
   ```

3. Fill `.env.local` with your Google OAuth values and a generated secret, then start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

To create and run a production build locally:

```bash
npm run build
npm start
```

## 🌐 Deployment

The GitHub repository is connected to Vercel for production deployment from `main`.

- **Production URL:** [daily-dashboard-tau-five.vercel.app](https://daily-dashboard-tau-five.vercel.app)
- **Framework:** Next.js
- **Build command:** `npm run build`
- **Environment:** Set Google OAuth values and `NEXTAUTH_URL` in the Vercel project settings; do not add secrets to GitHub.

For a manual deployment with the Vercel CLI:

```bash
vercel --prod
```

## 🧭 Current Integration Limits

- Gmail and Google Calendar are read-only.
- Google Drive and Google Sites are not integrated.
- Tasks, follow-ups, focus blocks, and deadlines are held in browser localStorage; not synced with Google Tasks.
- Google OAuth testing mode may limit access to configured test users until any required Google review is completed.

---

## 👤 Project

- **Repository:** [Itssanthoshhere/Daily-Dashboard](https://github.com/Itssanthoshhere/Daily-Dashboard)
- **Deployment:** [daily-dashboard-tau-five.vercel.app](https://daily-dashboard-tau-five.vercel.app)
- **Stack:** Next.js · TypeScript · Tailwind CSS · Auth.js · Google APIs · Vercel

---
*Last updated: 5 November 2026*
