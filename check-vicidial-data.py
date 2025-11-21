#!/usr/bin/env python3
"""Check what data exists in ViciDial"""

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

print("Checking ViciDial data...")
print("=" * 50)

# Try to get leads from a specific list
print("\nTrying to get leads from list 1213...")
params = {
    "source": "test",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "list_info",
    "list_id": "1213",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"List info response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Try update_lead function to see format
print("\nChecking lead format with update_lead...")
params = {
    "source": "test",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "update_lead",
    "search_location": "LIST",
    "list_id": "1213",
    "status": "TEST",
    "records": "1"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Update lead response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Try external_status
print("\nChecking external status...")
params = {
    "source": "test",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "external_status",
    "value": "TESTLEAD",
    "list_id": "1213"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"External status: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")