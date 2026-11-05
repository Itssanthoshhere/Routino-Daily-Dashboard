<div align="center">

  # ☀️ Routino

  <p align="center">
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Repository-Routino--Daily--Dashboard-8b6b3f?style=for-the-badge&logo=github&logoColor=white" alt="GitHub repository" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Stack-Next.js_·_TypeScript_·_Tailwind-1f2937?style=for-the-badge" alt="Next.js, TypeScript, and Tailwind CSS" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Google_Access-Gmail_&_Calendar_Read--Only-6f8a61?style=for-the-badge&logo=google&logoColor=white" alt="Read-only Gmail and Google Calendar access" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
    </a>
    <a href="CONTRIBUTING.md">
      <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" />
    </a>
  </p>

  <br />

  <a href="https://routino-daily-dashboard.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🚀_OPEN_LIVE_DASHBOARD-routino--daily--dashboard.vercel.app-a4161a?style=for-the-badge&logo=vercel&logoColor=white" alt="Open Live Dashboard" />
  </a>

  <br /><br />

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
| **Priorities & follow-ups** | Checkable tasks, custom categories, and completion progress | Local storage & server-side database sync |
| **Focus plan & deadlines** | Focus timer with ambient soundscapes (rain, waves, brown noise) | Synthesized Web Audio API & user state |
| **Quick links** | Shortcuts to Calendar, Gmail, LinkedIn, GitHub, and Portfolio | User configurable with custom modal & persistent links |
| **Preferences & Settings** | Routine defaults, focus durations, audio feedback, JSON export/import | Dedicated Preferences modal and DB sync |

## ✨ Features & Capabilities

1. **Responsive daily overview**
   - Layouts adapt for mobile, tablet, and desktop.
   - Clear summary cards surface calendar and inbox counts.
   - A seven-day view starts with the current day and updates its dates automatically.
   - Daily rotating intention quotes with interactive shuffle button.
   - Live location-aware weather widget powered by Open-Meteo.

2. **Google Calendar connection**
   - Uses Google OAuth with the `calendar.readonly` scope.
   - Requests up to 25 events between now and seven days from now.
   - Shows event titles, time, and optional short descriptions.

3. **Gmail unread messages**
   - Uses Google OAuth with the `gmail.readonly` scope.
   - Requests up to eight unread messages, excluding social and promotional categories.
   - Displays sender, subject, date, and snippet; full message bodies are not loaded.
   - Interactive star and read-status tracking.

4. **Tasks & Multi-Device Database Persistence**
   - Check off priorities, create custom tasks, and schedule custom events.
   - Persisted instantly to browser `localStorage` and automatically synchronized with the account database via `/api/user-data`.
   - Supports durable Neon Postgres, Upstash Redis, Vercel KV, or local development file storage for cross-device synchronization.

5. **Focus Timer & Ambient Soundscapes**
   - Customizable focus blocks (25m, 45m, 60m, 90m).
   - Built-in Web Audio synthesis: gentle rain, ocean waves, calming brown noise, and focus white noise.
   - Zero external audio files required.

6. **Comprehensive Preferences Modal**
   - Open via user avatar menu, sidebar bottom card (`···`), or Command Palette (`Cmd+K`).
   - General & Routine tab: focus duration target, audio feedback toggle, clear completed tasks.
   - Database & Sync tab: live account cloud sync status, manual sync trigger, JSON workspace backup & restore.
   - About tab: architecture and privacy information.

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
   https://routino-daily-dashboard.vercel.app/api/auth/callback/google
   ```

6. Set the client ID, client secret, Auth.js secret, and base URL as environment variables. Never commit actual credentials.

## 🔗 Optional LinkedIn Profile Connection

Routino can connect a LinkedIn account to the currently signed-in Google workspace using LinkedIn OpenID Connect. The optional connection requests only `openid`, `profile`, and `email`; it stores the returned name, email, and profile photo in the workspace database. OAuth access tokens are used only on the server for the profile lookup and are not persisted. LinkedIn messages, feed activity, and posting are not integrated.

1. Create an app in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) and enable **Sign In with LinkedIn using OpenID Connect**.
2. Add the redirect URI for each environment you intend to use:

   ```text
   http://localhost:3000/api/linkedin/callback
   https://routino-daily-dashboard.vercel.app/api/linkedin/callback
   ```

3. Set `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and the exact matching `LINKEDIN_REDIRECT_URI` in local `.env.development.local` and the corresponding Vercel environment. Keep the client secret server-side and out of Git.
4. Sign into Routino with Google, open **Preferences → Database & Sync**, and choose **Connect LinkedIn**.

Removing the profile in Routino deletes the saved profile data. To revoke LinkedIn authorization too, remove Routino from the account’s permitted services in LinkedIn settings.

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
| `LINKEDIN_CLIENT_ID` | Optional LinkedIn OAuth app client ID |
| `LINKEDIN_CLIENT_SECRET` | Optional LinkedIn OAuth app client secret |
| `LINKEDIN_REDIRECT_URI` | Exact OAuth callback URL registered in the LinkedIn app |

Generate a strong local secret with:

```bash
openssl rand -base64 32
```

For production, configure the values in the Vercel project’s **Production** environment and set `NEXTAUTH_URL` to the production URL. Add Preview or Development values only for environments where Google sign-in is needed. Redeploy after environment changes.

> Keep `.env.local`, OAuth credentials, and session secrets private. `.gitignore` excludes `.env*` files except `.env.example`.

## 🛠️ Repository Structure

```text
Routino-Daily-Dashboard/
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
   git clone https://github.com/Itssanthoshhere/Routino-Daily-Dashboard.git
   cd Routino-Daily-Dashboard
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

- **Production URL:** [routino-daily-dashboard.vercel.app](https://routino-daily-dashboard.vercel.app)
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
- Tasks, scheduled custom events, and focus targets are stored in browser `localStorage` and automatically synchronized with the account database via `/api/user-data`.
- Google OAuth testing mode may limit access to configured test users until any required Google review is completed.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
- Check out [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the project locally and submit improvements.
- Please review our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🛡️ Security

If you discover a security issue or vulnerability, please read our [Security Policy](SECURITY.md) and report it privately via email to `santhosh02vs@gmail.com`.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## 👤 Author & Maintainer

- **Santhosh VS**
- **GitHub:** [@Itssanthoshhere](https://github.com/Itssanthoshhere)
- **LinkedIn:** [thesanthoshvs](https://www.linkedin.com/in/thesanthoshvs/)
- **Portfolio:** [santhosh-vs-portfolio.vercel.app](https://santhosh-vs-portfolio.vercel.app/)

---
*Open source release · November 2026*
