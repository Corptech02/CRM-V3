#!/usr/bin/env python3
"""Manually check what dates should be for each lead"""

from datetime import datetime

print("=" * 80)
print("MANUAL DATE CHECK BASED ON KNOWN DATA")
print("=" * 80)

# Based on what we know from the database and previous runs
leads_data = [
    {
        'id': '88546',
        'name': 'CHRISTOPHER STEVENS',
        'title': '1021',  # This is what we've been seeing
        'vendor_code': '3481784',  # This is the DOT number
        'expected': 'Should be different per user'
    },
    {
        'id': '88571',
        'name': 'ABDI OMAR',
        'title': '1021',  # This is what we've been seeing
        'vendor_code': '1297534',  # This is the DOT number
        'expected': 'Should be different per user'
    },
    {
        'id': '43869',
        'name': 'FEVEN DEBESAY',
        'title': '',  # Empty
        'vendor_code': '09/16/2025',  # Date in vendor field
        'expected': '9/16/2025 (correct)'
    },
    {
        'id': '43923',
        'name': 'MELVIN KENNEDY',
        'title': '',  # Empty
        'vendor_code': '09/19/2025',  # Date in vendor field
        'expected': '9/19/2025 (correct)'
    }
]

print("\nCurrent parsing results:")
print("-" * 40)

for lead in leads_data:
    print(f"\nLead {lead['id']}: {lead['name']}")
    print(f"  Title field: '{lead['title']}'")
    print(f"  Vendor field: '{lead['vendor_code']}'")

    # Apply the same logic as in the sync
    renewal_date = ""
    title = lead['title']
    vendor_code = lead['vendor_code']

    if title and len(title) == 4 and title.isdigit():
        month = int(title[:2])
        day = int(title[2:4])
        renewal_date = f"{month}/{day}/2025"
        print(f"  → Parsed from title: {renewal_date}")
    elif vendor_code and '/' in vendor_code:
        import re
        date_match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', vendor_code)
        if date_match:
            month, day, year = date_match.groups()
            renewal_date = f"{int(month)}/{int(day)}/{year}"
            print(f"  → Parsed from vendor: {renewal_date}")

    print(f"  Result: {renewal_date}")
    print(f"  Expected: {lead['expected']}")

print("\n" + "=" * 80)
print("ISSUE: Both 88546 and 88571 have '1021' in title field")
print("This gives them both 10/21/2025")
print("User says these are inaccurate - they should have different dates")
print("=" * 80)

print("\nPossible issues:")
print("1. The title field in ViciDial might have been updated to all be '1021'")
print("2. We might be reading the wrong column from ViciDial")
print("3. The real dates might be in comments or another field")
print("4. The dates might need to come from the actual transcript analysis")