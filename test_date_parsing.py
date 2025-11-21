#!/usr/bin/env python3
"""Test date parsing logic for both title and vendor_code fields"""

import re
from datetime import datetime

def parse_renewal_date(title, vendor_code):
    """Parse renewal date from either title or vendor_code field"""
    renewal_date = ""

    # First check title field for MMDD format
    if title and len(title) == 4 and title.isdigit():
        # Title is in MMDD format (e.g., "1020" for October 20)
        month = title[:2]
        day = title[2:4]
        current_year = datetime.now().year
        # Format as MM/DD/YYYY
        renewal_date = f"{int(month)}/{int(day)}/{current_year}"
        print(f"  ✅ Found date in title field (MMDD): {title} → {renewal_date}")

    # If no date in title, check vendor_code for MM/DD/YYYY format
    elif vendor_code and '/' in vendor_code:
        # vendor_code might contain date like "09/16/2025"
        date_match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', vendor_code)
        if date_match:
            month, day, year = date_match.groups()
            renewal_date = f"{int(month)}/{int(day)}/{year}"
            print(f"  ✅ Found date in vendor_code field (MM/DD/YYYY): {vendor_code} → {renewal_date}")
        else:
            print(f"  ❌ vendor_code has '/' but not a valid date: {vendor_code}")
    else:
        if title:
            print(f"  ❌ Title '{title}' not in MMDD format")
        if vendor_code and vendor_code.isdigit() and len(vendor_code) > 4:
            print(f"  ℹ️ vendor_code appears to be DOT number: {vendor_code}")

    return renewal_date

# Test cases based on what we're seeing
test_cases = [
    # Lead 88546 - Christopher Stevens
    ("1021", "3481784", "Christopher Stevens - title has date, vendor has DOT"),

    # Lead 88571 - Abdi Omar
    ("1021", "1297534", "Abdi Omar - title has date, vendor has DOT"),

    # Lead 43869 - Feven Debesay (vendor_code might have date)
    ("", "09/16/2025", "Feven Debesay - vendor_code has date"),

    # Lead 43923 - Melvin Kennedy (vendor_code might have date)
    ("", "09/19/2025", "Melvin Kennedy - vendor_code has date"),

    # Other possible formats
    ("0315", "", "Title with MMDD, no vendor"),
    ("", "1234567", "No date, vendor is DOT"),
    ("ABC", "123", "Invalid formats"),
    ("1231", "09/15/2025", "Both have dates - title takes precedence"),
]

print("=" * 80)
print("TESTING RENEWAL DATE PARSING LOGIC")
print("=" * 80)

for title, vendor_code, description in test_cases:
    print(f"\n📋 {description}")
    print(f"  Title: '{title}'")
    print(f"  Vendor Code: '{vendor_code}'")

    renewal_date = parse_renewal_date(title, vendor_code)

    if renewal_date:
        print(f"  📅 RESULT: Renewal Date = {renewal_date}")
    else:
        print(f"  ❌ RESULT: No renewal date extracted")

print("\n" + "=" * 80)