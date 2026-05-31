#!/usr/bin/env bash
# Push momentum to GitHub. Usage:
#   ./scripts/push-to-github.sh https://github.com/YOUR_USER/momentum.git
set -euo pipefail

REPO_URL="${1:-}"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: ./scripts/push-to-github.sh <github-repo-url>"
  echo "Example: ./scripts/push-to-github.sh https://github.com/vivekvatsal/momentum.git"
  exit 1
fi

cd "$(dirname "$0")/.."

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Run from project root after: git init && git add -A && git commit"
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main

echo ""
echo "Done. Repo: ${REPO_URL%.git}"
