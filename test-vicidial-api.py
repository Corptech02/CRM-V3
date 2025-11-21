#!/usr/bin/env python3
"""Test ViciDial API connection and list available data"""

import requests
import urllib3

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("Testing ViciDial API Connection...")
print("=" * 50)

# Test 1: Version check
print("\n1. Testing API version...")
url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"
params = {
    "source": "test",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "version"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Get campaign list
print("\n2. Getting campaign list...")
params["function"] = "campaigns_list"
try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Get lead statuses
print("\n3. Getting lead statuses...")
params["function"] = "agent_stats"
try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Search for any leads
print("\n4. Searching for leads with different statuses...")
for status in ["SALE", "SOLD", "A", "B", "NEW", "NA", "DROP", "XFER", "CALLBK"]:
    params["function"] = "lead_search"
    params["status"] = status
    params["header"] = "YES"

    try:
        response = requests.get(url, params=params, verify=False, timeout=10)
        if "ERROR" not in response.text and len(response.text.strip()) > 0:
            lines = response.text.strip().split('\n')
            if len(lines) > 1:
                print(f"\n   Status '{status}': Found {len(lines)-1} leads")
                print(f"   Headers: {lines[0][:100]}")
                if len(lines) > 1:
                    print(f"   First lead: {lines[1][:100]}")
        else:
            print(f"   Status '{status}': No leads or error")
    except Exception as e:
        print(f"   Status '{status}': Error - {e}")

print("\n" + "=" * 50)
print("Test complete!")