#!/usr/bin/env python3

import sqlite3

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

# Query for all months
query = """
    SELECT
        state,
        strftime('%m', policy_renewal_date) as month_num,
        COUNT(*) as carrier_count
    FROM carriers
    WHERE state IN ('OH', 'TX')
    AND operating_status = 'Active'
    AND insurance_carrier IS NOT NULL
    AND insurance_carrier != ''
    AND policy_renewal_date IS NOT NULL
    GROUP BY state, month_num
    ORDER BY state, month_num
"""

cursor.execute(query)
results = cursor.fetchall()

# Store results
data = {}
for state, month, count in results:
    if month:
        if state not in data:
            data[state] = {}
        data[state][month] = count

month_names = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
}

print("INSURANCE RENEWAL COUNTS BY MONTH:")
print("=" * 50)
print("\nOHIO (OH):")
for month_num in sorted(month_names.keys()):
    count = data.get('OH', {}).get(month_num, 0)
    print(f"OH {month_names[month_num]}: {count:,} carriers")

print("\nTEXAS (TX):")
for month_num in sorted(month_names.keys()):
    count = data.get('TX', {}).get(month_num, 0)
    print(f"TX {month_names[month_num]}: {count:,} carriers")

conn.close()