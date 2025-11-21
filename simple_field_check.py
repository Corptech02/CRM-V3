#!/usr/bin/env python3
"""Simple check of ViciDial fields"""

import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings()

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "Leaddispute4490"

session = requests.Session()

# Login
login_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php"
login_data = {'ADD': '4A', 'user': VICIDIAL_USER, 'pass': VICIDIAL_PASS}
response = session.post(login_url, data=login_data, verify=False)

if "Invalid" in response.text or "Error" in response.text:
    print("Login failed")
    exit(1)

print("Checking ViciDial fields for specific leads...")
print("=" * 60)

# Check list 1000 for leads 88546 and 88571
for list_id in ['1000']:
    search_url = f"https://{VICIDIAL_HOST}/vicidial/admin_listloader_fourth_gen.php"
    search_data = {
        'list_id_override': list_id,
        'search_status': 'SALE',
        'ADD': '100'
    }

    response = session.post(search_url, data=search_data, verify=False)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find lead rows
    lead_rows = soup.find_all('tr', bgcolor=['#B9CBFD', '#9BB9FB'])

    for row in lead_rows:
        cells = row.find_all('td')
        if len(cells) > 10:
            lead_id = cells[0].text.strip()

            # Check all SALE leads
            if True:
                vendor = cells[3].text.strip() if len(cells) > 3 else ''
                name = cells[7].text.strip() if len(cells) > 7 else ''
                title = cells[9].text.strip() if len(cells) > 9 else ''

                print(f"\n📋 Lead {lead_id}: {name}")
                print(f"   Column 4 (vendor): '{vendor}'")
                print(f"   Column 10 (title): '{title}'")

                # Check what the renewal date should be
                if title and len(title) == 4 and title.isdigit():
                    month = int(title[:2])
                    day = int(title[2:4])
                    print(f"   ✅ Title is MMDD: {month}/{day}/2025")
                else:
                    print(f"   ❌ Title not MMDD: '{title}'")

                if vendor and '/' in vendor:
                    print(f"   📅 Vendor has date: {vendor}")
                elif vendor.isdigit() and len(vendor) > 4:
                    print(f"   🔢 Vendor is DOT: {vendor}")