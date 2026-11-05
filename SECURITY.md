# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Security is a core priority for Routino. If you discover a vulnerability or potential security flaw, please do **NOT** open a public issue.

Instead, please send an email directly to:

📧 **santhosh02vs@gmail.com**

Please include:
- A description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a proof of concept.
- Any suggested fixes or mitigations.

You should receive a response within 48 hours. We appreciate your efforts to responsibly disclose findings and help keep user routines and workspaces secure.

## OAuth & Privacy Safeguards

- **No Third-Party Token Storage**: OAuth refresh and access tokens are strictly encrypted in server-side HTTP-only session cookies and are never exposed to client-side scripts.
- **Read-Only Scopes**: Only `calendar.readonly` and `gmail.readonly` scopes are requested. The application never modifies, creates, or deletes calendar events or emails.
