#!/usr/bin/env python3
"""Debug title field extraction from ViciDial"""

import sys
import os
import re
from datetime import datetime

# Add the path to import the sync module
sys.path.insert(0, '/var/www/vanguard')

# Import with exec to handle hyphenated filename
with open('/var/www/vanguard/vicidial-fresh-sync.py') as f:
    code = compile(f.read(), 'vicidial-fresh-sync.py', 'exec')
    exec(code)

# Create sync instance
sync = ViciDialSync()

print("=" * 80)
print("DEBUGGING TITLE FIELD EXTRACTION")
print("=" * 80)

try:
    # Get all SALE leads
    all_leads = sync.get_all_sale_leads()

    print(f"\nFound {len(all_leads)} SALE leads")
    print("\n" + "-" * 80)

    for lead in all_leads:
        lead_id = lead.get('lead_id')
        name = lead.get('full_name', 'Unknown')
        title = lead.get('title', '')
        vendor_code = lead.get('vendor_code', '')  # DOT number
        list_id = lead.get('list_id', '')

        print(f"\n📋 Lead {lead_id} (List {list_id})")
        print(f"   Name: {name}")
        print(f"   DOT: {vendor_code}")
        print(f"   Title Field Raw: '{title}'")

        # Parse title as date
        if title and len(title) == 4 and title.isdigit():
            month = int(title[:2])
            day = int(title[2:4])
            year = datetime.now().year
            print(f"   ✅ Parsed as date: {month}/{day}/{year}")
        elif title:
            print(f"   ❌ Title not in MMDD format (length={len(title)}, isdigit={title.isdigit()})")
        else:
            print(f"   ❌ Title field is empty")

        # Now get the lead details page to check comments
        print(f"   Fetching detailed info...")
        try:
            import requests
            from bs4 import BeautifulSoup
            import urllib3
            urllib3.disable_warnings()

            # Use existing session from sync
            detail_url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
            response = sync.session.get(detail_url, params={
                'lead_id': lead_id,
                'ADD': '3',
                'list_id': list_id
            }, verify=False)

            soup = BeautifulSoup(response.text, 'html.parser')

            # Get comments
            comments_textarea = soup.find('textarea', {'name': 'comments'})
            if comments_textarea:
                comments = comments_textarea.text[:200]
                print(f"   Comments: {comments}")

                # Look for dates in comments
                date_patterns = [
                    r'(\d{1,2})[/-](\d{1,2})[/-]?(\d{2,4})?',
                    r'expires?\s+(\d{1,2})[/-](\d{1,2})',
                    r'renewal\s+(\d{1,2})[/-](\d{1,2})',
                ]

                for pattern in date_patterns:
                    match = re.search(pattern, comments, re.IGNORECASE)
                    if match:
                        print(f"   📅 Found date in comments: {match.group()}")
                        break
            else:
                print(f"   Comments: Not found")

        except Exception as e:
            print(f"   Error fetching details: {e}")

    print("\n" + "=" * 80)

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()