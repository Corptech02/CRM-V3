#!/usr/bin/env python3
"""Get comments field using correct authentication"""

import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings()

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"  # Correct password

# Create session with HTTP Basic Auth
session = requests.Session()
session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
session.verify = False

print("Searching for SALE leads in list 1000...")
print("=" * 80)

# Use the exact search method from the sync
url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
params = {
    'list_id': '1000',
    'status': 'SALE',
    'DB': '',
    'submit': 'submit'
}

response = session.get(url, params=params, timeout=10)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the data table
    for table in soup.find_all('table'):
        header_row = table.find('tr')
        if header_row:
            headers = [cell.text.strip() for cell in header_row.find_all(['th', 'td'])]
            if 'LEAD ID' in headers:
                print("\nFound SALE leads. Showing data for 88546 and 88571:")
                print("-" * 80)

                # Process data rows
                for row in table.find_all('tr')[1:]:  # Skip header
                    cells = row.find_all('td')
                    if len(cells) >= 11:
                        lead_id = cells[1].text.strip()  # LEAD ID column

                        # Only show our target leads
                        if lead_id in ['88546', '88571']:
                            name = cells[7].text.strip() if len(cells) > 7 else ''
                            vendor = cells[3].text.strip() if len(cells) > 3 else ''
                            title = cells[9].text.strip() if len(cells) > 9 else ''

                            print(f"\n📋 Lead {lead_id}: {name}")
                            print(f"  Vendor/DOT (col 3): '{vendor}'")
                            print(f"  Title (col 9): '{title}'")

                            # Try to get to the detail page
                            detail_url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
                            detail_params = {
                                'lead_id': lead_id,
                                'list_id': '1000',
                                'ADD': '3'
                            }

                            print("\n  Fetching detail page for comments...")
                            detail_response = session.get(detail_url, params=detail_params, verify=False)

                            if detail_response.status_code == 200:
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
                                    # Try to find it in the raw HTML
                                    import re
                                    comments_match = re.search(r'<textarea[^>]*name=["\']comments["\'][^>]*>(.*?)</textarea>',
                                                             detail_response.text, re.DOTALL | re.IGNORECASE)
                                    if comments_match:
                                        comments = comments_match.group(1).strip()
                                        print(f"\n  📝 COMMENTS FIELD (extracted):")
                                        print("  " + "-" * 50)
                                        if comments:
                                            for line in comments.split('\n'):
                                                print(f"    {line}")
                                        else:
                                            print("    (Empty)")
                                        print("  " + "-" * 50)
                                    else:
                                        print("  ❌ Could not find comments field")
                            else:
                                print(f"  ❌ Failed to fetch detail page (status: {detail_response.status_code})")

                break
else:
    print(f"❌ Failed to search leads (status: {response.status_code})")

print("\n" + "=" * 80)