#!/usr/bin/env bash
# Run this on the VPS to pull latest, install deps, and rebuild.
# Usage: ./update.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "→ Pulling latest..."
git pull --ff-only

echo "→ Installing dependencies..."
npm ci

echo "→ Building..."
npm run build

echo "✓ Updated. dist/ is ready at $(pwd)/dist"
