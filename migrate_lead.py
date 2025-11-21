#!/usr/bin/env python3
"""Migrate lead 88571 from vanguard.db to vanguard_system.db"""

import sqlite3
import json

# Get lead from vanguard.db
conn_old = sqlite3.connect('/var/www/vanguard/vanguard.db')
conn_old.row_factory = sqlite3.Row
cursor_old = conn_old.cursor()

cursor_old.execute("SELECT data FROM leads WHERE id = '88571'")
row = cursor_old.fetchone()

if row:
    data = json.loads(row['data'])

    # Connect to vanguard_system.db
    conn_new = sqlite3.connect('/var/www/vanguard/vanguard_system.db')
    cursor_new = conn_new.cursor()

    # Check if lead already exists
    cursor_new.execute("SELECT lead_id FROM leads WHERE lead_id = ?", (data.get('id', '88571'),))
    existing = cursor_new.fetchone()

    if existing:
        print(f"Lead {data.get('id')} already exists, updating...")
        # Update existing lead
        cursor_new.execute("""
            UPDATE leads SET
                company_name = ?,
                contact_name = ?,
                phone = ?,
                email = ?,
                dot_number = ?,
                mc_number = ?,
                years_in_business = ?,
                fleet_size = ?,
                address = ?,
                city = ?,
                state = ?,
                zip_code = ?,
                radius_of_operation = ?,
                commodity_hauled = ?,
                operating_states = ?,
                stage = ?,
                status = ?,
                premium = ?,
                notes = ?
            WHERE lead_id = ?
        """, (
            data.get('name') or data.get('company_name', ''),
            data.get('contact') or data.get('contact_name', ''),
            data.get('phone', ''),
            data.get('email', ''),
            data.get('dotNumber') or data.get('dot_number', ''),
            data.get('mcNumber') or data.get('mc_number', ''),
            int(data.get('yearsInBusiness', 0)) if data.get('yearsInBusiness') and str(data.get('yearsInBusiness')).isdigit() else 0,
            int(data.get('fleetSize', 0)) if data.get('fleetSize') and str(data.get('fleetSize')).replace(' units', '').isdigit() else 0,
            data.get('address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('zip') or data.get('zip_code', ''),
            data.get('radiusOfOperation') or data.get('radius_of_operation', ''),
            data.get('commodityHauled') or data.get('commodity_hauled', ''),
            data.get('operatingStates') or data.get('operating_states', ''),
            data.get('stage', 'new'),
            data.get('status', 'active'),
            float(data.get('premium', 0)) if data.get('premium') else 0,
            data.get('notes', ''),
            data.get('id', '88571')
        ))
    else:
        print(f"Inserting lead {data.get('id')}...")
        # Insert new lead
        cursor_new.execute("""
            INSERT INTO leads (
                lead_id, company_name, contact_name, phone, email,
                dot_number, mc_number, years_in_business, fleet_size,
                address, city, state, zip_code, radius_of_operation,
                commodity_hauled, operating_states, stage, status, premium, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('id', '88571'),
            data.get('name') or data.get('company_name', ''),
            data.get('contact') or data.get('contact_name', ''),
            data.get('phone', ''),
            data.get('email', ''),
            data.get('dotNumber') or data.get('dot_number', ''),
            data.get('mcNumber') or data.get('mc_number', ''),
            int(data.get('yearsInBusiness', 0)) if data.get('yearsInBusiness') and str(data.get('yearsInBusiness')).isdigit() else 0,
            int(data.get('fleetSize', 0)) if data.get('fleetSize') and str(data.get('fleetSize')).replace(' units', '').isdigit() else 0,
            data.get('address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('zip') or data.get('zip_code', ''),
            data.get('radiusOfOperation') or data.get('radius_of_operation', ''),
            data.get('commodityHauled') or data.get('commodity_hauled', ''),
            data.get('operatingStates') or data.get('operating_states', ''),
            data.get('stage', 'new'),
            data.get('status', 'active'),
            float(data.get('premium', 0)) if data.get('premium') else 0,
            data.get('notes', '')
        ))

    conn_new.commit()
    print(f"Lead {data.get('id')} migrated successfully!")

    # Verify
    cursor_new.execute("SELECT lead_id, company_name, phone FROM leads WHERE lead_id = '88571'")
    result = cursor_new.fetchone()
    if result:
        print(f"Verified: {result}")
else:
    print("Lead 88571 not found in vanguard.db")

conn_old.close()
conn_new.close()