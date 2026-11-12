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
      <img src="https://img.shields.io/badge/Google_Access-Gmail,_Calendar_&_Drive_Metadata-6f8a61?style=for-the-badge&logo=google&logoColor=white" alt="Read-only Gmail, Calendar, and Drive metadata access" />
    </a>
    <a href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard">
      <img src="https://img.shields.io/badge/Trackers-Google_Sheets_Live_Sync-059669?style=for-the-badge&logo=googlesheets&logoColor=white" alt="Google Sheets Live Sync" />
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
    <em>A calm, responsive workspace for your daily routine, schedule, unread email, personal priorities, zero-knowledge encrypted notes, and physical desk planner. Integrates seamlessly with Google Calendar, Gmail, read-only Google Drive metadata, and Microsoft Outlook (Mail & Calendar via Graph API).</em>
  </p>

  <p align="center">
    <code>nextjs</code> · <code>react</code> · <code>typescript</code> · <code>tailwindcss</code> · <code>dashboard</code> · <code>productivity</code> · <code>daily-planner</code> · <code>desk-sheet</code> · <code>google-calendar</code> · <code>gmail-api</code> · <code>outlook</code> · <code>microsoft-graph</code> · <code>google-keep</code> · <code>zero-knowledge</code> · <code>aes-256-gcm</code> · <code>focus-timer</code> · <code>habit-tracker</code> · <code>open-source</code>
  </p>

</div>

---

## 📌 Executive Summary

**Routino** brings every dimension of a focused day into one calm view: upcoming meetings, unread messages, high-priority tasks, zero-knowledge encrypted notes, deep work focus blocks, micro-habits, and the week ahead. Routino also bridges digital planning with physical focus through its **Daily Desk Sheet**—a single-page printable companion engineered for your actual desk.

Google sign-in uses Auth.js. When the account holder signs in and approves access, the app reads Calendar events and limited Gmail message details. Microsoft Outlook Mail & Calendar can also be connected via Microsoft Graph. Until connected, the page displays clearly identified sample content. The app never writes to or modifies external email or calendars.

---

## 📊 Dashboard Sections & Data Sources

| Section | What it shows | Data source |
| :--- | :--- | :--- |
| **Today's Flow Timeline** | Live daytime progress bar, upcoming meeting markers, and dynamic evening expansion | Google Calendar, Outlook Calendar, or local events |
| **Daily Summary** | Date, daily intention quote, weather forecast, calendar count, unread email count, and focus card | Google / Outlook Calendar, Gmail, Open-Meteo, and live state |
| **Daily Desk Sheet** | Single-page printable companion with Top 3 Non-Negotiables, schedule, hydration, and notes | Local storage, Calendar, and printer-optimized CSS |
| **Today’s Schedule** | Upcoming events with smart "Join Meeting" detection, Travel & Project badges, and time ranges | Google Calendar, Outlook Calendar, or labeled preview events |
| **The Week Ahead** | A rolling seven-day calendar view with category filters and event creation | Google Calendar, Outlook Calendar, or custom events |
| **Worth a Look** | Sender, subject, date, and short snippet for unread messages | Gmail, Outlook Mail, or labeled preview messages |
| **Priorities & Tasks** | Checkable tasks, sub-task checklists, auto-categorization (`Project`, `Travel`, `Work`, `Urgent`), and filters | Local storage & server-side database sync |
| **Notes & Scratchpad** | Google Keep-style notes, checklists, compressed images, priorities, drag-and-drop, and zero-knowledge AES-256 vault | Web Crypto API, Local storage & database sync |
| **Focus Plan & Timer** | Focus timer with ambient soundscapes (Rain, Waves, Brown Noise, Forest, Café) and volume control | Synthesized Web Audio API |
| **Daily Micro-Habits** | Streak tracking, completion history, local date calculation, and hydration tracker | Local storage & database sync |
| **Trackers Quick Snapshot** | Executive pulse widget on Overview: token availability, EB burn rate, budget burn-down, and pipeline alerts | Live Google Sheets sync or local cache |
| **Trackers Hub** | Full multi-tab operations center: Antigravity Tokens, PG Electricity (EB) Meter, Expense Journals, Career Pipelines, Investment Journal, and Hardware Inventory | Google Sheets GViz API (`/api/trackers/sync`) & offline demo seed |
| **Time Audit** | Automated past 90-day time allocation by category (Sleep, Study/Work, Social, Gaming, Routine, Travel) | Google Apps Script sync to Google Sheets |
| **Quick Links** | Shortcuts to Calendar, Gmail, Outlook, GitHub, Portfolio, and Drive | User-configurable with custom modal & persistent links |
| **Preferences & Settings** | Routine defaults, focus durations, audio feedback, JSON export/import, and Outlook connection | Dedicated Preferences modal and DB sync |

