#!/usr/bin/env python3
"""Directly check title field from ViciDial search results"""

import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings()

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "Leaddispute4490"

session = requests.Session()

# Login
print("Logging into ViciDial...")
login_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php"
login_data = {
    'ADD': '4A',
    'user': VICIDIAL_USER,
    'pass': VICIDIAL_PASS
}

response = session.post(login_url, data=login_data, verify=False)
if "Logged in as user" in response.text:
    print("✅ Logged in successfully\n")
else:
    print("❌ Login failed")
    exit(1)

# Check each list for SALE leads
lists_to_check = ['1000', '1006']

for list_id in lists_to_check:
    print(f"\n{'=' * 60}")
    print(f"LIST {list_id} - SALE LEADS")
    print(f"{'=' * 60}")

    # Search for SALE status
    search_url = f"https://{VICIDIAL_HOST}/vicidial/admin_listloader_fourth_gen.php"
    search_data = {
        'list_id_override': list_id,
        'search_status': 'SALE',
        'ADD': '100'
    }

    response = session.post(search_url, data=search_data, verify=False)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all lead rows
    lead_rows = soup.find_all('tr', bgcolor=['#B9CBFD', '#9BB9FB'])

    print(f"Found {len(lead_rows)} SALE leads\n")

    # Table headers to understand columns
    header_row = soup.find('tr', bgcolor='#015B91')
    if header_row:
        headers = [th.text.strip() for th in header_row.find_all(['th', 'td'])]
        print("Column Headers:")
        for i, header in enumerate(headers):
            print(f"  Col {i}: {header}")
        print()

    for row in lead_rows[:10]:  # First 10 leads
        cells = row.find_all('td')

        if len(cells) > 10:
            # Extract fields by position
            lead_id = cells[0].text.strip() if len(cells) > 0 else ''
            status = cells[2].text.strip() if len(cells) > 2 else ''
            vendor = cells[3].text.strip() if len(cells) > 3 else ''  # DOT
            source = cells[4].text.strip() if len(cells) > 4 else ''
            list_col = cells[5].text.strip() if len(cells) > 5 else ''
            phone = cells[6].text.strip() if len(cells) > 6 else ''
            name = cells[7].text.strip() if len(cells) > 7 else ''
            city = cells[8].text.strip() if len(cells) > 8 else ''
            title = cells[9].text.strip() if len(cells) > 9 else ''  # Title field!
            last_call = cells[10].text.strip() if len(cells) > 10 else ''

            print(f"Lead {lead_id}: {name}")
            print(f"  Status: {status}")
            print(f"  DOT (vendor): {vendor}")
            print(f"  Phone: {phone}")
            print(f"  City: {city}")
            print(f"  Title Field: '{title}'")
            print(f"  Last Call: {last_call}")

            # Parse title as date
            if title and len(title) == 4 and title.isdigit():
                month = int(title[:2])
                day = int(title[2:4])
                print(f"  ✅ Title parsed as date: {month}/{day}/2025")
            else:
                print(f"  ❌ Title not in MMDD format")

            print()