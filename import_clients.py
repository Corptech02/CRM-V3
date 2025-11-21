#!/usr/bin/env python3
import pandas as pd
import sqlite3
import json
from datetime import datetime, timedelta
import random

# Read the Excel file
df = pd.read_excel('/tmp/written_accounts_detailed.xlsx')

print("Excel columns:", df.columns.tolist())
print("\nFirst few rows:")
print(df.head())

# Connect to database
conn = sqlite3.connect('/var/www/vanguard/data/vanguard.db')
cursor = conn.cursor()

# Track statistics
clients_added = 0
policies_added = 0

# Process each row
for index, row in df.iterrows():
    try:
        # Extract client information
        company_name = str(row.get('Company Name', row.get('Client Name', '')))
        if not company_name or company_name == 'nan':
            continue

        contact_name = str(row.get('Contact Name', row.get('Contact', '')))
        phone = str(row.get('Phone', row.get('Phone Number', '')))
        email = str(row.get('Email', row.get('Email Address', '')))
        address = str(row.get('Address', row.get('Street Address', '')))
        city = str(row.get('City', ''))
        state = str(row.get('State', ''))
        zip_code = str(row.get('Zip', row.get('ZIP', '')))

        # Clean data
        if contact_name == 'nan': contact_name = ''
        if phone == 'nan': phone = ''
        if email == 'nan': email = ''
        if address == 'nan': address = ''
        if city == 'nan': city = ''
        if state == 'nan': state = ''
        if zip_code == 'nan': zip_code = ''

        # Extract DOT/MC numbers if available
        dot_number = str(row.get('DOT Number', row.get('DOT', '')))
        mc_number = str(row.get('MC Number', row.get('MC', '')))
        if dot_number == 'nan': dot_number = ''
        if mc_number == 'nan': mc_number = ''

        # Extract business details
        fleet_size = str(row.get('Fleet Size', row.get('Number of Vehicles', '')))
        years_in_business = str(row.get('Years in Business', ''))
        commodity_hauled = str(row.get('Commodity', row.get('Commodity Hauled', '')))
        radius_of_operation = str(row.get('Radius', row.get('Operating Radius', '')))

        if fleet_size == 'nan': fleet_size = ''
        if years_in_business == 'nan': years_in_business = ''
        if commodity_hauled == 'nan': commodity_hauled = ''
        if radius_of_operation == 'nan': radius_of_operation = ''

        # Extract policy information
        premium = row.get('Premium', row.get('Annual Premium', 0))
        if pd.isna(premium):
            premium = 0
        else:
            # Clean premium value (remove $ and commas)
            if isinstance(premium, str):
                premium = float(premium.replace('$', '').replace(',', ''))
            else:
                premium = float(premium)

        policy_number = str(row.get('Policy Number', row.get('Policy #', '')))
        carrier = str(row.get('Carrier', row.get('Insurance Carrier', row.get('Company', ''))))

        if policy_number == 'nan': policy_number = f"POL{random.randint(100000, 999999)}"
        if carrier == 'nan': carrier = 'Progressive'

        # Set effective dates
        effective_date = datetime.now().strftime('%Y-%m-%d')
        expiration_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')

        print(f"\nProcessing: {company_name}")

        # Insert client
        cursor.execute('''
            INSERT OR REPLACE INTO clients (
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

        # Insert policy
        cursor.execute('''
            INSERT INTO policies (
                client_id, policy_number, carrier, policy_type, premium,
                effective_date, expiration_date, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            client_id, policy_number, carrier, 'Commercial Auto', premium,
            effective_date, expiration_date, 'Active',
            datetime.now().isoformat(), datetime.now().isoformat()
        ))

        policies_added += 1
        print(f"  ✓ Policy added: {policy_number} with {carrier}")

    except Exception as e:
        print(f"Error processing row {index}: {str(e)}")
        continue

# Commit changes
conn.commit()

print(f"\n{'='*50}")
print(f"Import Complete!")
print(f"Clients added: {clients_added}")
print(f"Policies added: {policies_added}")
print(f"All assigned to: Maureen")
print(f"{'='*50}")

# Close connection
conn.close()