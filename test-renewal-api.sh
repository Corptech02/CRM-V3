#!/bin/bash

echo "Testing Renewal Completion API"
echo "================================"

API_URL="http://162.220.14.239:3001"
TEST_KEY="TEST_$(date +%s)"

echo ""
echo "1. Testing POST (save completion):"
curl -X POST ${API_URL}/api/renewal-completions \
  -H "Content-Type: application/json" \
  -d "{\"policyKey\":\"${TEST_KEY}\",\"policyNumber\":\"TEST123\",\"expirationDate\":\"2025-12-31\",\"completed\":true}" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "2. Testing GET (retrieve all completions):"
curl ${API_URL}/api/renewal-completions -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "3. Checking database directly:"
sqlite3 /var/www/vanguard/backend/vanguard.db "SELECT policy_key, completed, completed_at FROM renewal_completions WHERE policy_key LIKE 'TEST%' ORDER BY completed_at DESC LIMIT 5;"

echo ""
echo "4. Testing GET specific completion:"
curl ${API_URL}/api/renewal-completions/${TEST_KEY} -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "5. Testing DELETE:"
curl -X DELETE ${API_URL}/api/renewal-completions/${TEST_KEY} -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "6. Final database check:"
sqlite3 /var/www/vanguard/backend/vanguard.db "SELECT COUNT(*) as total_completions FROM renewal_completions;"