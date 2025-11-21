import sqlite3

conn = sqlite3.connect('fmcsa_complete.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Test the simpler query first
simple_query = """
    SELECT COUNT(*)
    FROM carriers
    WHERE state = 'OH'
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL
    AND LENGTH(email_address) > 5
    AND phone IS NOT NULL
    AND LENGTH(phone) >= 10
    AND operating_status = 'Active'
    AND power_units < 1000
    AND julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 5 AND 30
"""

cursor.execute(simple_query)
print(f"Total carriers matching base criteria: {cursor.fetchone()[0]}")

# Now test with representative check
with_rep = """
    SELECT COUNT(*)
    FROM carriers
    WHERE state = 'OH'
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL
    AND LENGTH(email_address) > 5
    AND phone IS NOT NULL
    AND LENGTH(phone) >= 10
    AND representative_1_name IS NOT NULL
    AND representative_1_name != ''
    AND representative_1_name != 'None'
    AND operating_status = 'Active'
    AND power_units < 1000
    AND julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 5 AND 30
"""

cursor.execute(with_rep)
print(f"With representative names: {cursor.fetchone()[0]}")

# Check without insurance_carrier filter
no_carrier_filter = """
    SELECT COUNT(*)
    FROM carriers
    WHERE state = 'OH'
    AND email_address IS NOT NULL
    AND LENGTH(email_address) > 5
    AND phone IS NOT NULL
    AND LENGTH(phone) >= 10
    AND operating_status = 'Active'
    AND power_units < 1000
    AND julianday(policy_renewal_date) - julianday(date('now')) BETWEEN 5 AND 30
"""

cursor.execute(no_carrier_filter)
print(f"Without carrier filter: {cursor.fetchone()[0]}")

conn.close()
