#!/usr/bin/env python3
"""Get comments field for specific leads from ViciDial"""

import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings()

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "Leaddispute4490"

def get_lead_details(session, lead_id, list_id):
    """Get detailed info including comments for a specific lead"""

    # Get lead details page
    detail_url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
    params = {
        'lead_id': lead_id,
        'list_id': list_id,
        'ADD': '3'
    }

    try:
        response = session.get(detail_url, params=params, verify=False)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find comments textarea
        comments_textarea = soup.find('textarea', {'name': 'comments'})
        comments = comments_textarea.text if comments_textarea else 'Comments field not found'

        # Also get title field
        title_input = soup.find('input', {'name': 'title'})
        title = title_input.get('value', '') if title_input else 'Title field not found'

        # Get vendor_lead_code
        vendor_input = soup.find('input', {'name': 'vendor_lead_code'})
        vendor_code = vendor_input.get('value', '') if vendor_input else 'Vendor field not found'

        return {
            'comments': comments,
            'title': title,
            'vendor_code': vendor_code
        }
    except Exception as e:
        return {'error': str(e)}

# Main script
session = requests.Session()

print("Logging into ViciDial...")
login_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php"
login_data = {
    'ADD': '4A',
    'user': VICIDIAL_USER,
    'pass': VICIDIAL_PASS
}

response = session.post(login_url, data=login_data, verify=False)

if "Invalid" in response.text or "ERROR" in response.text:
    print("❌ Login failed")
    exit(1)

print("✅ Logged in successfully\n")

# Check both leads in list 1000
leads_to_check = [
    ('88546', '1000', 'CHRISTOPHER STEVENS'),
    ('88571', '1000', 'ABDI OMAR')
]

print("=" * 80)
print("COMMENTS FIELD FOR LEADS IN LIST 1000")
print("=" * 80)

for lead_id, list_id, name in leads_to_check:
    print(f"\n📋 Lead {lead_id}: {name}")
    print("-" * 60)

    details = get_lead_details(session, lead_id, list_id)

    if 'error' in details:
        print(f"❌ Error: {details['error']}")
    else:
        print(f"Title Field: '{details['title']}'")
        print(f"Vendor Code: '{details['vendor_code']}'")
        print(f"\nComments Field:")
        print("-" * 40)
        comments = details['comments'].strip()
        if comments:
            print(comments)
        else:
            print("(No comments)")
        print("-" * 40)

        # Check if comments contain a date
        import re
        date_patterns = [
            r'(\d{1,2})[/-](\d{1,2})[/-]?(\d{2,4})?',
            r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}',
            r'expires?\s+\d{1,2}[/-]\d{1,2}',
            r'renewal\s+\d{1,2}[/-]\d{1,2}'
        ]

        found_date = False
        for pattern in date_patterns:
            match = re.search(pattern, comments, re.IGNORECASE)
            if match:
                print(f"\n📅 Possible date found in comments: {match.group()}")
                found_date = True
                break

        if not found_date:
            print("\n(No dates found in comments)")

print("\n" + "=" * 80)