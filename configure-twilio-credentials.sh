#!/bin/bash

# Twilio Credentials Configuration Script
echo "🔧 Twilio Credentials Configuration"
echo "==================================="
echo ""

echo "To enable Twilio calling, you need to set up your Twilio credentials:"
echo ""
echo "1. Log into your Twilio Console: https://console.twilio.com"
echo "2. Find your Account SID and Auth Token on the dashboard"
echo "3. Make sure you have a Twilio phone number for calling"
echo ""

echo "Current status:"
if [ -z "$TWILIO_ACCOUNT_SID" ]; then
    echo "❌ TWILIO_ACCOUNT_SID: Not set"
else
    echo "✅ TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID:0:10}..."
fi

if [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo "❌ TWILIO_AUTH_TOKEN: Not set"
else
    echo "✅ TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN:0:10}..."
fi

if [ -z "$TWILIO_PHONE_NUMBER" ]; then
    echo "❌ TWILIO_PHONE_NUMBER: Not set"
else
    echo "✅ TWILIO_PHONE_NUMBER: $TWILIO_PHONE_NUMBER"
fi

echo ""
echo "To configure Twilio credentials:"
echo ""
echo "Option 1: Set environment variables (temporary):"
echo "export TWILIO_ACCOUNT_SID='your_account_sid_here'"
echo "export TWILIO_AUTH_TOKEN='your_auth_token_here'"
echo "export TWILIO_PHONE_NUMBER='+13306369079'"
echo ""

echo "Option 2: Add to /etc/environment (permanent):"
echo "sudo nano /etc/environment"
echo "Add these lines:"
echo "TWILIO_ACCOUNT_SID=your_account_sid_here"
echo "TWILIO_AUTH_TOKEN=your_auth_token_here"
echo "TWILIO_PHONE_NUMBER=+13306369079"
echo ""

echo "Option 3: Create .env file in backend directory:"
echo "cd /var/www/vanguard/backend"
echo "echo 'TWILIO_ACCOUNT_SID=your_account_sid_here' > .env"
echo "echo 'TWILIO_AUTH_TOKEN=your_auth_token_here' >> .env"
echo "echo 'TWILIO_PHONE_NUMBER=+13306369079' >> .env"
echo ""

echo "After setting credentials, restart the backend:"
echo "pm2 restart vanguard-backend"
echo ""

echo "📞 Your Twilio phone number appears to be: +13306369079"
echo "   Make sure this number is active in your Twilio account"
echo ""

echo "🎯 Once configured, your phone tool will make calls via Twilio Voice API"