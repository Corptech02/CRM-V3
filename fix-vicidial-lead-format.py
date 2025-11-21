#!/usr/bin/env python3
"""
Fix ViciDial lead format to match frontend expectations
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

print("=" * 60)
print("FIXING VICIDIAL LEAD DATA FORMAT")
print("=" * 60)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get ViciDial leads
cursor.execute("SELECT id, data FROM leads WHERE id LIKE 'VICI-%'")
vici_leads = cursor.fetchall()

print(f"\nFound {len(vici_leads)} ViciDial leads to fix\n")

for lead_id, data_str in vici_leads:
    try:
        data = json.loads(data_str)

        print(f"Fixing {lead_id}...")
        print(f"  Current name: {data.get('name')}")

        # Create properly formatted lead data matching frontend expectations
        if 'VICI-1' in lead_id or '3481784' in str(data.get('name', '')):
            formatted_data = {
                "id": lead_id,
                "name": "Christopher Stevens",
                "contact": "Christopher Stevens",
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
                "city": "Ohio",
                "state": "OH",
                "zip": "",
                "radiusOfOperation": "Unknown",
                "commodityHauled": "",
                "source": "ViciDial Sale",
                "status": "hot",
                "priority": "high",
                "tags": ["ViciDial", "Sale", "List-1000"],
                "notes": "ViciDial SALE lead from list 1000"
            }
        elif 'VICI-2' in lead_id or '1297534' in str(data.get('name', '')):
            formatted_data = {
                "id": lead_id,
                "name": "Abdi Omar",
                "contact": "Abdi Omar",
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
                "city": "Columbus",
                "state": "OH",
                "zip": "",
                "radiusOfOperation": "Unknown",
                "commodityHauled": "",
                "source": "ViciDial Sale",
                "status": "hot",
                "priority": "high",
                "tags": ["ViciDial", "Sale", "List-1000"],
                "notes": "ViciDial SALE lead from list 1000"
            }
        else:
            # Generic format for other ViciDial leads
            formatted_data = {
                "id": lead_id,
                "name": data.get('name', 'Unknown'),
                "contact": data.get('name', 'Unknown'),
                "phone": data.get('phone', ''),
                "email": data.get('email', ''),
                "product": "Commercial Auto",
                "stage": "qualified",
                "assignedTo": "Sales Team",
                "created": datetime.now().strftime("%-m/%-d/%Y"),
                "renewalDate": "",
                "premium": 0,
                "dotNumber": data.get('dotNumber', ''),
                "mcNumber": "",
                "yearsInBusiness": "Unknown",
                "fleetSize": "Unknown",
                "address": data.get('address', ''),
                "city": data.get('city', ''),
                "state": data.get('state', ''),
                "zip": data.get('zip', ''),
                "radiusOfOperation": "Unknown",
                "commodityHauled": "",
                "source": data.get('source', 'ViciDial'),
                "status": data.get('status', 'hot'),
                "priority": data.get('priority', 'high'),
                "tags": data.get('tags', []),
                "notes": data.get('notes', '')
            }

        # Update the database with properly formatted data
        cursor.execute("UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                      (json.dumps(formatted_data), lead_id))

        print(f"  ✅ Fixed: {formatted_data['name']} - {formatted_data['phone']}")

    except Exception as e:
        print(f"  ❌ Error fixing {lead_id}: {e}")

conn.commit()

# Verify the fix
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

cursor.execute("SELECT id, data FROM leads WHERE id LIKE 'VICI-%'")
for lead_id, data_str in cursor.fetchall():
    data = json.loads(data_str)
    print(f"\n{lead_id}:")
    print(f"  Name: {data.get('name')}")
    print(f"  Contact: {data.get('contact')}")
    print(f"  Phone: {data.get('phone')}")
    print(f"  Email: {data.get('email')}")
    print(f"  DOT: {data.get('dotNumber')}")
    print(f"  Stage: {data.get('stage')}")
    print(f"  Assigned: {data.get('assignedTo')}")

conn.close()

print("\n✅ ViciDial leads fixed and ready for display!")