#!/usr/bin/env python3
"""Search for specific leads in ViciDial and check their fields"""

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
login_data = {'ADD': '4A', 'user': VICIDIAL_USER, 'pass': VICIDIAL_PASS}
response = session.post(login_url, data=login_data, verify=False)

if "Invalid" in response.text or "ERROR" in response.text:
    print("❌ Login failed")
    exit(1)

print("✅ Logged in\n")

# Search for specific lead IDs
lead_ids_to_find = ['88546', '88571']

print("=" * 80)
print("SEARCHING FOR SPECIFIC LEADS IN VICIDIAL")
print("=" * 80)

for search_lead_id in lead_ids_to_find:
    print(f"\n🔍 Searching for Lead {search_lead_id}...")

    # Search by SALE status in list 1000
    search_url = f"https://{VICIDIAL_HOST}/vicidial/admin_listloader_fourth_gen.php"
    search_data = {
        'list_id_override': '1000',
        'search_status': 'SALE',
        'ADD': '100'
    }

    response = session.post(search_url, data=search_data, verify=False)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find lead row
    lead_rows = soup.find_all('tr', bgcolor=['#B9CBFD', '#9BB9FB'])

    if lead_rows:
        for row in lead_rows:
            cells = row.find_all('td')
            if len(cells) > 10:
                lead_id = cells[0].text.strip()

                if lead_id == search_lead_id:
                    print(f"✅ Found Lead {lead_id}")

                    # Get all fields
                    fields = {
                        'Lead ID (col 0)': cells[0].text.strip() if len(cells) > 0 else '',
                        'Col 1': cells[1].text.strip() if len(cells) > 1 else '',
                        'Status (col 2)': cells[2].text.strip() if len(cells) > 2 else '',
                        'Vendor (col 3)': cells[3].text.strip() if len(cells) > 3 else '',
                        'Source (col 4)': cells[4].text.strip() if len(cells) > 4 else '',
                        'List (col 5)': cells[5].text.strip() if len(cells) > 5 else '',
                        'Phone (col 6)': cells[6].text.strip() if len(cells) > 6 else '',
                        'Name (col 7)': cells[7].text.strip() if len(cells) > 7 else '',
                        'City (col 8)': cells[8].text.strip() if len(cells) > 8 else '',
                        'Title (col 9)': cells[9].text.strip() if len(cells) > 9 else '',
                        'Last Call (col 10)': cells[10].text.strip() if len(cells) > 10 else '',
                    }

                    # Print all fields
                    for field_name, value in fields.items():
                        print(f"  {field_name}: '{value}'")

                    # Now try to get to the detail page for comments
                    print("\n  Trying to access detail page...")
                    detail_link = row.find('a', href=lambda x: x and 'lead_id=' in x)
                    if detail_link:
                        detail_href = detail_link.get('href')
                        if not detail_href.startswith('http'):
                            detail_href = f"https://{VICIDIAL_HOST}/vicidial/{detail_href}"

                        detail_response = session.get(detail_href, verify=False)
                        detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

                        # Look for comments
                        comments_textarea = detail_soup.find('textarea', {'name': 'comments'})
                        if comments_textarea:
                            comments = comments_textarea.text.strip()
                            print(f"\n  📝 COMMENTS FIELD:")
                            print("  " + "-" * 50)
                            if comments:
                                # Print each line of comments indented
                                for line in comments.split('\n'):
                                    print(f"  {line}")
                            else:
                                print("  (Empty)")
                            print("  " + "-" * 50)
                        else:
                            print("  Comments field not found on detail page")
                    else:
                        print("  No detail link found")

                    break
    else:
        print(f"❌ Lead {search_lead_id} not found in search results")

print("\n" + "=" * 80)