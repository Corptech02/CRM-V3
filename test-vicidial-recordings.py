#!/usr/bin/env python3
"""
Test ViciDial recordings availability
"""

import requests
from bs4 import BeautifulSoup
import urllib3
import re

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

session = requests.Session()
session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
session.verify = False

print("Testing ViciDial recording access...")

# Test leads
test_leads = ['88546', '88571']

for lead_id in test_leads:
    print(f"\n=== Checking Lead {lead_id} ===")

    # Try to get lead details
    url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
    params = {
        'lead_id': lead_id,
        'list_id': '1000',
        'DB': ''
    }

    try:
        response = session.get(url, params=params, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for recording links
            recording_links = []
            for link in soup.find_all('a'):
                href = link.get('href', '')
                text = link.text.strip()

                # Check for recording URLs
                if 'recording' in href.lower() or 'RECORDINGS' in text or '.mp3' in href or '.wav' in href:
                    recording_links.append((text, href))
                    print(f"  Found recording link: {text} -> {href}")

                # Check for audio player references
                if 'audio' in href.lower():
                    print(f"  Found audio reference: {href}")

            # Look for any recording info in text
            page_text = response.text

            # Check for recording IDs or filenames
            recording_patterns = [
                r'recording_id["\']?\s*[:=]\s*["\']?([^"\'>\s]+)',
                r'filename["\']?\s*[:=]\s*["\']?([^"\'>\s]+\.(?:mp3|wav|gsm))',
                r'/RECORDINGS/[^"\'>\s]+',
                r'location["\']?\s*[:=]\s*["\']?([^"\'>\s]+)',
                r'url["\']?\s*[:=]\s*["\']?([^"\'>\s]+\.(?:mp3|wav|gsm))'
            ]

            for pattern in recording_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    print(f"  Pattern '{pattern}' found: {matches[:3]}")  # Show first 3 matches

            # Check for call log or recording log
            if 'call_log' in page_text.lower():
                print("  Found call_log reference")
            if 'recording_log' in page_text.lower():
                print("  Found recording_log reference")

            # Look for any tables with recording info
            tables = soup.find_all('table')
            for table in tables:
                headers = table.find_all(['th', 'td'])
                header_text = ' '.join([h.text.strip() for h in headers[:10]])
                if 'recording' in header_text.lower() or 'call' in header_text.lower():
                    print(f"  Found table with potential recording data: {header_text[:100]}")

    except Exception as e:
        print(f"  Error checking lead {lead_id}: {e}")

# Try to access recordings directory directly
print("\n=== Checking recordings directories ===")
recording_paths = [
    '/RECORDINGS/',
    '/recordings/',
    '/var/spool/asterisk/monitor/',
    '/vicidial/RECORDINGS/'
]

for path in recording_paths:
    url = f"https://{VICIDIAL_HOST}{path}"
    try:
        response = session.get(url, timeout=5)
        print(f"  {path}: Status {response.status_code}")
        if response.status_code == 200:
            print(f"    Success! Found recordings at {path}")
    except:
        print(f"  {path}: Failed to access")

# Check for recording API endpoints
print("\n=== Checking API endpoints ===")
api_endpoints = [
    '/vicidial/recording_lookup.php',
    '/vicidial/admin_audio_list.php',
    '/agc/recording_lookup.php',
    '/vicidial/non_agent_api.php'
]

for endpoint in api_endpoints:
    url = f"https://{VICIDIAL_HOST}{endpoint}"
    try:
        response = session.get(url, timeout=5)
        print(f"  {endpoint}: Status {response.status_code}")
    except:
        print(f"  {endpoint}: Failed to access")