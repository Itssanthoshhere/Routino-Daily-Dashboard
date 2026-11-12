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

## OAuth, Privacy & Production Safeguards

- **Zero-Knowledge Encryption for Notes**: Client-side AES-256-GCM encryption with PBKDF2 (SHA-256, 100,000 iterations). Plaintext notes and passphrases are never transmitted to the server or database.
- **No Token Leakage**: OAuth refresh and access tokens are strictly handled server-side in encrypted, HTTP-only session cookies and are never exposed to client-side scripts or browser session objects.
- **Minimal Scopes**: Scopes are restricted to what is necessary for dashboard display (`calendar.readonly`, `calendar.events`, `gmail.readonly`, and `drive.metadata.readonly` for metadata only). File bodies are never accessed or downloaded.
- **Configurable Credentials**: All API credentials, OAuth client secrets, and external spreadsheet IDs are loaded strictly from environment variables (`.env.local`) and are never hardcoded in the open-source repository.
