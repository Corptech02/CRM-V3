#!/usr/bin/env python3
"""Get real ViciDial sale data with actual sale timestamps from ViciBox"""

import requests
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("GETTING REAL VICIDIAL SALE DATA WITH TIMESTAMPS")
print("=" * 80)
print(f"Server: {VICIDIAL_HOST}")
print(f"User: {VICIDIAL_USERNAME}")
print("-" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Try to get call_log data which has actual sale timestamps
print("\n1. Trying to get call log data for SALE dispositions...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "call_log_lookup",
    "stage": "READY",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Call log response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Try admin functions to get list of actual sales with timestamps
print("\n2. Trying admin function for call records...")
admin_functions = [
    "call_report",
    "agent_stats_export",
    "list_calls",
    "recording_lookup",
    "call_status_stats"
]

for func in admin_functions:
    params = {
        "source": "vanguard",
        "user": VICIDIAL_USERNAME,
        "pass": VICIDIAL_PASSWORD,
        "function": func,
        "stage": "READY",
        "header": "YES"
    }

    try:
        response = requests.get(url, params=params, verify=False, timeout=10)
        if response.text.strip() and "ERROR" not in response.text and len(response.text) > 10:
            print(f"\n✅ Function '{func}' returned data:")
            print(f"Response (first 300 chars): {response.text[:300]}")
            if len(response.text) > 300:
                print(f"... (truncated, total length: {len(response.text)})")
        else:
            print(f"❌ Function '{func}': {response.text[:100]}")
    except Exception as e:
        print(f"❌ Function '{func}': Error - {e}")

# Try to get recordings data which might have sale information
print("\n3. Checking for recordings with sale data...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "recording_lookup",
    "call_date": "2025-10-27",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Recordings response: {response.text[:500]}")
    if len(response.text) > 500:
        print(f"... (truncated, total length: {len(response.text)})")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 80)