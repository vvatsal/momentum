# Push Momentum to GitHub

Your project is already committed locally on branch `main`. Finish linking GitHub in two steps.

## Step 1 — Create an empty repo on GitHub

1. Open [github.com/new](https://github.com/new)
2. **Repository name:** `momentum` (or any name you prefer)
3. Set **Public** or **Private**
4. Do **not** add a README, `.gitignore`, or license (repo must stay empty)
5. Click **Create repository**

Copy the URL GitHub shows, e.g.:

- HTTPS: `https://github.com/YOUR_USERNAME/momentum.git`
- SSH: `git@github.com:YOUR_USERNAME/momentum.git`

## Step 2 — Push from your machine

In Terminal:

```bash
cd /Users/vivekvatsal/Documents/GitHub/momentum
./scripts/push-to-github.sh https://github.com/YOUR_USERNAME/momentum.git
```

Or manually:

```bash
cd /Users/vivekvatsal/Documents/GitHub/momentum
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/YOUR_USERNAME/momentum.git
git push -u origin main
```

### First-time GitHub login

If `git push` asks for credentials:

- **HTTPS:** use a [Personal Access Token](https://github.com/settings/tokens) as the password (not your GitHub password)
- **SSH:** add an SSH key in [GitHub SSH settings](https://github.com/settings/keys), then use the `git@github.com:...` URL

## Step 3 — Deploy on Vercel (optional)

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Import the GitHub repo you just pushed
3. Add env vars from `.env.example` (see [FREE-HOSTING.md](./FREE-HOSTING.md))

## Already set locally

| Item | Status |
|------|--------|
| Git repo in `momentum/` | ✅ (separate from parent `Projects` folder) |
| Initial commit on `main` | ✅ |
| `.env` / secrets | ✅ ignored (not committed) |
| Remote `origin` | `https://github.com/vvatsal/momentum.git` |
