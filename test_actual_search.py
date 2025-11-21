#!/usr/bin/env python3
"""Test the actual search method used by the sync"""

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

print("✅ Logged in successfully\n")

# Use the exact same search method as the sync
print("Searching list 1000 for SALE leads (using sync's method)...")
print("=" * 80)

url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
params = {
    'list_id': '1000',
    'status': 'SALE',
    'DB': '',
    'submit': 'submit'
}

response = session.get(url, params=params, verify=False)

if response.status_code == 200:
    print(f"Response received, length: {len(response.text)}")

    # Check if we got a valid response
    if "LEAD ID" in response.text:
        print("✓ Found LEAD ID in response")
    else:
        print("✗ No LEAD ID found in response")
        print("First 500 chars:", response.text[:500])

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the data table
    for table in soup.find_all('table'):
        header_row = table.find('tr')
        if header_row:
            headers = [cell.text.strip() for cell in header_row.find_all(['th', 'td'])]
            if 'LEAD ID' in headers:
                print("Found data table with columns:")
                for i, header in enumerate(headers):
                    print(f"  Column {i}: {header}")
                print()

                # Process data rows
                for row in table.find_all('tr')[1:]:  # Skip header
                    cells = row.find_all('td')
                    if len(cells) >= 11:
                        lead_id = cells[1].text.strip()  # LEAD ID column

                        # Only look at our target leads
                        if lead_id in ['88546', '88571']:
                            print(f"\n📋 Lead {lead_id}")
                            print("-" * 60)

                            # Show all columns
                            for i, cell in enumerate(cells):
                                if i < len(headers):
                                    print(f"  {headers[i]} (col {i}): '{cell.text.strip()}'")

                            # Now try to access the detail page for comments
                            print("\n  Attempting to get comments from detail page...")

                            # Find the link in the row
                            lead_link = row.find('a', href=lambda x: x and 'lead_id=' in x)
                            if lead_link:
                                detail_href = lead_link.get('href')
                                if not detail_href.startswith('http'):
                                    detail_href = f"https://{VICIDIAL_HOST}/vicidial/{detail_href}"

                                print(f"  Detail URL: {detail_href}")

                                detail_response = session.get(detail_href, verify=False)
                                detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

                                # Look for comments textarea
                                comments_textarea = detail_soup.find('textarea', {'name': 'comments'})
                                if comments_textarea:
                                    comments = comments_textarea.text.strip()
                                    print(f"\n  📝 COMMENTS FIELD:")
                                    print("  " + "-" * 50)
                                    if comments:
                                        for line in comments.split('\n'):
                                            print(f"    {line}")
                                    else:
                                        print("    (Empty)")
                                    print("  " + "-" * 50)
                                else:
                                    # Try alternative methods
                                    import re
                                    # Look for comments in the HTML
                                    comments_match = re.search(r'name="comments"[^>]*>(.*?)</textarea>',
                                                             detail_response.text, re.DOTALL)
                                    if comments_match:
                                        comments = comments_match.group(1).strip()
                                        print(f"\n  📝 COMMENTS (via regex):")
                                        print("  " + "-" * 50)
                                        for line in comments.split('\n'):
                                            print(f"    {line}")
                                        print("  " + "-" * 50)
                                    else:
                                        print("  ❌ Comments field not found")
                            else:
                                print("  ❌ No detail link found")

                break

print("\n" + "=" * 80)