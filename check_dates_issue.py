import sqlite3
from datetime import datetime

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

# Check date distribution
query = """
SELECT 
    CASE 
        WHEN policy_renewal_date < date('2025-01-01') THEN 'Before 2025'
        WHEN policy_renewal_date BETWEEN date('2025-01-01') AND date('2025-09-19') THEN 'Past (2025)'
        WHEN policy_renewal_date BETWEEN date('2025-09-19') AND date('2025-09-24') THEN 'Next 5 days'
        WHEN policy_renewal_date BETWEEN date('2025-09-24') AND date('2025-10-19') THEN 'Next 6-30 days'
        ELSE 'Future (30+ days)'
    END as date_range,
    COUNT(*) as count
FROM carriers
WHERE state = 'OH'
    AND insurance_carrier LIKE '%Progressive%'
    AND representative_1_name IS NOT NULL 
    AND representative_1_name != ''
    AND email_address IS NOT NULL
    AND email_address != ''
GROUP BY date_range
ORDER BY count DESC
"""

cursor.execute(query)
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]} carriers")

print("\n" + "="*50)
print("Checking Clayton Crowder specifically:")

# Check the specific carrier
cursor.execute("""
SELECT dot_number, legal_name, policy_renewal_date, 
       insurance_effective_date,
       datetime(created_at) as created,
       mcs_date
FROM carriers WHERE dot_number = '4030578'
""")
result = cursor.fetchone()
print(f"DOT: {result[0]}")
print(f"Name: {result[1]}")
print(f"Renewal Date: {result[2]}")
print(f"Effective Date: {result[3]}")
print(f"Created: {result[4]}")
print(f"MCS Date: {result[5]}")

conn.close()
