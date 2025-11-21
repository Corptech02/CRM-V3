#!/usr/bin/env python3
"""Get all leads from list 1000 in ViciDial"""

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

print("=" * 80)
print("FETCHING ALL LEADS FROM LIST 1000")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

# Method 1: Try direct list search
print("\n1. Searching for leads in list 1000...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "list_export",
    "list_id": "1000",
    "header": "YES"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=30)
    print(f"List export response length: {len(response.text)} chars")

    if "ERROR" not in response.text[:100] and len(response.text) > 50:
        lines = response.text.strip().split('\n')
        print(f"✅ Found {len(lines)-1} leads in list 1000!")

        if len(lines) > 1:
            # Parse headers
            headers = lines[0].split('|')
            print(f"\nHeaders: {headers[:10]}")

            # Show first 10 leads
            print(f"\nShowing first 10 leads from list 1000:")
            print("-" * 80)

            for i, line in enumerate(lines[1:11], 1):
                values = line.split('|')
                if len(values) >= len(headers):
                    lead = dict(zip(headers, values))

                    print(f"\nLead {i}:")
                    print(f"  ID: {lead.get('lead_id', 'N/A')}")
                    print(f"  Status: {lead.get('status', 'N/A')}")
                    print(f"  Phone: {lead.get('phone_number', 'N/A')}")
                    print(f"  Name: {lead.get('first_name', '')} {lead.get('last_name', '')}")
                    print(f"  Vendor: {lead.get('vendor_lead_code', 'N/A')}")
                    print(f"  Last Call: {lead.get('last_local_call_time', 'N/A')}")

            # Count by status
            print("\n" + "=" * 80)
            print("STATUS SUMMARY:")
            print("-" * 80)

            status_count = {}
            for line in lines[1:]:
                values = line.split('|')
                if len(values) >= len(headers):
                    lead = dict(zip(headers, values))
                    status = lead.get('status', 'UNKNOWN')
                    status_count[status] = status_count.get(status, 0) + 1

            for status, count in sorted(status_count.items()):
                print(f"  {status}: {count} leads")

            # Find SALE status leads
            sale_leads = []
            for line in lines[1:]:
                values = line.split('|')
                if len(values) >= len(headers):
                    lead = dict(zip(headers, values))
                    if lead.get('status', '').upper() in ['SALE', 'SOLD', 'A']:
                        sale_leads.append(lead)

            if sale_leads:
                print("\n" + "=" * 80)
                print(f"🎯 FOUND {len(sale_leads)} SALES-RELATED LEADS!")
                print("-" * 80)

                for i, lead in enumerate(sale_leads[:20], 1):  # Show up to 20 sales
                    print(f"\nSale Lead {i}:")
                    print(f"  ID: {lead.get('lead_id', 'N/A')}")
                    print(f"  Status: {lead.get('status', 'N/A')}")
                    print(f"  Phone: {lead.get('phone_number', 'N/A')}")
                    print(f"  Name: {lead.get('first_name', '')} {lead.get('last_name', '')}")
                    print(f"  Vendor: {lead.get('vendor_lead_code', 'N/A')}")
                    print(f"  Comments: {lead.get('comments', 'N/A')[:100]}")
    else:
        print(f"Response: {response.text[:500]}")

except Exception as e:
    print(f"Error: {e}")

# Method 2: Try lead_search with list_id parameter
print("\n" + "=" * 80)
print("2. Alternative search method for list 1000...")
params = {
    "source": "vanguard",
    "user": VICIDIAL_USERNAME,
    "pass": VICIDIAL_PASSWORD,
    "function": "lead_field_info",
    "list_id": "1000"
}

try:
    response = requests.get(url, params=params, verify=False, timeout=10)
    print(f"Lead field info: {response.text[:300]}")
except:
    pass

print("\n" + "=" * 80)