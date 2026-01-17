#!/usr/bin/env python3
"""
ViciDial Selective Sync - Import specific lead IDs with full premium/insurance extraction
"""

import sys
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

class VanguardViciDialSelectiveSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(USERNAME, PASSWORD)
        self.session.verify = False
        self.db = sqlite3.connect(DB_PATH)

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
        details = {}

        # Look for comments/notes
        for textarea in soup.find_all('textarea'):
            if 'comments' in str(textarea.get('name', '')).lower():
                details['comments'] = textarea.text.strip()

        # Extract any custom fields including address3 (renewal date) and list_id
        for input_field in soup.find_all('input'):
            name = input_field.get('name', '')
            value = input_field.get('value', '')
            if name and value:
                details[name] = value
                # Specifically capture address3 for renewal date
                if name.lower() == 'address3':
                    details['address3'] = value.strip()
                    logger.info(f"Found renewal date in address3: {value}")
                # Capture list_id from the form
                if name.lower() == 'list_id':
                    details['list_id'] = value.strip()
                    logger.info(f"✅ Found list ID: {value}")

        # Also try to extract list_id from URL parameters or page content
        if 'list_id' not in details:
            import re
            # Look for list_id in hidden inputs or other form elements
            list_id_patterns = [
                r'name=["\']list_id["\'][^>]*value=["\'](\d+)["\']',
                r'value=["\'](\d+)["\'][^>]*name=["\']list_id["\']',
                r'List\s*(?:ID|#):\s*(\d+)',
                r'list_id["\']?\s*[:=]\s*["\']?(\d+)',
                r'<input[^>]*list_id[^>]*value=["\'](\d+)["\']'
            ]

            for pattern in list_id_patterns:
                matches = re.search(pattern, response.text, re.IGNORECASE)
                if matches:
                    details['list_id'] = matches.group(1).strip()
                    logger.info(f"✅ Found list ID with pattern: {details['list_id']}")
                    break

        # Extract recording URL from the page
        recording_url = self.extract_recording_url(response.text)
        if recording_url:
            details['recording_url'] = recording_url
            logger.info(f"✅ Found recording URL: {recording_url}")

        # Extract call duration and timestamp information
        call_info = self.extract_call_info(response.text, lead_id)
        if call_info['call_duration'] or call_info['call_timestamp']:
            details.update(call_info)
            logger.info(f"✅ Found call info: duration={call_info['call_duration']}, timestamp={call_info['call_timestamp']}")

        return details

    def extract_recording_url(self, page_html):
        """Extract recording URL from ViciDial lead page HTML"""
        import re

        # Pattern 1: Look for href links to recording files
        recording_pattern = r'href="(http[^"]*RECORDINGS[^"]*\.(?:mp3|wav))"'
        matches = re.findall(recording_pattern, page_html, re.IGNORECASE)

        if matches:
            return matches[0]  # Take the first recording found

        # Pattern 2: Look for audio source tags
        source_pattern = r'src\s*=\s*[\'"]([^"\']*RECORDINGS[^"\']*\.(?:mp3|wav))[\'"]'
        source_matches = re.findall(source_pattern, page_html, re.IGNORECASE)

        if source_matches:
            recording_url = source_matches[0]
            if not recording_url.startswith('http'):
                recording_url = f"http://{VICIDIAL_HOST}{recording_url}"
            return recording_url

        # Pattern 3: Look for any RECORDINGS URLs in the text
        general_pattern = r'(http://[^"\s]*RECORDINGS[^"\s]*\.(?:mp3|wav))'
        general_matches = re.findall(general_pattern, page_html, re.IGNORECASE)

        if general_matches:
            return general_matches[0]

        return None

    def download_recording(self, recording_url, lead_id):
        """Download recording and save to local storage"""
        try:
            import os

            # Create recordings directory
            recordings_dir = '/var/www/vanguard/recordings'
            os.makedirs(recordings_dir, exist_ok=True)

            # Download the recording
            response = self.session.get(recording_url, stream=True, timeout=30)
            if response.status_code == 200:
                # Determine file extension
                file_ext = '.mp3' if '.mp3' in recording_url.lower() else '.wav'
                local_filename = f"recording_{lead_id}{file_ext}"
                local_path = os.path.join(recordings_dir, local_filename)

                # Save the file
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                # Verify file was downloaded
                if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
                    logger.info(f"✅ Recording downloaded: {local_filename}")
                    return f"/recordings/{local_filename}"  # Return web-accessible path
                else:
                    logger.warning(f"⚠️ Downloaded recording is too small or empty")
                    return None
            else:
                logger.warning(f"⚠️ Failed to download recording: HTTP {response.status_code}")
                return None

        except Exception as e:
            logger.warning(f"⚠️ Error downloading recording: {str(e)[:50]}")
            return None

    def extract_call_info(self, page_html, lead_id=None):
        """Extract call duration and timestamp from ViciDial lead page"""
        import re

        call_info = {
            'call_duration': None,
            'call_timestamp': None,
            'talk_time': None
        }

        try:
            # Debug: Look specifically for RECORDINGS section
            import re as re_debug
            recordings_match = re_debug.search(r'RECORDINGS FOR THIS LEAD:(.*?)(?:Click here|$)', page_html, re_debug.DOTALL)
            if recordings_match:
                recordings_section = recordings_match.group(1)
                logger.info(f"🎬 Found RECORDINGS section: {recordings_section[:500]}")  # First 500 chars

                # Look for the seconds column specifically
                seconds_matches = re_debug.findall(r'(\d{2,4})', recordings_section)
                if seconds_matches:
                    logger.info(f"🕐 Numbers found in RECORDINGS: {seconds_matches}")

            # Debug: Log all time-related content in the HTML
            time_content = re_debug.findall(r'(?i)(time|length|duration|sec)[^>]*>[^<]*<|>[^<]*(?:time|length|duration|sec)[^<]*<|<td[^>]*>\s*\d+\s*</td>', page_html)
            if time_content:
                logger.info(f"🔍 All time-related content found: {time_content[:20]}")  # First 20 matches

            # Also log any table rows with numbers that could be durations
            table_rows = re_debug.findall(r'<tr[^>]*>.*?</tr>', page_html, re_debug.DOTALL)
            for i, row in enumerate(table_rows[:10]):  # Check first 10 rows
                if re_debug.search(r'\b\d{1,4}\b', row):
                    logger.info(f"🔍 Table row {i+1} with numbers: {row[:200]}")  # First 200 chars

            # Pattern 1: Look for call duration in seconds (ViciDial specific patterns)
            # Priority order: RECORDINGS table seconds first, then other patterns
            duration_patterns = [
                # HIGHEST PRIORITY: ViciDial HTML RECORDINGS table (most accurate)
                # Pattern for HTML table: <td> LEAD </td><td> DATE/TIME </td><td> SECONDS </td><td> RECID </td>
                r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?<tr[^>]*>.*?<td[^>]*>\s*\d+\s*</td>.*?<td[^>]*>.*?</td>.*?<td[^>]*>.*?</td>.*?<td[^>]*>\s*(\d{3,4})\s*</td>',  # HTML table SECONDS column
                # Alternative HTML patterns for RECORDINGS table
                r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?<td[^>]*>\s*(\d{3,4})\s*</td>',  # Any SECONDS cell after header
                r'(?s)<font[^>]*>SECONDS.*?<td[^>]*>\s*(\d{3,4})\s*</td>',                   # Font-wrapped SECONDS header
                # Plain text RECORDINGS patterns (fallback)
                r'RECORDINGS FOR THIS LEAD:.*?(?:\d+\s+\d+\s+[\d\-:\s]+)\s+(\d{3,4})\s+(?:\d+\s+)',  # Specific RECORDINGS row format
                r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?\n.*?(\d{3,4})\s+\d+\s+',  # Line after SECONDS header with proper format
                r'(?s)RECORDINGS FOR THIS LEAD:.*?(\d{3,4})\s+\d{4,}\s+',              # Duration followed by RECID (4+ digits)
                # ViciDial specific patterns - TOTAL CALL TIME
                r'total[_\s]*time[^>]*>(\d+)<',     # Total call time
                r'total[_\s]*length[^>]*>(\d+)<',   # Total call length
                r'call[_\s]*length[^>]*>(\d+)<',    # Call length field
                r'recording[_\s]*length[^>]*>(\d+)<', # Recording length
                r'length_in_sec[^>]*>(\d+)<',       # ViciDial HTML table cell
                r'talk_sec[^>]*>(\d+)<',            # ViciDial talk seconds field
                r'talk[_\s]*time[^>]*>(\d+)<',      # Talk time field
                r'Total.*?(\d+)\s*seconds?',        # "Total: 737 seconds"
                r'Call\s*Length:\s*(\d+)\s*seconds?', # "Call Length: 737 seconds"
                r'Recording.*?(\d+)\s*seconds?',    # "Recording: 737 seconds"
                r'Duration:\s*(\d+)\s*seconds?',    # "Duration: 737 seconds"
                r'Length:\s*(\d+)\s*seconds?',      # "Length: 737 seconds"
                r'Talk\s*Time:\s*(\d+)\s*seconds?', # "Talk Time: 737 seconds"
                # Look for the LONGEST number in table cells (likely the total time)
                r'<td[^>]*>(\d{3,4})</td>',         # 3-4 digit numbers (300+ seconds = 5+ minutes)
                r'(\d{3,4})\s*seconds?\s*$',        # 3-4 digit seconds at end of line
                r'(\d{3,4})\s*sec(?:onds?)?',       # 3-4 digit "sec" format
                # Generic patterns as fallback
                r'length_in_sec.*?(\d+)',           # ViciDial length field
                r'time[^>]*>(\d+)<',                # Any field with 'time' in name
                r'duration[^>]*>(\d+)<',            # Any field with 'duration' in name
                r'<td[^>]*>\s*(\d+)\s*</td>',       # Table cell with potential whitespace
                r'(\d+)\s*(?:sec|second|seconds)\b', # Flexible seconds matching
                r'>(\d+)s<',                        # ">737s<" format
                r'(\d+)\s*$',                       # Just digits at end of line (last resort)
            ]

            found_duration = False
            best_duration = 0
            best_pattern_info = None

            # Collect ALL possible durations, then pick the best one
            all_durations = []
            for i, pattern in enumerate(duration_patterns):
                matches = re.findall(pattern, page_html, re.IGNORECASE)
                for match in matches:
                    try:
                        seconds = int(match if isinstance(match, str) else match[0] if isinstance(match, tuple) else match)
                        # Reasonable bounds check - calls should be between 1 second and 30 minutes (1800 seconds)
                        if 1 <= seconds <= 1800:
                            all_durations.append((seconds, i+1, pattern))
                    except (ValueError, IndexError):
                        continue

            if all_durations:
                # Sort by duration (longest first) and pick the longest reasonable duration
                all_durations.sort(key=lambda x: x[0], reverse=True)
                logger.info(f"🔍 All found durations: {[(d[0], f'pattern {d[1]}') for d in all_durations[:5]]}")

                # Pick the longest duration that's reasonable
                for seconds, pattern_num, pattern in all_durations:
                    # Prefer longer durations unless they seem unreasonable
                    if seconds >= 30:  # At least 30 seconds for a real call
                        best_duration = seconds
                        best_pattern_info = (pattern_num, pattern)
                        break

                # Fallback to any duration if no long ones found
                if best_duration == 0 and all_durations:
                    best_duration, pattern_num, pattern = all_durations[0]
                    best_pattern_info = (pattern_num, pattern)

            if best_duration > 0:
                # Convert to minutes and seconds
                minutes = best_duration // 60
                remaining_seconds = best_duration % 60
                if minutes > 0:
                    call_info['call_duration'] = f"{minutes}:{remaining_seconds:02d}"
                    call_info['talk_time'] = f"{minutes} min {remaining_seconds} sec"
                else:
                    call_info['call_duration'] = f"0:{remaining_seconds:02d}"
                    call_info['talk_time'] = f"{best_duration} sec"
                logger.info(f"✅ Selected call duration with pattern {best_pattern_info[0]}: {call_info['talk_time']} ({best_duration} seconds) using pattern: {best_pattern_info[1]}")
                found_duration = True

            if not found_duration:
                logger.warning("⚠️ No call duration found in ViciDial HTML - trying to get duration from recording file")
                # Try to get duration from downloaded recording file using ffprobe
                try:
                    import subprocess
                    # Try both possible recording paths (short ID and full ID with 8 prefix)
                    recording_paths = [
                        f"/var/www/vanguard/recordings/recording_{lead_id}.mp3",  # Short ID like 132511
                        f"/var/www/vanguard/recordings/recording_8{lead_id}.mp3"  # Full ID like 8132511
                    ]
                    recording_path = None
                    for path in recording_paths:
                        if os.path.exists(path):
                            recording_path = path
                            break

                    if recording_path:
                        result = subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', recording_path],
                                              capture_output=True, text=True, timeout=10)
                        if result.returncode == 0 and result.stdout.strip():
                            duration_seconds = float(result.stdout.strip())
                            best_duration = int(round(duration_seconds))
                            minutes = best_duration // 60
                            remaining_seconds = best_duration % 60
                            if minutes > 0:
                                call_info['call_duration'] = f"{minutes}:{remaining_seconds:02d}"
                                call_info['talk_time'] = f"{minutes} min {remaining_seconds} sec"
                            else:
                                call_info['call_duration'] = f"0:{remaining_seconds:02d}"
                                call_info['talk_time'] = f"{best_duration} sec"
                            logger.info(f"✅ Got call duration from recording file: {call_info['talk_time']} ({best_duration} seconds)")
                            found_duration = True
                        else:
                            logger.warning(f"❌ ffprobe failed for {recording_path}: {result.stderr}")
                    else:
                        logger.warning(f"❌ Recording file not found. Tried: {recording_paths}")
                except Exception as e:
                    logger.error(f"❌ Error getting duration from recording file: {e}")

                if not found_duration:
                    logger.warning("⚠️ Recording file fallback failed - checking for any numeric patterns in the content")
                    # Last resort: look for any reasonable numbers that could be call duration
                    all_numbers = re.findall(r'\b(\d{1,4})\b', page_html)
                    for num_str in all_numbers:
                        num = int(num_str)
                        if 10 <= num <= 600:  # 10 seconds to 10 minutes seems reasonable
                            minutes = num // 60
                            remaining_seconds = num % 60
                            if minutes > 0:
                                call_info['call_duration'] = f"{minutes}:{remaining_seconds:02d}"
                                call_info['talk_time'] = f"{minutes} min {remaining_seconds} sec"
                            else:
                                call_info['call_duration'] = f"0:{remaining_seconds:02d}"
                                call_info['talk_time'] = f"{num} sec"
                            logger.info(f"🔍 Found potential call duration (fallback): {call_info['talk_time']} ({num} seconds)")
                            break

            # Pattern 2: Look for call timestamp
            timestamp_patterns = [
                r'Call\s*Time:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
                r'Start\s*Time:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
                r'call_date[^>]*>([^<]+)<',
                r'start_epoch[^>]*>(\d+)<',
                r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',  # Generic datetime format
                r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2})',  # MM/DD/YYYY format
            ]

            for pattern in timestamp_patterns:
                matches = re.search(pattern, page_html, re.IGNORECASE)
                if matches:
                    timestamp_str = matches.group(1)
                    # Handle epoch timestamp
                    if timestamp_str.isdigit() and len(timestamp_str) == 10:
                        from datetime import datetime
                        call_info['call_timestamp'] = datetime.fromtimestamp(int(timestamp_str)).isoformat()
                    else:
                        call_info['call_timestamp'] = timestamp_str
                    logger.info(f"✅ Found call timestamp: {call_info['call_timestamp']}")
                    break

        except Exception as e:
            logger.warning(f"⚠️ Error extracting call info: {str(e)}")

        return call_info

    def create_auto_call_log(self, lead_data, call_info):
        """Create an automatic call log entry from ViciDial call information"""
        if not call_info.get('call_duration') and not call_info.get('call_timestamp'):
            return lead_data

        # Initialize reachOut structure if it doesn't exist
        if 'reachOut' not in lead_data:
            lead_data['reachOut'] = {
                'contacted': False,
                'completedAt': None,
                'reachOutCompletedAt': None,
                'callLogs': []
            }

        if 'callLogs' not in lead_data['reachOut']:
            lead_data['reachOut']['callLogs'] = []

        # Create call log entry
        call_log = {
            'timestamp': call_info.get('call_timestamp') or datetime.now().isoformat(),
            'connected': True,  # Assume connected since we have a recording
            'duration': call_info.get('talk_time') or call_info.get('call_duration') or 'Unknown',
            'leftVoicemail': False,
            'notes': f"ViciDial Call - Duration: {call_info.get('talk_time') or 'Unknown'}"
        }

        # Add the call log
        lead_data['reachOut']['callLogs'].append(call_log)

        # Mark as contacted if we have call information
        lead_data['reachOut']['contacted'] = True

        logger.info(f"✅ Created automatic call log for lead {lead_data['name']}: {call_log['duration']}")
        return lead_data

    def extract_policy_from_comments(self, comments):
        """Extract insurance policy details and fleet size from comments/notes"""
        policy_info = {
            'current_carrier': '',
            'current_premium': '',
            'quoted_premium': 0,
            'liability': '$1,000,000',
            'cargo': '$100,000',
            'fleet_size': 0,
            'calculated_premium': 0
        }

        if not comments:
            return policy_info

        # Extract fleet size from multiple possible patterns
        fleet_patterns = [
            r'Insurance Expires:.*?\|\s*Fleet Size:?\s*(\d+)',  # Original pattern
            r'Size:\s*(\d+)',  # NEW: "Size: 10" pattern for new ViciDial format
            r'Fleet Size:?\s*(\d+)',  # Simple "Fleet Size: x" pattern
            r'Fleet\s*Size\s*:\s*(\d+)',  # "Fleet Size : x" with spaces
            r'(\d+)\s*vehicles?',  # "9 vehicles" pattern
            r'fleet\s*of\s*(\d+)',  # "fleet of 9" pattern
            r'(\d+)\s*units?',  # "5 units" pattern
            r'(\d+)\s*trucks?',  # "3 trucks" pattern
            r'(\d+)\s*power\s*units?',  # "4 power units" pattern
            r'units?\s*:\s*(\d+)',  # "Units: 5" pattern
            r'truck\s*count\s*:\s*(\d+)',  # "Truck count: 3" pattern
            r'total\s*vehicles?\s*:\s*(\d+)',  # "Total vehicles: 7" pattern
        ]

        fleet_size = 0
        for pattern in fleet_patterns:
            fleet_match = re.search(pattern, comments, re.I)
            if fleet_match:
                fleet_size = int(fleet_match.group(1))
                policy_info['fleet_size'] = fleet_size
                # Calculate premium at $14,400 per vehicle
                calculated_premium = fleet_size * 14400
                policy_info['calculated_premium'] = calculated_premium
                logger.info(f"✓ Fleet size extracted with pattern '{pattern}': {fleet_size} vehicles, calculated premium: ${calculated_premium:,}")
                break

        if fleet_size == 0:
            logger.warning(f"⚠️ No fleet size found in comments: '{comments}'")

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

    def format_phone(self, phone):
        """Format phone number consistently"""
        if not phone:
            return ""

        # Remove all non-numeric characters
        digits = re.sub(r'\D', '', phone)

        # Format as (XXX) XXX-XXXX if we have 10 digits
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            # Remove leading 1
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        else:
            return phone

    def format_renewal_date(self, raw_date):
        """Format renewal date to M/D/YYYY format"""
        if not raw_date:
            return ""

        # Handle YYYY-MM-DD format (common in ViciDial)
        yyyy_mm_dd = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})', raw_date)
        if yyyy_mm_dd:
            year, month, day = yyyy_mm_dd.groups()
            formatted = f"{int(month)}/{int(day)}/{year}"
            logger.info(f"YYYY-MM-DD format detected: '{raw_date}' -> '{formatted}'")
            return formatted

        # Handle MM/DD/YYYY format (already correct)
        mm_dd_yyyy = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', raw_date)
        if mm_dd_yyyy:
            return raw_date

        # Try to handle other formats with month names
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

    def get_assigned_agent_from_list(self, list_id):
        """Get assigned agent based on list ID"""
        list_agent_mapping = {
            '998': 'Hunter',    # OH Hunter
            '999': 'Hunter',    # TX Hunter
            '1000': 'Hunter',   # IN Hunter
            '1001': 'Grant',    # OH Grant
            '1005': 'Grant',    # TX Grant
            '1006': 'Grant',    # IN Grant
            '1007': 'Carson',   # OH Carson
            '1008': 'Carson',   # TX Carson
            '1009': 'Carson'    # IN Carson
        }
        return list_agent_mapping.get(list_id, 'Unassigned')

    def save_lead(self, lead_data):
        """Save lead to database"""
        cursor = self.db.cursor()

        # Validate lead ID before saving
        lead_id = lead_data.get('id')
        if not lead_id or str(lead_id).strip() == '' or str(lead_id) == 'undefined':
            logger.error(f"🚫 Cannot save lead with invalid ID: {lead_id} (name: {lead_data.get('name', 'Unknown')})")
            return False

        try:
            cursor.execute('''
                INSERT OR REPLACE INTO leads (id, data, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (
                lead_data['id'],
                json.dumps(lead_data),
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            self.db.commit()
            logger.info(f"✅ Saved lead to database: {lead_data['name']} (ID: {lead_data['id']})")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save lead {lead_data['id']}: {e}")

    def sync_specific_leads(self, lead_ids_with_info):
        """Sync specific leads by ID with full extraction"""
        logger.info(f"🎯 Starting selective sync for {len(lead_ids_with_info)} specific leads...")

        total_imported = 0

        for lead_info in lead_ids_with_info:
            lead_id_raw = lead_info['id']

            # Validate lead ID - skip if invalid
            if lead_id_raw is None or str(lead_id_raw).strip() == '' or str(lead_id_raw) == 'undefined':
                logger.warning(f"🚫 Skipping lead with invalid ID: {lead_id_raw} (name: {lead_info.get('name', 'Unknown')})")
                continue

            # Strip the "8" prefix that the frontend adds to ViciDial IDs
            if str(lead_id_raw).startswith('8') and len(str(lead_id_raw)) > 6:
                lead_id = str(lead_id_raw)[1:]  # Remove first character
                logger.info(f"📋 Processing lead {lead_id_raw} -> {lead_id}: {lead_info.get('name', 'Unknown')}")
            else:
                lead_id = str(lead_id_raw)
                logger.info(f"📋 Processing lead {lead_id}: {lead_info.get('name', 'Unknown')}")

            try:
                # Get detailed information from ViciDial
                lead_details = self.get_lead_details(lead_id)
                if not lead_details:
                    logger.warning(f"⚠️ Could not fetch details for lead {lead_id}")
                    continue

                # Extract policy information from comments
                comments = lead_details.get('comments', '')
                policy_info = self.extract_policy_from_comments(comments)

                # Extract insurance company from address fields
                insurance_company = ""
                address1 = lead_details.get('address1', '').strip()
                address2 = lead_details.get('address2', '').strip()

                # Common insurance company patterns
                insurance_patterns = [
                    r'(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty|USAA|Farmers|Travelers)',
                    r'([A-Z\s]+CASUALTY\s+CO\.?)',  # "GREAT WEST CASUALTY CO."
                    r'([A-Z\s]+Insurance)',
                    r'([A-Z\s]+Mutual)',
                    r'([A-Z\s]+General)',
                    r'([A-Z\s]+Casualty)',  # General casualty pattern
                    r'(\w+.*INSURANCE.*)',  # Any text with INSURANCE
                ]

                # Check address1 first, then address2
                for address_field in [address2, address1]:  # Check address2 first as it usually has insurance
                    if address_field:
                        for pattern in insurance_patterns:
                            match = re.search(pattern, address_field, re.I)
                            if match:
                                insurance_company = match.group(1).title()
                                logger.info(f"✓ Insurance company extracted: '{insurance_company}' from address field")
                                break
                        if insurance_company:
                            break

                # Extract renewal date from address3 field
                renewal_date = ""
                if 'address3' in lead_details:
                    raw_renewal = lead_details['address3'].strip()
                    if raw_renewal:
                        renewal_date = self.format_renewal_date(raw_renewal)
                        logger.info(f"Processing renewal date: '{raw_renewal}'")

                # Download recording if available
                recording_path = None
                if 'recording_url' in lead_details:
                    recording_url = lead_details['recording_url']
                    logger.info(f"🎵 Downloading recording from: {recording_url}")
                    recording_path = self.download_recording(recording_url, lead_id_raw)
                    if recording_path:
                        logger.info(f"✅ Recording saved: {recording_path}")
                    else:
                        logger.warning(f"⚠️ Failed to download recording")

                # Get assigned agent based on list ID (prefer ViciDial-extracted, fallback to lead_info)
                list_id = lead_details.get('list_id', lead_info.get('listId', ''))
                assigned_agent = self.get_assigned_agent_from_list(list_id)

                # Create lead record
                lead_data = {
                    "id": lead_id_raw,  # Use original ID with prefix for database
                    "name": lead_info.get('name', 'Unknown Company'),
                    "contact": lead_info.get('contact', 'Agent'),
                    "phone": self.format_phone(lead_info.get('phone', '')),
                    "email": lead_info.get('email', ''),
                    "product": "Commercial Auto",
                    "stage": "new",
                    "status": "hot_lead",
                    "assignedTo": assigned_agent,
                    "created": datetime.now().strftime("%-m/%-d/%Y"),
                    "lastActivity": datetime.now().isoformat(),
                    "priority": "high",
                    "notes": f"Imported from ViciDial (List {list_id}) - Quick Import",
                    "source": "ViciDial",
                    "city": lead_info.get('city', ''),
                    "state": lead_info.get('state', ''),
                    "dotNumber": address1,  # DOT number is in address1
                    "mcNumber": "",
                    "fleetSize": str(policy_info['fleet_size']) if policy_info['fleet_size'] > 0 else '',
                    "premium": str(policy_info['calculated_premium']) if policy_info['calculated_premium'] > 0 else '',
                    "insuranceCompany": insurance_company,
                    "currentCarrier": insurance_company,
                    "renewalDate": renewal_date,
                    "lastCallDate": lead_info.get('lastCallDate', datetime.now().isoformat()),
                    "listId": list_id,
                    "leadStatus": lead_info.get('status', 'SALE'),
                    "recordingPath": recording_path or "",
                    "hasRecording": bool(recording_path)
                }

                # Create automatic call log from ViciDial call information
                if 'call_duration' in lead_details or 'call_timestamp' in lead_details:
                    call_info = {
                        'call_duration': lead_details.get('call_duration'),
                        'call_timestamp': lead_details.get('call_timestamp'),
                        'talk_time': lead_details.get('talk_time')
                    }
                    lead_data = self.create_auto_call_log(lead_data, call_info)
                elif recording_path:
                    # Fallback: If we have a recording but no call info, create a basic call log
                    logger.info(f"🎵 Creating fallback call log for recording: {recording_path}")
                    fallback_call_info = {
                        'call_duration': 'Unknown',
                        'call_timestamp': datetime.now().isoformat(),
                        'talk_time': 'Recording available'
                    }
                    lead_data = self.create_auto_call_log(lead_data, fallback_call_info)

                logger.info(f"📋 Final lead data for {lead_data['name']}:")
                logger.info(f"  Fleet Size: {policy_info['fleet_size']}")
                logger.info(f"  Premium: ${policy_info['calculated_premium']:,}")
                logger.info(f"  Insurance: {insurance_company}")
                logger.info(f"  DOT: {address1}")
                if lead_data.get('reachOut', {}).get('callLogs'):
                    logger.info(f"  📞 Call Log: {len(lead_data['reachOut']['callLogs'])} entries")

                # Save to database
                self.save_lead(lead_data)
                total_imported += 1

            except Exception as e:
                logger.error(f"❌ Error processing lead {lead_id}: {e}")

        logger.info(f"✅ Selective sync complete! Imported {total_imported} leads")

        return {
            "success": True,
            "imported": total_imported,
            "message": f"Successfully quick imported {total_imported} leads with premium and insurance data"
        }

def main():
    """Run selective sync with lead IDs from command line"""
    if len(sys.argv) < 2:
        logger.error("Usage: python3 vanguard_vicidial_sync_selective.py '[{\"id\":\"123\", \"name\":\"...\", ...}]'")
        sys.exit(1)

    try:
        selected_leads = json.loads(sys.argv[1])
        sync = VanguardViciDialSelectiveSync()
        result = sync.sync_specific_leads(selected_leads)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON input: {e}")
        print(json.dumps({"success": False, "error": "Invalid JSON input"}))
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()