#!/usr/bin/env python3
"""Check list 1213 for real ViciDial data"""

import requests
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("CHECKING LIST 1213 FOR REAL VICIDIAL DATA")
print("=" * 80)
print(f"Time: {datetime.now()}")
print(f"Server: {VICIDIAL_HOST}")
print(f"User: {VICIDIAL_USERNAME}")
print("-" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# 1. Get list info
print("\n1. Getting list 1213 info...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "list_info",
    "list_id": "1213",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"List info: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# 2. Try to get leads by using export_leads function
print("\n2. Trying export_leads for list 1213...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "export_leads",
    "list_id": "1213",
    "header": "YES",
    "status": "ALL"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Export leads response (first 1000 chars): {response.text[:1000]}")
    if len(response.text) > 1000:
        print(f"... (truncated, total length: {len(response.text)})")
except Exception as e:
    print(f"Error: {e}")

# 3. Try various statuses to find sales
print("\n3. Checking for SALE status leads in list 1213...")
sale_statuses = ["SALE", "SOLD", "A", "B", "NEW", "CALLBK"]

for status in sale_statuses:
    params = {
        "source": "vanguard",
        "user": VICIDIAL_USERNAME,
        "pass": VICIDIAL_PASSWORD,
        "function": "lead_search",
        "list_id": "1213",
        "status": status,
        "header": "YES",
        "records": "10"
    }

    try:
        response = requests.get(url, params=params, verify=False, timeout=10)
        if response.text.strip() and "ERROR" not in response.text:
            lines = response.text.strip().split('\n')
            if len(lines) > 1:  # Has data beyond header
                print(f"\n✅ Found {len(lines)-1} leads with status '{status}' in list 1213:")
                print(f"Headers: {lines[0]}")
                for i, line in enumerate(lines[1:6], 1):  # Show first 5 leads
                    print(f"Lead {i}: {line}")
                if len(lines) > 6:
                    print(f"... and {len(lines)-6} more")
                break
            else:
                print(f"❌ Status '{status}': No leads found")
        else:
            print(f"❌ Status '{status}': {response.text[:100]}")
    except Exception as e:
        print(f"❌ Status '{status}': Error - {e}")

print("\n" + "=" * 80)