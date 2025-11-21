#!/usr/bin/env python3
"""
Fix ViciDial leads to work with existing frontend
- Use numeric IDs (frontend expects numbers)
- Set stage to 'new' not 'qualified'
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

print("=" * 60)
print("FINAL FIX FOR VICIDIAL LEADS")
print("=" * 60)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get VL_ leads
cursor.execute("SELECT id, data FROM leads WHERE id LIKE 'VL_%'")
vl_leads = cursor.fetchall()

print(f"\nFound {len(vl_leads)} VL_ leads to fix")

for old_id, data_str in vl_leads:
    try:
        data = json.loads(data_str)

        # Extract numeric part from VL_88546 -> 88546
        new_id = old_id.replace('VL_', '')

        print(f"\nConverting {old_id} -> {new_id}")
        print(f"  Name: {data.get('name')}")

        # Update the data
        data['id'] = new_id  # Pure numeric
        data['stage'] = 'new'  # Change to 'new' as requested
        data['status'] = 'hot_lead'  # Ensure proper status

        # Delete old entry
        cursor.execute("DELETE FROM leads WHERE id = ?", (old_id,))

        # Insert with numeric ID
        cursor.execute("""
            INSERT INTO leads (id, data, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (new_id, json.dumps(data)))

        print(f"  ✅ Fixed: ID={new_id}, Stage={data['stage']}")

    except Exception as e:
        print(f"  ❌ Error: {e}")

conn.commit()

# Verify the fix
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

cursor.execute("""
    SELECT id,
           json_extract(data, '$.name'),
           json_extract(data, '$.stage'),
           json_extract(data, '$.status')
    FROM leads
    WHERE id IN ('88546', '88571')
""")

for row in cursor.fetchall():
    print(f"\n{row[0]}: {row[1]}")
    print(f"  Stage: {row[2]}")
    print(f"  Status: {row[3]}")

# Check if transcription exists
cursor.execute("""
    SELECT id,
           LENGTH(json_extract(data, '$.transcription')) as trans_len,
           json_extract(data, '$.currentPremium')
    FROM leads
    WHERE id IN ('88546', '88571')
""")

print("\nData verification:")
for row in cursor.fetchall():
    print(f"{row[0]}: Transcription={row[1]} chars, Premium={row[2]}")

conn.close()

print("\n✅ Leads fixed! Using numeric IDs and stage='new'")