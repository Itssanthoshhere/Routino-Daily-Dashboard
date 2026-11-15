# Security Policy

## Supported Versions

Security fixes are made on the latest version in the `main` branch.

## Report a Vulnerability

Please report suspected vulnerabilities privately through [GitHub Security Advisories](https://github.com/Itssanthoshhere/Routino-Daily-Dashboard/security/advisories/new). Do not include credentials, tokens, or private user data in a public issue.

Include the affected route or component, impact, and steps to reproduce using synthetic data. Do not access or retain another person's account data while investigating.

## Data and Integration Notes

- OAuth client secrets and database credentials belong in server-side environment variables. Never add them to source control or `NEXT_PUBLIC_*` variables.
- Google Calendar and Gmail requests use the signed-in user's OAuth session. Drive access is metadata-only.
- Google Calendar auto-colorization updates event colors only after the signed-in user explicitly runs it.
- Routino task, habit, link, and preference data is stored per account in the configured database. Loading a workspace must not add demo data to or remove records from that account.
- Notes are encrypted in the browser with Web Crypto before persistence. Losing the vault passphrase prevents decryption.
- The optional Sheets tracker route requires the signed-in email to match `TRACKERS_OWNER_EMAIL`, and its in-memory cache is account-scoped. The current adapter still uses Google Visualization and requires a link-readable sheet. Anyone with that spreadsheet URL may read it; do not use it for confidential information. A private OAuth Sheets adapter is not yet enabled.
- Outlook access and refresh tokens are encrypted at rest with AES-256-GCM before storage. Configure a strong, stable Auth.js secret and restrict database access; changing the secret makes previously encrypted tokens unreadable.
- API responses containing workspace or tracker data use `Cache-Control: private, no-store`.
