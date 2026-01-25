#!/usr/bin/env python3
"""
Patch script to replace the extract_call_info method in the ViciDial sync script
with the enhanced version for better call duration extraction reliability
"""

import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    file_path = "/var/www/vanguard/vanguard_vicidial_sync_selective.py"

    logger.info("🔧 Patching ViciDial sync script with enhanced call duration extraction...")

    try:
        # Read the original file
        with open(file_path, 'r') as f:
            content = f.read()

        # Find the start and end of the extract_call_info method
        start_marker = "    def extract_call_info(self, page_html, lead_id=None):"

        # Find where the method starts
        start_index = content.find(start_marker)
        if start_index == -1:
            logger.error("❌ Could not find extract_call_info method")
            return False

        # Find the next method definition to know where this method ends
        next_method_marker = "\n    def "
        search_start = start_index + len(start_marker)
        end_index = content.find(next_method_marker, search_start)

        if end_index == -1:
            logger.error("❌ Could not find end of extract_call_info method")
            return False

        logger.info(f"📍 Found method at position {start_index} to {end_index}")

        # Enhanced method code
        enhanced_method = '''    def extract_call_info(self, page_html, lead_id=None):
        """Enhanced call duration extraction with improved reliability"""
        import re
        import os
        import subprocess
        from bs4 import BeautifulSoup

        call_info = {
            'call_duration': None,
            'call_timestamp': None,
            'talk_time': None,
            'extraction_method': None
        }

        try:
            # STRATEGY 1: Parse HTML with BeautifulSoup for better structure understanding
            soup = BeautifulSoup(page_html, 'html.parser')

            # Look for RECORDINGS section specifically
            recordings_markers = soup.find_all(string=re.compile(r"RECORDINGS FOR THIS LEAD", re.IGNORECASE))

            if recordings_markers:
                logger.info(f"🎬 Found RECORDINGS markers: {len(recordings_markers)}")

                # Get the parent elements and find nearby table data
                for marker in recordings_markers:
                    parent = marker.parent

                    # Look for the next table after this marker
                    table = parent.find_next('table')
                    if table:
                        logger.info("📊 Found table after RECORDINGS marker")

                        # Look for rows with numeric data that could be call duration
                        rows = table.find_all('tr')

                        for i, row in enumerate(rows):
                            cells = row.find_all(['td', 'th'])

                            # Look for header row first to understand structure
                            if any('SECONDS' in cell.get_text().upper() for cell in cells):
                                logger.info(f"🎯 Found SECONDS header in row {i}")

                                # The next data row should contain the actual duration
                                if i + 1 < len(rows):
                                    data_row = rows[i + 1]
                                    data_cells = data_row.find_all(['td', 'th'])

                                    # Find the cell that corresponds to SECONDS column
                                    seconds_col_index = None
                                    for idx, cell in enumerate(cells):
                                        if 'SECONDS' in cell.get_text().upper():
                                            seconds_col_index = idx
                                            break

                                    if seconds_col_index is not None and seconds_col_index < len(data_cells):
                                        seconds_text = data_cells[seconds_col_index].get_text().strip()

                                        # Extract numeric value
                                        seconds_match = re.search(r'(\\d{1,4})', seconds_text)
                                        if seconds_match:
                                            seconds = int(seconds_match.group(1))

                                            if 1 <= seconds <= 3600:  # Reasonable bounds
                                                call_info['call_duration'] = self.format_duration(seconds)
                                                call_info['talk_time'] = self.format_talk_time(seconds)
                                                call_info['extraction_method'] = 'HTML_TABLE_SECONDS_COLUMN'
                                                logger.info(f"✅ Method 1 (Table SECONDS): {call_info['talk_time']} ({seconds}s)")
                                                return self.add_timestamp(call_info, page_html)

            # STRATEGY 2: Enhanced regex patterns with better structure awareness
            if not call_info['call_duration']:
                logger.info("🔍 Trying enhanced regex patterns...")

                # More specific patterns for ViciDial RECORDINGS section
                enhanced_patterns = [
                    # Pattern 1: Full RECORDINGS table structure
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?<tr[^>]*>.*?<td[^>]*>\\s*\\d+\\s*</td>.*?<td[^>]*>[^<]*</td>.*?<td[^>]*>[^<]*</td>.*?<td[^>]*>\\s*(\\d{1,4})\\s*</td>',

                    # Pattern 2: Any SECONDS cell after RECORDINGS marker
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?<td[^>]*>\\s*(\\d{1,4})\\s*</td>',

                    # Pattern 3: Look for patterns like "123 seconds" or "123s" after RECORDINGS
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?(\\d{1,4})\\s*(?:seconds?|sec|s)\\b',

                    # Pattern 4: Numeric value followed by recording ID pattern
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?(\\d{1,4})\\s+\\d{6,}\\s+',

                    # Pattern 5: Time duration in table cell format
                    r'<td[^>]*>\\s*(\\d{2,4})\\s*</td>',

                    # Pattern 6: Look for time patterns anywhere
                    r'\\b(\\d{1,4})\\s*(?:seconds?|sec)\\b',
                ]

                for i, pattern in enumerate(enhanced_patterns, 1):
                    matches = re.findall(pattern, page_html, re.IGNORECASE)

                    for match in matches:
                        try:
                            seconds = int(match if isinstance(match, str) else match[0])

                            # Better bounds checking
                            if 5 <= seconds <= 1800:  # 5 seconds to 30 minutes
                                call_info['call_duration'] = self.format_duration(seconds)
                                call_info['talk_time'] = self.format_talk_time(seconds)
                                call_info['extraction_method'] = f'REGEX_PATTERN_{i}'
                                logger.info(f"✅ Method 2 (Pattern {i}): {call_info['talk_time']} ({seconds}s)")
                                return self.add_timestamp(call_info, page_html)

                        except (ValueError, IndexError):
                            continue

            # STRATEGY 3: Parse raw text for RECORDINGS section
            if not call_info['call_duration']:
                logger.info("🔍 Trying raw text parsing...")

                # Find RECORDINGS section in plain text
                recordings_match = re.search(r'RECORDINGS FOR THIS LEAD:(.*?)(?:\\n\\n|\\n[A-Z]|$)', page_html, re.DOTALL)

                if recordings_match:
                    recordings_section = recordings_match.group(1)
                    logger.info(f"📋 RECORDINGS section found: {recordings_section[:200]}...")

                    # Look for numeric patterns in the recordings section
                    # ViciDial format is typically: LEAD_ID DATE/TIME SECONDS RECORDING_ID
                    lines = recordings_section.strip().split('\\n')

                    for line in lines:
                        line = line.strip()
                        if line and not 'SECONDS' in line.upper():  # Skip header
                            # Look for pattern: numbers, datetime, seconds, recording_id
                            parts = line.split()

                            for part in parts:
                                if part.isdigit():
                                    seconds = int(part)
                                    # If it's a reasonable call duration (not a date/ID)
                                    if 5 <= seconds <= 1800:
                                        call_info['call_duration'] = self.format_duration(seconds)
                                        call_info['talk_time'] = self.format_talk_time(seconds)
                                        call_info['extraction_method'] = 'RAW_TEXT_PARSING'
                                        logger.info(f"✅ Method 3 (Raw Text): {call_info['talk_time']} ({seconds}s)")
                                        return self.add_timestamp(call_info, page_html)

            # STRATEGY 4: Recording file duration fallback (if file exists)
            if not call_info['call_duration'] and lead_id:
                logger.info("🎵 Trying recording file duration...")

                recording_paths = [
                    f"/var/www/vanguard/recordings/recording_{lead_id}.mp3",
                    f"/var/www/vanguard/recordings/recording_8{lead_id}.mp3"
                ]

                for recording_path in recording_paths:
                    if os.path.exists(recording_path):
                        try:
                            result = subprocess.run([
                                'ffprobe', '-v', 'quiet', '-show_entries',
                                'format=duration', '-of', 'csv=p=0', recording_path
                            ], capture_output=True, text=True, timeout=10)

                            if result.returncode == 0 and result.stdout.strip():
                                duration_seconds = int(float(result.stdout.strip()))

                                call_info['call_duration'] = self.format_duration(duration_seconds)
                                call_info['talk_time'] = self.format_talk_time(duration_seconds)
                                call_info['extraction_method'] = 'RECORDING_FILE_FFPROBE'
                                logger.info(f"✅ Method 4 (File): {call_info['talk_time']} ({duration_seconds}s)")
                                return self.add_timestamp(call_info, page_html)

                        except Exception as e:
                            logger.warning(f"⚠️ ffprobe error for {recording_path}: {e}")

            # STRATEGY 5: Last resort - look for any reasonable numbers
            if not call_info['call_duration']:
                logger.info("🔍 Last resort: scanning all numbers...")

                # Find all numbers in the page
                all_numbers = re.findall(r'\\b(\\d{1,4})\\b', page_html)

                # Sort by value (longer calls more likely to be real)
                valid_numbers = []
                for num_str in all_numbers:
                    num = int(num_str)
                    if 30 <= num <= 1800:  # 30 seconds to 30 minutes
                        valid_numbers.append(num)

                if valid_numbers:
                    # Take the longest reasonable duration
                    valid_numbers.sort(reverse=True)
                    seconds = valid_numbers[0]

                    call_info['call_duration'] = self.format_duration(seconds)
                    call_info['talk_time'] = self.format_talk_time(seconds)
                    call_info['extraction_method'] = 'LAST_RESORT_LONGEST'
                    logger.info(f"✅ Method 5 (Last Resort): {call_info['talk_time']} ({seconds}s)")
                    return self.add_timestamp(call_info, page_html)

            logger.warning("❌ No call duration found with any method")

        except Exception as e:
            logger.error(f"❌ Error in enhanced call duration extraction: {e}")

        return self.add_timestamp(call_info, page_html)

    def format_duration(self, seconds):
        """Format seconds into MM:SS format"""
        if seconds <= 0:
            return "0:00"

        minutes = seconds // 60
        remaining_seconds = seconds % 60
        return f"{minutes}:{remaining_seconds:02d}"

    def format_talk_time(self, seconds):
        """Format seconds into human readable format"""
        if seconds <= 0:
            return "0 sec"

        if seconds < 60:
            return f"{seconds} sec"

        minutes = seconds // 60
        remaining_seconds = seconds % 60

        if remaining_seconds == 0:
            return f"{minutes} min"
        else:
            return f"{minutes} min {remaining_seconds} sec"

    def add_timestamp(self, call_info, page_html):
        """Add timestamp extraction to call_info"""

        # Pattern 2: Look for call timestamp
        timestamp_patterns = [
            r'Call\\s*Time:\\s*(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})',
            r'Start\\s*Time:\\s*(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})',
            r'call_date[^>]*>([^<]+)<',
            r'start_epoch[^>]*>(\\d+)<',
            r'(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})',  # Generic datetime format
            r'(\\d{2}/\\d{2}/\\d{4}\\s+\\d{2}:\\d{2}:\\d{2})',  # MM/DD/YYYY format
        ]

        for pattern in timestamp_patterns:
            matches = re.findall(pattern, page_html, re.IGNORECASE)
            if matches:
                call_info['call_timestamp'] = matches[0]
                logger.info(f"✅ Found call timestamp: {call_info['call_timestamp']}")
                break

        return call_info
'''

        # Replace the old method with the enhanced one
        new_content = content[:start_index] + enhanced_method + content[end_index:]

        # Create backup
        backup_path = file_path + ".backup"
        with open(backup_path, 'w') as f:
            f.write(content)
        logger.info(f"📋 Created backup: {backup_path}")

        # Write the patched version
        with open(file_path, 'w') as f:
            f.write(new_content)

        logger.info("✅ Successfully patched ViciDial sync script with enhanced call duration extraction!")
        logger.info("🎯 The new method uses 5 different strategies for maximum reliability:")
        logger.info("   1. HTML table parsing with BeautifulSoup")
        logger.info("   2. Enhanced regex patterns")
        logger.info("   3. Raw text parsing")
        logger.info("   4. Recording file duration (ffprobe)")
        logger.info("   5. Last resort number scanning")

        return True

    except Exception as e:
        logger.error(f"❌ Error patching file: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)