---

## ✨ Features & Capabilities

### 1. 🖨️ Printable Daily Desk Sheet Companion
- **Single-page desk planner**: Designed strictly to fit on one physical sheet of paper with zero overflowing pages (`Cmd+P` shortcut or top header button).
- **Physical desk companion layout**: Displays Top 3 Non-Negotiables, additional tasks, today's schedule, daily micro-habits with an interactive 8-glass hydration tracker, and handwriting scratchpad lines.
- **Print isolation engine**: Automatically suppresses background web elements during print jobs to ensure a clean stationery output.

### 2. ⚡ Universal Quick-Capture (`Q` Hotkey)
- **Instant capture modal**: Triggered anywhere across the dashboard by pressing `Q`.
- **Tri-destination capture**: Quickly dump thoughts into a **Task**, **Note**, or **Scratchpad**.
- **Real-time category detection**: Automatically detects and tags tasks as `PROJECT`, `TRAVEL`, `WORK`, or `URGENT` with one-click category chips.

### 3. ⏱️ Today's Flow Visual Timeline
- **Live daytime visual progress bar**: Spans 8:00 AM to 8:00 PM with dynamic extension to midnight for late-night flights or events.
- **Clamped current-time marker**: Pulsing orange indicator showing real-time progress through the day.
- **Interactive event markers**: Color-coded meeting and travel blocks with remaining time count-downs (`Day starts at...` / `In 45m`).

### 4. 🏷️ First-Class Project, Travel & Banana (Yellow) Categorization
- **Universal categorization**: Tasks and calendar events share unified, intelligent categories:
  - 🟣 **`PROJECT`** (`#7c3aed`): Dedicated for build sessions, websites, apps, products, portfolio, coding, and dev sprints.
  - ✈️ **`TRAVEL`** (`#0284c7`): Dedicated for flights (e.g. `6E 2336`), trains, hotel bookings, airport transits, and trips.
  - 🟡 **`BANANA`** (`#eab308`): Dedicated for yellow / banana events (Google Calendar official color `colorId: 5` and custom yellow sub-calendars).
- **Multi-calendar synchronization**: Automatically pulls events across all active Google Calendars (`users/me/calendarList`), ensuring secondary and custom yellow calendars appear with their full fidelity.
- **Smart keyword & color inference**: Automatically recognizes project, travel, and banana-colored tasks/events.
- **Dedicated filter pills**: Filter calendar events specifically by Projects, Travel, or Banana (Yellow).

### 5. ⚠️ Schedule Overlap & Conflict Detection
- **Automated double-booking alerts**: Automatically inspects scheduled start and end times to flag overlapping meetings or tight connections.
- **Amber conflict pills & tags**: Warns users directly inside Today's Flow timeline banner and on conflicting event cards in the 7-day calendar.

### 6. ✈️ Flight & Travel Status Card
- **Automated itinerary detection**: When travel is scheduled for today (e.g. flight numbers like `6E 2336`), surfaces an airport card on the Overview dashboard.
- **Visual flight tracker**: Visual departure and arrival tracks, live departure countdowns, and airline recognition (IndiGo, Air India, Vistara, Emirates, etc.).
- **Interactive packing checklist**: Built-in travel essentials checklist (Boarding pass, ID/Passport, electronics, luggage tags) saved in local storage.

### 7. 📅 Task Due Dates & Scratchpad Line Extractor
- **Due dates with smart filters**: Assign due dates with quick presets (`Today`, `Tomorrow`) and filter tasks by *Due Today* and *Upcoming* with overdue indicators.
- **1-Click line-by-line task conversion**: Convert any single line or all scratchpad lines into prioritized tasks in one click with automated category inference.

