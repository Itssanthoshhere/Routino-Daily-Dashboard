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
- `Q` - Universal Quick Capture modal
- `F` - Launch Deep Work Focus Timer
- `T` - Add New Priority Task
- `E` - Schedule Calendar Event
- `H` - Open Micro-Habits Manager
- `Cmd + P` - Open & Print Daily Desk Sheet
- `Cmd + K` - Command Palette / Global Search
- `?` - Toggle Keyboard Shortcuts Sheet
- `Esc` - Close any active modal or popover

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
│   │   ├── dashboard/             # Authenticated Calendar and Gmail data route
│   │   ├── drive/files/           # Read-only Drive recent files route
│   │   ├── outlook/               # Microsoft Graph OAuth connect, callback & data routes
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
│       └── NotesView.tsx          # Keep-style markdown notes & AES-256 vault
├── lib/
│   ├── auth.ts                    # Google provider and session callbacks
│   ├── config.ts                  # Centralized typed configuration
│   ├── crypto.ts                  # Zero-knowledge PBKDF2 + AES-256-GCM client-side encryption
│   ├── database.ts                # Neon Postgres, Upstash Redis & KV persistence adapter
│   ├── google.ts                  # Server-side token refresh and Google requests
│   ├── meeting.ts                 # Video URL extraction, category & task inference
│   └── sound.ts                   # Web Audio synthesizers for ambient noise & timers
├── types/
│   ├── dashboard.ts               # Core domain types (Notes, Tasks, Events, Mail)
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
