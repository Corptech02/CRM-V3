#!/bin/bash

echo "================================"
echo "Send COI Email with Attachment"
echo "================================"
echo ""

# Configuration
API_URL="http://162-220-14-239.nip.io/api/gmail/send"
COI_FILE="/var/www/vanguard/ACORD_25_fillable.pdf"

# Check if COI file exists
if [ ! -f "$COI_FILE" ]; then
    echo "❌ COI file not found at $COI_FILE"
    echo "Using a sample COI from saved_cois directory..."
    COI_FILE=$(find /var/www/vanguard/saved_cois -name "*.pdf" -type f | head -1)
    if [ -z "$COI_FILE" ]; then
        echo "❌ No COI files found"
        exit 1
    fi
    echo "Using: $COI_FILE"
fi

# Get file info
FILENAME=$(basename "$COI_FILE")
echo "📄 COI File: $FILENAME"

# Encode the PDF file to base64
echo "📦 Encoding PDF file..."
PDF_BASE64=$(base64 -w 0 "$COI_FILE")

# Get recipient
read -p "To email address [corptech02@gmail.com]: " TO_EMAIL
TO_EMAIL=${TO_EMAIL:-corptech02@gmail.com}

read -p "Client/Company name [Test Company]: " COMPANY_NAME
COMPANY_NAME=${COMPANY_NAME:-Test Company}

# Create HTML body
HTML_BODY="<html>
<body style='font-family: Arial, sans-serif;'>
<h2>Certificate of Insurance</h2>
<p>Dear $TO_EMAIL,</p>

<p>Thank you for your Certificate of Insurance (COI) request for <strong>$COMPANY_NAME</strong>.</p>

<p>I have attached the requested COI to this email. This certificate provides evidence of the insurance coverages in effect as of the issue date.</p>

<p><strong>Important Information:</strong></p>
<ul>
<li>This certificate is issued as a matter of information only</li>
<li>It confers no rights upon the certificate holder</li>
<li>This certificate does not affirmatively or negatively amend, extend or alter the coverage afforded by the policies</li>
</ul>

<p>If you have any questions or need additional information, please don't hesitate to contact us.</p>

<p>Best regards,<br/>
COI Automation System<br/>
Vanguard Insurance Services</p>

<hr style='border: 1px solid #ccc; margin-top: 30px;'>
<p style='font-size: 12px; color: #666;'>
This is an automated message. Please do not reply directly to this email.<br/>
Generated on $(date '+%Y-%m-%d at %H:%M:%S')
</p>
</body>
</html>"

# Create JSON payload
echo "📧 Sending email to $TO_EMAIL..."

# Create the JSON with proper escaping
JSON_PAYLOAD=$(cat <<EOF
{
  "to": "$TO_EMAIL",
  "subject": "Certificate of Insurance - $COMPANY_NAME",
  "body": "$(echo "$HTML_BODY" | sed 's/"/\\"/g' | tr '\n' ' ')",
  "attachments": [
    {
      "filename": "$FILENAME",
      "mimeType": "application/pdf",
      "data": "$PDF_BASE64"
    }
  ]
}
EOF
)

# Send the email
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" 2>/dev/null)

# Check response
if echo "$RESPONSE" | grep -q '"success":true'; then
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"messageId":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "✅ COI email sent successfully!"
    echo "   Message ID: $MESSAGE_ID"
    echo "   To: $TO_EMAIL"
    echo "   Subject: Certificate of Insurance - $COMPANY_NAME"
    echo "   Attachment: $FILENAME"
else
    echo ""
    echo "❌ Failed to send email"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "================================"