### 8. 📹 Context-Aware Meeting & Video Detection
- **Smart video conference detection**: Accurately recognizes genuine Google Meet, Zoom, Microsoft Teams, and Webex links.
- **Direct action button**: Displays a prominent "Join Meeting" button only when a real video link exists; cleanly shows in-person or location details for flights and offline appointments.

### 9. 📝 Google Keep-Style Notes & Zero-Knowledge Vault
- **Live Markdown preview**: Rich text toolbar for bold, italic, code blocks, lists, quotes, and headings.
- **Zero-knowledge client-side encryption**: Master PIN vault using PBKDF2 (100,000 iterations, SHA-256) and AES-256-GCM. Unencrypted note data is never sent to the server.
- **Drag-and-drop reordering**: HTML5 draggable cards with visual insertion indicators.
- **Lightweight image attachments**: Client-side canvas compression (max 1200px, 80% JPEG).

### 10. 🎧 Deep Work Focus Timer & Ambient Audio
- **Customizable focus blocks**: 25m, 45m, 60m, and 90m presets.
- **Built-in ambient soundscapes**: Gentle Rain, Ocean Waves, Calming Brown Noise, White Noise, Forest, and Café ambiance.
- **Volume control & synthesized audio**: Pure Web Audio API synthesis—zero external audio files or network streams needed.

### 11. ⌨️ Comprehensive Keyboard Shortcuts (`?` Hotkey)
- `1` - Switch to Overview tab
- `2` - Switch to Calendar tab
- `3` - Switch to Inbox tab
- `4` - Switch to Tasks Manager
- `5` - Switch to Notes & Scratchpad
- `6` - Switch to Trackers Hub
- `Q` - Universal Quick Capture modal
- `F` - Launch Deep Work Focus Timer
- `T` - Add New Priority Task
- `E` - Schedule Calendar Event
- `H` - Open Micro-Habits Manager
- `Cmd + P` - Open & Print Daily Desk Sheet
- `Cmd + K` - Command Palette / Global Search
- `?` - Toggle Keyboard Shortcuts Sheet
- `Esc` - Close any active modal or popover

### 12. 📊 Trackers Hub: Multi-Stream Personal Operations Center
Routino integrates a high-performance **Trackers Hub** providing unified visibility across utility meters, account tokens, personal budgets, career pipelines, hardware assets, and educational investments:
- **Antigravity Token Management**: Real-time monitoring across 6 Chrome profiles (36 accounts total). Features a one-click **"Copy Next Ready"** button that directly copies the next available token email with instant clipboard feedback, **"Copy All Ready"** bulk copy, profile filter chips, and countdowns.
- **PG Electricity (EB) Meter & 30-Day Forecast**: Tracks sub-meter readings, daily burn velocity (`~1.92 u/day`), automated 50/50 roommate cost splitting, and projected month-end settlement (`₹580` total / `₹290` share). Includes a quick logger modal for new meter readings.
- **Expense & Monthly Budget Journals**: Multi-year financial ledger (`2026`, `2026-fampay`, `2025`, `2024`, `2023`, `PG`) with a dynamic **Monthly Budget Burn-down Progress Bar** against a planned ₹7,500 monthly limit. Color-coded spend threshold warnings (emerald <70%, amber 70-90%, rose >90%), category breakdown pills, real-time search, and **CSV export**.
- **Placement & Career Tracker (Career Hub)**: Tracks 31+ job applications with real-time company/role search, status filter chips (`Applied`, `Shortlisted`, `Interviewing`, `OA Scheduled`), and source filters (`Superset`, `LinkedIn`, etc.). Features a dedicated **Active Career Pipelines** card highlighting urgent assessments and interview rounds (e.g. Digiryte Round 3, Josh Talks Dataset Task).
- **Higher Education & Investment Journal**: Visual lifetime breakdown showcasing **University (95.1%) vs Schooling (4.9%)** of the ₹22.76 Lakh grand total, annual B.Tech fee ledger with 35% merit scholarship deductions, and a **Semester Funding Status Bar** reflecting 100% completed contributions (`₹2,80,000` of `₹2,80,000` Received) across family contributors.
- **Gadgets & Hardware Assets Inventory**: Complete device registry with live search across products and model numbers, brand filter chips (`Apple`, `Dell`, `LG`, `UGREEN`, `DailyObjects`, `Green Soul`), price and date sorting, and dynamic **Lifecycle / Warranty Badges** (`< 1 Yr · Active Warranty`, `1–3 Yrs · Mid Lifecycle`, `3+ Yrs · Mature`, `AppleCare+ Protected`). Accurate pricing including Green Soul Surface 2.0 Desk (₹23,009.00) and Free Furniture Assembly.
- **Time on Earth (Life Stats Odometer)**: Real-time biological age counter (years, months, days, hours, seconds) paired with an interplanetary age odometer for Mercury, Venus, Mars, Jupiter, and Saturn.

