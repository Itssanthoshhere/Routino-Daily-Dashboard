# Contributing to Routino

Thank you for your interest in contributing to **Routino**! We welcome contributions, bug reports, feature ideas, and improvements from the community.

## 🧭 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions within this project.

---

## 🛠️ Getting Started Locally

### Prerequisites
- **Node.js** >= 18.17.0
- **npm** >= 9.0.0 (or pnpm / yarn)
- A modern web browser with Web Audio API support

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Routino-Daily-Dashboard.git
cd Routino-Daily-Dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Routino runs out of the box in **Preview Mode** without any Google credentials configured.

*(Optional)* To test live Google Calendar and Gmail integration:
1. Follow the [Google OAuth Setup Guide in README.md](README.md#-google-oauth-setup)
2. Add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
3. Generate a secret for `NEXTAUTH_SECRET`: `openssl rand -base64 32`

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Architecture & Philosophy

- **Zero External Audio Assets**: Ambient sounds (rain, waves, brown/white noise) and completion chimes use Web Audio API synthesis for speed and zero network latency.
- **Privacy by Default**: OAuth tokens are stored in secure HTTP-only cookies and are never exposed to client-side scripts.
- **Graceful Fallbacks**: When unauthenticated or when keys are missing, the app continues to operate using local browser storage and illustrative sample routines.
- **Type Safety**: All TypeScript checks (`npx tsc --noEmit`) and production builds (`npm run build`) must pass cleanly before opening a pull request.

---

## 🌿 Contribution Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. **Make your changes**: Keep commits focused and descriptive.
3. **Verify the build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
4. **Push and open a Pull Request**:
   Push to your fork and submit a PR to `main` with a clear explanation of your changes.

---

## 💬 Questions or Help?

If you run into any issues or have questions, feel free to open a [GitHub Discussion](https://github.com/Itssanthoshhere/Routino-Daily-Dashboard/discussions) or create an [Issue](https://github.com/Itssanthoshhere/Routino-Daily-Dashboard/issues).
