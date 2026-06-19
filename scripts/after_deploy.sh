#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Print commands and their arguments as they are executed
set -x

# ===================================================================
# 1. CONFIGURATION
# ===================================================================

APP_DIR="/home/ubuntu/node-application-docbase/info-august-dev"
PM2_NAME="infoAugustServer"

# ===================================================================
# 2. DEPLOYMENT EXECUTION
# ===================================================================

cd "$APP_DIR"

echo "=================================="
echo "Current directory:"
pwd
echo "=================================="

echo "Checking for package changes..."

# Generate hash of current package-lock.json
NEW_HASH=$(md5sum package-lock.json | awk '{print $1}')

# File to store previous hash
HASH_FILE=".package-lock.hash"

# Read old hash if file exists
if [ -f "$HASH_FILE" ]; then
    OLD_HASH=$(cat "$HASH_FILE")
else
    OLD_HASH=""
fi

# Compare hashes
if [ "$NEW_HASH" != "$OLD_HASH" ]; then

    echo "=================================="
    echo "Dependency changes detected!"
    echo "Running npm ci..."
    echo "=================================="
    #rm -rf node_modules
    sudo npm install --legacy-peer-deps

    # Save new hash
    echo "$NEW_HASH" > "$HASH_FILE"

else

    echo "=================================="
    echo "No dependency changes detected."
    echo "Skipping npm ci."
    echo "=================================="

fi

echo "=================================="
echo "Restarting PM2 service: $PM2_NAME"
echo "=================================="

sudo pm2 restart "$PM2_NAME"

echo "=================================="
echo "Deployment of $PM2_NAME completed successfully"
echo "=================================="
