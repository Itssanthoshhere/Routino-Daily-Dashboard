# Mobile usability review — 20 November 2026

## Current status

The listed layout changes are implemented and browser-checked. This does **not** mean every item below has been solved or tested on a physical phone.

| Status | Item |
| --- | --- |
| Fixed | Header, tracker navigation, inbox layout, touch actions, dialog sizing, career filters and snooze placement |
| Fixed in follow-up | Notes unlock on a device without the original browser-local PIN verifier; incorrect-PIN feedback and opening the requested note after successful decryption |
| Fixed in follow-up | Monthly budget uses the chosen month’s Summary amount, with an explicitly labelled journal fallback; Overview uses the current month |
| Fixed in follow-up | Failed journal/Summary fetches retain successful data from the same account and spreadsheet, with stale/unavailable notices |
| Not verified | Physical-device gestures, virtual keyboard/safe-area behavior, install prompts and notification delivery |
| Not verified | Real account save/restore flows and final calendar focus-finder panel inspection |
| Environment limitation | Default Turbopack build worker cannot bind a local port here; Webpack production build passes |

## Scope and evidence

Reviewed the existing app with its connected account, using browser viewport overrides. This is a responsive UI audit, not certification on physical iOS/Android devices. No save, delete, restore, email-send, calendar-write, file-upload, notification-permission, or payment action was exercised.

| Area | Browser coverage |
| --- | --- |
| Overview, Calendar, Time Audit, Trackers, Inbox, Tasks, Notes, Recycle Bin | Phone widths 360/390; desktop 1440 |
| Airtel, subscriptions, PG electricity, expenses, tokens, investments, career, life, assets | Phone widths 360/390; tablet 768; desktop 1440 |
| Tracker selection and yearly summaries | Phone selection, expand/collapse, desktop navigation retained |
| Header and notifications | 44px controls, two-row header at 360px, panel bounds and repeated open/close verified |
| Task and event forms | Opened and dismissed; scrolling and layout inspected without submitting |
| Task snooze | Opened and dismissed; bottom panel at 360px measured inside viewport (x12–333, y490–788) |
| Preferences | General, Database & Sync, Shortcuts, About; backup/restore controls inspected without restoring |
| Asset manager | Documents, Warranty, Service history, Claims, Maintenance panels opened; full-height 390px layout verified |
| Overview tools | Focus timer, Daily Routine, habits manager, Morning Brief, Desk Sheet preview, quick-link manager opened without saving |
| Quick Capture | Opened at 390×600; bounded dialog measured at 538px high; no capture submitted |
| Workspace search | Empty-result query and Escape dismissal checked |
| Calendar focus finder | Entry opened; final panel inspection was interrupted by browser tooling timeout, so this flow is not marked verified |

The repaired career filters no longer expand the 360px page: measured document width 345px (remaining 15px is the browser scrollbar). Other checked pages stayed within their viewport. Wide data tables retain their existing local scrolling containers.

## Changes

- Put tracker navigation before yearly summaries; phones use a named native selector.
- Collapse yearly summary cards on phones while keeping desktop summaries visible.
- Keep header utilities in a compact second row; constrain notification/profile panels to phone bounds and fix toggle-button dismissal.
- Give inbox content its own mobile column, stack sender/date, and place actions below the message.
- Keep task/note actions visible without hover and enlarge common phone controls to 44px. Form text uses 16px on phones.
- Use full-height mobile Preferences and dynamic viewport limits for task, event, habit, focus, routine, and capture dialogs.
- Keep snooze controls in a bounded phone panel with an explicit Close button.
- Wrap career and asset filters rather than letting chips stretch the page.
- Add dialog names, task completion labels, expanded/current navigation states, and mobile drawer keyboard focus handling.

## Validation

- `npm run lint`: passed.
- `npm test`: passed (existing test suite; storage/provider interactions mocked by its tests).
- `git diff --check`: passed.
- `npm run build -- --webpack`: passed, including TypeScript and generation of all 31 pages.
- Default Turbopack production build: blocked by local worker port-binding `Operation not permitted`, including the escalated attempt. No bundler configuration changed.
- Desktop browser error log sampled after layout checks: no errors returned.
- Temporary viewport override reset after verification.

## Limits and separate findings

Physical touch gestures, mobile virtual keyboards, device safe-area behavior, install prompts, browser notification delivery, and save/restore flows still need device or disposable-data checks. Layout checks do not establish that every business workflow is correct.

The two data issues originally found in this review have now been fixed in the budget/sync follow-up below. Journal and Summary-sheet source records were not edited. The physical-device and workflow-verification limits above still apply.

## Notes unlock follow-up

The unlock dialog could open, but submitting did nothing on a new browser because `handleUnlockVault` returned immediately when the local PIN verifier was absent. Encrypted notes are synced; that verifier is device-local.

- Existing encrypted notes now show **Notes Locked**, rather than prompting for a new PIN on that device.
- Without a local verifier, the original PIN is authenticated by successful AES-GCM decryption of existing ciphertext. Plaintext, empty PINs, malformed ciphertext and tampered data cannot serve as proof. Existing local verifiers remain supported.
- Selecting a locked note remembers it and opens its preview only after that specific note decrypts successfully. Saved ciphertext is not rewritten by verification.
- Invalid PINs show an error, empty submission is disabled, cancellation clears the field, and obsolete unlock attempts cannot reopen a cancelled dialog.
- The unlock dialog has accessible names and a dynamic height limit for shorter phone screens.
- Browser checks: card and header entry points at 390×844 and 360×600; deliberate invalid test PIN produces an error; cancellation clears it; desktop dialog still opens.
- Crypto regression tests use fixture-only data and real Web Crypto. The full test suite and TypeScript pass. The user's real PIN was neither requested nor entered; a successful unlock of their actual private note remains for them to confirm on their phone.

