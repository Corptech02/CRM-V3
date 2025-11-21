#!/usr/bin/env python3
import sqlite3
import csv
from datetime import datetime, timedelta

# Connect to database
conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

# Calculate date range (30 days from today)
today = datetime.now().strftime('%Y-%m-%d')
end_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')

print("=" * 60)
print("GENERATING EXCEL FILES FOR DOWNLOAD PORTAL")
print(f"Date range: {today} to {end_date}")
print("=" * 60)

# 1. OHIO PROGRESSIVE LEADS (30 days)
print("\n1. Querying Ohio Progressive leads...")
cursor.execute("""
    SELECT
        dot_number,
        legal_name,
        dba_name,
        city,
        state,
        phone,
        email_address,
        policy_renewal_date,
        power_units,
        vehicle_count,
        representative_1_name,
        representative_1_title
    FROM carriers
    WHERE state = 'OH'
    AND policy_renewal_date BETWEEN ? AND ?
    AND (
        UPPER(legal_name) LIKE '%PROGRESSIVE%'
        OR UPPER(dba_name) LIKE '%PROGRESSIVE%'
    )
    ORDER BY policy_renewal_date
""", (today, end_date))

ohio_progressive = cursor.fetchall()
print(f"Found {len(ohio_progressive)} Ohio Progressive carriers")

# Write Ohio Progressive CSV
with open('/var/www/vanguard/download-portal/ohio_progressive_30days.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([
        'DOT Number', 'Legal Name', 'DBA Name', 'City', 'State',
        'Phone', 'Email', 'Policy Renewal Date', 'Power Units',
        'Vehicle Count', 'Representative Name', 'Representative Title'
    ])
    writer.writerows(ohio_progressive)

# 2. ALL OTHER COMPANIES (non-Progressive, 30 days)
print("\n2. Querying all other companies (non-Progressive)...")
cursor.execute("""
    SELECT
        dot_number,
        legal_name,
        dba_name,
        city,
        state,
        phone,
        email_address,
        policy_renewal_date,
        power_units,
        vehicle_count,
        representative_1_name,
        representative_1_title
    FROM carriers
    WHERE policy_renewal_date BETWEEN ? AND ?
    AND NOT (
        state = 'OH'
        AND (
            UPPER(legal_name) LIKE '%PROGRESSIVE%'
            OR UPPER(dba_name) LIKE '%PROGRESSIVE%'
        )
    )
    ORDER BY state, policy_renewal_date
    LIMIT 10000
""", (today, end_date))

other_companies = cursor.fetchall()
print(f"Found {len(other_companies)} other companies (limited to 10,000)")

# Write Other Companies CSV
with open('/var/www/vanguard/download-portal/other_companies_30days.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([
        'DOT Number', 'Legal Name', 'DBA Name', 'City', 'State',
        'Phone', 'Email', 'Policy Renewal Date', 'Power Units',
        'Vehicle Count', 'Representative Name', 'Representative Title'
    ])
    writer.writerows(other_companies)

# Get summary stats
cursor.execute("""
    SELECT state, COUNT(*) as count
    FROM carriers
    WHERE policy_renewal_date BETWEEN ? AND ?
    GROUP BY state
    ORDER BY count DESC
    LIMIT 10
""", (today, end_date))

print("\n" + "=" * 60)
print("TOP STATES WITH 30-DAY EXPIRATIONS:")
for state, count in cursor.fetchall():
    print(f"  {state}: {count:,}")

print("=" * 60)
print("\nFILES GENERATED:")
print("  1. ohio_progressive_30days.csv")
print("  2. other_companies_30days.csv")
print("=" * 60)

conn.close()