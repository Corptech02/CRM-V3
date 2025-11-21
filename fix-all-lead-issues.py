#!/usr/bin/env python3
"""
Fix all lead issues:
1. Change all leads to stage 'new'
2. Add missing status field
3. Remove duplicate ViciDial entries
4. Ensure proper lead profile structure
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

print("=" * 60)
print("FIXING ALL LEAD ISSUES")
print("=" * 60)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# First, remove duplicate ViciDial entries
print("\n1. Removing duplicate ViciDial entries (VICI-1, VICI-2)...")
cursor.execute("DELETE FROM leads WHERE id IN ('VICI-1', 'VICI-2')")
deleted = cursor.rowcount
print(f"   ✅ Deleted {deleted} duplicate entries")

# Get all leads
cursor.execute("SELECT id, data FROM leads")
leads = cursor.fetchall()

print(f"\n2. Updating {len(leads)} leads to stage 'new' and fixing structure...")

fixed_count = 0
for lead_id, data_str in leads:
    try:
        data = json.loads(data_str)
        original_stage = data.get('stage', 'unknown')

        # Update stage to 'new' for ALL leads
        data['stage'] = 'new'

        # Add status field if missing (required for frontend)
        if 'status' not in data:
            data['status'] = 'hot_lead'

        # Ensure all required fields exist for proper lead profile
        required_fields = {
            'id': lead_id,
            'name': data.get('name', 'Unknown'),
            'contact': data.get('contact', data.get('name', 'Unknown')),
            'phone': data.get('phone', ''),
            'email': data.get('email', ''),
            'product': data.get('product', 'Commercial Auto'),
            'stage': 'new',  # Force to 'new'
            'status': data.get('status', 'hot_lead'),
            'assignedTo': data.get('assignedTo', 'Sales Team'),
            'created': data.get('created', datetime.now().strftime("%-m/%-d/%Y")),
            'renewalDate': data.get('renewalDate', ''),
            'premium': data.get('premium', 0),
            'dotNumber': data.get('dotNumber', ''),
            'mcNumber': data.get('mcNumber', ''),
            'yearsInBusiness': data.get('yearsInBusiness', 'Unknown'),
            'fleetSize': data.get('fleetSize', 'Unknown'),
            'address': data.get('address', ''),
            'city': data.get('city', ''),
            'state': data.get('state', ''),
            'zip': data.get('zip', ''),
            'radiusOfOperation': data.get('radiusOfOperation', 'Unknown'),
            'commodityHauled': data.get('commodityHauled', ''),
            'source': data.get('source', 'Unknown'),
            'notes': data.get('notes', ''),
            'leadScore': data.get('leadScore', 0),
            'lastContactDate': data.get('lastContactDate', ''),
            'followUpDate': data.get('followUpDate', ''),
            'operatingStates': data.get('operatingStates', []),
            'annualRevenue': data.get('annualRevenue', ''),
            'safetyRating': data.get('safetyRating', ''),
            'currentCarrier': data.get('currentCarrier', ''),
            'currentPremium': data.get('currentPremium', ''),
            'needsCOI': data.get('needsCOI', False),
            'insuranceLimits': data.get('insuranceLimits', {})
        }

        # Update the database with the complete structure
        cursor.execute(
            "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (json.dumps(required_fields), lead_id)
        )

        fixed_count += 1
        print(f"   ✅ Fixed {lead_id}: {required_fields['name']} (was stage: '{original_stage}', now: 'new')")

    except Exception as e:
        print(f"   ❌ Error fixing {lead_id}: {e}")

conn.commit()

print(f"\n3. Summary:")
print(f"   - Removed {deleted} duplicate entries")
print(f"   - Fixed {fixed_count} leads (all set to stage 'new')")

# Verify the changes
print("\n4. Verification:")
cursor.execute("SELECT COUNT(*) FROM leads WHERE json_extract(data, '$.stage') = 'new'")
new_count = cursor.fetchone()[0]
print(f"   - Leads with stage 'new': {new_count}")

cursor.execute("SELECT COUNT(*) FROM leads WHERE json_extract(data, '$.status') IS NULL")
missing_status = cursor.fetchone()[0]
print(f"   - Leads missing status field: {missing_status}")

cursor.execute("SELECT COUNT(*) FROM leads WHERE id LIKE 'VICI-%'")
vici_count = cursor.fetchone()[0]
print(f"   - ViciDial leads remaining: {vici_count}")

# Show sample of fixed leads
print("\n5. Sample of fixed leads:")
cursor.execute("SELECT id, json_extract(data, '$.name'), json_extract(data, '$.stage'), json_extract(data, '$.status') FROM leads LIMIT 5")
for row in cursor.fetchall():
    print(f"   {row[0]}: {row[1]} - Stage: {row[2]}, Status: {row[3]}")

conn.close()

print("\n✅ All lead issues fixed! Refresh the Lead Management page.")