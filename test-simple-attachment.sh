#!/bin/bash

# Create a simple text attachment
TEXT_CONTENT="This is a test attachment file.
Line 2 of the attachment.
Line 3 of the attachment.
Testing email attachments."

# Encode to base64
TEXT_DATA=$(echo "$TEXT_CONTENT" | base64 -w 0)

# Send email with attachment
curl -X POST http://162-220-14-239.nip.io/api/gmail/send \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"corptech02@gmail.com\",
    \"subject\": \"Test Email with Text Attachment\",
    \"body\": \"<html><body><h2>Testing Attachments</h2><p>This email has a simple text file attachment.</p><p>If you see an attachment called test.txt, the attachment feature is working!</p></body></html>\",
    \"attachments\": [{
      \"filename\": \"test.txt\",
      \"mimeType\": \"text/plain\",
      \"data\": \"$TEXT_DATA\"
    }]
  }" 2>/dev/null

echo ""