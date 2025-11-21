#!/usr/bin/env python3
import sqlite3
import json

# Connect to database
conn = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = conn.cursor()

# Fix the specific policy
policy_number = '9300117261'
client_id = 'client_3869412'
client_name = 'DU ROAD TRUCKING LLC'

# Update the policy to include client info
cursor.execute("""
    SELECT data FROM policies
    WHERE json_extract(data, '$.policyNumber') = ?
""", (policy_number,))

row = cursor.fetchone()
if row:
    policy_data = json.loads(row[0])
    policy_data['clientId'] = client_id
    policy_data['clientName'] = client_name

    # Update the policy
    cursor.execute("""
        UPDATE policies
        SET client_id = ?,
            data = ?
        WHERE json_extract(data, '$.policyNumber') = ?
    """, (client_id, json.dumps(policy_data), policy_number))

    # Also update the client to include this policy
    cursor.execute("""
        SELECT data FROM clients WHERE id = ?
    """, (client_id,))

    client_row = cursor.fetchone()
    if client_row:
        client_data = json.loads(client_row[0])
        if 'policies' not in client_data:
            client_data['policies'] = []

        policy_id = policy_data.get('id', '')
        if policy_id and policy_id not in client_data['policies']:
            client_data['policies'].append(policy_id)

            cursor.execute("""
                UPDATE clients
                SET data = ?
                WHERE id = ?
            """, (json.dumps(client_data), client_id))

    conn.commit()
    print(f"Fixed policy {policy_number} - linked to client {client_name}")
else:
    print(f"Policy {policy_number} not found")

conn.close()