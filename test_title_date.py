#!/usr/bin/env python3
"""Test title field date extraction"""

from datetime import datetime

def parse_title_date(title):
    """Parse MMDD format title to MM/DD/YYYY date"""
    renewal_date = ""

    if title and len(title) == 4 and title.isdigit():
        # Title is in MMDD format (e.g., "1020" for October 20)
        month = title[:2]
        day = title[2:4]
        current_year = datetime.now().year
        # Format as MM/DD/YYYY
        renewal_date = f"{int(month)}/{int(day)}/{current_year}"

    return renewal_date

# Test cases
test_titles = [
    ("1020", "October 20"),
    ("0315", "March 15"),
    ("1231", "December 31"),
    ("0101", "January 1"),
    ("0706", "July 6"),
    ("", "Empty"),
    ("ABC", "Invalid"),
    ("12345", "Too long"),
    ("123", "Too short")
]

print("=" * 60)
print("TITLE FIELD DATE EXTRACTION TEST")
print("=" * 60)
print()

for title, description in test_titles:
    result = parse_title_date(title)
    status = "✓" if result else "✗"
    print(f"{status} Title: '{title}' ({description})")
    if result:
        print(f"  → Parsed as: {result}")
    else:
        print(f"  → No date extracted")
    print()

# Now test by fetching from ViciDial to see actual title fields
print("\n" + "=" * 60)
print("FETCHING ACTUAL TITLE FIELDS FROM VICIDIAL")
print("=" * 60)

import sys
sys.path.append('/var/www/vanguard')
from vicidial-fresh-sync import ViciDialSync

sync = ViciDialSync()

try:
    # Get all SALE leads with their title fields
    leads = sync.get_all_sale_leads()

    print(f"\nFound {len(leads)} SALE leads in ViciDial:")
    print()

    for lead in leads[:5]:  # Show first 5
        lead_id = lead.get('lead_id')
        title = lead.get('title', '')
        name = lead.get('full_name', 'Unknown')

        print(f"Lead {lead_id}: {name}")
        print(f"  Title field: '{title}'")

        renewal_date = parse_title_date(title)
        if renewal_date:
            print(f"  ✓ Renewal Date: {renewal_date}")
        else:
            print(f"  ✗ No valid date in title field")
        print()

except Exception as e:
    print(f"Error fetching from ViciDial: {e}")