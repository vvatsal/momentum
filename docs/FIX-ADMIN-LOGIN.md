# Fix admin login

## Use the right URL and credentials

- **URL:** `https://YOUR-APP.vercel.app/admin/login` (not `/login`)
- **Email:** `admin@example.com` (unless you changed seed env)
- **Password:** `change-me-admin-123` (unless you changed seed env)

## Step 1 — Create the admin user (most common fix)

On your Mac, in the project folder:

```bash
cd /Users/vivekvatsal/Documents/GitHub/momentum
cp .env.example .env.local
```

Edit `.env.local` — use the **same** Supabase URL and keys as Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then:

```bash
npm install
npm run db:seed
```

You should see: `Created: admin@example.com (admin)` or `Updated profile: admin@example.com (admin)`.

## Step 2 — Fix role in Supabase (if user exists but login says "not an admin")

Supabase → **SQL Editor** → run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Check: **Table Editor** → `profiles` → row for `admin@example.com` → `role` = `admin`.

## Step 3 — Reset admin password (if "Invalid login credentials")

Supabase → **Authentication** → **Users** → find `admin@example.com` → **Send password recovery** or reset password in dashboard.

Or re-run seed after deleting the user in Authentication → Users.

## Step 4 — Turn off email confirmation (for testing)

Supabase → **Authentication** → **Providers** → **Email** → disable **Confirm email**.

## Step 5 — Supabase Auth URLs

**Authentication** → **URL Configuration**

- Site URL = your Vercel URL
- Redirect URL = `https://YOUR-APP.vercel.app/auth/callback`

(Admin uses password, but this still helps overall auth.)

## What error do you see?

| Message | Fix |
|---------|-----|
| Invalid login credentials | Run seed or reset password in Supabase |
| No admin profile yet | Run `npm run db:seed` |
| This account is not an admin | SQL `UPDATE profiles SET role = 'admin'` |
| Page spins / back to login | Deploy latest code + seed + fix role |
