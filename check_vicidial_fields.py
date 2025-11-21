#!/usr/bin/env python3
"""Check actual title and comments fields in ViciDial"""

import requests
from bs4 import BeautifulSoup
import re
import urllib3
urllib3.disable_warnings()

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "Leaddispute4490"

def check_lead_details(lead_id, list_id="1000"):
    """Get detailed info for a specific lead"""

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
        return None

    # Get lead details
    detail_url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
    detail_params = {
        'lead_id': lead_id,
        'ADD': '3',
        'list_id': list_id
    }

    response = session.get(detail_url, params=detail_params, verify=False)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find title field
    title_input = soup.find('input', {'name': 'title'})
    title_value = title_input.get('value', '') if title_input else ''

    # Find comments field
    comments_textarea = soup.find('textarea', {'name': 'comments'})
    comments_value = comments_textarea.text if comments_textarea else ''

    # Find vendor_lead_code (DOT number)
    vendor_input = soup.find('input', {'name': 'vendor_lead_code'})
    vendor_value = vendor_input.get('value', '') if vendor_input else ''

    # Find name fields
    first_name_input = soup.find('input', {'name': 'first_name'})
    last_name_input = soup.find('input', {'name': 'last_name'})
    first_name = first_name_input.get('value', '') if first_name_input else ''
    last_name = last_name_input.get('value', '') if last_name_input else ''

    return {
        'title': title_value,
        'comments': comments_value,
        'vendor_lead_code': vendor_value,
        'first_name': first_name,
        'last_name': last_name
    }

# Check specific leads
test_leads = [
    ('88546', '1000', 'CHRISTOPHER STEVENS'),
    ('88571', '1000', 'ABDI OMAR'),
    ('43869', '1006', 'FEVEN DEBESAY'),
    ('43923', '1006', 'MELVIN KENNEDY')
]

print("=" * 80)
print("CHECKING ACTUAL VICIDIAL FIELDS")
print("=" * 80)

for lead_id, list_id, expected_name in test_leads:
    print(f"\n📋 Lead {lead_id} ({expected_name}):")
    print("-" * 40)

    details = check_lead_details(lead_id, list_id)

    if details:
        print(f"  Title Field: '{details['title']}'")
        print(f"  DOT Number: '{details['vendor_lead_code']}'")
        print(f"  Name: {details['first_name']} {details['last_name']}")
        print(f"  Comments: {details['comments'][:200] if details['comments'] else 'Empty'}")

        # Try to extract date from title
        title = details['title']
        if title and len(title) == 4 and title.isdigit():
            month = int(title[:2])
            day = int(title[2:4])
            print(f"  📅 Title Date Parse: {month}/{day}/2025")
        else:
            print(f"  ❌ Title not in MMDD format")

        # Try to extract date from comments
        if details['comments']:
            # Look for date patterns like MM/DD, MM-DD, etc
            date_patterns = [
                r'(\d{1,2})[/-](\d{1,2})',  # MM/DD or MM-DD
                r'expires?\s+(\d{1,2})[/-](\d{1,2})',  # expires MM/DD
                r'renewal\s+(\d{1,2})[/-](\d{1,2})',  # renewal MM/DD
                r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',  # MM/DD/YY or MM/DD/YYYY
            ]

            for pattern in date_patterns:
                match = re.search(pattern, details['comments'], re.IGNORECASE)
                if match:
                    print(f"  📅 Found date in comments: {match.group()}")
                    break
    else:
        print("  ❌ Failed to fetch lead details")

print("\n" + "=" * 80)