### 13. ⚡ Overview Dashboard: "Trackers Quick Snapshot" Widget
An executive summary card placed directly on your main **Overview** home screen:
- **Tokens Pulse**: Shows live ready count (`27 Ready / 9 Cooldown`) with a one-click **"Copy Next Ready"** button.
- **EB Meter**: Latest reading (`323 units`) and daily burn rate (`~1.92 u/day`) with projected bill and 50/50 roommate share.
- **Monthly Budget**: Spend velocity (`₹3,420 / ₹7,500`) with a mini burn-down progress bar and remaining limit.
- **Active Career Pipelines**: Direct alert chips for urgent rounds (`Digiryte Round 3`, `Josh Talks Task`).
- **Direct Navigation**: 1-click "Open Trackers Hub" link.

### 14. 🔄 Zero-Refresh Live Synchronization Engine
- **Tab & Window Focus Sync**: Automatically polls and updates Google Sheets data when switching back to the dashboard or focusing the browser tab—no manual page refresh required.
- **Smart 15s Caching**: Fast client-side responses with background cache invalidation and force-refresh support (`/api/trackers/sync?force=true`).
- **Graceful Offline Fallback**: Runs completely self-contained with rich demo seed data when no external Google Sheet is configured.

### 15. 🎨 Google Calendar Auto-Colorize Engine (`/api/calendar/auto-colorize`)
- Automatically analyzes calendar events within a rolling 74-day window (past 14 days to next 60 days) and applies harmonious Google Calendar colors:
  - 🥗 **Sage** (`#2`): Meals, Lunch, Dinner, Cooking, Food.
  - 🫐 **Blueberry** (`#9`): Daily Routine, Sleep, Fresh up, Social.
  - 🦩 **Flamingo** (`#4`): Games, Gaming, Chess, Valorant, BGMI.
  - 🍌 **Banana** (`#5`): Projects, Work, CS coursework, Dev sprints.
  - 🪨 **Graphite** (`#8`): Typing, Journaling, Notes.
- Throttled batch updates prevent hitting Google API rate limits.

### 16. 📜 Google Apps Script Calendar Sync & Time Audit
- Included script template (`scripts/google-apps-script-calendar-sync.js`) for automated time tracking.
- Syncs the past 90 days of Google Calendar events into a dedicated `Calendar Events` Google Sheet tab with automated categorization, minutes, and hours calculations for retrospective time auditing.

### 17. 🛡️ Production-Grade Open-Source Security & Privacy
- **Zero Secrets in Code**: All API credentials, client secrets, and external spreadsheet IDs are loaded strictly from environment variables (`.env.local`).
- **Zero-Knowledge Encryption**: Notes vault uses Web Crypto API AES-256-GCM + PBKDF2 (100,000 iterations). Plaintext notes and passphrases are never sent to the server.
- **Sanitized Fallback Data**: Open-source repository contains zero private email addresses or confidential family financial records in seed files.
- **HTTP Security Headers**: Configured with `nosniff`, `SAMEORIGIN`, `1; mode=block`, and `strict-origin-when-cross-origin`.

---

## 🔐 Google Access & Security

The app requests basic Google sign-in identity scopes and these read-only scopes:

- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

Google OAuth access and refresh tokens are stored exclusively in the encrypted, HTTP-only Auth.js JWT session cookie. Tokens are never exposed to client-side scripts, placed in local storage, or committed to this repository. Authenticated server routes call Google and return only the calendar events, limited email snippets, and Drive file metadata needed by the page. Drive file metadata is not persisted in Routino's database. Google access-token refreshes happen server-side automatically.

---

