#!/usr/bin/env python3
"""
Migrate policies from vanguard_system.db to vanguard.db
"""

import sqlite3
import json
import uuid
from datetime import datetime

# Connect to both databases
source_db = sqlite3.connect('/var/www/vanguard/vanguard_system.db')
target_db = sqlite3.connect('/var/www/vanguard/vanguard.db')

source_cursor = source_db.cursor()
target_cursor = target_db.cursor()

# Get policies from vanguard_system.db
source_cursor.execute("""
    SELECT policy_number, company_name, contact_name, email, phone,
           policy_type, carrier, effective_date, expiration_date,
           premium, commission, coverage_limits, deductibles,
           status, notes, dot_number
    FROM policies
""")

policies = source_cursor.fetchall()

print(f"Found {len(policies)} policies to migrate")

# Check the structure of the target policies table
target_cursor.execute("PRAGMA table_info(policies)")
columns = target_cursor.fetchall()
print("\nTarget table structure:")
for col in columns:
    print(f"  {col[1]}: {col[2]}")

# Migrate each policy
for policy in policies:
    (policy_number, company_name, contact_name, email, phone,
     policy_type, carrier, effective_date, expiration_date,
     premium, commission, coverage_limits, deductibles,
     status, notes, dot_number) = policy

    # Create policy data in the format expected by vanguard.db
    policy_data = {
        "id": str(uuid.uuid4()),
        "policyNumber": policy_number,
        "clientName": company_name,
        "client": company_name,
        "carrier": carrier,
        "effectiveDate": effective_date,
        "expirationDate": expiration_date,
        "policyType": policy_type,
        "status": status or "active",
        "policyStatus": status or "active",
        "premium": premium,
        "annualPremium": premium,
        "commission": commission,
        "financial": {
            "Annual Premium": premium,
            "Premium": premium,
            "Commission": commission
        },
        "coverage": {
            "limits": coverage_limits,
            "deductibles": deductibles
        },
        "contact": {
            "name": contact_name,
            "email": email,
            "phone": phone
        },
        "dotNumber": dot_number,
        "notes": notes,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }

    # Determine client_id (could be based on DOT number or company name)
    client_id = dot_number if dot_number else f"client_{policy_data['id'][:8]}"

    # Insert into vanguard.db policies table
    try:
        target_cursor.execute("""
            INSERT INTO policies (id, client_id, data, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (policy_data['id'], client_id, json.dumps(policy_data)))

        print(f"✓ Migrated policy {policy_number} - {company_name}")
    except sqlite3.IntegrityError as e:
        print(f"✗ Policy {policy_number} already exists or error: {e}")

# Commit changes
target_db.commit()

# Verify migration
target_cursor.execute("SELECT COUNT(*) FROM policies")
count = target_cursor.fetchone()[0]
print(f"\nMigration complete. Total policies in vanguard.db: {count}")

# Show the migrated policies
target_cursor.execute("SELECT id, data FROM policies")
migrated = target_cursor.fetchall()
print("\nMigrated policies:")
for pid, pdata in migrated:
    policy_info = json.loads(pdata)
    print(f"  - {policy_info.get('policyNumber', 'N/A')}: {policy_info.get('clientName', 'Unknown')} ({policy_info.get('carrier', 'N/A')})")

# Close connections
source_db.close()
target_db.close()