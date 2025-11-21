#!/usr/bin/env python3
"""Export leads from list 1000 using all possible methods"""

import requests
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("EXPORTING LEADS FROM LIST 1000")
print("=" * 80)
print(f"List last called: 2025-09-20 16:56:44")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Method 1: export_calls_report
print("\n1. Trying export_calls_report...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "export_calls_report",
    "datetime_start": "2025-09-20 00:00:00",
    "datetime_end": "2025-09-20 23:59:59",
    "list_id": "1000"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=30)
    if "ERROR" not in response.text[:50] and len(response.text) > 100:
        print(f"✅ Found call data! Response length: {len(response.text)}")
        lines = response.text.split('\n')
        print(f"Lines of data: {len(lines)}")
        if len(lines) > 0:
            print(f"First line: {lines[0][:200]}")
            if len(lines) > 1:
                print(f"Second line: {lines[1][:200]}")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

# Method 2: calls_report
print("\n2. Trying calls_report...")
params["function"] = "calls_report"

try:
    response = requests.get(url, params=params, verify=False, timeout=30)
    if "ERROR" not in response.text[:50] and len(response.text) > 100:
        print(f"✅ Found data! Length: {len(response.text)}")
        print(f"First 500 chars: {response.text[:500]}")
    else:
        print(f"Response: {response.text[:200]}")
except:
    pass

# Method 3: Try recording_list
print("\n3. Trying recording_list...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "recording_list",
    "datetime_start": "2025-09-20 00:00:00",
    "datetime_end": "2025-09-20 23:59:59"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=30)
    if "ERROR" not in response.text[:50]:
        print(f"Recording list response: {response.text[:500]}")
except:
    pass

# Method 4: check_phone_list - iterate through possible phone numbers
print("\n4. Checking for phone numbers in list...")
phone_prefixes = ["555", "469", "214", "972", "817"]  # Common Texas area codes

found_leads = []

for prefix in phone_prefixes[:2]:  # Check first 2 prefixes
    params = {
        "source": "vanguard",
        "user": VICIDIAL_USERNAME,
        "pass": VICIDIAL_PASSWORD,
        "function": "check_phone_number",
        "phone_number": f"{prefix}0000000",
        "list_id": "1000"
    }

    try:
        response = requests.get(url, params=params, verify=False, timeout=5)
        if "FOUND" in response.text or "lead_id" in response.text:
            print(f"Found lead with prefix {prefix}: {response.text[:100]}")
            found_leads.append(response.text)
    except:
        pass

print(f"\nFound {len(found_leads)} leads")

# Method 5: admin_log_report
print("\n5. Checking admin log for list 1000 activity...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "admin_log_report",
    "datetime_start": "2025-09-20 00:00:00",
    "datetime_end": "2025-09-20 23:59:59"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    if len(response.text) > 100:
        print(f"Admin log: {response.text[:300]}")
except:
    pass

print("\n" + "=" * 80)
print("RECOMMENDATION:")
print("-" * 80)
print("The ViciDial API has limited functionality for exporting leads.")
print("To get your SALE leads from list 1000:")
print("")
print("1. Log into ViciDial at: http://204.13.233.29/vicidial/admin.php")
print("2. Go to: Lists → List 1000")
print("3. Click: 'Download List' or 'Export'")
print("4. Filter by status: SALE")
print("5. Export as CSV")
print("")
print("Then I can import the CSV file directly into the lead management system.")
print("=" * 80)