#!/usr/bin/env bash
# Copy working tree from Cursor folder → GitHub Desktop folder (same repo, two paths).
set -euo pipefail

SRC="${1:-$HOME/Projects/momentum}"
DEST="${2:-$HOME/Documents/GitHub/momentum}"

if [[ ! -d "$SRC/.git" ]]; then
  echo "Not a git repo: $SRC"
  exit 1
fi
if [[ ! -d "$DEST/.git" ]]; then
  echo "Not a git repo: $DEST"
  exit 1
fi

rsync -av --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env.local \
  --exclude tsconfig.tsbuildinfo \
  "$SRC/" "$DEST/"

echo ""
echo "Synced → $DEST"
cd "$DEST"
git status -sb | head -20
echo ""
echo "Open GitHub Desktop on: $DEST"
