#!/usr/bin/env python3
"""Get ALL sales leads from ViciDial and display them"""

import requests
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("FETCHING ALL VICIDIAL SALES LEADS")
print("=" * 80)
print(f"Time: {datetime.now()}")
print(f"Server: {VICIDIAL_HOST}")
print(f"User: {VICIDIAL_USERNAME}")
print("-" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Check ALL possible sale-related statuses
statuses_to_check = [
    "SALE", "SOLD", "XFER", "A", "AA", "B", "NEW",
    "AFTHRS", "DROP", "CALLBK", "DNCL", "DNC",
    "PM", "PU", "NA", "NI", "NP", "DC"
]

all_leads = []

for status in statuses_to_check:
    params = {
        "source": "vanguard",
        "user": VICIDIAL_USERNAME,
        "pass": VICIDIAL_PASSWORD,
        "function": "lead_search",
        "status": status,
        "header": "YES"
    }

    try:
        response = requests.get(url, params=params, verify=False, timeout=10)

        if response.status_code == 200 and "ERROR" not in response.text and response.text.strip():
            lines = response.text.strip().split('\n')
            if len(lines) > 1:  # Has data
                headers = lines[0].split('|')

                print(f"\n✅ Status '{status}': Found {len(lines)-1} leads")
                print(f"Headers: {', '.join(headers[:5])}...")  # Show first 5 headers

                for i, line in enumerate(lines[1:6], 1):  # Show first 5 leads
                    values = line.split('|')
                    lead_data = dict(zip(headers, values))

                    # Store all leads
                    all_leads.append({
                        'status': status,
                        'lead_id': lead_data.get('lead_id', 'N/A'),
                        'phone': lead_data.get('phone_number', 'N/A'),
                        'first_name': lead_data.get('first_name', ''),
                        'last_name': lead_data.get('last_name', ''),
                        'list_id': lead_data.get('list_id', 'N/A'),
                        'vendor_lead_code': lead_data.get('vendor_lead_code', ''),
                        'last_call_time': lead_data.get('last_local_call_time', ''),
                        'full_data': lead_data
                    })

                    print(f"  Lead {i}: ID={lead_data.get('lead_id', 'N/A')}, "
                          f"Phone={lead_data.get('phone_number', 'N/A')}, "
                          f"Name={lead_data.get('first_name', '')} {lead_data.get('last_name', '')}, "
                          f"List={lead_data.get('list_id', 'N/A')}")

                if len(lines) > 6:
                    print(f"  ... and {len(lines)-6} more leads")
    except Exception as e:
        # Silent fail for statuses with no leads
        pass

print("\n" + "=" * 80)
print("SUMMARY OF ALL LEADS FOUND")
print("=" * 80)

if all_leads:
    print(f"\n📊 Total leads found across all statuses: {len(all_leads)}\n")

    # Group by status
    status_counts = {}
    for lead in all_leads:
        status = lead['status']
        if status not in status_counts:
            status_counts[status] = []
        status_counts[status].append(lead)

    # Show details for SALE/SOLD leads specifically
    sale_leads = []
    for status in ['SALE', 'SOLD', 'XFER', 'A']:
        if status in status_counts:
            sale_leads.extend(status_counts[status])

    if sale_leads:
        print(f"\n🎯 SALES-RELATED LEADS (SALE/SOLD/XFER/A status): {len(sale_leads)}\n")
        for lead in sale_leads[:10]:  # Show first 10 sales
            print(f"  • Lead ID: {lead['lead_id']}")
            print(f"    Name: {lead['first_name']} {lead['last_name']}")
            print(f"    Phone: {lead['phone']}")
            print(f"    Status: {lead['status']}")
            print(f"    List: {lead['list_id']}")
            print(f"    Last Call: {lead['last_call_time']}")
            print(f"    Vendor Code: {lead['vendor_lead_code']}")
            print("-" * 40)
    else:
        print("\n⚠️ No leads with SALE, SOLD, XFER, or A status found")
else:
    print("\n❌ No leads found in ViciDial with any status")
    print("\nPossible reasons:")
    print("  1. No leads have been added to ViciDial yet")
    print("  2. All leads might be in a different list")
    print("  3. API credentials may need different permissions")

print("\n" + "=" * 80)