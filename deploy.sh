#!/usr/bin/env bash
set -euo pipefail

SSH_TARGET="root@116.203.254.150"
REMOTE_PATH="/var/www/football-simulation/dist"

echo "→ Building..."
npm run build

echo "→ Ensuring remote path exists..."
ssh "$SSH_TARGET" "mkdir -p $REMOTE_PATH"

echo "→ Syncing dist/ to $SSH_TARGET:$REMOTE_PATH ..."
rsync -avz --delete dist/ "$SSH_TARGET:$REMOTE_PATH/"

echo "✓ Deployed to $SSH_TARGET:$REMOTE_PATH"