## 🧩 Google OAuth Setup

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Gmail API**, **Google Calendar API**, and **Google Drive API**.
3. Configure the Google Auth Platform consent screen. For a personal Google account, choose **External**, complete the required app details, add the account under **Test users** while the app is in testing, and declare the Calendar, Gmail, and Drive metadata scopes listed above.
4. Create an OAuth client ID with application type **Web application**.
5. Add these exact **Authorized redirect URIs**:

   ```text
   http://localhost:3000/api/auth/callback/google
   https://routino-daily-dashboard.vercel.app/api/auth/callback/google
   ```

6. Set the client ID, client secret, Auth.js secret, and base URL as environment variables.

---

## 📬 Microsoft Outlook Integration (Mail & Calendar)

Routino supports connecting personal and work/school Microsoft accounts via the Microsoft Graph API. When connected:
- Upcoming calendar meetings appear in **Daily Schedule** and **Calendar** views with the blue `OUTLOOK` badge.
- Unread inbox messages appear in the **Inbox** view and unread summary.
- Tokens are encrypted and refreshed automatically.

### Setup Instructions
1. Register an app in the [Azure Portal / Microsoft Entra ID](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Choose supported account types: **Accounts in any organizational directory and personal Microsoft accounts**.
3. Under **Authentication**, add a **Web** platform with the redirect URI:
   ```text
   http://localhost:3000/api/outlook/callback
   https://routino-daily-dashboard.vercel.app/api/outlook/callback
   ```
4. Under **Certificates & secrets**, generate a new client secret.
5. In **API permissions**, grant delegated permissions: `User.Read`, `Mail.Read`, `Calendars.Read`, `offline_access`.
6. Set `AZURE_AD_CLIENT_ID` and `AZURE_AD_CLIENT_SECRET` in `.env.local` or Vercel environment.
7. Open **Preferences → Database & Sync** and click **Connect Outlook**.

---

## 📊 Google Sheets Trackers Setup (Optional)

Routino includes a comprehensive **Trackers Hub** (PG Electricity, Multi-Year Expense Journals, Career Pipelines, Gadgets Inventory, Antigravity Tokens, and Investment Journal).

- **Offline Demo Mode**: If no spreadsheet ID is configured, Routino automatically loads rich, self-contained demo seed data—completely functional without any external configuration.
- **Live Google Sheets Sync**: To connect your personal Google Sheet:
  1. Open your spreadsheet in Google Drive.
  2. Set its sharing permissions to **Anyone with the link can view** (enables the read-only Google Visualization API).
  3. Copy the Spreadsheet ID from the browser URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`).
  4. Add the ID to your `.env.local` (or Vercel / deployment environment variables):
     ```bash
     TRACKERS_SPREADSHEET_ID=your_spreadsheet_id_here
     ```
  5. The dashboard will automatically query your sheet via `/api/trackers/sync` and refresh whenever you focus the window or switch tabs.

---

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
| `AZURE_AD_CLIENT_ID` | Optional Microsoft / Azure AD OAuth client ID |
| `AZURE_AD_CLIENT_SECRET` | Optional Microsoft / Azure AD OAuth client secret |
| `AZURE_AD_TENANT_ID` | Optional tenant ID (`common` by default for personal + work) |
| `OUTLOOK_REDIRECT_URI` | Exact OAuth callback URL registered in Azure |
| `TRACKERS_SPREADSHEET_ID` | Optional private Google Sheet ID for real-time trackers sync |
| `DATABASE_URL` | Optional Neon Postgres connection string for cross-device sync |
| `UPSTASH_REDIS_REST_URL` | Optional Upstash Redis endpoint for cloud persistence |
| `UPSTASH_REDIS_REST_TOKEN` | Optional Upstash Redis authentication token |

Generate a strong local secret with:

```bash
openssl rand -base64 32
```

---

## 🛠️ Repository Structure

```text
Routino-Daily-Dashboard/
├── app/
│   ├── actions.ts                 # Auth.js Google sign-in server action
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Auth.js route handlers
│   │   ├── calendar/auto-colorize # Google Calendar smart colorizer endpoint
│   │   ├── dashboard/             # Authenticated Calendar and Gmail data route
│   │   ├── drive/files/           # Read-only Drive recent files route
│   │   ├── outlook/               # Microsoft Graph OAuth connect, callback & data routes
│   │   ├── trackers/sync/         # Google Sheets live trackers synchronization API
│   │   └── user-data/             # Multi-device cloud sync endpoint
│   ├── auth/signout/              # Custom Routino sign-out confirmation page
│   ├── page.tsx                   # Responsive dashboard interface
│   └── globals.css                # Global styles, Tailwind layers & print media rules
├── components/                    # Interactive UI modules, modals, and views
│   ├── DailyDeskSheetModal.tsx    # Single-page printable daily desk planner
│   ├── FlightTravelCard.tsx       # Flight & travel status card with route and packing list
│   ├── QuickCaptureModal.tsx      # Universal quick-capture modal (Q shortcut)
│   ├── QuickScratchpadCard.tsx    # Scratchpad with 1-click line-to-task conversion
│   ├── DayTimelineBar.tsx         # Today's Flow daytime progress bar & event blocks
│   ├── KeyboardShortcutsModal.tsx # Full keyboard shortcuts cheat sheet (? shortcut)
│   ├── FocusTimerModal.tsx        # Deep work timer with ambient audio soundscapes
│   ├── TaskModal.tsx              # Task creation modal with sub-steps and category chips
│   ├── EventModal.tsx             # Calendar event detail modal with smart join links
│   ├── DailyRoutineModal.tsx      # Morning non-negotiables & evening reflections
│   ├── HabitTracker.tsx           # Daily micro-habits tracker & streaks
│   ├── PreferencesModal.tsx       # Cloud sync, Outlook connection, and export/import
│   └── views/                     # Full-page dedicated tab views
│       ├── CalendarView.tsx       # 7-day calendar view with Project & Travel filters
│       ├── TasksView.tsx          # Task management with category filters and sub-steps
│       ├── InboxView.tsx          # Gmail and Outlook unread email manager
│       ├── NotesView.tsx          # Keep-style markdown notes & AES-256 vault
│       ├── TrackersView.tsx       # Comprehensive Trackers Hub (EB, Expenses, Career, Assets, Tokens)
│       └── TimeAuditView.tsx      # Retrospective 90-day time allocation auditor
├── lib/
│   ├── auth.ts                    # Google provider and session callbacks
│   ├── config.ts                  # Centralized typed configuration
│   ├── crypto.ts                  # Zero-knowledge PBKDF2 + AES-256-GCM client-side encryption
│   ├── db.ts                      # Neon Postgres, Upstash Redis & filesystem persistence adapter
│   ├── google.ts                  # Server-side token refresh and Google requests
│   ├── meeting.ts                 # Video URL extraction, category & task inference
│   ├── outlook.ts                 # Microsoft Graph OAuth token exchange & Graph queries
│   ├── sound.ts                   # Web Audio synthesizers for ambient noise & timers
│   └── trackersSync.ts            # Google Sheets GViz parser, caching & offline demo seed
├── scripts/
│   └── google-apps-script-calendar-sync.js  # Google Apps Script for Calendar-to-Sheets time tracking
├── types/
│   ├── dashboard.ts               # Core domain types (Notes, Tasks, Events, Mail)
│   ├── trackers.ts                # Strong typing for all personal trackers
│   └── next-auth.d.ts             # Auth.js token type declarations
├── .env.example                   # Environment variable template
├── package.json
└── README.md
```

---

## 🚀 Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Itssanthoshhere/Routino-Daily-Dashboard.git
   cd Routino-Daily-Dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   cp .env.example .env.local
   ```

3. Fill `.env.local` with your credentials and run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

To create a production build locally:
```bash
npm run build
npm start
```

---

## 🌐 Deployment

The repository is continuously deployed on **Vercel** from `main`.

- **Production URL:** [routino-daily-dashboard.vercel.app](https://routino-daily-dashboard.vercel.app)
- **Framework:** Next.js
- **Build command:** `npm run build`

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
- Check out [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the project locally.
- Please review our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🛡️ Security

If you discover a security issue or vulnerability, please read our [Security Policy](SECURITY.md) and report it privately via email to `santhosh02vs@gmail.com`.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## 👤 Author & Maintainer

- **Santhosh VS**
- **GitHub:** [@Itssanthoshhere](https://github.com/Itssanthoshhere)
- **Portfolio:** [santhosh-vs-portfolio.vercel.app](https://santhosh-vs-portfolio.vercel.app/)

---
*Open source release · November 2026*
