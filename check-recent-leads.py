#!/usr/bin/env python3
"""
Check the most recent Vicidial leads to verify insurance company and audio data
"""

import sqlite3
import json
from datetime import datetime

# Connect to database
db_path = "/var/www/vanguard/vanguard.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if leads table exists and what columns it has
    cursor.execute("PRAGMA table_info(leads)")
    columns = cursor.fetchall()

    print("📊 Database Table Structure:")
    print("=" * 50)
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    print()

    # Get recent leads (last 5)
    cursor.execute("SELECT * FROM leads ORDER BY rowid DESC LIMIT 5")
    recent_leads = cursor.fetchall()

    print("🔍 Recent Leads Analysis:")
    print("=" * 50)

    if recent_leads:
        # Get column names
        column_names = [description[0] for description in cursor.description]

        for i, lead in enumerate(recent_leads, 1):
            lead_dict = dict(zip(column_names, lead))

            print(f"\n📋 Lead #{i}: {lead_dict.get('name', 'Unknown')}")
            print(f"  ID: {lead_dict.get('id', 'N/A')}")
            print(f"  Phone: {lead_dict.get('phone', 'N/A')}")
            print(f"  Insurance Company: {lead_dict.get('currentInsuranceCompany', 'NOT FOUND')}")
            print(f"  Audio URL: {lead_dict.get('audioUrl', 'NOT FOUND')}")
            print(f"  Audio Filename: {lead_dict.get('audioFileName', 'NOT FOUND')}")
            print(f"  Source: {lead_dict.get('source', 'Unknown')}")
    else:
        print("No leads found in database")

    conn.close()

except Exception as e:
    print(f"❌ Database Error: {e}")
    print("\n🔍 Checking localStorage format instead...")

    # Check if leads are stored in a JSON file or localStorage format
    try:
        # Sometimes leads are stored in JSON files
        import os

        # List potential data files
        data_files = []
        for root, dirs, files in os.walk("/var/www/vanguard"):
            for file in files:
                if any(keyword in file.lower() for keyword in ['lead', 'vicidial']) and file.endswith('.json'):
                    data_files.append(os.path.join(root, file))

        print(f"Found {len(data_files)} potential data files:")
        for file in data_files[:5]:  # Show first 5
            print(f"  - {file}")

    except Exception as e2:
        print(f"❌ File search error: {e2}")

print("\n💡 If leads aren't showing enhanced data:")
print("1. Make sure the frontend is using the correct sync endpoint")
print("2. Verify the enhanced sync script is being called")
print("3. Check that leads are being saved to the correct storage")