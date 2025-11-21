#!/usr/bin/env python3
import sqlite3
import json

db = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = db.cursor()

# Get all leads
cursor.execute("SELECT id, data FROM leads")
leads = cursor.fetchall()

for lead_id, data_json in leads:
    data = json.loads(data_json)

    transcript = data.get('transcription', '')

    print(f"\nLead {lead_id}:")
    print(f"  Transcript length: {len(transcript)} chars")

    # Check if it contains ellipsis
    if '...' in transcript:
        print(f"  WARNING: Contains '...' ellipsis!")
        # Find where
        idx = transcript.index('...')
        print(f"  Ellipsis at position {idx}")
        print(f"  Before: '{transcript[max(0,idx-20):idx]}'")
        print(f"  After: '{transcript[idx:min(len(transcript),idx+20)]}'")

    # Show first and last 100 chars
    if len(transcript) > 200:
        print(f"  Start: {transcript[:100]}")
        print(f"  End: {transcript[-100:]}")
    else:
        print(f"  Full: {transcript}")

db.close()