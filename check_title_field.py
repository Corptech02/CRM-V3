#!/usr/bin/env python3
"""Check title field from ViciDial directly"""

import requests
from bs4 import BeautifulSoup

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "Leaddispute4490"

session = requests.Session()

# Login
login_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php"
login_data = {
    'ADD': '4A',
    'user': VICIDIAL_USER,
    'pass': VICIDIAL_PASS
}

response = session.post(login_url, data=login_data, verify=False)
if "Logged in as user" not in response.text:
    print("Failed to login")
    exit(1)

print("Logged in successfully")
print()

# Search list 1000 for SALE leads
list_id = "1000"
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

print(f"Checking title field (column 10) for SALE leads in list {list_id}:")
print("=" * 60)

for row in lead_rows[:10]:  # Check first 10
    cells = row.find_all('td')
    if len(cells) > 10:
        lead_id = cells[0].text.strip()
        full_name = cells[7].text.strip()
        title = cells[9].text.strip()  # Column 10 (0-indexed as 9)

        print(f"\nLead {lead_id}: {full_name}")
        print(f"  Title field content: '{title}'")

        # Check if it's a date
        if title and len(title) == 4 and title.isdigit():
            month = title[:2]
            day = title[2:4]
            print(f"  ✓ Appears to be date: {int(month)}/{int(day)}/2025")
        else:
            print(f"  ✗ Not a valid MMDD format")