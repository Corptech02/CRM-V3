#!/bin/bash

echo "========================================="
echo "Testing ViciBox Connection from VPS"
echo "========================================="
echo ""
echo "ViciBox Server: 204.13.233.29"
echo "VPS IP: 162.220.14.239"
echo "Credentials: User 6666, Pass corp06"
echo ""

# Test 1: Basic connectivity
echo "[1] Testing basic network connectivity..."
ping -c 2 204.13.233.29
echo ""

# Test 2: Port 80 connectivity
echo "[2] Testing port 80 (HTTP)..."
nc -zv -w 5 204.13.233.29 80 2>&1
echo ""

# Test 3: API Version Call
echo "[3] Testing ViciBox API (version call)..."
curl -k -v "https://204.13.233.29/vicidial/non_agent_api.php?source=test&user=6666&pass=corp06&function=version" -m 10
echo ""
echo ""

# Test 4: API List Info
echo "[4] Testing ViciBox API (list info)..."
curl -k "https://204.13.233.29/vicidial/non_agent_api.php?source=test&user=6666&pass=corp06&function=list_info&list_id=999" -m 10
echo ""
echo ""

# Test 5: Local API proxy test
echo "[5] Testing local API proxy..."
curl "http://localhost:8897/api/vicidial/test" -m 10 | python3 -m json.tool
echo ""

echo "========================================="
echo "Test Complete"
echo "========================================="
echo ""
echo "If tests 1-2 fail: Firewall is still blocking"
echo "If test 3 fails but 1-2 pass: API credentials issue"
echo "If test 5 fails but 3 passes: Local API issue"
echo ""
echo "To fix on ViciBox server:"
echo "sudo iptables -I INPUT -s 162.220.14.239 -p tcp --dport 80 -j ACCEPT"
echo "sudo iptables-save > /etc/iptables/rules.v4"