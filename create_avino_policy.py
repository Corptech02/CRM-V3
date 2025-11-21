#!/usr/bin/env python3
"""
Create A-VINO LTD policy from the client data
"""

import sqlite3
import json
import uuid
from datetime import datetime

# Connect to database
db = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = db.cursor()

# Get A-VINO client data
cursor.execute("SELECT data FROM clients WHERE id = 'client_905413'")
row = cursor.fetchone()

if not row:
    print("A-VINO client not found")
    exit(1)

client_data = json.loads(row[0])
print(f"Found client: {client_data['name']}")

# Create policy from client data
policy_id = str(uuid.uuid4())
policy_data = {
    "id": policy_id,
    "policyNumber": f"POL-AVINO-{client_data['dotNumber']}",
    "clientName": client_data['name'],
    "client": client_data['name'],
    "clientId": "client_905413",
    "carrier": client_data['insuranceCarrier'],
    "effectiveDate": "2024-02-20",  # Assuming 1 year before expiry
    "expirationDate": client_data['policyExpiryDate'],
    "policyType": "Commercial Auto",
    "status": "active",
    "policyStatus": "active",
    "premium": 7395,
    "annualPremium": 7395,
    "monthlyPremium": 616.25,
    "commission": 739.50,  # 10% commission
    "financial": {
        "Annual Premium": 7395,
        "Premium": 7395,
        "Monthly Premium": 616.25,
        "Commission": 739.50,
        "Down Payment": 1479
    },
    "coverage": {
        "limits": "$1,000,000 Liability / $100,000 Cargo",
        "deductibles": "$1,000",
        "coverageAmount": "$15,000"
    },
    "contact": {
        "name": client_data['contactName'],
        "email": client_data['email'],
        "phone": client_data['phone']
    },
    "dotNumber": client_data['dotNumber'],
    "state": client_data['state'],
    "notes": client_data.get('notes', ''),
    "createdAt": datetime.now().isoformat(),
    "updatedAt": datetime.now().isoformat(),
    "source": "Converted from client record"
}

# Insert policy into database
cursor.execute("""
    INSERT INTO policies (id, client_id, data, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
""", (policy_id, "client_905413", json.dumps(policy_data)))

# Update client record to include policy reference
client_data['policies'] = [policy_id]
cursor.execute("""
    UPDATE clients SET data = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'client_905413'
""", (json.dumps(client_data),))

db.commit()
print(f"✅ Created policy {policy_data['policyNumber']} for {client_data['name']}")
print(f"   Carrier: {policy_data['carrier']}")
print(f"   Premium: ${policy_data['premium']:,.2f}")
print(f"   Expires: {policy_data['expirationDate']}")

# Verify it was created
cursor.execute("SELECT COUNT(*) FROM policies WHERE data LIKE '%VINO%'")
count = cursor.fetchone()[0]
print(f"\nTotal A-VINO policies in database: {count}")

db.close()