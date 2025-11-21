#!/usr/bin/env python3
"""
Test ViciDial scan to see actual data structure
"""

import requests
from bs4 import BeautifulSoup
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

session = requests.Session()
session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
session.verify = False

# Search for SALE leads in list 1000
url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
params = {
    'list_id': '1000',
    'status': 'SALE',
    'DB': '',
    'submit': 'submit'
}

try:
    response = session.get(url, params=params, timeout=10)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find all tables
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables")

        for i, table in enumerate(tables):
            rows = table.find_all('tr')
            print(f"\nTable {i} has {len(rows)} rows")

            # Check first few rows to understand structure
            for j, row in enumerate(rows[:3]):
                cells = row.find_all(['td', 'th'])
                print(f"  Row {j}: {len(cells)} cells")
                for k, cell in enumerate(cells[:15]):  # First 15 cells
                    text = cell.text.strip()[:30]  # First 30 chars
                    print(f"    Cell {k}: {text}")
                print()

except Exception as e:
    print(f"Error: {e}")