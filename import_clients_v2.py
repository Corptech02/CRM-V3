#!/usr/bin/env python3
import pandas as pd
import sqlite3
import json
from datetime import datetime, timedelta
import random

# Read the Excel file
df = pd.read_excel('/tmp/written_accounts_detailed.xlsx')

print("Excel columns:", df.columns.tolist())
print(f"\nTotal rows to process: {len(df)}")

# Connect to database
conn = sqlite3.connect('/var/www/vanguard/data/vanguard.db')
cursor = conn.cursor()

# Track statistics
clients_added = 0
policies_added = 0
errors = []

# Process each row
for index, row in df.iterrows():
    try:
        # Extract client information using actual column names
        company_name = str(row.get('Company_Name', ''))
        if not company_name or company_name == 'nan' or pd.isna(row.get('Company_Name')):
            continue

        # Extract contact info
        phone = str(row.get('Phone', ''))
        email = str(row.get('Email', ''))
        address = str(row.get('Address', ''))
        state = str(row.get('State', ''))

        # Clean data
        if phone == 'nan' or pd.isna(row.get('Phone')): phone = ''
        if email == 'nan' or pd.isna(row.get('Email')): email = ''
        if address == 'nan' or pd.isna(row.get('Address')): address = ''
        if state == 'nan' or pd.isna(row.get('State')): state = ''

        # Extract DOT/MC numbers
        dot_number = ''
        mc_number = ''
        if not pd.isna(row.get('DOT_Number')):
            dot_number = str(int(row.get('DOT_Number')))
        if not pd.isna(row.get('MC_Number')):
            mc_number = str(int(row.get('MC_Number')))

        # Extract business details
        fleet_size = ''
        trucks = row.get('Trucks', 0)
        trailers = row.get('Trailers', 0)
        if not pd.isna(trucks):
            fleet_size = str(int(trucks))
            if not pd.isna(trailers) and trailers > 0:
                fleet_size = f"{int(trucks)} trucks, {int(trailers)} trailers"

        # Driver information
        driver_count = ''
        if not pd.isna(row.get('Drivers')):
            driver_count = str(int(row.get('Drivers')))

        driver_names = str(row.get('Driver_Names', ''))
        if driver_names == 'nan' or pd.isna(row.get('Driver_Names')):
            driver_names = ''

        # Commodities and radius
        commodity_hauled = str(row.get('Commodities', ''))
        if commodity_hauled == 'nan' or pd.isna(row.get('Commodities')):
            commodity_hauled = 'General Freight'

        radius_of_operation = str(row.get('Radius', ''))
        if radius_of_operation == 'nan' or pd.isna(row.get('Radius')):
            radius_of_operation = ''

        # Extract premium information
        premium_total = row.get('Premium_Total', 0)
        if pd.isna(premium_total):
            premium_total = 0
        else:
            if isinstance(premium_total, str):
                premium_total = float(premium_total.replace('$', '').replace(',', ''))
            else:
                premium_total = float(premium_total)

        # Get individual premiums
        premium_al = row.get('Premium_AL', 0)
        premium_gl = row.get('Premium_GL', 0)
        premium_cargo = row.get('Premium_Cargo', 0)
        premium_pd = row.get('Premium_PD', 0)

        # Clean individual premiums
        if not pd.isna(premium_al): premium_al = float(premium_al)
        else: premium_al = 0
        if not pd.isna(premium_gl): premium_gl = float(premium_gl)
        else: premium_gl = 0
        if not pd.isna(premium_cargo): premium_cargo = float(premium_cargo)
        else: premium_cargo = 0
        if not pd.isna(premium_pd): premium_pd = float(premium_pd)
        else: premium_pd = 0

        # Policy number
        policy_number = str(row.get('Policy_Number', ''))
        if policy_number == 'nan' or pd.isna(row.get('Policy_Number')):
            policy_number = f"POL{random.randint(100000, 999999)}"

        # Get policy dates
        policy_effective = row.get('Policy_Effective', '')
        policy_expiry = row.get('Policy_Expiry', '')

        # Parse dates or use defaults
        if pd.isna(policy_effective) or policy_effective == '':
            effective_date = datetime.now().strftime('%Y-%m-%d')
        else:
            try:
                effective_date = pd.to_datetime(policy_effective).strftime('%Y-%m-%d')
            except:
                effective_date = datetime.now().strftime('%Y-%m-%d')

        if pd.isna(policy_expiry) or policy_expiry == '':
            expiration_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
        else:
            try:
                expiration_date = pd.to_datetime(policy_expiry).strftime('%Y-%m-%d')
            except:
                expiration_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')

        # Default values
        carrier = 'Progressive'
        years_in_business = '5'  # Default value
        contact_name = driver_names.split(',')[0].strip() if driver_names else ''
        city = address.split(',')[0].strip() if address else ''
        zip_code = ''

        print(f"\nProcessing: {company_name}")
        print(f"  DOT: {dot_number}, MC: {mc_number}")
        print(f"  Premium: ${premium_total:,.2f}")

        # Check if client already exists
        cursor.execute('SELECT id FROM clients WHERE name = ?', (company_name,))
        existing = cursor.fetchone()

        if existing:
            client_id = existing[0]
            print(f"  → Client exists with ID: {client_id}")
        else:
            # Insert new client
            cursor.execute('''
                INSERT INTO clients (
                    name, contact_name, phone, email, address, city, state, zip,
                    dot_number, mc_number, fleet_size, years_in_business,
                    commodity_hauled, radius_of_operation, status, assigned_to,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                company_name, contact_name, phone, email, address, city, state, zip_code,
                dot_number, mc_number, fleet_size, years_in_business,
                commodity_hauled, radius_of_operation, 'Active', 'Maureen',
                datetime.now().isoformat(), datetime.now().isoformat()
            ))

            client_id = cursor.lastrowid
            clients_added += 1
            print(f"  ✓ Client added with ID: {client_id}")

        # Insert policy (always add new policy)
        cursor.execute('''
            INSERT INTO policies (
                client_id, policy_number, carrier, policy_type, premium,
                effective_date, expiration_date, status,
                premium_al, premium_gl, premium_cargo, premium_pd,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            client_id, policy_number, carrier, 'Commercial Auto', premium_total,
            effective_date, expiration_date, 'Active',
            premium_al, premium_gl, premium_cargo, premium_pd,
            datetime.now().isoformat(), datetime.now().isoformat()
        ))

        policies_added += 1
        print(f"  ✓ Policy added: {policy_number} with {carrier}")
        print(f"    - Auto Liability: ${premium_al:,.2f}")
        print(f"    - General Liability: ${premium_gl:,.2f}")
        print(f"    - Cargo: ${premium_cargo:,.2f}")
        print(f"    - Physical Damage: ${premium_pd:,.2f}")

    except Exception as e:
        error_msg = f"Error processing row {index} ({company_name}): {str(e)}"
        print(f"  ✗ {error_msg}")
        errors.append(error_msg)
        continue

# Commit changes
conn.commit()

print(f"\n{'='*60}")
print(f"Import Complete!")
print(f"Clients added: {clients_added}")
print(f"Policies added: {policies_added}")
print(f"All assigned to: Maureen")

if errors:
    print(f"\nErrors encountered: {len(errors)}")
    for error in errors[:5]:  # Show first 5 errors
        print(f"  - {error}")

print(f"{'='*60}")

# Close connection
conn.close()