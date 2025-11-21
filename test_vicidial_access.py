#!/usr/bin/env python3
"""Test ViciDial access and field extraction"""

import sys
import os

# Add path and import the sync module
sys.path.insert(0, '/var/www/vanguard')

# Import the sync module by exec to handle hyphen in filename
exec_globals = {}
with open('/var/www/vanguard/vicidial-fresh-sync.py') as f:
    exec(f.read(), exec_globals)

# Create sync instance using the class from exec'd code
ViciDialSync = exec_globals['ViciDialSync']
sync = ViciDialSync()

print("Testing ViciDial field extraction...")
print("=" * 60)

# Get all SALE leads
try:
    leads = sync.get_all_sale_leads()
    print(f"Found {len(leads)} SALE leads\n")

    # Show details for each lead
    for lead in leads:
        lead_id = lead.get('lead_id')
        name = lead.get('full_name', 'Unknown')
        title = lead.get('title', '')
        vendor_code = lead.get('vendor_code', '')
        list_id = lead.get('list_id', '')

        print(f"Lead {lead_id} (List {list_id}): {name}")
        print(f"  Title field: '{title}'")
        print(f"  Vendor code: '{vendor_code}'")

        # Parse what the renewal date should be
        if title == '1021':
            print(f"  → Title '1021' should be: 10/21/2025")
        elif title == '1221':
            print(f"  → Title '1221' should be: 12/21/2025")
        elif title and len(title) == 4 and title.isdigit():
            month = int(title[:2])
            day = int(title[2:4])
            print(f"  → Title '{title}' should be: {month}/{day}/2025")

        if vendor_code and '/' in vendor_code:
            print(f"  → Vendor code is a date: {vendor_code}")

        print()

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()