#!/usr/bin/env python3
"""Get comments using the sync module's connection"""

import sys
import os

# Execute the sync script to get access to its methods
exec_globals = {}
with open('/var/www/vanguard/vicidial-fresh-sync.py') as f:
    code = f.read()
    # Prevent main from running
    code = code.replace('if __name__ == "__main__":', 'if False:')
    exec(code, exec_globals)

# Get the class
ViciDialSync = exec_globals.get('ViciDialSync')
if not ViciDialSync:
    print("Could not load ViciDialSync")
    exit(1)

# Create instance
print("Initializing ViciDial connection...")
sync = ViciDialSync()

# Get all SALE leads
print("\nFetching SALE leads from list 1000...")
all_leads = sync.get_all_sale_leads()

# Filter for list 1000 and our specific leads
target_leads = ['88546', '88571']

print("\n" + "=" * 80)
print("LEAD DETAILS FOR 88546 AND 88571")
print("=" * 80)

for lead in all_leads:
    lead_id = lead.get('lead_id')

    if lead_id in target_leads and lead.get('list_id') == '1000':
        print(f"\n📋 Lead {lead_id}: {lead.get('full_name', 'Unknown')}")
        print("-" * 60)

        # Show all fields we have
        print(f"  List ID: {lead.get('list_id')}")
        print(f"  Phone: {lead.get('phone')}")
        print(f"  City: {lead.get('city')}")
        print(f"  Vendor Code (col 3): '{lead.get('vendor_code', '')}'")
        print(f"  Agent (col 4): '{lead.get('agent', '')}'")
        print(f"  Title (col 9): '{lead.get('title', '')}'")
        print(f"  Last Call: {lead.get('last_call')}")

        # Now try to get the detail page for comments
        print("\n  Attempting to fetch detail page for comments...")

        import requests
        from bs4 import BeautifulSoup

        try:
            # Use the sync's existing session
            detail_url = f"https://204.13.233.29/vicidial/admin_modify_lead.php"
            params = {
                'lead_id': lead_id,
                'list_id': lead.get('list_id', '1000'),
                'ADD': '3'
            }

            response = sync.session.get(detail_url, params=params, verify=False)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Try to find comments in the response
            comments_textarea = soup.find('textarea', {'name': 'comments'})
            if comments_textarea:
                comments = comments_textarea.text.strip()
                print("\n  📝 COMMENTS FIELD:")
                print("  " + "-" * 50)
                if comments:
                    # Print comments line by line
                    for line in comments.split('\n'):
                        print(f"    {line}")
                else:
                    print("    (Empty)")
                print("  " + "-" * 50)
            else:
                # Try to find comments in text
                import re
                comments_match = re.search(r'<textarea[^>]*name=["\']comments["\'][^>]*>(.*?)</textarea>',
                                         response.text, re.DOTALL | re.IGNORECASE)
                if comments_match:
                    comments = comments_match.group(1).strip()
                    print("\n  📝 COMMENTS FIELD (extracted via regex):")
                    print("  " + "-" * 50)
                    if comments:
                        for line in comments.split('\n'):
                            print(f"    {line}")
                    else:
                        print("    (Empty)")
                    print("  " + "-" * 50)
                else:
                    print("  ❌ Could not find comments field in detail page")

                    # Check if we're on the right page
                    if "Modify Lead" in response.text:
                        print("  ✓ On Modify Lead page")
                    else:
                        print("  ✗ Not on Modify Lead page")

        except Exception as e:
            print(f"  ❌ Error fetching detail page: {e}")

print("\n" + "=" * 80)