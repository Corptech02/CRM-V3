#!/usr/bin/env python3
"""Migrate lead 88571 from vanguard.db to vanguard_system.db"""

import sqlite3
import json
import re

def parse_int(value):
    """Safe parse integer from various formats"""
    if not value:
        return 0
    try:
        # Remove common suffixes
        clean = str(value).replace(' units', '').replace(' years', '').strip()
        # Extract first number
        match = re.search(r'\d+', clean)
        if match:
            return int(match.group())
        return 0
    except:
        return 0

def parse_float(value):
    """Safe parse float from various formats"""
    if not value:
        return 0.0
    try:
        return float(value)
    except:
        return 0.0

# Get lead from vanguard.db
conn_old = sqlite3.connect('/var/www/vanguard/vanguard.db')
conn_old.row_factory = sqlite3.Row
cursor_old = conn_old.cursor()

cursor_old.execute("SELECT data FROM leads WHERE id = '88571'")
row = cursor_old.fetchone()

if row:
    data = json.loads(row['data'])
    print(f"Found lead data: {data.get('name', 'Unknown')}")

    # Connect to vanguard_system.db
    conn_new = sqlite3.connect('/var/www/vanguard/vanguard_system.db')
    cursor_new = conn_new.cursor()

    # Check if lead already exists
    lead_id = data.get('id', '88571')
    cursor_new.execute("SELECT lead_id FROM leads WHERE lead_id = ?", (lead_id,))
    existing = cursor_new.fetchone()

    # Prepare data
    company_name = data.get('name') or data.get('company_name', '')
    contact_name = data.get('contact') or data.get('contact_name', '')
    phone = data.get('phone', '')
    email = data.get('email', '')
    dot_number = data.get('dotNumber') or data.get('dot_number', '')
    mc_number = data.get('mcNumber') or data.get('mc_number', '')
    years_in_business = parse_int(data.get('yearsInBusiness', 0))
    fleet_size = parse_int(data.get('fleetSize', 0))
    address = data.get('address', '')
    city = data.get('city', '')
    state = data.get('state', '')
    zip_code = data.get('zip') or data.get('zip_code', '')
    radius_of_operation = data.get('radiusOfOperation') or data.get('radius_of_operation', '')
    commodity_hauled = data.get('commodityHauled') or data.get('commodity_hauled', '')
    operating_states_raw = data.get('operatingStates') or data.get('operating_states', '')
    if isinstance(operating_states_raw, list):
        operating_states = ', '.join(operating_states_raw)
    else:
        operating_states = str(operating_states_raw)
    stage = data.get('stage', 'new')
    status = data.get('status', 'active')
    premium = parse_float(data.get('premium', 0))
    notes = data.get('notes', '')

    if existing:
        print(f"Lead {lead_id} already exists, updating...")
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
            company_name, contact_name, phone, email,
            dot_number, mc_number, years_in_business, fleet_size,
            address, city, state, zip_code,
            radius_of_operation, commodity_hauled, operating_states,
            stage, status, premium, notes,
            lead_id
        ))
    else:
        print(f"Inserting lead {lead_id}...")
        cursor_new.execute("""
            INSERT INTO leads (
                lead_id, company_name, contact_name, phone, email,
                dot_number, mc_number, years_in_business, fleet_size,
                address, city, state, zip_code, radius_of_operation,
                commodity_hauled, operating_states, stage, status, premium, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lead_id, company_name, contact_name, phone, email,
            dot_number, mc_number, years_in_business, fleet_size,
            address, city, state, zip_code,
            radius_of_operation, commodity_hauled, operating_states,
            stage, status, premium, notes
        ))

    conn_new.commit()
    print(f"Lead {lead_id} migrated successfully!")

    # Verify
    cursor_new.execute("SELECT lead_id, company_name, phone FROM leads WHERE lead_id = '88571'")
    result = cursor_new.fetchone()
    if result:
        print(f"Verified in database: ID={result[0]}, Company={result[1]}, Phone={result[2]}")
else:
    print("Lead 88571 not found in vanguard.db")

conn_old.close()
conn_new.close()
print("Migration complete!")