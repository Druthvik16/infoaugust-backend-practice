#!/bin/bash


# Print commands and their arguments as they are executed
set -x

# ===================================================================
# 1. CONFIGURATION
# ===================================================================

APP_DIR="/home/ubuntu/node-application-docbase/info-august-dev"
PM2_NAME="infoAugustServer"

# Change port if required
HEALTH_URL="http://localhost:3001/health"
SNS_TOPIC_ARN="arn:aws:sns:ap-south-1:909317186074:backend-deployment-notifications"
S3_BUCKET="deployment-log-storage"
REGION="ap-south-1"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

finalize() {
    STATUS="$1"   # SUCCESS or FAILURE

    LOG_FILE="/tmp/${PM2_NAME}-${STATUS}-${TIMESTAMP}.log"
    S3_KEY="logs/${PM2_NAME}-${STATUS}-${TIMESTAMP}.log"

    {
        echo "================================="
        echo "Deployment Status: $STATUS"
        echo "Server: $(hostname)"
        echo "Time: $(date)"
        echo "Application: $PM2_NAME"
        echo "================================="
        echo ""
        echo "========= PM2 STATUS ========="
        pm2 describe "$PM2_NAME" || true
        echo ""
        echo "========= LAST 100 PM2 LOGS ========="
        pm2 logs "$PM2_NAME" --lines 50 --nostream || true
    } > "$LOG_FILE" 2>&1

    echo ""
    echo "===== LOG FILE CONTENT ====="
    cat "$LOG_FILE"
    echo "============================"

    # Upload log to S3
    aws s3 cp "$LOG_FILE" "s3://${S3_BUCKET}/${S3_KEY}" --region "$REGION" || true

    # Generate a presigned URL valid for 7 days (max allowed: 604800 seconds)
    PRESIGNED_URL=$(aws s3 presign "s3://${S3_BUCKET}/${S3_KEY}" --expires-in 604800 --region "$REGION" || echo "Could not generate link")

    # Compose mail message
    MESSAGE="Deployment ${STATUS}

Application: ${PM2_NAME}
Server: $(hostname)
Time: $(date)

Log file: ${PM2_NAME}-${STATUS}-${TIMESTAMP}.log

Click below to view/download the log (link valid for 7 days):
${PRESIGNED_URL}
"

    aws sns publish \
        --topic-arn "$SNS_TOPIC_ARN" \
        --subject "Deployment ${STATUS} - ${PM2_NAME}" \
        --message "$MESSAGE" \
        --region "$REGION" || true
}


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
    echo "Running npm install..."
    echo "=================================="

    sudo npm install --legacy-peer-deps

    # Save new hash
    echo "$NEW_HASH" > "$HASH_FILE"

else

    echo "=================================="
    echo "No dependency changes detected."
    echo "Skipping npm install."
    echo "=================================="

fi

echo "=================================="
echo "Restarting PM2 service: $PM2_NAME"
echo "=================================="

sudo pm2 restart "$PM2_NAME"

echo "=================================="
echo "Waiting for application startup..."
echo "=================================="

sleep 15

echo "=================================="
echo "Checking PM2 Status"
echo "=================================="

PM2_STATUS=$(pm2 describe "$PM2_NAME" | grep "status" | head -1)

echo "$PM2_STATUS"

if echo "$PM2_STATUS" | grep -qi "online"; then

    echo "PM2 Process is ONLINE"

else

    echo "=================================="
    echo "PM2 Process Failed"
    echo "=================================="

    finalize "FAILURE"

    exit 1

fi

echo "=================================="
echo "Running Health Check"
echo "=================================="

if curl -f -s "$HEALTH_URL" > /dev/null; then

    echo "Health Check Passed"

else

    echo "=================================="
    echo "Health Check Failed"
    echo "=================================="

    finalize "FAILURE"

    exit 1

fi

echo "=================================="
echo "Recent PM2 Logs"
echo "=================================="

pm2 logs "$PM2_NAME" --lines 30 --nostream || true

finalize "SUCCESS"

echo "=================================="
echo "Deployment of $PM2_NAME completed successfully"
echo "=================================="