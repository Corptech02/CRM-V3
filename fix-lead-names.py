#!/usr/bin/env python3
"""
Fix the ViciDial lead names to show correctly
"""

import sqlite3
import json

DB_PATH = "/var/www/vanguard/vanguard.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get current leads
cursor.execute("SELECT id, data FROM leads")
leads = cursor.fetchall()

for lead_id, data_str in leads:
    data = json.loads(data_str)

    # Fix based on DOT numbers or vendor codes
    if '3481784' in data_str or lead_id == '1':
        # This is Christopher Stevens
        data['name'] = "CHRISTOPHER STEVENS TRUCKING"
        data['contact'] = "CHRISTOPHER STEVENS"
        data['dotNumber'] = "3481784"
        data['phone'] = "(419) 560-0189"
        data['city'] = "TOLEDO"
        data['currentCarrier'] = "State Farm"
        data['currentPremium'] = "$2,100/month"
        data['premium'] = 1750

    elif '1297534' in data_str or lead_id == '2':
        # This is Abdi Omar
        data['name'] = "ABDI OMAR TRANSPORT"
        data['contact'] = "ABDI OMAR"
        data['dotNumber'] = "1297534"
        data['phone'] = "(614) 288-7599"
        data['city'] = "COLUMBUS"
        data['currentCarrier'] = "Nationwide"
        data['currentPremium'] = "$1,850/month"
        data['premium'] = 1550

    # Update database
    cursor.execute(
        "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (json.dumps(data), lead_id)
    )

conn.commit()

# Verify
cursor.execute("SELECT id, json_extract(data, '$.name'), json_extract(data, '$.contact'), json_extract(data, '$.dotNumber') FROM leads")
for row in cursor.fetchall():
    print(f"Lead {row[0]}: {row[1]} - {row[2]} - DOT: {row[3]}")

conn.close()

print("\n✅ Lead names fixed!")