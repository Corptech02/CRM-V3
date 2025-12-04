#!/usr/bin/env python3
"""
Vanguard ViciDial Sync - Adapted from Lead-Transfer to work with Vanguard format
Matches existing lead format like "CHARLES V MUMFORD JR / MUMFORD FARMS"
"""

import json
import logging
import os
import sqlite3
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import re
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/var/www/vanguard/logs/vicidial-sync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ViciDial Configuration
USERNAME = "6666"
PASSWORD = "corp06"
VICIDIAL_HOST = "204.13.233.29"
DB_PATH = "/var/www/vanguard/vanguard.db"

class VanguardViciDialSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(USERNAME, PASSWORD)
        self.session.verify = False
        self.db = sqlite3.connect(DB_PATH)
        self.processed_leads = self.load_processed_leads()

    def load_processed_leads(self):
        """Load list of already processed lead IDs"""
        cursor = self.db.cursor()
        cursor.execute("SELECT id FROM leads WHERE id LIKE '8%' AND LENGTH(id) = 5")
        return set(row[0] for row in cursor.fetchall())

    def get_sale_leads_from_list(self, list_id="1000"):
        """Get SALE leads from ViciDial list using web scraping"""
        url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
        params = {
            'list_id': list_id,
            'status': 'SALE',
            'DB': '',
            'submit': 'submit'
        }

        logger.info(f"Fetching SALE leads from list {list_id}")
        response = self.session.get(url, params=params)

        if response.status_code != 200:
            logger.error(f"Failed to fetch leads: {response.status_code}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        leads = []

        # Parse the HTML table for lead data
        for table in soup.find_all('table'):
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) > 10:
                    lead_id = cells[0].text.strip()
                    if lead_id and lead_id.isdigit():
                        # Skip if already processed
                        if lead_id in self.processed_leads:
                            continue

                        # Extract lead details
                        phone = cells[2].text.strip() if len(cells) > 2 else ''
                        first_name = cells[3].text.strip() if len(cells) > 3 else ''
                        last_name = cells[4].text.strip() if len(cells) > 4 else ''
                        city = cells[5].text.strip() if len(cells) > 5 else ''
                        state = cells[6].text.strip() if len(cells) > 6 else 'OH'
                        vendor_code = cells[10].text.strip() if len(cells) > 10 else ''

                        lead = {
                            'lead_id': lead_id,
                            'phone': phone,
                            'first_name': first_name,
                            'last_name': last_name,
                            'city': city,
                            'state': state,
                            'vendor_code': vendor_code,
                            'list_id': list_id
                        }

                        # Only add unique leads
                        if not any(l['lead_id'] == lead_id for l in leads):
                            leads.append(lead)
                            logger.info(f"Found new SALE lead: {lead_id} - {first_name} {last_name}")

        return leads

    def get_lead_details(self, lead_id):
        """Get detailed information for a specific lead"""
        url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
        params = {
            'lead_id': lead_id,
            'archive_search': 'No',
            'archive_log': '0'
        }

        response = self.session.get(url, params=params)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract additional details from the lead detail page
        details = {}

        # Look for comments/notes
        for textarea in soup.find_all('textarea'):
            if 'comments' in str(textarea.get('name', '')).lower():
                details['comments'] = textarea.text.strip()

        # Extract any custom fields
        for input_field in soup.find_all('input'):
            name = input_field.get('name', '')
            value = input_field.get('value', '')
            if name and value:
                details[name] = value

        return details

    def format_business_name(self, first_name, last_name, vendor_code):
        """Format business name like existing leads"""
        # Match format: "CHARLES V MUMFORD JR / MUMFORD FARMS"
        if first_name and last_name:
            # Create business name in proper format
            full_name = f"{first_name} {last_name}".upper()

            # Check for common business indicators
            if any(word in full_name for word in ['LLC', 'INC', 'CORP', 'TRUCKING', 'TRANSPORT']):
                return full_name

            # If it's a person's name, add business suffix
            if 'TRUCKING' not in full_name and 'TRANSPORT' not in full_name:
                # Format like "CHARLES V MUMFORD JR / MUMFORD FARMS"
                business_suffix = f"{last_name} TRUCKING".upper()
                return f"{full_name} / {business_suffix}"

            return full_name
        elif vendor_code:
            return f"DOT {vendor_code} TRUCKING"
        else:
            return "UNKNOWN TRUCKING"

    def format_phone(self, phone):
        """Format phone number to (XXX) XXX-XXXX"""
        # Remove all non-digits
        digits = re.sub(r'\D', '', phone)

        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        else:
            return phone

    def format_renewal_date(self, raw_date):
        """Format renewal date from ViciDial address3 field to M/D/YYYY format"""
        if not raw_date:
            return ""

        # Clean up the raw date string
        raw_date = raw_date.strip()

        # Try various date formats that might be in address3
        date_patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # M/D/YYYY or MM/DD/YYYY
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # M-D-YYYY or MM-DD-YYYY
            r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD
            r'(\d{1,2})/(\d{1,2})/(\d{2})',  # M/D/YY or MM/DD/YY
        ]

        for pattern in date_patterns:
            match = re.search(pattern, raw_date)
            if match:
                if len(match.group(3)) == 4:  # Full year
                    if pattern == r'(\d{4})-(\d{1,2})-(\d{1,2})':  # YYYY-MM-DD format
                        year, month, day = match.groups()
                        return f"{int(month)}/{int(day)}/{year}"
                    else:  # M/D/YYYY or M-D-YYYY format
                        month, day, year = match.groups()
                        return f"{int(month)}/{int(day)}/{year}"
                else:  # 2-digit year, assume 20XX
                    month, day, year = match.groups()
                    full_year = f"20{year}"
                    return f"{int(month)}/{int(day)}/{full_year}"

        # If no standard date pattern found, look for month names
        month_names = {
            'jan': '1', 'january': '1',
            'feb': '2', 'february': '2',
            'mar': '3', 'march': '3',
            'apr': '4', 'april': '4',
            'may': '5',
            'jun': '6', 'june': '6',
            'jul': '7', 'july': '7',
            'aug': '8', 'august': '8',
            'sep': '9', 'september': '9',
            'oct': '10', 'october': '10',
            'nov': '11', 'november': '11',
            'dec': '12', 'december': '12'
        }

        raw_lower = raw_date.lower()
        for month_name, month_num in month_names.items():
            if month_name in raw_lower:
                # Extract year and day if possible
                year_match = re.search(r'(\d{4})', raw_date)
                day_match = re.search(r'\b(\d{1,2})\b', raw_date)
                if year_match and day_match:
                    return f"{month_num}/{day_match.group(1)}/{year_match.group(1)}"

        # If nothing matches, return the original string
        return raw_date

    def extract_policy_from_comments(self, comments):
        """Extract insurance policy details from comments/notes"""
        policy_info = {
            'current_carrier': '',
            'current_premium': '',
            'quoted_premium': 0,
            'liability': '$1,000,000',
            'cargo': '$100,000'
        }

        if not comments:
            return policy_info

        # Extract carrier
        carrier_match = re.search(r'(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty)', comments, re.I)
        if carrier_match:
            policy_info['current_carrier'] = carrier_match.group(1)

        # Extract current premium
        current_match = re.search(r'(?:paying|current)\s*\$?([\d,]+)\s*(?:per|/)\s*month', comments, re.I)
        if current_match:
            amount = int(re.sub(r'[^\d]', '', current_match.group(1)))
            policy_info['current_premium'] = f"${amount}/month (${amount * 12:,}/year)"

        # Extract quoted premium
        quoted_match = re.search(r'(?:quoted?|offer)\s*\$?([\d,]+)\s*(?:per|/)\s*month', comments, re.I)
        if quoted_match:
            policy_info['quoted_premium'] = int(re.sub(r'[^\d]', '', quoted_match.group(1)))

        return policy_info

    def create_lead_record(self, vicidial_lead, lead_details=None):
        """Create lead record in Vanguard format"""
        lead_id = vicidial_lead['lead_id']

        # Format business name
        business_name = self.format_business_name(
            vicidial_lead.get('first_name', ''),
            vicidial_lead.get('last_name', ''),
            vicidial_lead.get('vendor_code', '')
        )

        # Format contact name
        contact_name = f"{vicidial_lead.get('first_name', '')} {vicidial_lead.get('last_name', '')}".strip()
        if not contact_name or contact_name == ' ':
            contact_name = business_name.split('/')[0].strip()

        # Format phone
        phone = self.format_phone(vicidial_lead.get('phone', ''))

        # Extract policy info from comments if available
        comments = lead_details.get('comments', '') if lead_details else ''
        policy_info = self.extract_policy_from_comments(comments)

        # Extract renewal date from address3 field (where ViciDial stores renewal date)
        renewal_date = ""
        if lead_details and 'address3' in lead_details:
            raw_renewal = lead_details['address3'].strip()
            if raw_renewal:
                # Try to format the renewal date to match existing format (M/D/YYYY)
                renewal_date = self.format_renewal_date(raw_renewal)

        # Create lead data matching existing format
        lead_data = {
            "id": lead_id,
            "name": business_name,
            "contact": contact_name.upper(),
            "phone": phone,
            "email": f"{contact_name.lower().replace(' ', '.')}@company.com" if contact_name else "",
            "product": "Commercial Auto",
            "stage": "new",  # All new imports start as 'new'
            "status": "hot_lead",
            "assignedTo": "Sales Team",
            "created": datetime.now().strftime("%-m/%-d/%Y"),
            "renewalDate": renewal_date,
            "premium": policy_info['quoted_premium'],
            "dotNumber": vicidial_lead.get('vendor_code', ''),
            "mcNumber": "",
            "yearsInBusiness": "Unknown",
            "fleetSize": "Unknown",
            "address": "",
            "city": vicidial_lead.get('city', '').upper(),
            "state": vicidial_lead.get('state', 'OH'),
            "zip": "",
            "radiusOfOperation": "Regional",
            "commodityHauled": "",
            "operatingStates": [vicidial_lead.get('state', 'OH')],
            "annualRevenue": "",
            "safetyRating": "Satisfactory",
            "currentCarrier": policy_info['current_carrier'],
            "currentPremium": policy_info['current_premium'],
            "needsCOI": False,
            "insuranceLimits": {
                "liability": policy_info['liability'],
                "cargo": policy_info['cargo']
            },
            "source": "ViciDial",
            "leadScore": 85,
            "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
            "followUpDate": "",
            "notes": f"SALE from ViciDial list {vicidial_lead.get('list_id', '1000')}. {comments}",
            "tags": ["ViciDial", "Sale", f"List-{vicidial_lead.get('list_id', '1000')}"]
        }

        return lead_data

    def save_lead(self, lead_data):
        """Save lead to database"""
        cursor = self.db.cursor()

        # Check if lead already exists
        cursor.execute("SELECT id FROM leads WHERE id = ?", (lead_data['id'],))
        if cursor.fetchone():
            logger.info(f"Lead {lead_data['id']} already exists, updating...")
            cursor.execute(
                "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(lead_data), lead_data['id'])
            )
        else:
            cursor.execute(
                "INSERT INTO leads (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                (lead_data['id'], json.dumps(lead_data))
            )
            logger.info(f"✓ Added new lead: {lead_data['id']} - {lead_data['name']}")

        self.db.commit()
        self.processed_leads.add(lead_data['id'])

    def sync_vicidial_leads(self):
        """Main sync function - called by Sync ViciDial Now button"""
        logger.info("=" * 60)
        logger.info("Starting ViciDial sync...")

        total_imported = 0

        # Check multiple lists if needed
        lists_to_check = ["1000", "1001", "1002"]  # Add more lists as needed

        for list_id in lists_to_check:
            logger.info(f"Checking list {list_id}...")
            leads = self.get_sale_leads_from_list(list_id)

            for lead in leads:
                try:
                    # Get additional lead details if available
                    lead_details = self.get_lead_details(lead['lead_id'])

                    # Create lead record in Vanguard format
                    lead_data = self.create_lead_record(lead, lead_details)

                    # Save to database
                    self.save_lead(lead_data)
                    total_imported += 1

                except Exception as e:
                    logger.error(f"Error processing lead {lead['lead_id']}: {e}")

        logger.info(f"Sync complete! Imported {total_imported} new leads")
        logger.info("=" * 60)

        return {
            "success": True,
            "imported": total_imported,
            "message": f"Successfully imported {total_imported} ViciDial leads"
        }

def main():
    """Run the sync manually or via cron"""
    sync = VanguardViciDialSync()
    result = sync.sync_vicidial_leads()
    print(json.dumps(result))

if __name__ == "__main__":
    main()