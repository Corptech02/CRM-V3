#!/bin/bash

echo "Gmail OAuth Configuration"
echo "========================="
echo ""
read -p "Enter your Gmail Client ID: " CLIENT_ID
read -p "Enter your Gmail Client Secret: " CLIENT_SECRET

# Update .env file
sed -i "s/GMAIL_CLIENT_ID=.*/GMAIL_CLIENT_ID=$CLIENT_ID/" .env
sed -i "s/GMAIL_CLIENT_SECRET=.*/GMAIL_CLIENT_SECRET=$CLIENT_SECRET/" .env

echo ""
echo "✓ Gmail credentials updated!"
echo ""
echo "Next steps:"
echo "1. Restart services: pm2 restart all"
echo "2. Visit http://162.220.14.239/ in your browser"
echo "3. Click on 'Gmail' section"
echo "4. Click 'Connect Gmail Account'"
echo "5. Authorize the application"
