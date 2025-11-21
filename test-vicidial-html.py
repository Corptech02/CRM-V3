#!/usr/bin/env python3
"""Test ViciDial HTML structure to understand column positions"""

import requests
from bs4 import BeautifulSoup
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

USERNAME = "6666"
PASSWORD = "corp06"
VICIDIAL_HOST = "204.13.233.29"

session = requests.Session()
session.auth = requests.auth.HTTPBasicAuth(USERNAME, PASSWORD)
session.verify = False

url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
params = {
    'list_id': '999',
    'status': 'SALE',
    'DB': '',
    'submit': 'submit'
}

print("Fetching ViciDial SALE leads from list 999...")
response = session.get(url, params=params)

if response.status_code != 200:
    print(f"Error: {response.status_code}")
    exit()

soup = BeautifulSoup(response.text, 'html.parser')

# Find all tables and look for the one with lead data
tables = soup.find_all('table')
print(f"Found {len(tables)} tables")

for table_idx, table in enumerate(tables):
    rows = table.find_all('tr')
    if len(rows) > 1:  # Has more than just header
        print(f"\n=== TABLE {table_idx} ===")

        # Check first row (header or data)
        first_row = rows[0]
        cells = first_row.find_all(['th', 'td'])

        if len(cells) > 10:
            print(f"This table has {len(cells)} columns")
            print("First row cells:")
            for i, cell in enumerate(cells[:15]):  # Show first 15 cells
                text = cell.text.strip()
                print(f"  Cell {i}: {text[:30]}")

            # Show second row if it exists
            if len(rows) > 1:
                print("\nSecond row (likely data):")
                data_row = rows[1]
                data_cells = data_row.find_all('td')
                for i, cell in enumerate(data_cells[:15]):
                    text = cell.text.strip()
                    print(f"  Cell {i}: {text[:30]}")

                # Try to identify what each column might be
                if len(data_cells) > 10:
                    print("\nGuessed mapping:")
                    print(f"  Lead ID: {data_cells[0].text.strip() if len(data_cells) > 0 else 'N/A'}")
                    print(f"  List ID: {data_cells[1].text.strip() if len(data_cells) > 1 else 'N/A'}")
                    print(f"  Status: {data_cells[2].text.strip() if len(data_cells) > 2 else 'N/A'}")
                    print(f"  Phone: {data_cells[5].text.strip() if len(data_cells) > 5 else 'N/A'}")