## Monthly budget and partial-sync follow-up

Both previously outstanding data issues are implemented and regression-tested.

### Monthly budget

- The expenses view compares one chosen calendar month with the current planned monthly limit. Its month selector also sets the transaction month filter.
- A recorded monthly Summary value takes precedence, including a valid zero. Where that month has no Summary value, the UI explicitly labels the fallback as full journal debits; those can include transfers. Other years, months, undated entries and income-only rows do not inflate the monthly debit calculation.
- Overview uses the current month and year. Zero/unknown budget limits do not become an invented ₹7,500 limit or produce division by zero. Empty months mean zero **recorded** spending, not confirmation that no spending occurred.
- Historical monthly budget limits are not stored; the interface explicitly says historical months are compared with the current plan.
- Browser checks against the connected sheet: October 2026 budget spending ₹39,754; January 2025 ₹23,034. Annual journal totals remain available separately and unchanged. Overview shows November 2026 rather than the full-year total. Phone page width remained within the viewport.

### Partial sync

- GViz fetch/response failures are distinguished from a successful empty sheet.
- Journal and Summary sources retain their independent last-success data and timestamps. Successful sources update normally; failed sources display stale notices. Without a prior success, they show unavailable rather than verified zero balances/counts/spending.
- Retention requires matching authenticated account and spreadsheet identities. Demo data never inherits private rows. A total refresh failure does not replace live data with demo data.
- The authenticated API cache and client merge both retain last-success sources. Retention is in memory; a fresh process/browser with no previous successful snapshot shows unavailable if the source fails.
- Repeated failures retain the original success timestamp. Recovery clears the stale status. A genuinely successful empty sheet clears previous rows; a valid zero is preserved.
- Overlapping Overview/Tracker requests share one pending provider refresh per account/source, reducing duplicate spreadsheet traffic. Older Tracker refresh responses cannot overwrite a newer request’s result.
- Budget limits also retain the last successful value on a failed budget-sheet fetch and are labelled accordingly.

### Validation

- `scripts/test-journal-sync-budget.cjs`: real GViz parsing with mocked provider responses, authenticated API cache retention, total-failure rejection, shared in-flight fetches, account/source/demo isolation, successful clearing, recovery, immutable source data, monthly amounts and zero/over-limit/unknown cases. Server-rendered notices also verify that unavailable data is not presented as ₹0 or a verified zero entry count.
- Full `npm test`, `npm run lint`, `git diff --check`, and Webpack production build pass.
- Live browser checks cover displayed monthly amounts and the Overview calculation. Failure injection was exercised in regression tests with mocked provider responses, without interrupting or writing to the connected account.

## Final commit review

- Added a freshness regression guard: older successful or stale responses from another server instance cannot replace newer journal, Summary, or budget data already held by the client. A newer successful empty source can still clear old values. Source timestamps use the start of the refresh so a slower earlier request is not treated as newer.
- Overview also ignores older in-flight results and errors after a newer refresh or account change.
- Added 15-minute and 30-minute focus-time options while retaining 25/45/60/90 minutes. Scheduling tests confirm the returned slot lengths for both new durations.
- Physical-device behavior, successful unlock with the user's actual PIN, real save/restore flows, and the final focus-finder booking flow remain outside this non-writing verification. No account records were changed for the review.


## Phone and iPad visual refinement — 20 November 2026

- Compact header below 1280px: navigation, current view, search, quick capture, and an expandable Workspace tools panel. Secondary actions and the existing sync status remain available. The panel supports outside-pointer dismissal and Escape with focus returned to its trigger.
- Sidebar switches to a drawer below 1280px, giving iPad Pro portrait and the smaller landscape viewport full content width. Larger landscape screens retain desktop navigation.
- Renewals and yearly journal summaries start collapsed below 1280px. Tracker navigation uses the labelled dropdown at these widths.
- Phone expense transactions use cards with date, category, description, amount and balance; tablet/desktop retain the table. Both use the same filtered and paginated records.
- Phone task actions stack below task content, completion controls retain a small visual circle inside a 44px target, and saved views/filter tabs scroll horizontally.
- Browser overflow checks passed for all eight workspace views at 393×852 and 834×1194, and all nine tracker tabs at 393×852. Additional responsive checks covered 320×740, 360×800, 430×932, 768×1024, 1024×1366, 1194×834 and 1366×1024. Visual inspection covered phone tasks/trackers and both iPad Pro portrait sizes plus landscape. Disclosure expansion/collapse and tools dismissal were exercised. These are browser viewport checks, not physical Safari/PWA verification or exhaustive checks of every dialog.
- TypeScript, full test suite, production Webpack build and whitespace checks passed. UI verification did not create, edit or remove account records.

- Commit review: native dialogs retain Escape handling without closing the parent Workspace tools panel; browser verification confirmed first Escape closes Undo history while tools remain expanded, and the next Escape dismisses tools.
