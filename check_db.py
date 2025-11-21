import sqlite3

conn = sqlite3.connect('fmcsa_complete.db')
cursor = conn.cursor()

# Check total carriers with representative names
cursor.execute("""
    SELECT COUNT(*) FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
    AND representative_1_name IS NOT NULL
    AND representative_1_name != ''
""")
print(f"Ohio Progressive carriers with email AND rep name: {cursor.fetchone()[0]}")

# Check without rep name requirement
cursor.execute("""
    SELECT COUNT(*) FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
""")
print(f"Ohio Progressive carriers with email only: {cursor.fetchone()[0]}")

# Check a sample of data
cursor.execute("""
    SELECT dot_number, legal_name, email_address, representative_1_name, policy_renewal_date
    FROM carriers 
    WHERE state = 'OH' 
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
    LIMIT 5
""")
print("\nSample carriers:")
for row in cursor.fetchall():
    print(f"  DOT: {row[0]}, Name: {row[1][:30]}, Email: {row[2]}, Rep: {row[3]}, Renewal: {row[4]}")

conn.close()
