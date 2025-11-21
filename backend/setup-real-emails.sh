#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SETUP REAL OUTLOOK EMAILS - Find test2006"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will connect to contact@vigagency.com and fetch real emails"
echo ""
echo "📋 STEPS TO GET APP PASSWORD:"
echo ""
echo "1. Open browser and go to:"
echo "   https://account.microsoft.com/security"
echo ""
echo "2. Sign in with: contact@vigagency.com"
echo ""
echo "3. Look for 'App passwords' or 'Additional security'"
echo ""
echo "4. Generate new app password"
echo ""
echo "5. Copy the 16-character password"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Enter your app password: " APP_PASSWORD

if [ -z "$APP_PASSWORD" ]; then
    echo "❌ No password provided"
    exit 1
fi

echo ""
echo "🔄 Fetching emails..."
echo ""

# Run the fetch script
cd /var/www/vanguard/backend
node fetch-test2006.js "$APP_PASSWORD"

echo ""
echo "🔄 Restarting backend..."
pm2 restart vanguard-backend

echo ""
echo "✅ Done! Check the COI Management tab now"
echo "   You should see the test2006 email!"