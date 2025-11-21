#!/usr/bin/env python3
"""
Fix lead database sync issues - ensures vanguard.db has all the latest data
since the frontend reads from vanguard.db
"""

import sqlite3
import json
from datetime import datetime

print("=" * 60)
print("FIXING LEAD DATABASE SYNC")
print("=" * 60)

# Connect to both databases
vanguard_conn = sqlite3.connect('/var/www/vanguard/vanguard.db')
vanguard_cursor = vanguard_conn.cursor()

system_conn = sqlite3.connect('/var/www/vanguard/vanguard_system.db')
system_cursor = system_conn.cursor()

# Get all leads from vanguard_system.db
system_cursor.execute("""
    SELECT lead_id, company_name, stage, status, premium,
           contact_name, phone, email, dot_number, mc_number,
           notes, assigned_to
    FROM leads
""")
system_leads = system_cursor.fetchall()

print(f"\nFound {len(system_leads)} leads in vanguard_system.db")

updated_count = 0
created_count = 0

for lead in system_leads:
    lead_id = lead[0]

    # Check if lead exists in vanguard.db
    vanguard_cursor.execute("SELECT id, data FROM leads WHERE id = ?", (lead_id,))
    existing = vanguard_cursor.fetchone()

    # Prepare lead data
    lead_data = {
        'id': lead_id,
        'name': lead[1] or '',
        'company_name': lead[1] or '',
        'stage': lead[2] or 'new',
        'status': lead[3] or 'active',
        'premium': lead[4] or 0,
        'contact': lead[5] or '',
        'contact_name': lead[5] or '',
        'phone': lead[6] or '',
        'email': lead[7] or '',
        'dotNumber': lead[8] or '',
        'dot_number': lead[8] or '',
        'mcNumber': lead[9] or '',
        'mc_number': lead[9] or '',
        'notes': lead[10] or '',
        'assignedTo': lead[11] or '',
        'assigned_to': lead[11] or '',
        'updated_at': datetime.now().isoformat()
    }

    if existing:
        # Update existing lead with data from vanguard_system.db
        existing_data = json.loads(existing[1])

        # Only update if system DB has more recent/complete data
        if lead[2] != 'new' or lead[4] > 0:  # Has stage or premium
            existing_data.update(lead_data)

            vanguard_cursor.execute(
                "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(existing_data), lead_id)
            )
            updated_count += 1
            print(f"   ✅ Updated {lead_id}: {lead[1]} (stage: {lead[2]}, premium: ${lead[4] or 0})")
    else:
        # Create new lead in vanguard.db
        vanguard_cursor.execute(
            "INSERT INTO leads (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            (lead_id, json.dumps(lead_data))
        )
        created_count += 1
        print(f"   ✅ Created {lead_id}: {lead[1]}")

vanguard_conn.commit()

print(f"\n✅ Sync complete!")
print(f"   - Updated {updated_count} existing leads")
print(f"   - Created {created_count} new leads")

# Close connections
vanguard_conn.close()
system_conn.close()