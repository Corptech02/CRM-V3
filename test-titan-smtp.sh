#!/bin/bash

echo "Testing Titan SMTP..."
curl -X POST http://localhost:3001/api/outlook/send \
  -H "Content-Type: application/json" \
  -d '{"to":"contact@vigagency.com","subject":"Test COI Email from Titan","body":"<p>This is a test email to verify Titan SMTP is working.</p>"}'

echo ""
echo "Check contact@vigagency.com inbox for the test email!"