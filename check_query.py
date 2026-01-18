import sqlite3

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
conn.row_factory = sqlite3.Row

# Simplified query to test
query = """
SELECT dot_number, legal_name, policy_renewal_date, email_address, representative_1_name
FROM carriers
WHERE insurance_carrier LIKE '%Progressive%'
AND state = 'OH'
AND email_address IS NOT NULL
AND email_address != ''
AND (representative_1_name IS NOT NULL AND representative_1_name != '')
AND dot_number IN ('3436361', '2482178', '4030578')
"""

cursor = conn.cursor()
cursor.execute(query)
results = cursor.fetchall()

print(f"Query returned {len(results)} carriers:")
for r in results:
    print(f"  {r['dot_number']}: {r['legal_name']}")
    print(f"    Date: {r['policy_renewal_date']}")
    print(f"    Email: {r['email_address']}")
    
conn.close()
