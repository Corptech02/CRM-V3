#!/usr/bin/env python3
import pandas as pd
import sqlite3
import json
from datetime import datetime, timedelta
import random
import uuid

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

        # Clean phone number format
        if phone:
            phone_digits = ''.join(filter(str.isdigit, phone))
            if len(phone_digits) == 10:
                phone = f"({phone_digits[:3]}) {phone_digits[3:6]}-{phone_digits[6:]}"

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
            radius_of_operation = 'Regional'

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

        # Parse address for city
        city = ''
        if address:
            parts = address.split(',')
            if len(parts) > 1:
                city = parts[-2].strip() if len(parts) > 2 else parts[0].strip()

        zip_code = ''

        print(f"\nProcessing: {company_name}")
        print(f"  DOT: {dot_number}, MC: {mc_number}")
        print(f"  Premium: ${premium_total:,.2f}")

        # Generate unique client ID
        client_id = f"client_{uuid.uuid4().hex[:12]}"

        # Create client data object
        client_data = {
            "id": client_id,
            "name": company_name,
            "contact": contact_name,
            "phone": phone,
            "email": email,
            "company": company_name,
            "address": address,
            "city": city,
            "state": state,
            "zip": zip_code,
            "dotNumber": dot_number,
            "mcNumber": mc_number,
            "fleetSize": fleet_size,
            "yearsInBusiness": years_in_business,
            "radiusOfOperation": radius_of_operation,
            "commodityHauled": commodity_hauled,
            "driverCount": driver_count,
            "drivers": driver_names,
            "status": "Active",
            "assignedTo": "Maureen",
            "source": "Excel Import",
            "created": datetime.now().strftime('%Y-%m-%d'),
            "updated": datetime.now().strftime('%Y-%m-%d'),
            "notes": f"Imported from Excel on {datetime.now().strftime('%Y-%m-%d')}",
            "tags": ["imported", "commercial-auto"]
        }

        # Check if client already exists by name
        cursor.execute('SELECT id, data FROM clients WHERE json_extract(data, "$.name") = ?', (company_name,))
        existing = cursor.fetchone()

        if existing:
            client_id = existing[0]
            # Update existing client data
            existing_data = json.loads(existing[1])
            existing_data.update(client_data)
            existing_data['id'] = client_id  # Keep original ID

            cursor.execute('''
                UPDATE clients
                SET data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (json.dumps(existing_data), client_id))
            print(f"  → Updated existing client: {client_id}")
        else:
            # Insert new client
            cursor.execute('''
                INSERT INTO clients (id, data, created_at, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', (client_id, json.dumps(client_data)))
            clients_added += 1
            print(f"  ✓ Client added with ID: {client_id}")

        # Generate unique policy ID
        policy_id = f"policy_{uuid.uuid4().hex[:12]}"

        # Create policy data object
        policy_data = {
            "id": policy_id,
            "clientId": client_id,
            "clientName": company_name,
            "policyNumber": policy_number,
            "carrier": carrier,
            "type": "Commercial Auto",
            "premium": premium_total,
            "premiumAL": premium_al,
            "premiumGL": premium_gl,
            "premiumCargo": premium_cargo,
            "premiumPD": premium_pd,
            "effectiveDate": effective_date,
            "expirationDate": expiration_date,
            "status": "Active",
            "coverages": {
                "autoLiability": {
                    "limit": "$1,000,000",
                    "premium": premium_al
                },
                "generalLiability": {
                    "limit": "$1,000,000",
                    "premium": premium_gl
                },
                "cargo": {
                    "limit": "$100,000",
                    "premium": premium_cargo
                },
                "physicalDamage": {
                    "deductible": "$1,000",
                    "premium": premium_pd
                }
            },
            "created": datetime.now().strftime('%Y-%m-%d'),
            "updated": datetime.now().strftime('%Y-%m-%d')
        }

        # Insert policy
        cursor.execute('''
            INSERT INTO policies (id, data, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', (policy_id, json.dumps(policy_data)))

        policies_added += 1
        print(f"  ✓ Policy added: {policy_number} with {carrier}")
        if premium_total > 0:
            print(f"    Total Premium: ${premium_total:,.2f}")
            if premium_al > 0: print(f"    - Auto Liability: ${premium_al:,.2f}")
            if premium_gl > 0: print(f"    - General Liability: ${premium_gl:,.2f}")
            if premium_cargo > 0: print(f"    - Cargo: ${premium_cargo:,.2f}")
            if premium_pd > 0: print(f"    - Physical Damage: ${premium_pd:,.2f}")

    except Exception as e:
        error_msg = f"Error processing row {index} ({company_name}): {str(e)}"
        print(f"  ✗ {error_msg}")
        errors.append(error_msg)
        continue

# Commit changes
conn.commit()

print(f"\n{'='*60}")
print(f"Import Complete!")
print(f"New clients added: {clients_added}")
print(f"Policies added: {policies_added}")
print(f"All assigned to: Maureen")

if errors:
    print(f"\nErrors encountered: {len(errors)}")
    for error in errors[:5]:  # Show first 5 errors
        print(f"  - {error}")

# Show summary of imported data
cursor.execute('SELECT COUNT(*) FROM clients WHERE json_extract(data, "$.assignedTo") = "Maureen"')
total_maureen_clients = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM policies WHERE json_extract(data, "$.status") = "Active"')
total_active_policies = cursor.fetchone()[0]

print(f"\nTotal clients assigned to Maureen: {total_maureen_clients}")
print(f"Total active policies: {total_active_policies}")
print(f"{'='*60}")

# Close connection
conn.close()