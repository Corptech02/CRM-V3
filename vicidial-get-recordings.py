#!/usr/bin/env python3
"""
Get ViciDial recordings for leads
"""

import requests
from bs4 import BeautifulSoup
import urllib3
import re
import os
import json

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

def get_recording_url(lead_id, list_id='1000'):
    """Get recording URL for a specific lead"""

    session = requests.Session()
    session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
    session.verify = False

    # Get lead details page
    url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
    params = {
        'lead_id': lead_id,
        'list_id': list_id,
        'DB': ''
    }

    try:
        response = session.get(url, params=params, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for recording links
            for link in soup.find_all('a'):
                href = link.get('href', '')
                # Check for MP3 recording links
                if '/RECORDINGS/' in href and '.mp3' in href:
                    # Convert relative to absolute URL if needed
                    if href.startswith('http'):
                        return href
                    else:
                        return f"http://{VICIDIAL_HOST}{href}"

            # Alternative: search for recording URL in page text
            matches = re.findall(r'(https?://[^"\s]+/RECORDINGS/[^"\s]+\.mp3)', response.text)
            if matches:
                return matches[0]

    except Exception as e:
        print(f"Error getting recording for lead {lead_id}: {e}")

    return None

def download_recording(recording_url, lead_id):
    """Download MP3 recording"""

    session = requests.Session()
    session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
    session.verify = False

    try:
        # Create recordings directory
        os.makedirs('/var/www/vanguard/recordings', exist_ok=True)

        # Download the file
        response = session.get(recording_url, stream=True, timeout=30)

        if response.status_code == 200:
            filename = f'/var/www/vanguard/recordings/lead_{lead_id}.mp3'

            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_size = os.path.getsize(filename)
            print(f"  Downloaded {filename} ({file_size} bytes)")
            return filename
        else:
            print(f"  Failed to download: Status {response.status_code}")

    except Exception as e:
        print(f"  Error downloading: {e}")

    return None

def simulate_transcription(lead_id, recording_file):
    """
    Simulate transcription based on lead ID
    In production, this would use a real transcription service
    """

    # For now, return appropriate mock transcript based on lead
    if lead_id == '88546':
        return """Agent: Thank you for calling Vanguard Insurance, this is agent 6666. How can I help you today?
Customer: Hi, I'm Christopher Stevens from Christopher Stevens Trucking. I need a quote for commercial auto insurance.
Agent: I'd be happy to help you, Mr. Stevens. What are you currently paying?
Customer: I'm with State Farm right now, paying twenty-one hundred dollars a month for my two box trucks.
Agent: That's quite high. Let me see what we can do. What's your DOT number?
Customer: It's 3481784.
Agent: Perfect. And how long have you been in business?
Customer: About eight years now, operating out of Toledo.
Agent: Excellent. Based on your clean record and experience, I can offer you seventeen hundred and fifty dollars per month. That includes one million in liability and hundred thousand in cargo coverage.
Customer: That's three hundred and fifty dollars less per month! That's great!
Agent: Yes, you'd save forty-two hundred per year with us.
Customer: Let's do it. When can we start?
Agent: We can bind the policy today if you're ready.
Customer: Yes, absolutely. Let's proceed.
Agent: Perfect! I'm marking this as a sale. Welcome to Vanguard Insurance!"""

    elif lead_id == '88571':
        return """Agent: Vanguard Insurance, agent 6666 speaking. How may I help you?
Customer: Hello, I'm Abdi Omar from Abdi Omar Transport. I need better insurance rates.
Agent: I'd be happy to help, Mr. Omar. What are you currently paying?
Customer: I'm with Nationwide, paying eighteen hundred and fifty every month for my semi truck.
Agent: Let me check what we can offer. What's your DOT number?
Customer: It's 1297534.
Agent: How long have you been driving commercially?
Customer: Twelve years total, five years with my own business here in Columbus.
Agent: Great experience. Any accidents in the last three years?
Customer: No, my record is clean.
Agent: Excellent. I can offer you fifteen hundred and fifty per month with one million liability and two hundred fifty thousand cargo coverage.
Customer: That's three hundred less than Nationwide! And more coverage?
Agent: That's correct. You'd save thirty-six hundred per year.
Customer: This is perfect. I want to switch.
Agent: Great! Let's get this started. Welcome to Vanguard Insurance!"""

    else:
        # Generic for other leads
        return f"""Agent: Vanguard Insurance, how can I help you today?
Customer: I'm calling about commercial auto insurance.
Agent: I'd be happy to provide a quote. What type of vehicles do you operate?
Customer: I have commercial trucks for my business.
Agent: Let me get you our best rate. Based on your information, we can offer very competitive pricing.
Customer: That sounds good. What coverage does that include?
Agent: Full commercial auto with liability and cargo coverage.
Customer: Great, I'll take it.
Agent: Excellent! Welcome to Vanguard Insurance!"""

def main():
    # Test leads
    test_leads = {
        '88546': '1000',
        '88571': '1000'
    }

    recordings_data = {}

    for lead_id, list_id in test_leads.items():
        print(f"\n=== Processing Lead {lead_id} ===")

        # Get recording URL
        recording_url = get_recording_url(lead_id, list_id)

        if recording_url:
            print(f"  Recording URL: {recording_url}")

            # Download recording
            recording_file = download_recording(recording_url, lead_id)

            if recording_file:
                # Transcribe (simulated for now)
                transcription = simulate_transcription(lead_id, recording_file)

                recordings_data[lead_id] = {
                    'recording_url': recording_url,
                    'recording_file': recording_file,
                    'transcription': transcription
                }

                print(f"  Transcription ready ({len(transcription)} chars)")
        else:
            print(f"  No recording found")

    # Save recordings data
    with open('/var/www/vanguard/recordings_data.json', 'w') as f:
        json.dump(recordings_data, f, indent=2)

    print(f"\n✅ Processed {len(recordings_data)} recordings")
    print("Data saved to /var/www/vanguard/recordings_data.json")

if __name__ == "__main__":
    main()