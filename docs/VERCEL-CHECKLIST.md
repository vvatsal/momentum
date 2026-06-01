# Vercel deploy checklist

## Environment variables (Production)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (seed + future server actions) |
| `NEXT_PUBLIC_APP_URL` | Yes (`https://your-app.vercel.app`, no trailing slash) |

Redeploy after adding or changing variables.

## Supabase Auth

- **Site URL:** same as `NEXT_PUBLIC_APP_URL`
- **Redirect URLs:** `{APP_URL}/auth/callback`

## Local seed (once)

```bash
cp .env.example .env.local
npm install
npm run db:seed
```

## Verify build locally

```bash
npm run typecheck
npm run build
```
