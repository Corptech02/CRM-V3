#!/bin/bash

TOKEN="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"

# Create a simple README via API to test
echo "Creating README.md in repository..."
curl -X PUT \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Corptech02/VIG-Software-Most-Recent-/contents/README.md \
  -d "{\"message\":\"Initial commit\",\"content\":\"$(echo 'Vanguard Insurance Group Software' | base64)\"}"

echo ""
echo "If successful, trying git push..."
git push -u origin main