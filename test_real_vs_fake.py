#!/usr/bin/env python3
"""
Demonstrate the difference between REAL and FAKE lead generation
"""

import sqlite3
from datetime import datetime, timedelta

def count_real_leads(state, month):
    """Count REAL carriers with actual renewal dates in a given month"""

    conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*)
        FROM carriers
        WHERE state = ?
        AND strftime('%m', policy_renewal_date) = ?
        AND operating_status = 'Active'
        AND insurance_carrier IS NOT NULL
        AND insurance_carrier != ''
    """, (state, f"{month:02d}"))

    count = cursor.fetchone()[0]
    conn.close()
    return count

def count_real_leads_with_email_and_rep(state, month):
    """Count carriers with email AND representative"""

    conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*)
        FROM carriers
        WHERE state = ?
        AND strftime('%m', policy_renewal_date) = ?
        AND operating_status = 'Active'
        AND insurance_carrier IS NOT NULL
        AND email_address IS NOT NULL
        AND email_address != ''
        AND (
            representative_1_name IS NOT NULL
            OR representative_2_name IS NOT NULL
            OR principal_name IS NOT NULL
        )
    """, (state, f"{month:02d}"))

    count = cursor.fetchone()[0]
    conn.close()
    return count

print("=" * 80)
print("REAL vs FAKE LEAD GENERATION COMPARISON")
print("=" * 80)

print("\n🔍 WHAT THE CURRENT API DOES (BROKEN):")
print("-" * 50)
print("For Texas:")
print("  ❌ IGNORES real renewal dates")
print("  ❌ Creates FAKE dates for random carriers")
print("  ❌ Requires email + representative (filters out 99.9% of leads)")
print("  ❌ Returns synthetic data that doesn't match reality")

print("\nFor Ohio:")
print("  ✅ Uses real renewal dates")
print("  ❌ But requires email + representative (very few have both)")

print("\n📊 REAL DATA FROM FMCSA DATABASE:")
print("-" * 50)

months = {
    5: 'May', 9: 'September', 10: 'October', 11: 'November', 12: 'December'
}

for month_num, month_name in months.items():
    print(f"\n{month_name}:")

    oh_total = count_real_leads('OH', month_num)
    tx_total = count_real_leads('TX', month_num)

    oh_with_both = count_real_leads_with_email_and_rep('OH', month_num)
    tx_with_both = count_real_leads_with_email_and_rep('TX', month_num)

    print(f"  Ohio:  {oh_total:,} total carriers ({oh_with_both} with email+rep)")
    print(f"  Texas: {tx_total:,} total carriers ({tx_with_both} with email+rep)")

print("\n💡 THE PROBLEM:")
print("-" * 50)
print("1. Texas special handling creates FAKE renewal dates")
print("2. Requiring email + representative filters out 99% of real leads")
print("3. You're missing THOUSANDS of real opportunities")

print("\n✅ THE SOLUTION:")
print("-" * 50)
print("1. Use REAL renewal dates for ALL states (no synthetic data)")
print("2. Make representative optional (include if available)")
print("3. Include all carriers with insurance, prioritize by data quality")

print("\n🎯 ACTUAL AVAILABLE LEADS (REAL DATA):")
print("-" * 50)

# Count leads for specific date example (May 30)
conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

cursor.execute("""
    SELECT state, COUNT(*) as count
    FROM carriers
    WHERE policy_renewal_date LIKE '%-05-30'
    AND operating_status = 'Active'
    AND insurance_carrier IS NOT NULL
    GROUP BY state
    HAVING state IN ('OH', 'TX')
""")

print("\nMay 30th specific:")
for state, count in cursor.fetchall():
    print(f"  {state}: {count} carriers")

# September totals
cursor.execute("""
    SELECT state, COUNT(*) as count
    FROM carriers
    WHERE strftime('%m', policy_renewal_date) = '09'
    AND operating_status = 'Active'
    AND insurance_carrier IS NOT NULL
    AND state IN ('OH', 'TX')
    GROUP BY state
""")

print("\nSeptember total (best month):")
for state, count in cursor.fetchall():
    print(f"  {state}: {count:,} carriers")

conn.close()

print("\n" + "=" * 80)
print("RECOMMENDATION: Fix the API to use REAL data for ALL states!")
print("=" * 80)