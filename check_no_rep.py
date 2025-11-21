import sqlite3

conn = sqlite3.connect('fmcsa_complete.db')
cursor = conn.cursor()

# Check carriers WITHOUT rep names and their renewal dates
cursor.execute("""
    SELECT COUNT(*),
           MIN(policy_renewal_date), 
           MAX(policy_renewal_date)
    FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
    AND (representative_1_name IS NULL OR representative_1_name = '' OR representative_1_name = 'None')
""")
result = cursor.fetchone()
print(f"Carriers WITHOUT rep names: {result[0]}")
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
    AND (representative_1_name IS NULL OR representative_1_name = '' OR representative_1_name = 'None')
    AND julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 5 AND 30
""")
print(f"\nCarriers WITHOUT rep names expiring in 5-30 days: {cursor.fetchone()[0]}")

# Show distribution of renewal dates
cursor.execute("""
    SELECT 
        CASE 
            WHEN julianday(policy_renewal_date) - julianday(date('now')) < 0 THEN 'Past'
            WHEN julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 0 AND 30 THEN '0-30 days'
            WHEN julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 31 AND 60 THEN '31-60 days'
            ELSE 'More than 60 days'
        END as period,
        COUNT(*) as count
    FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL
    GROUP BY period
    ORDER BY count DESC
""")
print("\nRenewal date distribution for Ohio Progressive with email:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} carriers")

conn.close()
