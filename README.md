# DJ Booking Website

Customer-facing booking site with Google Calendar sync, automated email notifications, and live staging deployment.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Database | SQLite (`better-sqlite3`) |
| Calendar | Google Calendar API (OAuth2 service account) |
| Email | Nodemailer (Gmail App Password) |
| Hosting | Vercel |
| CI/CD | GitHub Actions → Vercel |

---

## Local Development

```bash
# 1. Clone the repo
git clone <repo-url>
cd dj-booking-website

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your real credentials (see Environment Variables section)

# 4. Run the dev server
npm run dev
# → http://localhost:3000

# 5. Run tests (optional)
npm test
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for local dev. In production, set these in the Vercel dashboard under **Settings → Environment Variables**.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Service account email for Google Calendar API |
| `GOOGLE_PRIVATE_KEY` | Yes | Private key from the service account JSON (keep `\n` newlines) |
| `GOOGLE_CALENDAR_ID` | Yes | DJ's Google Calendar ID (usually their email address) |
| `EMAIL_FROM` | Yes | Sender email address (Gmail) |
| `EMAIL_APP_PASSWORD` | Yes | Gmail App Password (not your login password — see setup below) |
| `DJ_EMAIL` | Yes | DJ's email — receives booking notifications |
| `DB_PATH` | Yes | SQLite file path. Use `/tmp/bookings.db` on Vercel (ephemeral). |
| `ADMIN_API_KEY` | Yes | Secret key to protect `/admin/bookings` page |
| `NEXTAUTH_URL` | Yes | Full URL of your deployment (e.g. `https://your-app.vercel.app`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for session signing |

### Setting up Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Calendar API**.
3. Create a **Service Account** under IAM & Admin.
4. Download the JSON key file.
5. Share the DJ's Google Calendar with the service account email (give it "Make changes to events" permission).
6. Set `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` from the JSON key.

### Setting up Gmail App Password

1. Enable 2FA on the Gmail account.
2. Go to Google Account → Security → App Passwords.
3. Generate a password for "Mail" / "Other".
4. Set `EMAIL_APP_PASSWORD` to this password (no spaces).

---

## Deployment: Vercel

### First-time setup

1. **Install Vercel CLI** (optional but helpful):
   ```bash
   npm i -g vercel
   ```

2. **Link the project to Vercel:**
   ```bash
   vercel login
   vercel link
   # Follow prompts — creates .vercel/ directory with project/org IDs
   ```

3. **Add environment variables in the Vercel dashboard:**
   - Go to your project → Settings → Environment Variables.
   - Add all variables from the table above.
   - Set for **Production** and **Preview** environments.

4. **Deploy:**
   ```bash
   vercel --prod
   ```
   Vercel will print the live URL.

### Subsequent deploys

Push to `main` — the GitHub Actions workflow automatically deploys to Vercel.

---

## CI/CD: GitHub Actions

The workflow at `.github/workflows/ci.yml` runs on every push and pull request:

1. **Lint & Test** — `npm run lint` + `npm run test:ci`
2. **Build** — verifies the Next.js build succeeds
3. **Deploy** (main branch only) — deploys to Vercel via `amondnet/vercel-action`

### Required GitHub Secrets

Add these under **Settings → Secrets and variables → Actions** in your GitHub repo:

| Secret | How to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel dashboard → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after running `vercel link` |

---

## Project Structure

```
├── app/
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Booking form (Frontend Lead)
│   ├── admin/
│   │   └── bookings/
│   │       └── page.tsx       # Admin bookings table (Frontend Lead)
│   └── api/
│       └── bookings/
│           └── route.ts       # Booking API (Backend Lead)
├── lib/
│   ├── db.ts                  # SQLite setup, schema migration, insert/list helpers
│   ├── calendar.ts            # Google Calendar event creation (service account)
│   └── email.ts               # Nodemailer — customer confirmation + DJ notification
├── __tests__/
│   ├── api/bookings.test.ts   # Route handler tests (validation, auth, responses)
│   └── lib/db.test.ts         # DB helper tests
├── .env.example               # Environment variable template
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline
├── vercel.json                # Vercel deployment config
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Notes

- **SQLite on Vercel**: `/tmp/bookings.db` is ephemeral — it resets on each cold start. This is acceptable for MVP/staging. For production, migrate to a hosted DB (PlanetScale, Supabase, Neon, etc.).
- **Secrets**: Never commit `.env.local` or any file containing real credentials. `.gitignore` already excludes `.env*` files.
