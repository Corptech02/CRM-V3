#!/usr/bin/env python3
"""
Comprehensive ViciDial Sync System
- Scans ALL ViciDial lists for SALE leads
- Checks against existing leads/clients to avoid duplicates
- Pulls audio recordings from ViciDial
- Transcribes with Whisper
- Extracts policy details from transcription
- Creates properly formatted leads
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
import hashlib
import subprocess
import tempfile

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/var/www/vanguard/logs/vicidial-comprehensive-sync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"
DB_PATH = "/var/www/vanguard/vanguard.db"
AUDIO_CACHE_DIR = "/var/www/vanguard/vicidial-audio-cache"

# Create audio cache directory if it doesn't exist
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

class ComprehensiveViciDialSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
        self.session.verify = False
        self.db = sqlite3.connect(DB_PATH)
        self.existing_phones = set()
        self.existing_dots = set()
        self.existing_names = set()
        self.load_existing_records()

    def load_existing_records(self):
        """Load all existing leads/clients to check for duplicates"""
        cursor = self.db.cursor()

        # Get all existing leads
        cursor.execute("SELECT data FROM leads")
        for row in cursor.fetchall():
            try:
                data = json.loads(row[0])
                # Extract identifying information
                phone = self.normalize_phone(data.get('phone', ''))
                if phone:
                    self.existing_phones.add(phone)

                dot = data.get('dotNumber', '')
                if dot:
                    self.existing_dots.add(dot)

                # Normalize name for comparison
                name = data.get('name', '').upper().strip()
                if name:
                    self.existing_names.add(name)

                contact = data.get('contact', '').upper().strip()
                if contact:
                    self.existing_names.add(contact)

            except json.JSONDecodeError:
                continue

        logger.info(f"Loaded {len(self.existing_phones)} phone numbers, {len(self.existing_dots)} DOT numbers, {len(self.existing_names)} names from existing records")

    def normalize_phone(self, phone):
        """Normalize phone number to digits only"""
        return re.sub(r'\D', '', str(phone))[-10:]  # Last 10 digits

    def is_duplicate(self, lead_data):
        """Check if lead already exists in system"""
        phone = self.normalize_phone(lead_data.get('phone', ''))
        dot = lead_data.get('vendor_code', '')
        name = f"{lead_data.get('first_name', '')} {lead_data.get('last_name', '')}".upper().strip()

        # Check phone
        if phone and phone in self.existing_phones:
            logger.info(f"Duplicate found by phone: {phone}")
            return True

        # Check DOT
        if dot and dot in self.existing_dots:
            logger.info(f"Duplicate found by DOT: {dot}")
            return True

        # Check name (exact match)
        if name and name in self.existing_names:
            logger.info(f"Duplicate found by name: {name}")
            return True

        return False

    def scan_all_vicidial_lists(self):
        """Scan ALL ViciDial lists for SALE leads"""
        logger.info("=" * 60)
        logger.info("SCANNING ALL VICIDIAL LISTS")
        logger.info("=" * 60)

        all_sale_leads = []

        # First, get list of all lists
        lists_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php?ADD=100"
        response = self.session.get(lists_url)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find all list IDs - they're usually in links or table cells
            list_ids = set()

            # Method 1: Look for list links
            for link in soup.find_all('a'):
                href = link.get('href', '')
                if 'list_id=' in href:
                    match = re.search(r'list_id=(\d+)', href)
                    if match:
                        list_ids.add(match.group(1))

            # Method 2: Look in table cells for numeric list IDs
            for td in soup.find_all('td'):
                text = td.text.strip()
                if text.isdigit() and len(text) >= 3 and len(text) <= 5:
                    list_ids.add(text)

            # Add known lists
            list_ids.update(['999', '1000', '1001', '1002', '1003', '1213'])

            logger.info(f"Found {len(list_ids)} lists to scan: {sorted(list_ids)}")
        else:
            # Use default known lists
            list_ids = ['999', '1000', '1001', '1002', '1003', '1213']
            logger.info(f"Using default lists: {list_ids}")

        # Scan each list for SALE leads
        for list_id in sorted(list_ids):
            logger.info(f"\nScanning list {list_id}...")
            leads = self.get_leads_from_list(list_id)

            for lead in leads:
                # Check if it's a duplicate
                if not self.is_duplicate(lead):
                    all_sale_leads.append(lead)
                    logger.info(f"  ✓ New lead found: {lead['lead_id']} - {lead.get('first_name')} {lead.get('last_name')}")
                else:
                    logger.info(f"  ⊘ Skipping duplicate: {lead['lead_id']}")

        logger.info(f"\n✓ Total new SALE leads found: {len(all_sale_leads)}")
        return all_sale_leads

    def get_leads_from_list(self, list_id):
        """Get SALE status leads from a specific list"""
        url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
        params = {
            'list_id': list_id,
            'status': 'SALE',
            'DB': '',
            'submit': 'submit'
        }

        try:
            response = self.session.get(url, params=params)

            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            leads = []

            # Parse the HTML table for lead data
            for table in soup.find_all('table'):
                for row in table.find_all('tr'):
                    cells = row.find_all('td')
                    if len(cells) > 10:
                        lead_id = cells[0].text.strip()
                        if lead_id and lead_id.isdigit():
                            lead = {
                                'lead_id': lead_id,
                                'list_id': list_id,
                                'phone': cells[2].text.strip() if len(cells) > 2 else '',
                                'first_name': cells[3].text.strip() if len(cells) > 3 else '',
                                'last_name': cells[4].text.strip() if len(cells) > 4 else '',
                                'city': cells[5].text.strip() if len(cells) > 5 else '',
                                'state': cells[6].text.strip() if len(cells) > 6 else 'OH',
                                'vendor_code': cells[10].text.strip() if len(cells) > 10 else ''
                            }

                            # Only add unique leads
                            if not any(l['lead_id'] == lead_id for l in leads):
                                leads.append(lead)

            return leads

        except Exception as e:
            logger.error(f"Error scanning list {list_id}: {e}")
            return []

    def get_recording_url(self, lead_id, phone):
        """Construct recording URL for a lead"""
        # Try multiple date formats and patterns
        date_formats = [
            datetime.now().strftime("%Y%m%d"),
            datetime.now().strftime("%Y-%m-%d"),
            datetime.now().strftime("%y%m%d")
        ]

        recording_urls = []
        for date in date_formats:
            # Various ViciDial recording patterns
            recording_urls.extend([
                f"https://{VICIDIAL_HOST}/RECORDINGS/{date}-{phone}-{lead_id}.mp3",
                f"https://{VICIDIAL_HOST}/RECORDINGS/{date}_{phone}_{lead_id}.mp3",
                f"https://{VICIDIAL_HOST}/recordings/{date}-{phone}.mp3",
                f"https://{VICIDIAL_HOST}/vicidial/RECORDINGS/{lead_id}.mp3"
            ])

        return recording_urls

    def download_recording(self, lead_id, phone):
        """Download recording for a lead"""
        recording_urls = self.get_recording_url(lead_id, phone)

        for url in recording_urls:
            try:
                logger.info(f"Trying to download recording from: {url}")
                response = self.session.get(url, timeout=30)

                if response.status_code == 200 and len(response.content) > 1000:
                    # Save to cache
                    filename = f"{AUDIO_CACHE_DIR}/{lead_id}_{phone}.mp3"
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    logger.info(f"✓ Recording downloaded: {filename}")
                    return filename

            except Exception as e:
                continue

        logger.warning(f"No recording found for lead {lead_id}")
        return None

    def transcribe_audio(self, audio_file):
        """Transcribe audio using Whisper"""
        try:
            # Check if Whisper is available
            result = subprocess.run(
                ['python3', '-c', 'import whisper; print("OK")'],
                capture_output=True,
                text=True
            )

            if result.stdout.strip() == "OK":
                # Use Whisper
                logger.info("Transcribing with Whisper...")

                transcribe_script = """
