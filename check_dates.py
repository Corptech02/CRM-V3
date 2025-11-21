import sqlite3
from datetime import datetime, timedelta

conn = sqlite3.connect('fmcsa_complete.db')
cursor = conn.cursor()

# Get current date
today = datetime.now().date()
print(f"Today's date: {today}")

# Check carriers with rep names and their renewal dates
cursor.execute("""
    SELECT COUNT(*), 
           MIN(policy_renewal_date), 
           MAX(policy_renewal_date)
    FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
    AND representative_1_name IS NOT NULL
    AND representative_1_name != ''
    AND representative_1_name != 'None'
""")
result = cursor.fetchone()
print(f"\nCarriers with rep names: {result[0]}")
print(f"Earliest renewal: {result[1]}")
print(f"Latest renewal: {result[2]}")

# Check how many are in the next 30 days
cursor.execute("""
    SELECT COUNT(*)
    FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
    AND representative_1_name IS NOT NULL
    AND representative_1_name != ''
    AND representative_1_name != 'None'
    AND julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 5 AND 30
""")
print(f"\nCarriers with rep names expiring in 5-30 days: {cursor.fetchone()[0]}")

# Show some examples with dates
cursor.execute("""
    SELECT dot_number, legal_name, policy_renewal_date,
           julianday(policy_renewal_date) - julianday(date('now')) as days_until
    FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND representative_1_name IS NOT NULL
    AND representative_1_name != ''
    AND representative_1_name != 'None'
    ORDER BY policy_renewal_date
    LIMIT 10
""")
print("\nSample carriers with rep names and renewal dates:")
for row in cursor.fetchall():
    print(f"  DOT: {row[0]}, Name: {row[1][:30]}, Renewal: {row[2]}, Days: {row[3]:.0f}")

conn.close()
