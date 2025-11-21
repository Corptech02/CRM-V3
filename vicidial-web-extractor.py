#!/usr/bin/env python3
"""
ViciDial Web Extractor - Extracts SALE leads from list 1000
Using web scraping method to bypass API limitations
"""

import requests
from bs4 import BeautifulSoup
import json
import sqlite3
from datetime import datetime
import re

# ViciDial Configuration
BASE_URL = "https://204.13.233.29/vicidial"
USERNAME = "6666"
PASSWORD = "corp06"
LIST_ID = "1000"

# Database path - use the main database
DB_PATH = "/var/www/vanguard/vanguard.db"

class ViciDialExtractor:
    def __init__(self):
        self.session = requests.Session()
        self.session.verify = False  # Disable SSL verification

    def login(self):
        """Login to ViciDial admin interface using Basic Auth"""
        from requests.auth import HTTPBasicAuth

        # Set up Basic Auth for all requests
        self.session.auth = HTTPBasicAuth(USERNAME, PASSWORD)

        # Test login
        test_url = f"{BASE_URL}/admin.php"

        print(f"Logging into ViciDial as {USERNAME}...")
        response = self.session.get(test_url)

        if response.status_code == 200:
            print("✅ Login successful!")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False

    def get_list_leads(self, list_id, status_filter=None):
        """Get all leads from a specific list"""
        print(f"\nFetching leads from list {list_id}...")

        # URL for downloading list
        download_url = f"{BASE_URL}/admin_listloader_fourth_gen.php"

        params = {
            'list_id_field': list_id,
            'submit_file': 'submit',
            'DB': '',
            'action': 'DOWNLOAD_LISTS'
        }

        if status_filter:
            params['status'] = status_filter

        response = self.session.get(download_url, params=params)

        if response.status_code == 200:
            # Parse CSV-like response
            lines = response.text.strip().split('\n')
            if len(lines) > 1:
                headers = lines[0].split(',')
                leads = []

                for line in lines[1:]:
                    values = line.split(',')
                    if len(values) >= len(headers):
                        lead = dict(zip(headers, values))
                        leads.append(lead)

                print(f"✅ Found {len(leads)} leads in list {list_id}")
                return leads
            else:
                print(f"No leads found in list {list_id}")
                return []
        else:
            print(f"Failed to fetch list {list_id}")
            return []

    def search_sale_leads(self, list_id):
        """Search for SALE status leads in a specific list"""
        print(f"\nSearching for SALE leads in list {list_id}...")

        search_url = f"{BASE_URL}/admin_search_lead.php"

        # Search parameters
        search_data = {
            'DB': '',
            'list_id': list_id,
            'status': 'SALE',
            'submit': 'submit'
        }

        response = self.session.post(search_url, data=search_data)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find all lead data in the response
            leads = []

            # Look for table with lead data
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) > 5:  # Lead row has multiple cells
                        lead = {
                            'lead_id': cells[0].text.strip(),
                            'list_id': list_id,
                            'status': 'SALE',
                            'phone_number': cells[1].text.strip() if len(cells) > 1 else '',
                            'first_name': cells[2].text.strip() if len(cells) > 2 else '',
                            'last_name': cells[3].text.strip() if len(cells) > 3 else '',
                            'vendor_code': cells[4].text.strip() if len(cells) > 4 else '',
                            'source': 'ViciDial Web Extract'
                        }

                        # Only add if it has a lead_id
                        if lead['lead_id'] and lead['lead_id'].isdigit():
                            leads.append(lead)

            print(f"✅ Found {len(leads)} SALE leads")
            return leads
        else:
            print(f"Search failed: {response.status_code}")
            return []

    def save_to_database(self, leads):
        """Save extracted leads to the database"""
        if not leads:
            print("No leads to save")
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        imported_count = 0

        for lead in leads:
            try:
                # Create lead ID using the actual ViciDial lead ID
                vicidial_id = lead.get('lead_id', '')
                lead_id = f"VICI-{vicidial_id}"

                # Check if already exists
                cursor.execute("SELECT id FROM leads WHERE id = ?", (lead_id,))
                if cursor.fetchone():
                    print(f"Lead {lead_id} already exists, skipping")
                    continue

                # Prepare lead data using exact format as existing leads
                # Extract actual name from the lead data
                contact_name = f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip()
                if not contact_name or contact_name == "SALE" or "SALE" in contact_name:
                    # Try to extract from other fields
                    if isinstance(lead, dict) and len(lead) > 6:
                        # Look for actual name in other fields
                        contact_name = lead.get('vendor_lead_code', '') or contact_name

                # Format phone number
                phone = lead.get('phone_number', '')
                if phone and len(phone) == 10:
                    phone = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
                elif phone and not phone.startswith('('):
                    # Try to format any phone number
                    phone_digits = ''.join(filter(str.isdigit, phone))
                    if len(phone_digits) == 10:
                        phone = f"({phone_digits[:3]}) {phone_digits[3:6]}-{phone_digits[6:]}"

                # Create business name from contact or DOT
                business_name = f"{contact_name} TRUCKING" if contact_name and contact_name != "Unknown" else f"DOT {lead.get('vendor_code', vicidial_id)}"

                lead_data = {
                    "id": lead_id,
                    "name": business_name.upper(),
                    "contact": contact_name.upper() if contact_name else "UNKNOWN",
                    "phone": phone,
                    "email": f"{contact_name.lower().replace(' ', '.')}@company.com" if contact_name else "",
                    "product": "Commercial Auto",
                    "stage": "qualified",
                    "assignedTo": "Sales Team",
                    "created": datetime.now().strftime("%-m/%-d/%Y"),
                    "renewalDate": "",
                    "premium": 0,
                    "dotNumber": lead.get('vendor_code', '') or vicidial_id,
                    "mcNumber": "",
                    "yearsInBusiness": "Unknown",
                    "fleetSize": "Unknown",
                    "address": "",
                    "city": "OHIO",
                    "state": "OH",
                    "zip": "",
                    "radiusOfOperation": "Unknown",
                    "commodityHauled": "",
                    "operatingStates": ["OH"],
                    "annualRevenue": "",
                    "safetyRating": "",
                    "currentCarrier": "",
                    "currentPremium": "",
                    "needsCOI": False,
                    "insuranceLimits": {},
                    "source": "ViciDial Sale",
                    "leadScore": 85,
                    "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
                    "followUpDate": "",
                    "notes": f"ViciDial SALE lead from list {lead.get('list_id', '')} - Hot lead ready for follow-up"
                }

                # Insert into database
                cursor.execute("""
                    INSERT INTO leads (id, data, created_at, updated_at)
                    VALUES (?, ?, datetime('now'), datetime('now'))
                """, (lead_id, json.dumps(lead_data)))

                imported_count += 1
                print(f"✅ Imported: {lead_id} - {lead_data['name']}")

            except Exception as e:
                print(f"Error importing lead: {e}")

        conn.commit()
        conn.close()

        print(f"\n🎉 Successfully imported {imported_count} new SALE leads!")
        return imported_count

def main():
    print("=" * 60)
    print("VICIDIAL WEB EXTRACTOR - FETCHING SALE LEADS")
    print("=" * 60)

    extractor = ViciDialExtractor()

    # Login to ViciDial
    if not extractor.login():
        print("Failed to login to ViciDial")
        return

    # Search for SALE leads in list 1000
    sale_leads = extractor.search_sale_leads(LIST_ID)

    if sale_leads:
        print(f"\nFound {len(sale_leads)} SALE leads to import")

        # Save to database
        imported = extractor.save_to_database(sale_leads)

        print(f"\n✅ Import complete! {imported} new leads added to the system")
    else:
        # Try alternative method - get all leads from list
        print("\nTrying alternative method - fetching all list 1000 leads...")
        all_leads = extractor.get_list_leads(LIST_ID)

        # Filter for SALE status
        sale_leads = [l for l in all_leads if l.get('status') == 'SALE']

        if sale_leads:
            print(f"Found {len(sale_leads)} SALE leads")
            imported = extractor.save_to_database(sale_leads)
            print(f"\n✅ Import complete! {imported} new leads added")
        else:
            print("No SALE leads found in list 1000")

if __name__ == "__main__":
    # Suppress SSL warnings
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    main()