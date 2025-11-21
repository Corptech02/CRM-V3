#!/usr/bin/env python3
"""Get details of ViciDial leads"""

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("FETCHING VICIDIAL LEAD DETAILS")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Search by phone number to get lead details
print("\n1. Searching for leads by phone...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "lead_search",
    "phone_number": "5551234567",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Raw response:\n{response.text}")

    # Now get lead info
    print("\n2. Getting lead info for ID 88927...")
    params = {
        "source": "vanguard",
        "user": VICIDIAL_USERNAME,
        "pass": VICIDIAL_PASSWORD,
        "function": "lead_info",
        "lead_id": "88927",
        "header": "YES"
    }

    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Lead info response:\n{response.text}")

except Exception as e:
    print(f"Error: {e}")

# Try to update the lead status to SALE
print("\n3. Updating lead status to SALE...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "update_lead",
    "lead_id": "88927",
    "status": "SALE"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Update response: {response.text}")
except:
    pass

# Search for SALE status leads again
print("\n4. Searching for SALE status leads...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "lead_search",
    "status": "SALE",
    "list_id": "1213",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"SALE leads response: {response.text}")
except:
    pass

print("\n" + "=" * 80)