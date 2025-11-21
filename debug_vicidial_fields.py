#!/usr/bin/env python3
"""Debug what's actually in ViciDial fields"""

import sys
sys.path.insert(0, '/var/www/vanguard')

# Import the sync module
with open('/var/www/vanguard/vicidial-fresh-sync.py') as f:
    code = compile(f.read(), 'vicidial-fresh-sync.py', 'exec')
    exec(code)

# Create sync instance
sync = ViciDialSync()

print("=" * 80)
print("DEBUGGING VICIDIAL FIELD VALUES")
print("=" * 80)

# Get all SALE leads with raw field values
all_leads = sync.get_all_sale_leads()

for lead in all_leads:
    lead_id = lead.get('lead_id')
    name = lead.get('full_name', 'Unknown')
    title = lead.get('title', '')
    vendor_code = lead.get('vendor_code', '')
    list_id = lead.get('list_id', '')

    print(f"\n📋 Lead {lead_id} in List {list_id}: {name}")
    print(f"   Title Field: '{title}'")
    print(f"   Vendor Code: '{vendor_code}'")

    # Parse renewal date using the same logic
    renewal_date = ""

    # Check title field
    if title and len(title) == 4 and title.isdigit():
        month = int(title[:2])
        day = int(title[2:4])
        year = 2025
        renewal_date = f"{month}/{day}/{year}"
        print(f"   ✅ Title parsed as: {renewal_date}")
    elif title:
        print(f"   ❌ Title not MMDD format: len={len(title)}, isdigit={title.isdigit()}")

    # Check vendor_code field
    if not renewal_date and vendor_code and '/' in vendor_code:
        import re
        date_match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', vendor_code)
        if date_match:
            month, day, year = date_match.groups()
            renewal_date = f"{int(month)}/{int(day)}/{year}"
            print(f"   ✅ Vendor code parsed as: {renewal_date}")

    if not renewal_date:
        print(f"   ⚠️ No renewal date found")
    else:
        print(f"   📅 FINAL RENEWAL DATE: {renewal_date}")

print("\n" + "=" * 80)