import whisper
model = whisper.load_model("base")
result = model.transcribe("{}")
print(result["text"])
""".format(audio_file)

                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                    f.write(transcribe_script)
                    script_path = f.name

                result = subprocess.run(
                    ['python3', script_path],
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                os.unlink(script_path)

                if result.returncode == 0:
                    transcription = result.stdout.strip()
                    logger.info(f"✓ Transcription complete: {len(transcription)} characters")
                    return transcription
                else:
                    logger.error(f"Whisper error: {result.stderr}")
                    return None
            else:
                logger.warning("Whisper not available, using fallback")
                return None

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return None

    def extract_policy_from_transcription(self, transcription):
        """Extract insurance policy details from transcription"""
        if not transcription:
            return {}

        policy_info = {
            'current_carrier': '',
            'current_premium': 0,
            'quoted_premium': 0,
            'liability': '$1,000,000',
            'cargo': '$100,000',
            'fleet_size': '',
            'dot_number': '',
            'years_in_business': '',
            'commodities': ''
        }

        # Extract carrier
        carrier_match = re.search(
            r'(?:with|from|current carrier is|currently with)\s+(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty Mutual|Farmers)',
            transcription, re.I
        )
        if carrier_match:
            policy_info['current_carrier'] = carrier_match.group(1)

        # Extract current premium
        current_patterns = [
            r'(?:paying|current premium is|costs?)\s*\$?([\d,]+)\s*(?:per|/|a)\s*month',
            r'\$?([\d,]+)\s*(?:per|/|a)\s*month\s*(?:with|from)',
            r'(?:paying|costs?)\s*(?:about|around)?\s*\$?([\d,]+)'
        ]

        for pattern in current_patterns:
            match = re.search(pattern, transcription, re.I)
            if match:
                policy_info['current_premium'] = int(re.sub(r'[^\d]', '', match.group(1)))
                break

        # Extract quoted premium
        quoted_patterns = [
            r'(?:quote you|offer you|price is|can do)\s*\$?([\d,]+)\s*(?:per|/|a)\s*month',
            r'(?:bring it down to|reduce it to|save you)\s*\$?([\d,]+)',
            r'\$?([\d,]+)\s*(?:per|/|a)\s*month\s*(?:with us|with Vanguard)'
        ]

        for pattern in quoted_patterns:
            match = re.search(pattern, transcription, re.I)
            if match:
                policy_info['quoted_premium'] = int(re.sub(r'[^\d]', '', match.group(1)))
                break

        # Extract DOT number
        dot_match = re.search(r'DOT\s*(?:number|#)?\s*(?:is\s*)?(\d{6,8})', transcription, re.I)
        if dot_match:
            policy_info['dot_number'] = dot_match.group(1)

        # Extract fleet size
        fleet_patterns = [
            r'(\d+)\s*(?:trucks?|vehicles?|units?|trailers?)',
            r'(?:have|own|operate)\s*(\d+)',
            r'fleet\s*(?:of|size)?\s*(\d+)'
        ]

        for pattern in fleet_patterns:
            match = re.search(pattern, transcription, re.I)
            if match:
                policy_info['fleet_size'] = match.group(1) + " units"
                break

        # Extract years in business
        years_match = re.search(r'(\d+)\s*years?\s*(?:in business|operating|driving)', transcription, re.I)
        if years_match:
            policy_info['years_in_business'] = years_match.group(1)

        # Extract commodities
        commodity_patterns = [
            r'(?:haul|transport|carry)\s*([^.]+?)(?:\.|,|\sand)',
            r'(?:freight|cargo|commodity)\s*(?:is|are)?\s*([^.]+?)(?:\.|,|\sand)'
        ]

        for pattern in commodity_patterns:
            match = re.search(pattern, transcription, re.I)
            if match:
                policy_info['commodities'] = match.group(1).strip()
                break

        return policy_info

    def create_lead_from_vicidial(self, vicidial_lead, transcription="", policy_info=None):
        """Create properly formatted lead for Vanguard system"""
        lead_id = vicidial_lead['lead_id']

        # Format business name like existing leads
        first_name = vicidial_lead.get('first_name', '')
        last_name = vicidial_lead.get('last_name', '')

        if first_name and last_name:
            # Format like "CHARLES V MUMFORD JR / MUMFORD FARMS"
            full_name = f"{first_name} {last_name}".upper()
            business_suffix = f"{last_name} TRUCKING".upper()
            business_name = f"{full_name} / {business_suffix}"
            contact_name = full_name
        else:
            vendor_code = vicidial_lead.get('vendor_code', '')
            if vendor_code:
                business_name = f"DOT {vendor_code} TRUCKING"
            else:
                business_name = f"LEAD {lead_id} TRUCKING"
            contact_name = business_name.split('/')[0].strip()

        # Format phone
        phone = vicidial_lead.get('phone', '')
        if phone:
            digits = re.sub(r'\D', '', phone)
            if len(digits) == 10:
                phone = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"

        if not policy_info:
            policy_info = {}

        # Create lead data
        lead_data = {
            "id": lead_id,
            "name": business_name,
            "contact": contact_name,
            "phone": phone,
            "email": f"{contact_name.lower().replace(' ', '.')}@company.com" if contact_name else "",
            "product": "Commercial Auto",
            "stage": "new",
            "status": "hot_lead",
            "assignedTo": "Sales Team",
            "created": datetime.now().strftime("%-m/%-d/%Y"),
            "renewalDate": "",
            "premium": policy_info.get('quoted_premium', 0),
            "dotNumber": policy_info.get('dot_number', vicidial_lead.get('vendor_code', '')),
            "mcNumber": "",
            "yearsInBusiness": policy_info.get('years_in_business', 'Unknown'),
            "fleetSize": policy_info.get('fleet_size', 'Unknown'),
            "address": "",
            "city": vicidial_lead.get('city', '').upper(),
            "state": vicidial_lead.get('state', 'OH'),
            "zip": "",
            "radiusOfOperation": "Regional",
            "commodityHauled": policy_info.get('commodities', ''),
            "operatingStates": [vicidial_lead.get('state', 'OH')],
            "annualRevenue": "",
            "safetyRating": "Satisfactory",
            "currentCarrier": policy_info.get('current_carrier', ''),
            "currentPremium": f"${policy_info.get('current_premium', 0)}/month" if policy_info.get('current_premium') else "",
            "needsCOI": False,
            "insuranceLimits": {
                "liability": policy_info.get('liability', '$1,000,000'),
                "cargo": policy_info.get('cargo', '$100,000')
            },
            "source": "ViciDial",
            "leadScore": 85,
            "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
            "followUpDate": "",
            "notes": f"SALE from ViciDial list {vicidial_lead.get('list_id', '1000')}. Full transcript available in Call Transcript section." if transcription else f"SALE from ViciDial list {vicidial_lead.get('list_id', '1000')}.",
            "transcription": transcription,  # Backend field
            "transcriptText": transcription,  # Frontend expects this field
            "hasTranscript": bool(transcription),  # Flag for UI
            "tags": ["ViciDial", "Sale", f"List-{vicidial_lead.get('list_id', '1000')}"]
        }

        # Add savings calculation to notes if both premiums available
        if policy_info.get('current_premium') and policy_info.get('quoted_premium'):
            savings = policy_info.get('current_premium') - policy_info.get('quoted_premium')
            lead_data['notes'] += f" Savings: ${savings}/month."

        return lead_data

    def save_lead(self, lead_data):
        """Save lead to database"""
        cursor = self.db.cursor()

        cursor.execute(
            "INSERT OR REPLACE INTO leads (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            (lead_data['id'], json.dumps(lead_data))
        )

        self.db.commit()
        logger.info(f"✓ Saved lead: {lead_data['id']} - {lead_data['name']}")

    def comprehensive_sync(self):
        """Main comprehensive sync function - triggered by button"""
        logger.info("\n" + "=" * 60)
        logger.info("COMPREHENSIVE VICIDIAL SYNC STARTED")
        logger.info("=" * 60)

        results = {
            "success": True,
            "scanned_lists": 0,
            "total_found": 0,
            "duplicates_skipped": 0,
            "new_imported": 0,
            "with_recordings": 0,
            "with_transcriptions": 0,
            "errors": []
        }

        try:
            # Step 1: Scan all ViciDial lists
            all_leads = self.scan_all_vicidial_lists()
            results["total_found"] = len(all_leads)

            if not all_leads:
                logger.info("No new SALE leads found")
                return results

            # Step 2: Process each lead
            for lead in all_leads:
                try:
                    logger.info(f"\nProcessing lead {lead['lead_id']}...")

                    # Step 3: Download recording
                    audio_file = self.download_recording(lead['lead_id'], lead.get('phone', ''))

                    transcription = ""
                    policy_info = {}

                    if audio_file:
                        results["with_recordings"] += 1

                        # Step 4: Transcribe audio
                        transcription = self.transcribe_audio(audio_file)

                        if transcription:
                            results["with_transcriptions"] += 1

                            # Step 5: Extract policy details
                            policy_info = self.extract_policy_from_transcription(transcription)
                            logger.info(f"  Extracted: {policy_info}")

                    # Step 6: Create lead record
                    lead_data = self.create_lead_from_vicidial(lead, transcription, policy_info)

                    # Step 7: Save to database
                    self.save_lead(lead_data)
                    results["new_imported"] += 1

                    # Update existing records cache
                    self.existing_phones.add(self.normalize_phone(lead.get('phone', '')))
                    if lead.get('vendor_code'):
                        self.existing_dots.add(lead.get('vendor_code'))

                except Exception as e:
                    error_msg = f"Error processing lead {lead['lead_id']}: {e}"
                    logger.error(error_msg)
                    results["errors"].append(error_msg)

            logger.info("\n" + "=" * 60)
            logger.info("SYNC COMPLETE")
            logger.info(f"  Found: {results['total_found']} SALE leads")
            logger.info(f"  Imported: {results['new_imported']} new leads")
            logger.info(f"  With recordings: {results['with_recordings']}")
            logger.info(f"  With transcriptions: {results['with_transcriptions']}")
            logger.info("=" * 60)

        except Exception as e:
            error_msg = f"Sync failed: {e}"
            logger.error(error_msg)
            results["success"] = False
            results["errors"].append(error_msg)

        return results

def main():
    """Main entry point for manual or button-triggered sync"""
    sync = ComprehensiveViciDialSync()
    result = sync.comprehensive_sync()

    # Output as JSON for API
    print(json.dumps(result))

    return result

if __name__ == "__main__":
    main()