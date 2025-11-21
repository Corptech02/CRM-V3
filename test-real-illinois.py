#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timedelta

# Connect to database
conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

print("=" * 80)
print("REAL ILLINOIS LEAD DATA CHECK")
print("=" * 80)

# Get counts for different time periods
periods = [30, 60, 90, 120]

for days in periods:
    end_date = datetime.now() + timedelta(days=days)
    end_str = end_date.strftime('%Y-%m-%d')
    start_str = datetime.now().strftime('%Y-%m-%d')

    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE state = 'IL'
        AND policy_renewal_date BETWEEN ? AND ?
    """, (start_str, end_str))

    count = cursor.fetchone()[0]
    print(f"\nIllinois carriers expiring in next {days} days: {count:,}")

    # Show sample
    if days == 30:
        cursor.execute("""
            SELECT dot_number, legal_name, city, policy_renewal_date
            FROM carriers
            WHERE state = 'IL'
            AND policy_renewal_date BETWEEN ? AND ?
            ORDER BY policy_renewal_date
            LIMIT 5
        """, (start_str, end_str))

        print("\nSample Illinois carriers (next 30 days):")
        for dot, name, city, renewal in cursor.fetchall():
            print(f"  DOT {dot}: {name} ({city}) - Expires: {renewal}")

# Check total Illinois carriers
cursor.execute("SELECT COUNT(*) FROM carriers WHERE state = 'IL'")
total_il = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM carriers WHERE state = 'IL' AND policy_renewal_date IS NOT NULL")
with_dates = cursor.fetchone()[0]

print("\n" + "=" * 80)
print("SUMMARY:")
print(f"Total Illinois carriers in database: {total_il:,}")
print(f"Illinois carriers with renewal dates: {with_dates:,}")
print(f"Percentage with dates: {(with_dates/total_il)*100:.1f}%")
print("=" * 80)

conn.close()