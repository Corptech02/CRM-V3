#!/usr/bin/env python3
"""
Sync all duplicate name fields in leads to prevent display inconsistencies
"""

import sqlite3
import json

print("Syncing name fields for all leads...")

conn = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = conn.cursor()

cursor.execute('SELECT id, data FROM leads')
leads = cursor.fetchall()

fixed_count = 0

for lead_id, data_str in leads:
    data = json.loads(data_str)
    updated = False

    # Get the most complete name (prefer company_name over name)
    name = data.get('company_name') or data.get('name') or data.get('company', '')

    # Sync all name fields
    if name:
        if data.get('name') != name:
            data['name'] = name
            updated = True
        if data.get('company_name') != name:
            data['company_name'] = name
            updated = True
        if data.get('company') != name:
            data['company'] = name
            updated = True

    # Sync contact fields
    contact = data.get('contact_name') or data.get('contact', '')
    if contact:
        if data.get('contact') != contact:
            data['contact'] = contact
            updated = True
        if data.get('contact_name') != contact:
            data['contact_name'] = contact
            updated = True

    # Sync DOT fields
    dot = data.get('dot_number') or data.get('dotNumber') or data.get('dot', '')
    if dot:
        if data.get('dot_number') != dot:
            data['dot_number'] = dot
            updated = True
        if data.get('dotNumber') != dot:
            data['dotNumber'] = dot
            updated = True
        if data.get('dot') != dot:
            data['dot'] = dot
            updated = True

    # Sync MC fields
    mc = data.get('mc_number') or data.get('mcNumber') or data.get('mc', '')
    if mc:
        if data.get('mc_number') != mc:
            data['mc_number'] = mc
            updated = True
        if data.get('mcNumber') != mc:
            data['mcNumber'] = mc
            updated = True
        if data.get('mc') != mc:
            data['mc'] = mc
            updated = True

    if updated:
        cursor.execute(
            "UPDATE leads SET data = ? WHERE id = ?",
            (json.dumps(data), lead_id)
        )
        fixed_count += 1
        print(f"  ✓ Fixed {lead_id}: {name}")

conn.commit()
conn.close()

print(f"\n✅ Synced {fixed_count} leads")