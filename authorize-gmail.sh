#!/bin/bash

echo "================================"
echo "Gmail OAuth Authorization Helper"
echo "================================"
echo ""

# Get the auth URL from backend
AUTH_URL=$(curl -s http://162-220-14-239.nip.io/api/gmail/auth-url | sed 's/.*"authUrl":"\(.*\)".*/\1/')

if [ -z "$AUTH_URL" ]; then
    echo "❌ Failed to get authorization URL from backend"
    exit 1
fi

echo "📝 Authorization URL:"
echo ""
echo "$AUTH_URL"
echo ""
echo "================================"
echo "Steps to authorize:"
echo ""
echo "1. Open the URL above in your browser"
echo "2. Sign in with your Google account"
echo "3. Grant the requested permissions"
echo "4. You'll be redirected to the callback URL"
echo "5. The backend will automatically handle the token exchange"
echo ""
echo "After authorization, check the status with:"
echo "  curl http://162-220-14-239.nip.io/api/gmail/status"
echo ""
echo "================================"
echo ""

# Check current status
echo "Current Gmail status:"
curl -s http://162-220-14-239.nip.io/api/gmail/status 2>/dev/null || echo "Status endpoint not available"
echo ""