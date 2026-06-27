#!/usr/bin/env bash
# Routine deploy script — run on EC2 after initial setup
# Usage: ./deploy/scripts/deploy.sh

set -euo pipefail

APP_DIR="/var/www/khummela"
cd "$APP_DIR"

echo "==> Pulling latest code..."
git pull

echo "==> Installing dependencies..."
npm ci

echo "==> Building application..."
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
npm run build

echo "==> Restarting PM2..."
pm2 restart khummela

echo "==> Deploy complete."
pm2 status khummela
