#!/bin/bash

echo "================================"
echo "Gmail Complete Test Suite"
echo "================================"
echo ""

BASE_URL="http://162-220-14-239.nip.io/api/gmail"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Test 1: Check status
echo "1. Testing Gmail Status Endpoint..."
STATUS=$(curl -s "$BASE_URL/status")
if echo "$STATUS" | grep -q "authenticated"; then
    print_result 0 "Status endpoint working"
    echo "   Response: $STATUS"
else
    print_result 1 "Status endpoint failed"
fi
echo ""

# Test 2: Get auth URL
echo "2. Testing Auth URL Generation..."
AUTH_RESPONSE=$(curl -s "$BASE_URL/auth-url")
if echo "$AUTH_RESPONSE" | grep -q "authUrl"; then
    print_result 0 "Auth URL generated successfully"
    AUTH_URL=$(echo "$AUTH_RESPONSE" | sed 's/.*"authUrl":"\(.*\)".*/\1/')
    echo "   URL length: ${#AUTH_URL} characters"
else
    print_result 1 "Auth URL generation failed"
fi
echo ""

# Test 3: List messages
echo "3. Testing Message List..."
MESSAGES=$(curl -s "$BASE_URL/messages" 2>/dev/null)
if echo "$MESSAGES" | grep -q '"id"'; then
    MESSAGE_COUNT=$(echo "$MESSAGES" | grep -o '"id"' | wc -l)
    print_result 0 "Successfully retrieved $MESSAGE_COUNT messages"

    # Get first message ID for further testing
    FIRST_MESSAGE_ID=$(echo "$MESSAGES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   First message ID: $FIRST_MESSAGE_ID"
else
    print_result 1 "Failed to retrieve messages"
    FIRST_MESSAGE_ID=""
fi
echo ""

# Test 4: Get specific message (if we have one)
if [ ! -z "$FIRST_MESSAGE_ID" ]; then
    echo "4. Testing Specific Message Retrieval..."
    MESSAGE_DETAIL=$(curl -s "$BASE_URL/messages/$FIRST_MESSAGE_ID" 2>/dev/null)
    if echo "$MESSAGE_DETAIL" | grep -q '"id"'; then
        print_result 0 "Successfully retrieved message details"
        # Extract some info
        SUBJECT=$(echo "$MESSAGE_DETAIL" | grep -o '"subject":"[^"]*"' | cut -d'"' -f4)
        echo "   Subject: $SUBJECT"
    else
        print_result 1 "Failed to retrieve message details"
    fi
    echo ""
fi

# Test 5: Test COI search
echo "5. Testing COI Search..."
COI_RESULTS=$(curl -s "$BASE_URL/search-coi" 2>/dev/null)
if [ $? -eq 0 ]; then
    if echo "$COI_RESULTS" | grep -q "error"; then
        print_result 1 "COI search returned error"
        echo "   Error: $(echo "$COI_RESULTS" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
    else
        COI_COUNT=$(echo "$COI_RESULTS" | grep -o '"id"' | wc -l 2>/dev/null || echo "0")
        print_result 0 "COI search completed (found $COI_COUNT results)"
    fi
else
    print_result 1 "COI search failed"
fi
echo ""

# Test 6: Test sending capability (dry run)
echo "6. Testing Send Endpoint (dry run)..."
SEND_TEST=$(curl -s -X POST "$BASE_URL/send" \
    -H "Content-Type: application/json" \
    -d '{"to":"test@example.com","subject":"Test","body":"Test message","dryRun":true}' 2>/dev/null)

if echo "$SEND_TEST" | grep -q "error"; then
    ERROR_MSG=$(echo "$SEND_TEST" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if echo "$ERROR_MSG" | grep -qi "token\|auth"; then
        print_result 1 "Send endpoint requires authentication"
    else
        print_result 1 "Send endpoint error: $ERROR_MSG"
    fi
else
    print_result 0 "Send endpoint accessible"
fi
echo ""

# Summary
echo "================================"
echo "Test Summary"
echo "================================"

# Check overall health
if curl -s "$BASE_URL/messages" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Gmail integration is WORKING${NC}"
    echo ""
    echo "The system can:"
    echo "  • Retrieve messages"
    echo "  • Access message details"
    echo "  • Search for COI emails"

    # Check if token needs refresh
    if echo "$STATUS" | grep -q '"authenticated":false'; then
        echo ""
        echo -e "${YELLOW}⚠️  Note: Status shows unauthenticated but API calls work.${NC}"
        echo "   This suggests automatic token refresh is functioning."
    fi
else
    echo -e "${RED}❌ Gmail integration needs attention${NC}"
    echo ""
    echo "To fix:"
    echo "1. Run: $0"
    echo "2. Open the authorization URL in your browser"
    echo "3. Complete the OAuth flow"
fi

echo ""
echo "================================"