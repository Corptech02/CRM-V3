#!/usr/bin/env python3
"""
Deep analysis of insurance renewal dates for OH and TX carriers
Using the FMCSA complete database
"""

import sqlite3
from datetime import datetime
from collections import defaultdict

print("=" * 80)
print("COMPREHENSIVE INSURANCE RENEWAL ANALYSIS FOR OH AND TX")
print("Using FMCSA Complete Database")
print("=" * 80)

# Connect to FMCSA database
conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

# First, get total counts for context
print("\n📊 DATABASE OVERVIEW:")
print("-" * 50)

cursor.execute("""
    SELECT
        state,
        COUNT(*) as total_carriers,
        COUNT(CASE WHEN operating_status = 'Active' THEN 1 END) as active_carriers,
        COUNT(CASE WHEN insurance_carrier IS NOT NULL AND insurance_carrier != '' THEN 1 END) as with_insurance,
        COUNT(CASE WHEN policy_renewal_date IS NOT NULL THEN 1 END) as with_renewal_date,
        COUNT(CASE WHEN email_address IS NOT NULL AND email_address != '' THEN 1 END) as with_email
    FROM carriers
    WHERE state IN ('OH', 'TX')
    GROUP BY state
""")

overview = cursor.fetchall()
for row in overview:
    state, total, active, insured, renewal, email = row
    print(f"\n{state}:")
    print(f"  Total Carriers: {total:,}")
    print(f"  Active Carriers: {active:,}")
    print(f"  With Insurance Info: {insured:,}")
    print(f"  With Renewal Date: {renewal:,}")
    print(f"  With Email: {email:,}")

# Now analyze renewal dates by month for ACTIVE carriers with insurance
print("\n" + "=" * 80)
print("📅 MONTHLY RENEWAL DISTRIBUTION (ACTIVE CARRIERS WITH INSURANCE)")
print("=" * 80)

# Query for monthly distribution
query = """
    SELECT
        state,
        strftime('%m', policy_renewal_date) as renewal_month,
        strftime('%Y-%m', policy_renewal_date) as year_month,
        COUNT(*) as carrier_count
    FROM carriers
    WHERE state IN ('OH', 'TX')
    AND operating_status = 'Active'
    AND insurance_carrier IS NOT NULL
    AND insurance_carrier != ''
    AND policy_renewal_date IS NOT NULL
    GROUP BY state, renewal_month
    ORDER BY state, renewal_month
"""

cursor.execute(query)
results = cursor.fetchall()

# Organize data by state and month
state_data = defaultdict(lambda: defaultdict(int))
for state, month, year_month, count in results:
    if month:  # Skip null months
        state_data[state][month] = count

# Month names for display
month_names = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
}

# Display Ohio data
print("\n🔵 OHIO (OH) - Monthly Insurance Renewals:")
print("-" * 50)
oh_total = 0
for month in sorted(month_names.keys()):
    count = state_data['OH'].get(month, 0)
    oh_total += count
    month_name = month_names[month]
    bar = '█' * (count // 10) if count > 0 else ''
    print(f"{month_name:12} ({month}): {count:5,} carriers {bar}")
print(f"\nTotal OH Carriers with Renewal Dates: {oh_total:,}")

# Display Texas data
print("\n🔴 TEXAS (TX) - Monthly Insurance Renewals:")
print("-" * 50)
tx_total = 0
for month in sorted(month_names.keys()):
    count = state_data['TX'].get(month, 0)
    tx_total += count
    month_name = month_names[month]
    bar = '█' * (count // 50) if count > 0 else ''
    print(f"{month_name:12} ({month}): {count:5,} carriers {bar}")
print(f"\nTotal TX Carriers with Renewal Dates: {tx_total:,}")

# Side-by-side comparison
print("\n" + "=" * 80)
print("📊 SIDE-BY-SIDE COMPARISON")
print("=" * 80)
print(f"{'Month':<12} | {'Ohio (OH)':<12} | {'Texas (TX)':<12} | {'TX/OH Ratio':<10}")
print("-" * 60)

for month in sorted(month_names.keys()):
    oh_count = state_data['OH'].get(month, 0)
    tx_count = state_data['TX'].get(month, 0)
    ratio = f"{tx_count/oh_count:.1f}x" if oh_count > 0 else "N/A"
    print(f"{month_names[month]:<12} | {oh_count:>10,}  | {tx_count:>10,}  | {ratio:>10}")

# Find specific dates with most renewals
print("\n" + "=" * 80)
print("🎯 TOP RENEWAL DATES (SPECIFIC DAYS)")
print("=" * 80)

for state in ['OH', 'TX']:
    print(f"\n{state} - Top 10 Renewal Dates:")
    cursor.execute("""
        SELECT
            policy_renewal_date,
            COUNT(*) as count
        FROM carriers
        WHERE state = ?
        AND operating_status = 'Active'
        AND insurance_carrier IS NOT NULL
        AND policy_renewal_date IS NOT NULL
        GROUP BY policy_renewal_date
        ORDER BY count DESC
        LIMIT 10
    """, (state,))

    for i, (date, count) in enumerate(cursor.fetchall(), 1):
        print(f"  {i}. {date}: {count:,} carriers")

# Check for patterns in renewal dates
print("\n" + "=" * 80)
print("📈 RENEWAL DATE PATTERNS")
print("=" * 80)

# Check day of month distribution
cursor.execute("""
    SELECT
        state,
        strftime('%d', policy_renewal_date) as day_of_month,
        COUNT(*) as count
    FROM carriers
    WHERE state IN ('OH', 'TX')
    AND operating_status = 'Active'
    AND policy_renewal_date IS NOT NULL
    GROUP BY state, day_of_month
    ORDER BY count DESC
""")

day_patterns = defaultdict(lambda: defaultdict(int))
for state, day, count in cursor.fetchall():
    if day:
        day_patterns[state][day] = count

print("\nMost Common Renewal Days of Month:")
for state in ['OH', 'TX']:
    top_days = sorted(day_patterns[state].items(), key=lambda x: x[1], reverse=True)[:5]
    days_str = ', '.join([f"{day} ({count:,})" for day, count in top_days])
    print(f"{state}: {days_str}")

conn.close()

print("\n" + "=" * 80)
print("✅ ANALYSIS COMPLETE")
print("=" * 80)