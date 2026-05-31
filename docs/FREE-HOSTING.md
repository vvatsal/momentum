# Free hosting guide

Host **Momentum** at $0 using:

| Service | Free tier | Role |
|---------|-----------|------|
| [Vercel](https://vercel.com) | Hobby | Next.js app (frontend + server) |
| [Supabase](https://supabase.com) | Free | Database, auth, RLS |
| [GitHub](https://github.com) | Free | Git repo (required for easy Vercel deploy) |

**Recommended:** Vercel + Supabase. This app uses Next.js middleware and server components; Vercel supports that without extra setup.

Cloudflare Pages can host Next.js but needs extra adapters (`@cloudflare/next-on-pages`) and has limits on Node APIs — use Vercel unless you already standardize on Cloudflare.

---

## Overview

```
Students/Admin  →  https://your-app.vercel.app  →  Vercel (Next.js)
                              ↓
                    https://xxxx.supabase.co  →  Supabase (Auth + DB)
```

---

## Step 1 — Supabase (backend)

1. Go to [supabase.com](https://supabase.com) → **New project** (free).
2. Wait for the project to finish provisioning.
3. **SQL Editor** — run migrations **in order**:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_functions_triggers.sql`
   - `supabase/migrations/003_rls.sql`
4. **Project Settings → API** — save:
   - Project URL
   - `anon` public key
   - `service_role` key (secret — server/seed only)

### Auth URLs (do this again after you know your Vercel URL)

**Authentication → URL Configuration:**

| Field | Value |
|-------|--------|
| Site URL | `https://YOUR-APP.vercel.app` |
| Redirect URLs | `https://YOUR-APP.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` (optional, for local dev) |

**Authentication → Providers → Email:** enabled.

For testing without email setup: **Authentication → Providers → Email** → turn off “Confirm email” (tighten this before real students use the app).

### Seed admin + students (from your laptop)

Create `.env.local` with **production** Supabase keys, then:

```bash
npm install
npm run db:seed
```

Change `SEED_*` passwords in `.env.local` before going live.

---

## Step 2 — Push code to GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Initial Momentum app"
```

Create an empty repo on GitHub (e.g. `yourname/momentum`), then:

```bash
git remote add origin https://github.com/YOUR_USER/momentum.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy on Vercel (free)

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub.
2. **Add New → Project** → import your `momentum` repo.
3. Framework preset: **Next.js** (auto-detected).
4. **Environment variables** — add these for **Production** (and Preview if you want):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase (keep secret) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` (your real Vercel URL, no trailing slash) |

`RESEND_*` can wait until Phase 4 (email on publish).

5. Click **Deploy**. First build takes ~2–3 minutes.
6. Copy your live URL, e.g. `https://momentum-abc123.vercel.app`.

---

## Step 4 — Wire Supabase to your live URL

Back in Supabase **Authentication → URL Configuration**:

- Set **Site URL** to your Vercel URL.
- Add **Redirect URL**: `https://YOUR-PROJECT.vercel.app/auth/callback`

In Vercel → **Settings → Environment Variables**, set:

```
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
```

Then **Deployments → … → Redeploy** so magic links use the correct domain.

---

## Step 5 — Verify

1. Open `https://YOUR-PROJECT.vercel.app`
2. **Admin:** `/admin/login` — use seeded admin email/password
3. **Student:** `/login` — password or magic link

If magic link opens localhost, `NEXT_PUBLIC_APP_URL` is wrong or you didn’t redeploy after changing it.

---

## Custom domain (optional, still free on Vercel)

1. Vercel → Project → **Settings → Domains** → add `exams.yourschool.org`
2. Add the DNS records Vercel shows at your registrar.
3. Update Supabase Auth URLs and `NEXT_PUBLIC_APP_URL` to the custom domain.
4. Redeploy.

---

## What stays free (typical limits)

- **Vercel Hobby:** personal/non-commercial; bandwidth and build minutes caps (enough for a class/school pilot).
- **Supabase Free:** 500 MB database, 50k monthly active users auth cap, paused after 1 week inactivity on inactive projects (log in to dashboard to wake).

For a school exam app with tens–hundreds of students, free tiers are usually enough until you scale.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Invalid login credentials” | Re-run `npm run db:seed` against the same Supabase project; check email/password |
| Magic link goes to localhost | Set `NEXT_PUBLIC_APP_URL` on Vercel + redeploy; fix Supabase redirect URLs |
| “Auth callback” error | Redirect URL must exactly match `/auth/callback` on your Vercel domain |
| Blank page after deploy | Check Vercel build logs; ensure all `NEXT_PUBLIC_*` vars are set |
| Admin login says “not an admin” | User’s `profiles.role` must be `admin` (seed sets this) |

---

## Cloudflare Pages (advanced)

Only if you must use Cloudflare:

1. Use [Cloudflare Pages Next.js guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/) with the OpenNext or `@cloudflare/next-on-pages` adapter.
2. Set the same environment variables in the Cloudflare dashboard.
3. Expect extra config for middleware and server actions.

For this project, **Vercel is the path of least resistance.**

---

## Checklist

- [ ] Supabase project + 3 SQL migrations
- [ ] `npm run db:seed` with production keys
- [ ] Code on GitHub
- [ ] Vercel project with 4 env vars
- [ ] Supabase Site URL + redirect URL = Vercel URL
- [ ] `NEXT_PUBLIC_APP_URL` = Vercel URL + redeploy
- [ ] Test admin + student login on live site
