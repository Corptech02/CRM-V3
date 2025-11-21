#!/usr/bin/env python3
"""
Fix ViciDial lead IDs to use numeric format like other leads
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

print("=" * 60)
print("FIXING VICIDIAL LEAD IDs TO NUMERIC FORMAT")
print("=" * 60)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get current ViciDial leads
cursor.execute("SELECT id, data FROM leads WHERE id LIKE 'VICI-%' ORDER BY id")
vici_leads = cursor.fetchall()

print(f"\nFound {len(vici_leads)} ViciDial leads to fix")

# Start IDs after the highest existing numeric ID
next_id = 88546  # Use the actual ViciDial lead numbers as IDs

for old_id, data_str in vici_leads:
    try:
        data = json.loads(data_str)

        # Determine new numeric ID based on which ViciDial lead this is
        if "CHRISTOPHER STEVENS" in data.get('name', ''):
            new_id = "88546"
        elif "ABDI OMAR" in data.get('name', ''):
            new_id = "88571"
        else:
            # Fallback - extract number from old ID if present
            new_id = old_id.replace('VICI-', '')
            if not new_id.isdigit():
                new_id = str(next_id)
                next_id += 1

        print(f"\nConverting {old_id} -> {new_id}")
        print(f"  Name: {data.get('name')}")

        # Update the ID in the data structure
        data['id'] = new_id

        # Delete old record first (to avoid primary key conflict)
        cursor.execute("DELETE FROM leads WHERE id = ?", (old_id,))

        # Insert with new numeric ID
        cursor.execute("""
            INSERT INTO leads (id, data, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (new_id, json.dumps(data)))

        print(f"  ✅ Successfully converted to ID: {new_id}")

    except Exception as e:
        print(f"  ❌ Error converting {old_id}: {e}")

conn.commit()

# Verify the conversion
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM leads WHERE id LIKE 'VICI-%'")
old_format_count = cursor.fetchone()[0]
print(f"\nLeads with old VICI- format: {old_format_count}")

cursor.execute("SELECT id, json_extract(data, '$.name') FROM leads WHERE id IN ('88546', '88571')")
for row in cursor.fetchall():
    print(f"✅ Lead {row[0]}: {row[1]}")

conn.close()

print("\n✅ Lead IDs converted to numeric format!")