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

Plan your day, check messages, manage tasks and routines, keep encrypted notes, and track recurring costs. Google and Microsoft integrations are optional. Cross-device workspace sync requires the same signed-in account and a configured durable database.

[Source code](https://github.com/Itssanthoshhere/Routino-Daily-Dashboard) · [Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md)

**Explore:** [Calendar & focus](#-focus-scheduling-and-meeting-notes) · [Notes](#-notes-and-linked-records) · [Features](#-features) · [Tasks](#-tasks-and-repeating-schedules) · [Trackers](#-subscriptions-recharges-and-payment-reports) · [Recovery](#-recycle-bin-and-undo) · [Run locally](#-run-locally) · [Environment](#-environment-variables) · [Backups](#-sync-backups-and-health) · [Deployment](#-deploy-to-vercel)

> **Privacy for self-hosters:** Connect your own OAuth applications and database. Never commit credentials, personal records, private spreadsheet IDs, or recovery exports. The optional Google Sheets adapter uses Google Visualization and requires a link-readable spreadsheet. Anyone with its URL may be able to read it; do not use confidential sheets. A private OAuth Sheets API adapter is not enabled.

## ✨ Features

| Area | What it includes | Data source |
| --- | --- | --- |
| **Daily overview** | Schedule, priorities, habits, weather, focus timer, quick links, and printable Daily Desk Sheet | Connected services and account workspace |
| **Calendar** | Today/week views, overlap warnings, focus-slot finder, Google focus scheduling/edit/delete with Undo, meeting-note creation, and colorization | Google Calendar, read-only Outlook, and saved custom events |
| **Inbox** | Mail previews, pagination, triage, email-to-task review, and a live unread badge for the last 48 hours | Read-only Gmail and Outlook |
| **Tasks and routines** | Editable tasks, subtasks, repeating schedules, snooze, skip, pause/resume, and activity history | Account workspace |
| **Notes** | Browser-side encryption with Web Crypto before persistence | Encrypted account records; your passphrase is required |
| **Focus tools** | Timer, synthesized ambient audio, focus-slot finder, keyboard shortcuts, command palette, and voice Quick Capture | Workspace settings, browser speech support, and Google Calendar |
| **Drive files** | Recent file names, types, timestamps, and links | Google Drive metadata only; no file contents |
| **Subscription Manager** | Active-first plans, status filters, payment history, total expense, payment calendar, and monthly reports | Journal imports and editable account records |
| **Airtel Recharge** | Separate recharge history, main plans/top-ups, current validity, allowances, and selected benefits | Journal records and manual/imported account records |
| **Other trackers** | Budgets, utilities, investments, applications, purchases, assets, and configured metrics | Optional linked spreadsheet |
| **Recycle Bin** | Individual recovery of deleted workspace and tracker records | Neon Postgres account workspace |
| **Database & Sync** | Save status, pending edits, conflict handling, backup history, recovery, and health checks | Configured storage and optional private Vercel Blob |
| **Time audit** | Calendar categorization and spreadsheet reports | Optional Google Apps Script |

The responsive interface includes desktop/mobile navigation, accessible dialogs, print layouts, and consistent crimson hover and keyboard-focus states. Preview records are fictional.

**Phone and iPad layouts:** Below 1280px, the compact header keeps navigation, search and Quick Capture visible; **Workspace tools** contains Undo history, Reminders, Sync Center, notifications and profile controls. The sidebar becomes a drawer, tracker navigation uses a labelled selector, and renewals/yearly journal summaries expand on demand. At 1280px and above, desktop navigation remains visible. Phone expense transactions use readable cards; tablet/desktop use the table with the same filters and pagination. Phone task actions stack below the task content, with horizontally scrollable view/filter controls. See [mobile review and verification coverage](docs/mobile-review.md) for viewport checks and remaining physical-device verification.

**Return to your place:** Reopening `/dashboard` remembers the last section, tracker and vertical scroll position on this device, separately for each account. Explicit section links, anchors, setup flows and Capture/Focus shortcuts take priority. Restoration briefly retries while asynchronous content mounts and stops immediately when you touch, scroll, type or use browser history. This saves navigation metadata locally; it does not save open dialogs, unsaved forms, tracker filters or additional journal rows loaded with Show More. Storage restrictions or changed page content can limit restoration. Existing open-app resume/sync behavior remains in place.

Preferences → General offers **Accessible display** scaling (Standard, Large 112.5%, Larger 125%), reduced motion, and stronger contrast. **Customise Overview** hides/shows and reorders 16 widgets without removing their data. Display/layout settings use account sync, conflict review, export/import, and recovery.

## 📅 Focus scheduling and meeting notes

**Find focus time** scans loaded Google, Outlook, and custom events for 15-, 25-, 30-, 45-, 60-, or 90-minute openings over the next seven days (local 08:00–20:00 by default). All-day events and overlaps block slots. Connected calendars are rechecked before booking; failed checks stop creation. Suggestions do not reserve availability, and concurrent calendar edits can still conflict.

**Focus planning:** Configure working days/hours and 0–120 minute breaks/travel buffers in **Find focus time**. Optionally restrict suggestions to overdue tasks, choose a task/slot, then approve booking. Buffers are rechecked before creation; task deadlines and recurrence stay unchanged.

**Completed focus history:** Choose a task before starting the timer. Finished work sessions retain task, date, and duration; breaks and stopped/reset sessions are excluded. Running timers use wall-clock time in background tabs; closing pauses them. History/preferences use account-scoped offline storage, revision-checked sync, and export/import.

Task focus events are created in your primary Google Calendar with a linked workspace copy. Reschedule/delete from Details; guarded **Undo** skips newer edits and recreates deleted future events with a new link. Outlook remains read-only.

**Create Meeting Note** prepares a Routino template with available event details and sections for notes, decisions, and actions. Existing linked notes reopen; unfinished checklists in unencrypted notes can become tasks with duplicate protection. This is not an automatic transcript, AI summary, or Google Keep write.

**Meeting follow-ups** on Overview collects unfinished checklist actions from unencrypted meeting notes. Open the note, open its linked task, or convert an action into a task. Completed/skipped linked tasks leave the follow-up list; locked note content is not exposed.

**Jump to date** opens a day and its seven-day strip; **Today** returns to now. Calendar remembers date, day/week view, and category per account on this device, but not search text.

**Calendar search** combines titles, dates, and categories across loaded events, beyond the selected week. Results open event Details; clearing search restores the calendar. Unloaded history is not searched.

**Colour events** provides ordered keyword rules, Google colours, whole-word/contains matching, exclusions, a **Colour guide**, and a read-only title tester. Preview a local **From / Through** range up to two years, then **Apply selected & save rules**. All-day, excluded, unmatched, and already-correct events are skipped. **Keep this colour** protects an event without recolouring it. Apply rechecks event versions and changes only Google `colorId`; Outlook/custom events remain unchanged.

**History & Undo** keeps the latest 10 colour batches and skips events changed since Apply. **Recover interrupted operation** releases stalled locks after two minutes; uncertain writes require a fresh preview. Workspace backups preserve colour settings/history but do not roll back Google Calendar colours.

## 📝 Notes and linked records

**Vault auto-lock:** Choose Off, 1, 5 (default), or 15 minutes in Notes. Backgrounding also locks an enabled vault after saving the open encrypted note and preserving an encrypted composer draft locally. A preservation failure leaves the draft open with an error. Auto-lock does not change your PIN.

**Note templates & linked records:** Meeting, Journal, and Project templates create separate notes without replacing drafts. **Linked records** connects ordinary notes to tasks, meetings, subscriptions, and gadgets, with **Linked notes** backlinks. Removed records retain labels; encrypted notes exclude link indexing and lose plain-text link metadata when locked.

## 🎙️ Voice capture and reading lists

Open **Q → microphone** to dictate into Task, Note, or Scratchpad, then review/edit the transcript before saving. Native browser speech recognition requires microphone permission and browser support. It may process audio through an online browser speech service; offline or entirely local recognition is not guaranteed. No separate speech API key is configured.

**Tech radar · Read later** complements Quick Links with a developer-link reading list, read/unread state, title/URL editing, and confirmed deletion. Removing an item also removes its shared Quick Link. Reading-time estimates use optional article text supplied through Edit (200 words/minute); the app does not fetch article contents. Read-state updates use the existing workspace sync path. Read Later supports tags, favourites, search, and Unread/Reading/Read filters, synced with Quick links without rewriting existing records.

**Quick Links → Manage** supports title/URL edits, pinning, moving links up/down, and confirmed removal. Pinned links appear first; saved order and removals persist through workspace sync. Read Later shares the same link records.

## 🌱 Habits and routines

Habits support optional Monday–Sunday targets of 1–7 days per week, inclusive pause periods, and dated completion notes. Paused days retain existing history but do not earn streak credit; fully paused weeks preserve weekly streak continuity. Notes never create completions. Resume tracking from the habit card or edit pause dates in the habit editor.

Daily habits retain their completion history and streaks. Optional elapsed-day counters use a saved start date or last completion date and refresh at local midnight and when the tab resumes. Elapsed days do not fabricate daily completions or increase the streak; tick each day to extend a daily streak.

**Edit habit → Completion history** lets you select or correct past dates, navigate calendar months, and preview the recalculated consecutive-day streak before saving. Future completion dates are disabled. Cancel closes the editor without applying draft history.

## 🔎 Global workspace search

Use `⌘ K` / `Ctrl K` or the search button to find tasks (including checklist text), calendar events, unlocked notes, subscriptions, and recharge history. Search subscriptions by service, price, currency, status, or renewal date; recharges by date, amount, notes, or payment method. Results open the relevant workspace view. Locked notes and ciphertext are excluded. Search runs locally over loaded account data, without a separate external index. Refine broad queries to narrow capped result lists.

**Advanced workspace search:** Open universal search and choose **Filters** to combine record type, inclusive date range, tag/category, exact status, and attachment/reference presence. Dates use task due dates, event starts, note updates, subscription renewals, or recharge payments. Locked notes remain excluded. Filters do not edit saved records.

## ⌨️ Keyboard shortcuts

Open **Shortcuts** from the sidebar/user menu, or **Preferences → Shortcuts**. Both in-app guides share the same shortcut list.

| Key | Action |
| --- | --- |
| `1`–`6` | Overview, Calendar, Inbox, Tasks, Notes, Trackers |
| `Q` | Quick capture a task, note, or scratchpad entry |
| `F` | Open focus timer |
| `T` | Create a task, including repeat options |
| `E` | Create a calendar event |
| `H` | Manage habits |
| `⌘ K` / `Ctrl K` | Toggle command palette/search |
| `?` | Toggle shortcut guide |
| `Esc` | Dismiss supported dialogs/popovers |

Single-key shortcuts apply outside text fields. Use the sidebar for Recycle Bin and the tracker controls for payment reports and renewal actions.

## 🔁 Tasks and repeating schedules

**Task organisation:** Undated Quick Capture and quick-add entries default to the **Task inbox**; assigning a date moves them out. Existing tasks stay unchanged, and repeating tasks require a deadline. Use up to 20 **custom tags**, project groups, and milestones to search/filter tasks and track progress. Project tasks show a derived `#project` tag. **Select tasks** supports bulk completion, date changes, and categorisation for selected unfinished tasks, with guarded Undo.

**Task attachments** support private PDF, PNG, JPG, DOCX, TXT, and HTTP(S) references. Uploads finish before saving; cancelling preserves the saved task. Attachments remain with their occurrence rather than copying into new repeats, and recovery retention protects referenced files.

**Task deadlines and templates:** Date-only deadlines stay on their local day. **Add Priority** offers Bill payment, Travel preparation, and Project setup templates, plus custom templates for title, category, priority, and checklist. Applied templates get fresh unchecked steps without copied dates/history; templates sync and export with the workspace.

**Natural-language task quick-add** recognizes relative/ISO dates, weekdays, times, priority markers (`!high`, `!normal`, `!low`), categories, and custom hashtags. Preview chips before saving; dismiss a detection to keep its phrase, or use **Restore detections**. Manual choices take priority. Parsing works locally/offline; detected times become task context, not timed alerts. Similar unfinished tasks trigger a warning: **Open existing task** or confirm **Add as a separate task anyway**. No automatic merging occurs.

Create or edit tasks with a due date, priority, checklist, and optional repeat schedule. Repeat supports daily, weekdays, weekly, monthly, and yearly schedules, custom intervals where applicable, and an optional end date.

- **Complete:** keep the occurrence in history and create one next occurrence with a reset checklist. Missed dates are skipped; monthly schedules preserve their original day where possible, such as 31 January → 28 February → 31 March.
- **Edit:** choose **Only this occurrence** or **This and future occurrences**. Future edits preserve existing scheduled dates, checklist progress, and completed history; repeat settings govern newly generated occurrences.
- **Snooze:** move one occurrence to tomorrow, next week, or a chosen date without changing the series template.
- **Skip:** record skipped history separately from completed work and generate the next valid occurrence.
- **Pause / Resume series:** stop generation while paused, then resume the original cadence without filling missed dates. An ended series needs its end date updated before it can resume.

**Activity history** on each task shows its creation date and newly recorded edits, reschedules, snoozes, checklist changes, completion/reopening, and repeat actions. The latest 200 events travel with the task through existing account sync and backups. Past edits are not reconstructed.

A repeating task requires a due date. Turning repeat off stops future generation. These schedules do not create operating-system notifications or external reminders.

### Optional browser reminders

Enable **Preferences → General → Browser reminders** to request notification permission. The preference is account-scoped on this browser; other devices need their own permission. Task due/overdue and renewal alerts require an open Routino tab and loaded workspace data. Date-only tasks are due that day; timed tasks wait until their due time. Alerts are deduplicated per item/day, with at most one delivery per minute after startup. Browser/OS settings may suppress delivery, and titles may appear on the lock screen. No background push service is configured.

## 💳 Subscriptions, recharges, and payment reports

### Subscription Manager

Add, edit, search, and filter subscriptions, with active plans first. Plans needing attention appear under **Needs review** and can be marked **Completed** without losing payment history. Completed plans are excluded from active spending projections.

**Recurring spending forecasts:** Subscriptions previews 3, 6, or 12 months using active recurring prices/dates, partial months, and separate currencies. Unknown cycles, bundles, one-time/future purchases, price changes, refunds, and shared settlements are not inferred. Forecasts do not mark payments paid.

**Subscription follow-up:** Log cancellation requests, confirmations, final charges, and refunds without changing plan status/totals. Track domain/certificate/licence expiries and review possible service overlaps. Nothing automatically cancels or merges plans.

**Subscription planning:** The **Renewal decision queue** records Keep, Cancel, or Decide later for overdue/next-30-day reviews; provider cancellation remains manual. Account-synced **Monthly subscription budgets** separate INR/USD/EUR/GBP and flag 90%/over-budget projections.

**Payment reconciliation:** Preview a local CSV (`name,date,amount,currency,reference`; reference optional), match existing plans, and approve. Supports 500 rows / 500 KB, ISO dates, and positive two-decimal amounts. Only unique exact name/currency matches are suggested; duplicates are skipped and unmatched selections block approval. Imports preserve existing payments and plan settings without creating plans or charging bundles separately.

**Shared expenses:** Record payer, date, total, and shares that add up exactly. Mark reimbursements to update balances; edits/removal require confirmation. These tracker-synced records do not change spending totals or send payment requests.

The **Total expense** dialog separates recorded payments from monthly/yearly projections, keeps currencies separate, and counts shared bundles once. Journal imports detect named service payments; their start date is the first recorded payment, not a verified signup date. Monthly cadence is inferred only from repeated payments. Duplicate invoice/journal representations are counted once.

**Renewal decisions:** choose **Keep**, **Cancel before renewal**, or **Decide later** when editing a plan. Cancellation intent is also shown in renewal alerts. This is a planning label; billing continues until you cancel with the provider.

**Price history:** creating a subscription records its current rate; changing amount, currency, or billing cycle appends a dated rate. Existing records establish their previous rate when first changed, without assuming a historical effective date. The latest 500 entries remain with the subscription. Compare rate changes in the expanded history and actual paid spending in Monthly report. Rates do not create payment receipts or alter past expenses; comparisons stay within matching currencies and cycles. Annual-equivalent comparisons support billing-cycle changes; bundled/nonrecurring rates stay separate and free previous rates have no percentage baseline.

**Planning and usage:** monthly/annual equivalents and category totals keep currencies separate. The upcoming-payment timeline covers three calendar months and labels projections and access expiries. Comparable recorded price increases are highlighted. **Used recently** records the date you confirm usage; it does not monitor provider activity. Status changes saved through Edit append dated history, without reconstructing earlier pauses.

Optional trial-end and cancellation deadlines guide **Add Google Calendar alert** and **Add review task**. Choose 1, 3, or 7 days before the deadline (default 3). A passed Calendar alert time moves to 15 minutes from now with a notice. Saved reminder dates prevent ordinary repeated clicks for the same date; changing a deadline or lead time does not automatically update an already-created reminder. Provider cancellation still requires your action.

**Bills, invoices & documents** accepts private PDF, PNG, JPG, DOCX, and TXT uploads up to 3 MB per file, plus external document links. Files use the configured private Vercel Blob store; account-scoped authenticated downloads are delivered as attachments. The subscription saves the file reference, name, upload date, and size through the existing tracker revision flow. Check tracker sync status after upload; drafts remain local if that save fails. Storage usage counts toward your provider plan. Database and JSON snapshots contain file references; successful encrypted external backups also create separate copies of uploaded file contents. No bill parsing, malware scanning, or automatic payment is performed.

Uploaded documents have no inactivity expiry or last-opened requirement. Saved asset references protect their files from the manual unused-file cleanup regardless of upload age. The 75-day threshold applies only to unreferenced uploads, and deletion requires explicit confirmation. Continued availability depends on maintaining the storage account; external links are controlled by their source. Workspace snapshots contain file references. Successful encrypted external backups also create verified encrypted copies of uploaded files under a separate Blob prefix, without a TTL. Downloads can use these copies if the original is missing. These copies use the same Blob provider; they are not a backup with a separate provider. External links are not fetched or copied.

Private PDFs and images support in-app **Preview**. PDFs render locally with an on-demand PDF.js worker and Previous/Next controls, including browsers without an embedded PDF viewer. File contents stay behind the authenticated document route. Attachment names can be edited; confirmed removal detaches the reference without deleting the private file. Older backups retain their references. External links and other file types open or download instead of rendering in the preview.

### Airtel Recharge

**Airtel family recharges:** Keep each member’s phone, plan, observations, and payment history separate from your ledger. Screenshot prices/data/countdowns are observations, not payments or guessed dates. Exact confirmed dates drive countdowns. Profiles are editable/archiveable and use tracker sync, backups, and guarded Undo; family history excludes personal journal imports.

The dedicated tracker separates main plans from data top-ups and keeps payment dates distinct from activation/validity dates. Saved plans can include allowances and benefits you actually use. Included subscriptions link to the recharge payment; one-time upgrades remain separate from recurring charges. Failed attempts and other-number transactions are excluded from spending totals.

**Import Airtel transactions** previews pasted history or CSV/JSON before saving selected successful payments. Enter your number to exclude others. Duplicates, previously removed imports, failed payments, and unsupported statuses are excluded. Choose main plan or data top-up for each payment; importing history does not replace the current plan.

CSV starts with `date` and supports `number,amount,status,kind,method,time,notes`; JSON accepts an array with the same keys. Dates accept ISO or day/month/year. Same-date, same-amount, same-status records are conservatively treated as duplicates; distinct payments can be entered manually.

Renewal records the confirmed payment and validity, archives the previous plan, and explicitly confirms included benefits. Linked subscriptions and the plan update together through the revision-checked save path. Restoring a payment does not activate an old plan. **Routino does not purchase recharges or automatically fetch future Airtel transactions.**

### Reports and reminders

**Journal summaries:** Tracker Hub shows 2023–2026 Summary-tab spending pivots, monthly/category drill-down, and separate full-journal reconciliation. Income, counts, and balances describe the full journal; FamPay stays separate. Unavailable summaries are labelled rather than shown as zero.

**Gmail receipt review:** Search likely receipts from Airtel Recharge or Subscriptions using sender, subject, date, and snippet only. Review the original and confirm your successful payment before adding or linking it. Duplicate checks preserve totals; amount/date suggestions need review. Email never determines plan validity or renewal dates, and messages/attachments remain unchanged.

**Reminders inbox:** Review deadlines, renewals, domain/certificate/licence expiries, warranties, and maintenance through the next 30 days. Filter and open source records. Browser alerts require support/permission and an open app; closed-app delivery is not promised.

**Reminder snooze & source links:** Snooze an occurrence for an hour, until tomorrow at 9 AM, or a week without changing its source date. Account-synced snoozes suppress matching alerts; changed deadlines form new occurrences. Missing sources are never replaced with different records.

- **Payments calendar:** recorded and projected subscription dates plus recharge/bundle expiry. Projections are labelled, month-end/leap-year dates follow the original anchor, and shared bundle expiries use one recharge entry without assuming its next price.
- **Monthly report:** recorded subscription/recharge spending compared with the previous month, per currency. Percentages appear only with a nonzero previous baseline; missing records are not proof of zero spending.
- **Search all payment history:** filter across months by text/service, date, currency, and amount. **Export rows as CSV** exports all filtered rows, including other pages, with quoted fields and spreadsheet-formula protection.
- **Expiry reminders:** upcoming seven days and up to 30 days overdue. Expired bundles need review; the app does not assume a paid renewal.

The notification bell links to relevant mail, calendar, overdue-task, expiry, and backup items. Dismissing a notification does not complete a task or renew a plan. Alerts appear in-app, with optional browser reminders as described above. No email or background push delivery is configured.

### Gadgets, documents, and asset care

The private attachment panel also appears on each **Gadgets & Assets** card. Asset bill references save separately in the account tracker workspace without changing the source spreadsheet’s purchase records. Product, model, order date, and seller identify the asset, so moving a spreadsheet row does not detach its bills. Changing those identifying values requires relinking; identical records with the same identifying values share attachments.

Each asset has a **Warranty** panel for a confirmed expiry date and a review task 30 days before expiry (or today when that reminder date has passed). Check the invoice/provider terms; the app does not infer warranty duration. Existing reminder tasks remain when an expiry date changes. **Service history** records repairs and maintenance with dates, providers, INR costs, notes, and private receipts; entries can be edited or removed with confirmation. These optional records use the existing account tracker revision flow.

**Asset detail & planning:** **View details** opens a private asset page with documents, warranty, care history, and linked notes; copy its link for another signed-in device. Optional straight-line/declining-balance estimates preserve purchase prices. Identifier masking hides values on screen but is not encryption.

**Documents & asset care:** Gadgets & Assets provides a searchable **Document library** and **Manage asset** tabs for Documents, Warranty, Service history, Claims, and Maintenance. Private previews/uploads remain available, tab changes preserve drafts, and the modal adapts to desktop/mobile.

**Warranty claims & checklist** stores contacts, references, status, notes, and evidence. **Maintenance schedules** support one-time or repeating intervals (1–3,650 days), completion history, and overdue highlighting. Completing a repeat advances from its actual completion date. Removal requires confirmation; records sync/back up without rewriting purchase history or automatically creating alerts/events.

## 📬 Live 48-hour Inbox badge

The desktop/mobile badge counts unread Gmail and Outlook Inbox messages received in the **last 48 hours**. Gmail excludes Promotions and Social, matching the app query. Counts come from paginated message IDs, rather than full-mailbox totals, search estimates, or the loaded preview size.

It refreshes with account sync/focus. Zero is valid; failed or incomplete pagination shows unavailable (`—`). The badge is hidden without a connected account. Requests are capped at ten 500-ID pages per provider; hitting the cap reports unavailable instead of a partial count. Preview estimates remain separately labelled.

## 🗑️ Recycle Bin and Undo

**Sync & recovery:** **Sync Center → Preserved recovery copies** lets you search, inspect, and download local conflict drafts/caches. Compare and restore one supported record with explicit confirmation; pending edits or stale previews block restoration. A safety snapshot preserves the prior state and unrelated records. Selective recovery requires Neon Postgres and does not restore missing uploads or external calendar events.

**Undo history:** Keep up to 20 supported actions for 30 minutes in the current account session. Record guards skip newer edits; reload clears callbacks. Deleted records remain in Recycle Bin, and Google Calendar uses its separate Undo path.

**Restore change preview:** Preferences → Database & Sync compares backup additions, removals, edits, ordering, and unchanged counts before restoration. Encrypted note content stays hidden. Restore requires confirmation and an unchanged account/workspace version. Local JSON imports preview only supported fields present in the file; previewing never writes records.

Open **Recycle Bin** from the desktop/mobile sidebar at `/dashboard?tab=recycle-bin`, or through **Database & Sync**. It retains deleted tasks, notes, habits, custom events, quick links, subscriptions, and recharge records until restored.

On Neon Postgres, an additive database trigger captures deletions in the same write transaction. Earlier deletions cannot be reconstructed retroactively. Restore checks the exact workspace version, refuses existing IDs, and preserves unrelated records. Sync or export pending edits first. Journal-only records are restored by removing their hidden-record marker. No permanent-purge action is provided.

The bin is included in database and external snapshots. Ordinary local workspace exports contain active records only. Other storage providers retain their existing save behavior but do not provide this database bin.

Task completion/deletion, recurring-task actions, subscription completion/deletion, and recharge removal offer a **15-second Undo toast**. Undo affects only the action's records, checks the signed-in account, and refuses to overwrite subsequent changes. Undoing recurring-task completion removes its generated next occurrence only if unchanged. An already-restored ID may remain in historical bin entries; restore will not overwrite it. Undo is temporary and does not replace backups.

## 🔌 Integrations and access

| Integration | Access | Behavior |
| --- | --- | --- |
| Google Calendar | Read events; `calendar.events` for focus scheduling, focus edit/delete, renewal review events, and colorization | Explicit scheduling actions write to the primary calendar. Color changes require a version-checked preview and explicit Apply. |
| Gmail | Read-only message access | No sending, archiving, labelling, or deleting mail. |
| Google Drive | `drive.metadata.readonly` | File metadata and links only. |
| Microsoft Outlook | Delegated `User.Read`, `Mail.Read`, `Calendars.Read` | Read-only profile, mail, and calendar access via Microsoft Graph. |
| Google Sheets trackers | Optional link-readable Visualization endpoint | Not a private OAuth Sheets API connection. |
| Google Sites | None | Not integrated. |

Google tokens remain on the Auth.js server and are omitted from the browser-visible session. Stored Outlook credentials use AES-256-GCM with a key derived from the Auth.js secret. Keep that secret strong, private, and consistent across instances of an environment. Workspace records are account-scoped; avoid shared demo accounts for personal data.

## 🚀 Run locally

Use Node.js 20 or newer and npm. Configure your own Google OAuth client, and optionally Microsoft Entra and durable storage.

```bash
git clone https://github.com/Itssanthoshhere/Routino-Daily-Dashboard.git
cd Routino-Daily-Dashboard
npm install
cp .env.example .env.local
```

Replace template values in `.env.local`; never commit it. Generate a strong Auth.js secret with `openssl rand -base64 32`. If setting both secret aliases, use the same value. Use separate credentials for separate environments.

Register Google OAuth callbacks:

```text
http://localhost:3000/api/auth/callback/google
https://<your-production-domain>/api/auth/callback/google
```

Enable Gmail API, Google Calendar API, and Google Drive API. Configure the consent screen and authorized test users. For Outlook, register `/api/outlook/callback` for the appropriate domain and grant the delegated permissions above.

```bash
npm run dev
```

Open `http://localhost:3000`; the workspace is `/dashboard`.

## ⚙️ Environment variables

See [.env.example](.env.example) for the template. Replace or remove placeholder storage credentials before running.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials. |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Auth.js session protection and Outlook token encryption. Keep configured aliases consistent. |
| `NEXTAUTH_URL` | Canonical URL for the environment. |
| `DATABASE_URL` | Neon Postgres; enables database backup history and Recycle Bin. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional Redis-compatible workspace storage. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Alternative Vercel KV credentials. |
| `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` | Optional Outlook OAuth configuration. |
| `OUTLOOK_REDIRECT_URI` | Outlook callback matching the app registration and environment. |
| `TRACKERS_SPREADSHEET_ID` | Optional link-readable tracker sheet; never use confidential data with this adapter. |
| `TRACKERS_OWNER_EMAIL` | Exact account permitted to access the configured tracker source; missing/mismatched values fail closed. |
| `CRON_SECRET` | Server-side authentication for the scheduled backup endpoint. |
| `BLOB_READ_WRITE_TOKEN` | Optional private Vercel Blob backup credentials. Supported OIDC setups can use `BLOB_STORE_ID` instead. |
| `WORKSPACE_BACKUP_KEY` | Dedicated 32-byte base64 key for external backup encryption. Generate with `openssl rand -base64 32`. |

Only intentionally public branding/service settings use `NEXT_PUBLIC_`. Never use that prefix for secrets, tokens, database credentials, or private source identifiers.

## 🔐 Sync, backups, and health

### 📲 Installable app and offline workspace

**Everyday use:** Supported installed-app shortcuts open Quick Capture (`/dashboard?action=capture`), Tasks (`/dashboard?tab=tasks`), and Focus Timer (`/dashboard?action=focus`). Opening a shortcut does not create records or start a timer. The shell works offline; connected services need a connection.

The production app provides `/manifest.webmanifest`, PNG icons, and a service worker for supported browser installation. Use the same production URL and signed-in account as your browser workspace. Installation availability and window appearance depend on the browser and operating system; iOS installation uses Safari’s Add to Home Screen flow. A separate origin such as localhost has separate device storage.

Visit online first and check **Sync Center → App shell ready offline**. The worker caches the dashboard shell and its required static assets; root and dashboard navigations can fall back to that shell offline. Required chunks retry; a missing required chunk blocks the new worker so the prior worker remains available. Optional asset failures are tolerated. API/authentication responses are excluded from caching. A waiting worker offers **Update & reload**.

Tasks, notes, habits, and generated ambient sounds can use the locally saved workspace while offline. Locked notes still require their passphrase. Core edits queue under the last verified account and retry after authenticated reconnect; database sync does not require a successful Google Calendar/Gmail request. Google/Outlook APIs, speech services, and external links may remain unavailable offline. Tracker conflict/revision handling remains separate. Local storage can be cleared or evicted by the browser, so keep backups.

**Sync Center** in the header shows pending core sections, last successful save, storage estimates, offline-shell readiness, Retry sync, and a shortcut to backup preferences. A cached shell is not proof that every record has synced; verify the pending queue and account save status.

### Saved workspace and conflicts

The header’s **Sync Center → Data health** shows database reachability, latest account update, database/external backup age, and pending core/tracker saves. Health checks run when the panel opens or **Check now** is selected. Local pending counts refresh while open; status is informational and does not replace backup verification.

**Workspace reliability:** Account-scoped caches, record-level updates, and database revisions preserve unrelated changes. Stale saves open local/cloud comparison with recovery copies. Legacy data stays with its recorded owner; unknown-owner caches and original copies are retained. Older tabs must refresh before saving.

**Device sync activity** shows an account-scoped browser ID/nickname, last seen, successful saves, and pending-edit reports while visible/online. Reports older than five minutes are stale. This is not a security-session list; local recovery copies are not uploaded to other devices.

**Data health:** Sync Center performs a read-only check of saved records and up to 50 private file references. Suggestions never change records; failed storage checks mean unconfirmed availability, not deletion.

**Backup coverage & document bundles:** Verify attachment copies in **Sync Center**, then export up to 25 items / 20 MB as a private `.tar.gz` with files, contexts, SHA-256 hashes, and availability. External links are listed without fetching. Counts cover checked pages; stale inventories are rejected and source records remain unchanged.

**Document retention:** Preferences → General reviews unreferenced uploads older than 75 days. Live records, Recycle Bin, and backup references protect files. Cleanup requires permanent-deletion confirmation and a fresh reference check; unavailable storage blocks cleanup. No background purge runs.

Core workspace records refresh every 30 seconds and on browser focus. Pending edits are merged before refresh; older reads cannot replace newer edits. Empty saved arrays remain empty rather than being reseeded with demos.

Core saves patch submitted fields, preserving unrelated records. Neon task saves merge touched IDs atomically, including concurrent additions. Tracker saves validate records and reject stale revisions. Account-scoped local drafts support retries; conflicting tracker changes require review with download/reload options. Browser or filesystem fallback alone cannot sync across devices.

**Preferences → Database & Sync → Sync health** shows connectivity, pending edits, save/conflict status, last database update, and backup timestamps. Retry pending saves respects conflicts. Server checks run when opened or requested; local draft counts do not trigger storage calls.

### Database snapshots

Neon captures the first pre-change state each UTC day. Database backup controls provide manual snapshots, counts, download, and restore. Restores require the unchanged workspace version and atomically create a safety copy first. Save or export pending drafts before restoring.

Snapshots are in a separate table in the **same Neon database**. Other storage providers do not provide this history. Keep an external copy for protection against database loss. Scheduled snapshots retain up to 30 days.

### Encrypted external backups

Optional **private Vercel Blob** copies provide storage outside Neon. The job compresses and encrypts saved workspace data with AES-256-GCM, writes one immutable snapshot per account per UTC day, then reads it back to verify it. Snapshots have a 2 MB size limit and 30-day retention. A same-day manual run verifies the existing copy rather than replacing it.

Configure Blob credentials and `WORKSPACE_BACKUP_KEY`. Keep a secure copy of the key outside Vercel: replacing it makes older snapshots unreadable. Encrypted notes also retain their separate passphrase requirement. Authenticated recovery downloads can be imported through workspace restore. Backup failures do not alter live data or database snapshots; unsynced browser drafts are not included.

The notification bell and Sync health flag missing/unreadable backups and snapshots older than **48 hours**. Automatic checks are cached per account/browser for six hours, with a 15-minute retry delay after failures. Manual health checks update the cache. A recent backup does not guarantee future scheduled jobs will succeed. Blob usage shares your plan's allowances; this setup does not guarantee free storage.

Treat all recovery exports as private. Back up before changing infrastructure, database credentials, or encryption secrets.

## ☁️ Deploy to Vercel

1. Import your repository and configure environment-specific OAuth credentials and callback URLs.
2. Attach durable storage and set the server-side variables above. Prefer separate preview/production databases and credentials.
3. For Neon recovery features, ensure the database role can install the required additive tables, functions, and deletion trigger.
4. Optionally connect a **private** Blob store and set its credentials plus the backup encryption key.
5. Set `CRON_SECRET` and deploy [vercel.json](vercel.json). Its daily backup job runs at `0 21 * * *` UTC, or **02:30 IST the following day**. Scheduled features require the deployed code and configured secrets.
6. Verify sign-in, account isolation, save/reload persistence, a second-device read, integration access, and recovery with disposable records before relying on the deployment. Check backup health and scheduled execution after deployment.

This README describes application behavior and configuration; it does not certify an individual deployment's environment or successful backup schedule.

## 🧪 Verification and development

```bash
npm run dev                         # local development
npm run lint                        # TypeScript check
node scripts/test-trackers.cjs       # tracker regression checks
node scripts/test-workspace-features.cjs # search, history, and reminder checks
node scripts/test-review-fixes.cjs     # timing, action identity, and habit counter regressions
npm test # all isolated regression suites; no live provider or database writes
TZ=America/Los_Angeles npm test # alternate-timezone checks
node scripts/test-task-duplicates.cjs # similar unfinished tasks and duplicate confirmation keys
node scripts/test-task-quick-parse.cjs # natural-language dates, times, priorities, categories, and title cleanup
node scripts/test-calendar-navigation.cjs # date jumps, leap days, year boundaries, and DST
node scripts/test-calendar-colors.cjs # default category mappings and legacy auto-write prevention
node scripts/test-calendar-color-manager.cjs # previews, exclusions, stale versions, selective Apply, and Undo
node scripts/test-calendar-search.cjs # loaded-history search, categories, dates, and timezone boundaries
node scripts/test-workspace-resume.cjs # saved-position validation, launch precedence, and account isolation
node scripts/test-workspace-resume-lifecycle.cjs # restore cancellation, timers, and hide-time saves
node scripts/test-management-features.cjs # habit history and private document validation
npm run build                       # production build
```

If the environment blocks Turbopack's local process, use `npx next build --webpack` for production-build verification.

To check PWA assets and simulated cache fallback, start the production build on port 3100 (`npm run start -- --port 3100`) and run `node scripts/test-pwa.cjs`. This checks manifest/icon output, precached assets, root/dashboard offline fallback, and API cache exclusion; it does not simulate installation on every operating system. Service workers are registered only in production mode.

These integration checks require configured private storage and perform writes:

| Script | Checks |
| --- | --- |
| `node scripts/verify-workspace-features.cjs` | Round-trip task activity, price history and decisions through a disposable database account, check backup metadata and preserve the owner workspace. |
| `node scripts/verify-tracker-database.cjs` | Independent reads, stale-write rejection, concurrent task saves, and owner-data preservation using a temporary test account. |
| `node scripts/verify-recycle-bin.cjs` | Transactional deletion capture, task/recharge/journal recovery, encrypted notes, stale restore rejection, and account isolation with disposable records. |
| `node scripts/verify-external-backup.cjs` | Creates or verifies the owner's daily Blob copy, checks isolation, and confirms the source workspace is unchanged. Can load ignored `.env.backup.local`. |
| `node scripts/verify-subscription-documents.cjs` | Uploads and independently reads a disposable private Blob document, then removes only that test upload. Existing user files are unchanged. |
| `node scripts/verify-asset-records.cjs` | Saves warranty, repair, and receipt metadata under a disposable account; independently checks persistence, stale-write rejection, and unrelated-field preservation; removes only its test account and snapshots. |
| `node scripts/verify-calendar-color-state.cjs` | Uses a disposable account to check independent color revisions, concurrent/stale-save rejection, and preservation of core/tracker data; cleans up only that account and its snapshots. |

The migration utility `scripts/migrate-tracker-records.cjs` uses a pre-migration backup and compare-and-swap guard for private tracker imports. Keep private exports in ignored `.data/`; never commit them.

## 🗂️ Project structure

```text
app/                  Next.js pages, server actions, and API routes
components/           Dashboard UI, modals, and views
lib/                  Auth, storage, service integrations, and utilities
scripts/              Regression checks, storage verification, and Apps Script
types/               Shared TypeScript models
public/               Static assets
```

Please use fictional data in screenshots, issues, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Routino is distributed under the [MIT License](LICENSE).

Pull-request and main-branch CI runs TypeScript, the local regression suites in two timezones, a production build, and the production PWA check. Live provider scheduling and actual permanent file deletion are not performed by CI.
