#!/usr/bin/env python3
"""
List ALL leads found in ViciDial list 1000 with details
"""

import requests
from bs4 import BeautifulSoup
from requests.auth import HTTPBasicAuth
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ViciDial Configuration
BASE_URL = "https://204.13.233.29/vicidial"
USERNAME = "6666"
PASSWORD = "corp06"
LIST_ID = "1000"

session = requests.Session()
session.verify = False
session.auth = HTTPBasicAuth(USERNAME, PASSWORD)

print("=" * 80)
print("LISTING ALL SALE LEADS IN VICIDIAL LIST 1000")
print("=" * 80)

# Login test
test_url = f"{BASE_URL}/admin.php"
response = session.get(test_url)

if response.status_code == 200:
    print("✅ Connected to ViciDial\n")
else:
    print(f"❌ Connection failed: {response.status_code}")
    exit()

# Search for SALE leads
search_url = f"{BASE_URL}/admin_search_lead.php"
search_data = {
    'DB': '',
    'list_id': LIST_ID,
    'status': 'SALE',
    'submit': 'submit'
}

print(f"Searching for SALE status leads in list {LIST_ID}...")
print("-" * 80)

response = session.post(search_url, data=search_data)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract all text to see what we're getting
    text_content = soup.get_text()

    # Look for leads in tables
    all_leads = []
    tables = soup.find_all('table')

    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 3:  # Likely a data row
                cell_text = [cell.text.strip() for cell in cells]
                # Check if first cell looks like a lead ID (numeric)
                if cell_text[0].isdigit():
                    all_leads.append(cell_text)

    # Also look for any links that might contain lead info
    links = soup.find_all('a')
    lead_links = [link for link in links if 'lead_id=' in str(link.get('href', ''))]

    print(f"\n📊 FOUND {len(all_leads)} SALE LEADS IN LIST 1000:\n")

    if all_leads:
        for i, lead in enumerate(all_leads, 1):
            print(f"Lead {i}:")
            print(f"  Lead ID: {lead[0] if len(lead) > 0 else 'N/A'}")
            print(f"  Phone: {lead[1] if len(lead) > 1 else 'N/A'}")
            print(f"  Name: {lead[2] if len(lead) > 2 else 'N/A'} {lead[3] if len(lead) > 3 else ''}")
            print(f"  Other Fields: {', '.join(lead[4:8]) if len(lead) > 4 else 'N/A'}")
            print("-" * 40)

    # If we found lead links, show them too
    if lead_links:
        print(f"\nFound {len(lead_links)} lead links in the response")
        for link in lead_links[:10]:  # Show first 10
            print(f"  - {link.text.strip()}: {link.get('href')}")

    # Show a sample of the raw response to see what we're getting
    if len(all_leads) == 0:
        print("\nNo structured leads found. Raw response sample:")
        # Find any line with numbers that might be lead data
        lines = response.text.split('\n')
        for line in lines:
            if 'SALE' in line or (any(char.isdigit() for char in line) and len(line) < 200):
                print(f"  {line.strip()[:150]}")

else:
    print(f"Search failed: {response.status_code}")

print("\n" + "=" * 80)