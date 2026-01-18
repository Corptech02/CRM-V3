import sqlite3
from datetime import datetime

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get ALL Ohio Progressive carriers with rep names and emails
query = """
SELECT 
    dot_number,
    legal_name,
    representative_1_name,
    email_address,
    phone,
    city,
    insurance_carrier,
    policy_renewal_date,
    julianday(policy_renewal_date) - julianday(date('now')) as days_until
FROM carriers
WHERE state = 'OH'
    AND insurance_carrier LIKE '%Progressive%'
    AND representative_1_name IS NOT NULL 
    AND representative_1_name != ''
    AND representative_1_name != 'None'
    AND email_address IS NOT NULL
    AND email_address != ''
    AND email_address LIKE '%@%'
ORDER BY policy_renewal_date DESC
LIMIT 50
"""

cursor.execute(query)
results = cursor.fetchall()

print(f"Found {len(results)} Ohio Progressive carriers with rep names and emails")
print("="*80)

for i, lead in enumerate(results[:20], 1):
    days = int(lead['days_until']) if lead['days_until'] else -999
    status = "EXPIRED" if days < 0 else f"In {days} days"
    print(f"\n{i}. DOT: {lead['dot_number']}")
    print(f"   Name: {lead['legal_name']}")
    print(f"   Rep: {lead['representative_1_name']}")
    print(f"   Email: {lead['email_address']}")
    print(f"   Renewal: {lead['policy_renewal_date']} ({status})")

conn.close()
