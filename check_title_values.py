#!/usr/bin/env python3
"""Check title field values by running the sync's get_all_sale_leads"""

import sys
import os
import json
from datetime import datetime

# Load the sync script as a module
sys.path.insert(0, '/var/www/vanguard')

# Execute the script to get the class
exec_namespace = {'__name__': '__main__'}
with open('/var/www/vanguard/vicidial-fresh-sync.py') as f:
    code = f.read()
    # Replace main execution to avoid running the sync
    code = code.replace('if __name__ == "__main__":', 'if False:')
    exec(code, exec_namespace)

# Get the class
ViciDialSync = exec_namespace.get('ViciDialSync')

if not ViciDialSync:
    print("Could not find ViciDialSync class")
    exit(1)

# Create instance
sync = ViciDialSync()

print("Fetching SALE leads from ViciDial...")
print("=" * 80)

# Get all SALE leads
all_leads = sync.get_all_sale_leads()

print(f"\nFound {len(all_leads)} SALE leads")
print("-" * 80)

# Focus on the problem leads
problem_leads = ['88546', '88571']

for lead in all_leads:
    lead_id = lead.get('lead_id')

    # Show all leads but highlight the problem ones
    if lead_id in problem_leads:
        print(f"\n⚠️  PROBLEM LEAD: {lead_id}")
    else:
        print(f"\nLead {lead_id}")

    print(f"  Name: {lead.get('full_name', 'Unknown')}")
    print(f"  List: {lead.get('list_id', 'Unknown')}")
    print(f"  Title field: '{lead.get('title', '')}'")
    print(f"  Vendor code: '{lead.get('vendor_code', '')}'")

    # Show what renewal date SHOULD be extracted
    title = lead.get('title', '')
    vendor_code = lead.get('vendor_code', '')

    renewal_date = ""

    if title and len(title) == 4 and title.isdigit():
        month = int(title[:2])
        day = int(title[2:4])
        renewal_date = f"{month}/{day}/{datetime.now().year}"
        print(f"  ✅ Title '{title}' → Renewal: {renewal_date}")
    elif vendor_code and '/' in vendor_code:
        import re
        date_match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', vendor_code)
        if date_match:
            month, day, year = date_match.groups()
            renewal_date = f"{int(month)}/{int(day)}/{year}"
            print(f"  ✅ Vendor '{vendor_code}' → Renewal: {renewal_date}")
    else:
        print(f"  ❌ No valid date found")

print("\n" + "=" * 80)