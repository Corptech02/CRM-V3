#!/usr/bin/env python3
"""Find any data in ViciDial system"""

import requests
import urllib3
from datetime import datetime, timedelta

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("SEARCHING FOR ANY VICIDIAL DATA")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Try recording lookup for today
today = datetime.now().strftime("%Y-%m-%d")
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

print(f"\nChecking for recordings/calls on {today}...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "recording_lookup",
    "date": today,
    "uniqueid": "1234567890"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Recording lookup response: {response.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

# Try agent_status
print("\nChecking agent status...")
params["function"] = "agent_status"
params["agent_user"] = "6666"

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Agent status: {response.text[:300]}")
except:
    pass

# Try to add a test lead directly
print("\nTrying to add a test lead to list 1213...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "add_lead",
    "list_id": "1213",
    "phone_number": "5551234567",
    "first_name": "Test",
    "last_name": "Sale",
    "status": "SALE"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Add lead response: {response.text[:500]}")

    if "SUCCESS" in response.text or "added" in response.text.lower():
        print("\n✅ Test lead added successfully!")

        # Now try to search for it
        print("\nSearching for the test lead...")
        params = {
            "source": "vanguard",
            "user": VICIDIAL_USERNAME,
            "pass": VICIDIAL_PASSWORD,
            "function": "lead_search",
            "phone_number": "5551234567",
            "header": "YES"
        }

        response = requests.get(url, params=params, verify=False, timeout=10)
        if "ERROR" not in response.text and len(response.text.strip()) > 10:
            print(f"✅ Found the test lead: {response.text[:300]}")
        else:
            print(f"Could not find test lead: {response.text[:200]}")
except Exception as e:
    print(f"Error adding lead: {e}")

print("\n" + "=" * 80)