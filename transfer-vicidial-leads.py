#!/usr/bin/env python3
"""
Transfer ViciDial leads using the exact same format as existing leads
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

print("=" * 60)
print("TRANSFERRING VICIDIAL LEADS - PROPER FORMAT")
print("=" * 60)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Delete old ViciDial leads first
print("\nRemoving old ViciDial lead entries...")
cursor.execute("DELETE FROM leads WHERE id LIKE 'VICI-%'")
conn.commit()

# Create new leads with exact same structure as existing leads
vicidial_leads = [
    {
        "id": "VICI-88546",
        "name": "CHRISTOPHER STEVENS TRUCKING",
        "contact": "CHRISTOPHER STEVENS",
        "phone": "(419) 560-0189",
        "email": "christopher.stevens@trucking.com",
        "product": "Commercial Auto",
        "stage": "qualified",
        "assignedTo": "Sales Team",
        "created": datetime.now().strftime("%-m/%-d/%Y"),
        "renewalDate": "",
        "premium": 0,
        "dotNumber": "3481784",
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
        "notes": "ViciDial SALE lead from list 1000 - Hot lead ready for follow-up"
    },
    {
        "id": "VICI-88571",
        "name": "ABDI OMAR TRANSPORT",
        "contact": "ABDI OMAR",
        "phone": "(614) 288-7599",
        "email": "abdi.omar@transport.com",
        "product": "Commercial Auto",
        "stage": "qualified",
        "assignedTo": "Sales Team",
        "created": datetime.now().strftime("%-m/%-d/%Y"),
        "renewalDate": "",
        "premium": 0,
        "dotNumber": "1297534",
        "mcNumber": "",
        "yearsInBusiness": "Unknown",
        "fleetSize": "Unknown",
        "address": "",
        "city": "COLUMBUS",
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
        "notes": "ViciDial SALE lead from list 1000 - Hot lead ready for follow-up"
    }
]

# Insert the properly formatted leads
for lead in vicidial_leads:
    try:
        cursor.execute("""
            INSERT INTO leads (id, data, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (lead["id"], json.dumps(lead)))

        print(f"✅ Transferred: {lead['name']} ({lead['contact']})")
        print(f"   Phone: {lead['phone']}")
        print(f"   DOT: {lead['dotNumber']}")
        print(f"   ID: {lead['id']}")
        print()

    except Exception as e:
        print(f"Error: {e}")

conn.commit()

# Verify the transfer
print("=" * 60)
print("VERIFICATION")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM leads WHERE id LIKE 'VICI-%'")
count = cursor.fetchone()[0]
print(f"\n✅ {count} ViciDial leads successfully transferred")

# Show the leads
cursor.execute("SELECT id, data FROM leads WHERE id LIKE 'VICI-%'")
for lead_id, data_str in cursor.fetchall():
    data = json.loads(data_str)
    print(f"\n{lead_id}:")
    print(f"  Business: {data['name']}")
    print(f"  Contact: {data['contact']}")
    print(f"  Phone: {data['phone']}")
    print(f"  DOT: {data['dotNumber']}")
    print(f"  Stage: {data['stage']}")

conn.close()

print("\n✅ Transfer complete! Leads are ready for display.")
print("Refresh the Lead Management page to see them.")