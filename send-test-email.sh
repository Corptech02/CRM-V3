#!/bin/bash

echo "================================"
echo "Gmail Send Test"
echo "================================"
echo ""

# Default values
DEFAULT_TO="corptech02@gmail.com"
DEFAULT_SUBJECT="Test Email - $(date '+%Y-%m-%d %H:%M:%S')"
DEFAULT_BODY="This is a test email from the Vanguard system.\n\nTimestamp: $(date)\n\nIf you receive this, email sending is working correctly."

# Get user input or use defaults
read -p "To email address [$DEFAULT_TO]: " TO_EMAIL
TO_EMAIL=${TO_EMAIL:-$DEFAULT_TO}

read -p "Subject [$DEFAULT_SUBJECT]: " SUBJECT
SUBJECT=${SUBJECT:-$DEFAULT_SUBJECT}

read -p "Message body (press Enter for default): " BODY
BODY=${BODY:-$DEFAULT_BODY}

echo ""
echo "Sending email..."
echo "To: $TO_EMAIL"
echo "Subject: $SUBJECT"
echo ""

# Send the email
RESPONSE=$(curl -s -X POST http://162-220-14-239.nip.io/api/gmail/send \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$TO_EMAIL\",
    \"subject\": \"$SUBJECT\",
    \"body\": \"$BODY\",
    \"attachments\": []
  }" 2>/dev/null)

# Check response
if echo "$RESPONSE" | grep -q '"success":true'; then
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"messageId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Email sent successfully!"
    echo "   Message ID: $MESSAGE_ID"
else
    echo "❌ Failed to send email"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "================================"