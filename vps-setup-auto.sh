#!/bin/bash
# Non-interactive VPS Setup Script for Vanguard Insurance

set -e

# Use environment variables or defaults
DOMAIN="${DOMAIN:-162.220.14.239}"
EMAIL="${EMAIL:-admin@example.com}"
GMAIL_CLIENT_ID="${GMAIL_CLIENT_ID:-your-client-id-here}"
GMAIL_CLIENT_SECRET="${GMAIL_CLIENT_SECRET:-your-client-secret-here}"
DB_DOWNLOAD_URL="${DB_DOWNLOAD_URL:-skip}"

echo "============================================================"
echo "   Vanguard Insurance System - Automated Deployment"
echo "============================================================"
echo "Domain/IP: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# The script will now run without prompting
echo "Starting automated deployment..."

# Create a response file for the interactive script
cat > responses.txt << RESP
$DOMAIN
$EMAIL
$GMAIL_CLIENT_ID
$GMAIL_CLIENT_SECRET
$DB_DOWNLOAD_URL
RESP

# Run the original script with responses
./vps-setup.sh < responses.txt
