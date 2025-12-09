#!/usr/bin/env python3
"""
Complete ViciDial Sync Pipeline
1. Connect to ViciDial at 204.13.233.29
2. Scan ALL lists for SALE leads
3. Download call recordings
4. Transcribe with Deepgram
5. Process with OpenAI
"""

import sys
import json
import requests
import os
import time
from datetime import datetime
from bs4 import BeautifulSoup
import urllib3
import asyncio

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Add parent directory for imports
sys.path.append('/var/www/vanguard')

# Import our modules
import importlib.util

# Load Deepgram module
deepgram_spec = importlib.util.spec_from_file_location(
    "deepgram_transcription",
    "/var/www/vanguard/deepgram-transcription.py"
)
deepgram_module = importlib.util.module_from_spec(deepgram_spec)
deepgram_spec.loader.exec_module(deepgram_module)
DeepgramTranscriber = deepgram_module.DeepgramTranscriber

# Load OpenAI module
openai_spec = importlib.util.spec_from_file_location(
    "openai_processor",
    "/var/www/vanguard/openai-processor.py"
)
openai_module = importlib.util.module_from_spec(openai_spec)
openai_spec.loader.exec_module(openai_module)
OpenAIProcessor = openai_module.OpenAIProcessor

# ViciDial Configuration
VICIDIAL_HOST = "204.13.233.29"
USERNAME = "6666"
PASSWORD = "corp06"

class ViciDialCompleteSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(USERNAME, PASSWORD)
        self.session.verify = False
        self.deepgram = DeepgramTranscriber()
        self.openai = OpenAIProcessor()
        self.leads_found = []

    def scan_all_lists(self):
        """Scan ALL ViciDial lists for SALE leads and check active status"""
        print(f"🔍 Connecting to ViciDial at {VICIDIAL_HOST}...")

        # All possible lists to scan
        all_lists = ['998', '999', '1000', '1001', '1002', '1003', '1004', '1005', '1006']  # Real active lists

        all_leads = []
        list_summary = {}
        seen_lead_ids = set()  # Track unique lead IDs to prevent duplicates

        for list_id in all_lists:
            print(f"📋 Scanning List {list_id}...")

            # Get SALE leads from the list first
            leads = self.get_leads_from_list(list_id)

            # Remove duplicates based on lead ID
            unique_leads = []
            if leads:
                for lead in leads:
                    lead_id = lead.get('id', '')
                    if lead_id and lead_id not in seen_lead_ids:
                        seen_lead_ids.add(lead_id)
                        unique_leads.append(lead)
                    elif lead_id in seen_lead_ids:
                        print(f"  🔄 Skipping duplicate lead {lead_id}: {lead.get('name', 'Unknown')}")

            # Then check if list is active (using leads count as hint)
            is_active = self.check_list_active_status(list_id, has_leads=(len(unique_leads) > 0))

            if unique_leads:
                all_leads.extend(unique_leads)
                # Map list IDs to their actual ViciDial names
                list_names = {
                    '998': 'OH Hunter',
                    '999': 'TX Hunter',
                    '1000': 'IN Hunter',
                    '1001': 'OH Grant',
                    '1005': 'TX Grant',
                    '1006': 'IN Grant'
                }

                list_summary[list_id] = {
                    'listId': list_id,
                    'listName': list_names.get(list_id, f'List {list_id}'),
                    'saleCount': len(unique_leads),
                    'active': is_active
                }
                status_icon = "🟢" if is_active else "🟠"
                if len(leads) != len(unique_leads):
                    print(f"  ✅ Found {len(unique_leads)} unique SALE leads (filtered {len(leads) - len(unique_leads)} duplicates) in List {list_id} {status_icon}")
                else:
                    print(f"  ✅ Found {len(unique_leads)} SALE leads in List {list_id} {status_icon}")
            else:
                # Map list IDs to their actual ViciDial names
                list_names = {
                    '998': 'OH Hunter',
                    '999': 'TX Hunter',
                    '1000': 'IN Hunter',
                    '1001': 'OH Grant',
                    '1005': 'TX Grant',
                    '1006': 'IN Grant'
                }

                list_summary[list_id] = {
                    'listId': list_id,
                    'listName': list_names.get(list_id, f'List {list_id}'),
                    'saleCount': 0,
                    'active': is_active
                }
                status_icon = "🟢" if is_active else "🟠"
                print(f"  ⚪ No SALE leads in List {list_id} {status_icon}")

        print(f"\n📊 Total: {len(all_leads)} unique SALE leads found across all lists")
        return all_leads, list_summary

    def check_list_active_status(self, list_id, has_leads=False):
        """Check if a ViciDial list is active (Y) or inactive (N) by scanning admin pages"""
        try:
            print(f"    🔍 Scanning ViciDial admin for List {list_id} Y/N status...")

            # Access the main lists admin page (ADD=100) - this shows all lists with their Y/N status
            lists_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php"
            lists_params = {
                'ADD': '100',  # Main lists administration page
                'DB': ''
            }

            response = self.session.get(lists_url, params=lists_params, timeout=15)

            if response.status_code == 200:
                # Parse the HTML to find table rows with list information
                import re

                # Look for table rows that contain our list_id
                # The format we saw is: <tr...><td><a href=...>999</a></td>...<td> N</td>...

                # Find all table rows that contain our list_id
                pattern = rf'<tr[^>]*>.*?{re.escape(list_id)}.*?</tr>'
                matches = re.findall(pattern, response.text, re.DOTALL | re.IGNORECASE)

                for match in matches:
                    # Parse this table row to extract the active status
                    # The active status is typically in the 7th column (index 6)
                    soup = BeautifulSoup(match, 'html.parser')
                    cells = soup.find_all(['td', 'th'])

                    if len(cells) >= 7:
                        # Check if first cell contains our list_id to confirm this is the right row
                        first_cell_text = cells[0].get_text().strip()
                        if list_id in first_cell_text:
                            # Active status is in the 7th column (index 6)
                            active_status = cells[6].get_text().strip().upper()

                            if active_status == 'Y':
                                print(f"    🟢 List {list_id} is ACTIVE (Y) from ViciDial admin")
                                return True
                            elif active_status == 'N':
                                print(f"    🟠 List {list_id} is INACTIVE (N) from ViciDial admin")
                                return False
                            else:
                                print(f"    ⚠️ List {list_id} active status unclear: '{active_status}'")

                # If we found the list but couldn't parse Y/N, try text pattern matching
                if list_id in response.text:
                    print(f"    📋 Found List {list_id} in admin page, extracting row data...")

                    # Extract the specific row for debugging
                    import re
                    row_pattern = rf'<tr[^>]*class="records_list_[xy]"[^>]*onclick="[^"]*list_id={re.escape(list_id)}[^"]*"[^>]*>.*?</tr>'
                    row_match = re.search(row_pattern, response.text, re.IGNORECASE | re.DOTALL)

                    if row_match:
                        row_html = row_match.group(0)
                        print(f"    🔍 Found row HTML for List {list_id}")

                        # Parse the row to extract Y/N from the 7th column
                        row_soup = BeautifulSoup(row_html, 'html.parser')
                        cells = row_soup.find_all('td')

                        if len(cells) >= 7:
                            # The active status is in the 7th column (index 6)
                            active_cell = cells[6]
                            status_text = active_cell.get_text().strip().upper()

                            print(f"    📊 List {list_id} active column contains: '{status_text}'")

                            if 'Y' in status_text:
                                print(f"    🟢 List {list_id} is ACTIVE (Y) from admin parsing")
                                return True
                            elif 'N' in status_text:
                                print(f"    🟠 List {list_id} is INACTIVE (N) from admin parsing")
                                return False
                            else:
                                print(f"    ⚠️ List {list_id} status unclear: '{status_text}'")
                        else:
                            print(f"    ⚠️ List {list_id} row has only {len(cells)} columns, expected 7+")
                    else:
                        print(f"    ❌ Could not find table row for List {list_id}")

                print(f"    ⚠️ Could not find Y/N status for List {list_id} in admin page")
            else:
                print(f"    ❌ Failed to access ViciDial admin page (HTTP {response.status_code})")

            # Final fallback - assume inactive if can't determine
            print(f"    🔄 Defaulting List {list_id} to INACTIVE (parsing failed)")
            return False

        except Exception as e:
            print(f"    ⚠️ Error scanning List {list_id}: {str(e)[:50]}...")
            return False

    def get_leads_from_list(self, list_id):
        """Get SALE leads from a specific ViciDial list"""
        try:
            url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
            params = {
                'list_id': list_id,
                'status': 'SALE',
                'DB': '',
                'submit': 'submit'
            }

            response = self.session.get(url, params=params, timeout=10)

            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            leads = []

            # Find the data table
            for table in soup.find_all('table'):
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) == 11:  # ViciDial lead table format
                        row_num = cells[0].text.strip()
                        if row_num.isdigit():
                            lead = {
                                'id': cells[1].text.strip(),
                                'status': cells[2].text.strip(),
                                'vendor_id': cells[3].text.strip(),
                                'last_agent': cells[4].text.strip(),
                                'list_id': cells[5].text.strip(),
                                'phone': cells[6].text.strip(),
                                'name': cells[7].text.strip(),
                                'city': cells[8].text.strip(),
                                'security': cells[9].text.strip(),
                                'last_call': cells[10].text.strip()
                            }

                            if lead['status'] == 'SALE':
                                leads.append(lead)

            return leads

        except Exception as e:
            print(f"  ⚠️ Error scanning list {list_id}: {e}")
            return []

    def get_recording_url(self, lead_id, phone):
        """Get the recording URL for a lead by checking the ViciDial lead modification page"""
        try:
            print(f"    🔍 Checking ViciDial lead page for recording...")

            # Access the lead modification page where recordings are listed
            url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
            params = {
                'lead_id': lead_id,
                'archive_search': 'No',
                'archive_log': '0'
            }

            response = self.session.get(url, params=params, timeout=15)

            if response.status_code == 200:
                # Look for recording URLs in the response
                import re

                # Pattern 1: Look for href links to recording files
                recording_pattern = r'href="(http[^"]*RECORDINGS[^"]*\.(?:mp3|wav))"'
                matches = re.findall(recording_pattern, response.text, re.IGNORECASE)

                if matches:
                    recording_url = matches[0]  # Take the first recording found
                    print(f"    ✅ Found recording URL: {recording_url}")
                    return recording_url

                # Pattern 2: Look for audio source tags
                source_pattern = r'src\s*=\s*[\'"]([^"\']*RECORDINGS[^"\']*\.(?:mp3|wav))[\'"]'
                source_matches = re.findall(source_pattern, response.text, re.IGNORECASE)

                if source_matches:
                    recording_url = source_matches[0]
                    if not recording_url.startswith('http'):
                        recording_url = f"http://{VICIDIAL_HOST}{recording_url}"
                    print(f"    ✅ Found recording in audio tag: {recording_url}")
                    return recording_url

                # Pattern 3: Look for any RECORDINGS URLs in the text
                general_pattern = r'(http://[^"\s]*RECORDINGS[^"\s]*\.(?:mp3|wav))'
                general_matches = re.findall(general_pattern, response.text, re.IGNORECASE)

                if general_matches:
                    recording_url = general_matches[0]
                    print(f"    ✅ Found recording URL in page: {recording_url}")
                    return recording_url

                # Check if page contains "RECORDINGS FOR THIS LEAD" but no URL found
                if 'RECORDINGS FOR THIS LEAD' in response.text:
                    print(f"    📋 Page shows recordings section but couldn't extract URL")
                    # Try to extract any recording reference manually
                    soup = BeautifulSoup(response.text, 'html.parser')
                    for link in soup.find_all('a'):
                        href = link.get('href', '')
                        if 'RECORDINGS' in href and ('.mp3' in href or '.wav' in href):
                            if not href.startswith('http'):
                                href = f"http://{VICIDIAL_HOST}{href}" if href.startswith('/') else f"http://{VICIDIAL_HOST}/{href}"
                            print(f"    ✅ Extracted recording from link: {href}")
                            return href

                print(f"    ⚠️ No recording found in lead page for {lead_id}")
            else:
                print(f"    ❌ Could not access lead page (HTTP {response.status_code})")

            return None

        except Exception as e:
            print(f"    ⚠️ Error accessing lead page: {str(e)[:50]}")
            return None

    def get_lead_details(self, lead_id):
        """Extract detailed lead information including email from ViciDial lead page"""
        try:
            print(f"    📧 Fetching lead details for email...")

            # Access the lead modification page
            url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
            params = {
                'lead_id': lead_id,
                'archive_search': 'No',
                'archive_log': '0'
            }

            response = self.session.get(url, params=params, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                lead_details = {}

                # Look for email field - it's typically in an input field named 'email'
                email_input = soup.find('input', {'name': 'email'})
                if email_input and email_input.get('value'):
                    lead_details['email'] = email_input.get('value').strip()
                    print(f"    ✅ Found email: {lead_details['email']}")
                else:
                    # Try alternative selectors for email field
                    for field_name in ['email', 'email_address', 'Email']:
                        field = soup.find('input', {'name': field_name})
                        if field and field.get('value'):
                            lead_details['email'] = field.get('value').strip()
                            print(f"    ✅ Found email in {field_name}: {lead_details['email']}")
                            break

                    if 'email' not in lead_details:
                        # Try to find email in table cells or text
                        import re
                        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                        email_matches = re.findall(email_pattern, response.text)
                        if email_matches:
                            # Take the first email that doesn't look like a system email
                            for email in email_matches:
                                if not any(system in email.lower() for system in ['vicidial', 'asterisk', 'localhost', 'example']):
                                    lead_details['email'] = email
                                    print(f"    ✅ Found email in text: {email}")
                                    break

                # Also look for other fields that might be useful
                fields_to_extract = [
                    'address1', 'address2', 'address3',
                    'city', 'state', 'postal_code',
                    'alt_phone', 'comments'
                ]

                for field_name in fields_to_extract:
                    field = soup.find('input', {'name': field_name}) or soup.find('textarea', {'name': field_name})
                    if field:
                        value = field.get('value') or field.text
                        if value and value.strip():
                            lead_details[field_name] = value.strip()

                # Extract DOT number from Address1 field
                if 'address1' in lead_details:
                    address1 = lead_details['address1']
                    import re
                    # Look for DOT patterns: DOT123456, DOT-123456, DOT 123456, etc.
                    dot_patterns = [
                        r'DOT[\s-]?(\d{6,7})',  # DOT123456, DOT-123456, DOT 123456
                        r'dot[\s-]?(\d{6,7})',  # case insensitive
                        r'D\.O\.T\.?[\s-]?(\d{6,7})',  # D.O.T.123456
                        r'(\d{6,7})',  # Just 6-7 digit number (if address1 is purely numeric)
                    ]

                    for pattern in dot_patterns:
                        match = re.search(pattern, address1, re.IGNORECASE)
                        if match:
                            dot_number = match.group(1)
                            lead_details['dot_number'] = dot_number
                            print(f"    ✅ Found DOT number in Address1: {dot_number}")
                            break

                    # Also check if address1 contains just a number (common case)
                    if 'dot_number' not in lead_details and address1.strip().isdigit():
                        if len(address1.strip()) in [6, 7]:  # DOT numbers are typically 6-7 digits
                            lead_details['dot_number'] = address1.strip()
                            print(f"    ✅ Found DOT number as pure number in Address1: {address1.strip()}")

                return lead_details

            else:
                print(f"    ⚠️ Failed to access lead page: {response.status_code}")
                return {}

        except Exception as e:
            print(f"    ⚠️ Error fetching lead details: {str(e)[:50]}")
            return {}

    def try_alternative_recording_search(self, lead_id, phone):
        """Try additional methods to find recordings"""
        try:
            print(f"    🔎 Trying alternative recording search for lead {lead_id}")

            # Method 1: Try different date patterns (recordings might be from different days)
            from datetime import datetime, timedelta

            # Try dates from the past week
            for days_back in range(0, 7):
                date_to_try = datetime.now() - timedelta(days=days_back)
                date_str = date_to_try.strftime('%Y%m%d')

                # Try different recording URL patterns
                possible_urls = [
                    f"https://{VICIDIAL_HOST}/RECORDINGS/{date_str}/{phone}.wav",
                    f"https://{VICIDIAL_HOST}/recordings/{date_str}/{phone}.wav",
                    f"https://{VICIDIAL_HOST}/RECORDINGS/ORIG/{date_str}-{phone}.wav",
                    f"https://{VICIDIAL_HOST}/RECORDINGS/MP3/{date_str}-{phone}.mp3",
                ]

                for url in possible_urls:
                    try:
                        response = self.session.head(url, timeout=3)
                        if response.status_code == 200:
                            print(f"    ✅ Found recording at: {url}")
                            return url
                    except:
                        continue

            # Method 2: Try to access ViciDial recording management pages
            recording_admin_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php"
            params = {
                'ADD': '4111111',  # Recording management
                'lead_id': lead_id,
                'DB': ''
            }

            response = self.session.get(recording_admin_url, params=params, timeout=10)
            if response.status_code == 200 and '.wav' in response.text.lower():
                # Look for recording links in the response
                import re
                recording_pattern = r'href="([^"]*\.(?:wav|mp3)[^"]*)"'
                matches = re.findall(recording_pattern, response.text, re.IGNORECASE)

                for match in matches:
                    if not match.startswith('http'):
                        full_url = f"https://{VICIDIAL_HOST}{match}"
                    else:
                        full_url = match

                    print(f"    💡 Found potential recording: {full_url}")
                    return full_url

            print(f"    ❌ No alternative recordings found for lead {lead_id}")
            return None

        except Exception as e:
            print(f"    ⚠️ Error in alternative search: {str(e)[:50]}")
            return None

    def download_recording(self, recording_url, lead_id):
        """Download the recording file"""
        try:
            temp_dir = '/tmp/vicidial_recordings'
            os.makedirs(temp_dir, exist_ok=True)

            local_path = f"{temp_dir}/recording_{lead_id}.wav"

            response = self.session.get(recording_url, stream=True, timeout=30)
            if response.status_code == 200:
                # Check content type - ViciDial might send various content-types
                content_type = response.headers.get('content-type', '').lower()
                content_length = response.headers.get('content-length', '0')

                # Accept various content-types that ViciDial might use
                if (any(audio_type in content_type for audio_type in ['audio', 'wav', 'mp3', 'mpeg', 'octet-stream', 'forcedownload'])
                    or recording_url.endswith(('.mp3', '.wav'))
                    or int(content_length) > 1000):  # Audio files should be reasonably large

                    with open(local_path, 'wb') as f:
                        total_size = 0
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                            total_size += len(chunk)

                    print(f"    ✅ Recording downloaded successfully ({total_size} bytes)")

                    # Verify the file was actually downloaded
                    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
                        return local_path
                    else:
                        print(f"    ⚠️ Downloaded file too small ({os.path.getsize(local_path) if os.path.exists(local_path) else 0} bytes)")
                        return None
                else:
                    print(f"    ⚠️ Not an audio file (content-type: {content_type}, size: {content_length})")
                    return None
            elif response.status_code == 404:
                print(f"    ℹ️ Recording not found (404)")
                return None
            else:
                print(f"    ⚠️ HTTP {response.status_code} for recording")
                return None

        except requests.exceptions.Timeout:
            print(f"    ⚠️ Timeout downloading recording")
            return None
        except Exception as e:
            print(f"    ⚠️ Error downloading: {str(e)[:50]}")
            return None

    def process_lead(self, lead):
        """Process a single lead - get recording, transcribe, extract data"""
        lead_id = lead['id']
        print(f"\n🎯 Processing lead {lead_id}: {lead['name']}")

        # Step 1: Get lead details including email
        print(f"  📋 Fetching lead details...")
        lead_details = self.get_lead_details(lead_id)

        # Step 2: Get recording URL
        print(f"  📞 Finding recording...")
        recording_url = self.get_recording_url(lead_id, lead['phone'])

        if not recording_url:
            print(f"  ⚠️ No recording found")
            # Try alternative recording search methods before falling back
            alternative_url = self.try_alternative_recording_search(lead_id, lead['phone'])
            if alternative_url:
                recording_url = alternative_url
            else:
                print(f"  ℹ️ No recording available, using basic lead data")
                return self.create_basic_lead_record(lead, lead_details)

        # Step 3: Download recording
        print(f"  📥 Downloading recording from: {recording_url}")
        local_recording = self.download_recording(recording_url, lead_id)

        if not local_recording:
            print(f"  ⚠️ Could not download recording, using basic lead data")
            return self.create_basic_lead_record(lead, lead_details)

        # Step 4: Transcribe with Deepgram
        print(f"  🎤 Transcribing with Deepgram...")
        try:
            deepgram_response = self.deepgram.transcribe_audio(local_recording)

            if not deepgram_response:
                print(f"  ⚠️ Transcription failed")
                return self.create_basic_lead_record(lead, lead_details)

            formatted_transcript = self.deepgram.format_diarized_transcript(deepgram_response)

            if not formatted_transcript:
                print(f"  ⚠️ Could not format transcript")
                return self.create_basic_lead_record(lead, lead_details)

        except Exception as e:
            print(f"  ⚠️ Transcription error: {e}")
            # Create lead record with note about transcription failure
            lead_record = self.create_basic_lead_record(lead, lead_details)
            lead_record['notes'] = f'Recording found but transcription failed: {str(e)[:100]}'
            lead_record['transcriptText'] = f'[Transcription failed: {str(e)[:100]}]'
            return lead_record

        # Step 5: Process with OpenAI
        print(f"  🤖 Processing with OpenAI...")
        try:
            structured_data = self.openai.process_transcription(formatted_transcript, {
                'lead_id': lead_id,
                'phone': lead['phone'],
                'full_name': lead['name'],
                'city': lead['city']
            })

            # Extract structured data - OpenAI processor returns {success: True, data: {...}}
            if structured_data and structured_data.get('success'):
                extracted_data = structured_data.get('data', {})
            else:
                extracted_data = {}

        except Exception as e:
            print(f"  ⚠️ OpenAI processing error: {e}")
            extracted_data = {}

        # Step 6: Create complete lead record
        lead_record = {
            'id': f"8{lead_id}",
            'listId': lead['list_id'],
            'name': extracted_data.get('business_name') or lead['name'],
            'contact': extracted_data.get('customer_name') or lead['last_agent'],
            'phone': lead['phone'],
            'email': extracted_data.get('email') or lead_details.get('email', ''),
            'state': extracted_data.get('state', 'OH'),
            'city': lead['city'],
            'status': 'SALE',
            'source': 'ViciDial',
            'lastCallDate': lead['last_call'],
            'transcriptText': formatted_transcript,
            'hasTranscription': True,
            'dotNumber': extracted_data.get('dot_number') or lead_details.get('dot_number', ''),
            'mcNumber': extracted_data.get('mc_number', ''),
            'currentPremium': extracted_data.get('current_premium', 0),
            'quotedPremium': extracted_data.get('quoted_premium', 0),
            'savings': extracted_data.get('savings', 0),
            'fleetSize': extracted_data.get('fleet_size', ''),
            'yearsInBusiness': extracted_data.get('years_in_business', ''),
            'radiusOfOperation': extracted_data.get('radius_of_operation', ''),
            'commodityHauled': extracted_data.get('commodity_hauled', ''),
            'address3': lead_details.get('address3', ''),  # Add renewal date field from Vicidial
            'structuredData': extracted_data
        }

        # Clean up temp file
        if os.path.exists(local_recording):
            os.remove(local_recording)

        print(f"  ✅ Lead processed successfully!")
        return lead_record

    def create_sample_lead_record(self, lead):
        """Create a lead record with sample transcription for testing"""
        company_name = lead.get('name', 'Unknown Company')
        phone = lead.get('phone', '')
        city = lead.get('city', '')

        # Generate sample transcription based on lead data
        sample_transcript = f"""Agent: Thank you for calling Vanguard Insurance. How can I help you today?

Customer: Hi, I'm calling from {company_name}. I got a quote from you guys and wanted to proceed with the insurance.

Agent: Excellent! Let me pull up your information. Can you confirm your DOT number?

Customer: Yes, it's 3481784.

Agent: Perfect, I see you operate out of {city}. You currently have 2 trucks, correct?

Customer: That's right. We're currently paying about $2,500 a month with our current provider.

Agent: Based on your clean driving record and profile, we can offer you $1,850 per month. That's a savings of $650 monthly.

Customer: That's great! When can we start the policy?

Agent: We can bind it today if you're ready to proceed.

Customer: Yes, let's do it!

Agent: Wonderful! I'm marking this as a sale and will send over the paperwork within the hour. Welcome to Vanguard Insurance!"""

        # Create structured data from the sample
        structured_data = {
            'business_name': company_name,
            'phone': phone,
            'current_premium': 2500,
            'quoted_premium': 1850,
            'savings': 650,
            'call_outcome': 'SALE',
            'fleet_size': '2',
            'years_in_business': '5',
            'dot_number': '3481784',
            'city': city,
            'state': 'OH'
        }

        return {
            'id': f"8{lead['id']}",
            'listId': lead['list_id'],
            'name': company_name,
            'contact': lead.get('last_agent', ''),
            'phone': phone,
            'email': '',
            'state': 'OH',
            'city': city,
            'status': 'SALE',
            'source': 'ViciDial',
            'lastCallDate': lead['last_call'],
            'transcriptText': sample_transcript,
            'hasTranscription': True,
            'dotNumber': structured_data['dot_number'],
            'mcNumber': '',
            'currentPremium': structured_data['current_premium'],
            'quotedPremium': structured_data['quoted_premium'],
            'savings': structured_data['savings'],
            'fleetSize': structured_data['fleet_size'],
            'yearsInBusiness': structured_data['years_in_business'],
            'radiusOfOperation': '500 miles',
            'commodityHauled': 'General freight',
            'structuredData': structured_data,
            'notes': 'Sample transcription for testing'
        }

    def create_basic_lead_record(self, lead, lead_details=None):
        """Create a basic lead record without transcription"""
        if lead_details is None:
            lead_details = {}

        return {
            'id': f"8{lead['id']}",
            'listId': lead['list_id'],
            'name': lead['name'],
            'contact': f"Agent {lead['last_agent']}",
            'phone': lead['phone'],
            'email': lead_details.get('email', ''),
            'state': 'OH',
            'city': lead['city'],
            'status': 'SALE',
            'source': 'ViciDial',
            'lastCallDate': lead['last_call'],
            'transcriptText': '[No recording found - call transcription not available]',
            'hasTranscription': False,
            'dotNumber': lead_details.get('dot_number', ''),
            'mcNumber': '',
            'currentPremium': 0,
            'quotedPremium': 0,
            'savings': 0,
            'address3': lead_details.get('address3', ''),  # Add renewal date field from Vicidial
            'notes': 'No call recording found for transcription'
        }

    def run_sync(self):
        """Run the complete sync process"""
        print("=" * 80)
        print("🚀 VICIDIAL COMPLETE SYNC STARTING")
        print(f"📍 Server: {VICIDIAL_HOST}")
        print(f"👤 User: {USERNAME}")
        print("=" * 80)

        # Step 1: Scan all lists
        all_leads, list_summary = self.scan_all_lists()

        if not all_leads:
            print("\n❌ No SALE leads found in any list")
            return {
                'saleLeads': [],
                'totalLeads': 0,
                'lists': list(list_summary.values()),
                'allListsSummary': list(list_summary.values())
            }

        # Step 2: Process each lead
        processed_leads = []
        for i, lead in enumerate(all_leads):  # Process all leads
            print(f"\n[{i+1}/{len(all_leads)}] Processing...")
            lead_record = self.process_lead(lead)
            processed_leads.append(lead_record)

        print("\n" + "=" * 80)
        print(f"✅ SYNC COMPLETE: {len(processed_leads)} leads processed")
        print("=" * 80)

        return {
            'saleLeads': processed_leads,
            'totalLeads': len(processed_leads),
            'lists': list(list_summary.values()),
            'allListsSummary': list(list_summary.values())
        }

def main():
    """Main entry point"""
    sync = ViciDialCompleteSync()
    result = sync.run_sync()
    print(json.dumps(result))

if __name__ == "__main__":
    main()