#!/usr/bin/env python3
"""Check ViciDial lists and their contents"""

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("CHECKING VICIDIAL LISTS AND DATA")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# 1. Get campaign lists
print("\n1. Getting all campaigns and lists...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "campaigns_list"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Campaigns response: {response.text[:500]}")

    # Parse campaign data to find list IDs
    if "AgentsCM" in response.text:
        print("\n✅ Found campaign: AgentsCM")
        print("   List IDs mentioned: 1213")
except Exception as e:
    print(f"Error: {e}")

# 2. Try to get leads from specific list
print("\n2. Checking list 1213 for leads...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "lead_search",
    "list_id": "1213",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    if "ERROR" not in response.text and response.text.strip():
        lines = response.text.strip().split('\n')
        if len(lines) > 1:
            print(f"✅ Found {len(lines)-1} leads in list 1213")
            headers = lines[0].split('|')
            print(f"Headers: {headers[:5]}")

            for i, line in enumerate(lines[1:4], 1):  # Show first 3
                values = line.split('|')
                lead = dict(zip(headers, values))
                print(f"  Lead {i}: Status={lead.get('status')}, Phone={lead.get('phone_number')}, ID={lead.get('lead_id')}")
        else:
            print("❌ No leads in list 1213")
    else:
        print(f"❌ Error or no data: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

# 3. Try alternative API functions
print("\n3. Trying alternative API functions...")

# Try dial_log
params["function"] = "dial_log"
params["end_date"] = "2025-09-20"
params["start_date"] = "2025-09-20"

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    if "ERROR" not in response.text[:100]:
        print(f"Dial log response: {response.text[:300]}")
except:
    pass

# Try call_log
params["function"] = "call_log"

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    if "ERROR" not in response.text[:100]:
        print(f"Call log response: {response.text[:300]}")
except:
    pass

print("\n" + "=" * 80)