# Momentum — Online Exam Platform

Mobile-first online tests for students with an admin dashboard. Built with Next.js 14 (App Router), Supabase, Tailwind, and shadcn/ui.

## Phases

| Phase | Status | Scope |
|-------|--------|--------|
| **1** | ✅ | Supabase schema, RLS, auth, admin/student roles |
| **2** | ✅ | Student test-taking, per-question timer, palette, resume |
| **3** | Planned | Admin test creation & publish |
| **4** | Planned | Reports, CSV export, Resend emails |

## Phase 2 — Try the student flow

```bash
npm run db:seed
npm run db:seed-sample
```

Log in as a student → **Dashboard** → **Sample Mathematics Quiz** → Start test.

| Route | Screen |
|-------|--------|
| `/tests/[id]` | Instructions, start / resume |
| `/tests/[id]/attempt` | Questions, palette, timer, auto-save |
| `/tests/[id]/summary` | Score after final submit |

## Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (free tier)
- (Later) [Resend](https://resend.com) API key for publish emails

## Local setup (Phase 1)

### 1. Clone and install

```bash
cd momentum
cp .env.example .env.local
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server/seed only)
3. In **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. Enable **Email** provider (and optionally disable email confirmation for local dev under Auth settings).

### 3. Run database migrations

In the Supabase **SQL Editor**, run these files **in order**:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_functions_triggers.sql`
3. `supabase/migrations/003_rls.sql`

### 4. Seed users

Add seed variables to `.env.local` (see `.env.example`), then:

```bash
npm run db:seed
```

Default credentials (change in production):

- Admin: `admin@example.com` / `change-me-admin-123`
- Students: `student1@example.com`, … / `change-me-student-123`

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Student**: `/login` — magic link or password  
- **Admin**: `/admin/login` — password only  

## Project structure

```
momentum/
├── supabase/migrations/   # SQL schema, triggers, RLS
├── scripts/seed.ts        # Admin + student users
├── src/
│   ├── app/               # App Router pages & actions
│   ├── components/        # UI + layout + auth
│   ├── lib/               # Supabase clients, auth helpers
│   └── types/             # Shared TypeScript types
└── .env.example
```

## Auth & roles

- `profiles` table mirrors `auth.users` with `role`: `admin` | `student`.
- New signups get a profile via `handle_new_user` trigger (`user_metadata.role` for admin seed).
- Middleware enforces:
  - Unauthenticated users → landing or login
  - Students cannot access `/admin/*`
  - Admins cannot access `/dashboard` or `/tests/*` (student routes)

## RLS summary

- **Students**: read published available tests/questions; CRUD own in-progress attempts/responses; read own submitted data.
- **Admins**: full access to tests/questions; read all profiles, attempts, responses.

## GitHub

The project is committed locally. To upload:

1. Create an empty repo at [github.com/new](https://github.com/new)
2. Run: `./scripts/push-to-github.sh https://github.com/YOUR_USER/momentum.git`

Details: **[docs/GITHUB-SETUP.md](docs/GITHUB-SETUP.md)**

## Free hosting (production)

**Easiest path:** [Vercel](https://vercel.com) (free Hobby) + [Supabase](https://supabase.com) (free tier) + GitHub.

Step-by-step guide: **[docs/FREE-HOSTING.md](docs/FREE-HOSTING.md)**

Quick summary:

1. Run SQL migrations in Supabase.
2. Push repo to GitHub.
3. Import repo on Vercel; add env vars from `.env.example` (set `NEXT_PUBLIC_APP_URL` to your `*.vercel.app` URL).
4. In Supabase Auth, set Site URL + redirect URL to `https://your-app.vercel.app/auth/callback`.
5. Run `npm run db:seed` locally using production Supabase keys (once).

**Resend** (Phase 4): optional until publish emails; verify domain when you add it.

## Manual configuration checklist

| Item | Where |
|------|--------|
| Supabase URL & keys | `.env.local` |
| Auth redirect URLs | Supabase Dashboard → Auth |
| `NEXT_PUBLIC_APP_URL` | `.env.local` (production URL when deployed) |
| SQL migrations | Supabase SQL Editor (once per project) |
| Seed users | `npm run db:seed` |
| Resend | Phase 4 — optional until publish emails |

## License

Private / your organization.
