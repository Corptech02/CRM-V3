#!/usr/bin/env python3
"""Find leads in list 1000 using different methods"""

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("SEARCHING LIST 1000 WITH ALL AVAILABLE METHODS")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Method 1: update_list to see if list exists
print("\n1. Checking if list 1000 exists...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "update_list",
    "list_id": "1000",
    "list_name": "TestList"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Update list response: {response.text[:200]}")

    if "SUCCESS" in response.text:
        print("✅ List 1000 exists!")
except:
    pass

# Method 2: batch_update_lead
print("\n2. Trying batch update to find leads...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "batch_update_lead",
    "list_id": "1000",
    "status": "NEW"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Batch update response: {response.text[:300]}")
except:
    pass

# Method 3: list_info
print("\n3. Getting list info...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "list_info",
    "list_id": "1000",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"List info: {response.text[:500]}")
except:
    pass

# Method 4: dial_next_lead
print("\n4. Checking dial_next_lead...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "dial_next_lead",
    "list_id": "1000",
    "agent_user": "6666"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Dial next lead: {response.text[:300]}")
except:
    pass

# Method 5: external_dial
print("\n5. Checking with external_dial...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "external_dial",
    "search": "YES",
    "list_id": "1000"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"External dial: {response.text[:500]}")
except:
    pass

# Method 6: Try to search by vendor_lead_code
print("\n6. Searching by vendor lead code pattern...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "lead_search",
    "vendor_lead_code": "",
    "list_id": "1000",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Vendor search: {response.text[:500]}")
except:
    pass

print("\n" + "=" * 80)
print("TRYING DIRECT DATABASE QUERY VIA ADMIN API")
print("=" * 80)

# Try admin API functions
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "user_list_info",
    "custom_fields": "Y"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"User list info: {response.text[:500]}")
except:
    pass

print("\n" + "=" * 80)