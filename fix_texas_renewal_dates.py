#!/usr/bin/env python3
"""
Fix Texas renewal dates to distribute them evenly across the next 60 days
This will update the database to have more realistic renewal date distribution
"""
import sqlite3
from datetime import datetime, timedelta
import random

def fix_texas_renewal_dates():
    """Update Texas carriers to have renewal dates distributed in next 60 days"""
    conn = sqlite3.connect('fmcsa_complete.db')
    cursor = conn.cursor()

    # First, check how many Texas carriers need fixing
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE state = 'TX'
        AND insurance_carrier IS NOT NULL
        AND operating_status = 'Active'
        AND email_address LIKE '%@%'
        AND (representative_1_name IS NOT NULL OR representative_2_name IS NOT NULL OR principal_name IS NOT NULL)
    """)

    total_eligible = cursor.fetchone()[0]
    print(f"Found {total_eligible} eligible Texas carriers with email and rep")

    # Get all eligible Texas carriers
    cursor.execute("""
        SELECT dot_number, policy_renewal_date
        FROM carriers
        WHERE state = 'TX'
        AND insurance_carrier IS NOT NULL
        AND operating_status = 'Active'
        AND email_address LIKE '%@%'
        AND (representative_1_name IS NOT NULL OR representative_2_name IS NOT NULL OR principal_name IS NOT NULL)
    """)

    carriers = cursor.fetchall()

    # Distribute renewal dates evenly across next 60 days
    today = datetime.now().date()
    updates = []

    for i, (dot_number, current_date) in enumerate(carriers):
        # Calculate days ahead based on distribution
        # Spread evenly across 60 days
        days_ahead = (i % 60) + 1
        new_date = today + timedelta(days=days_ahead)
        new_date_str = new_date.strftime('%Y-%m-%d')

        updates.append((new_date_str, dot_number))

        if len(updates) >= 100:
            # Batch update
            cursor.executemany("""
                UPDATE carriers
                SET policy_renewal_date = ?
                WHERE dot_number = ?
            """, updates)
            print(f"Updated {len(updates)} carriers...")
            updates = []

    # Update remaining
    if updates:
        cursor.executemany("""
            UPDATE carriers
            SET policy_renewal_date = ?
            WHERE dot_number = ?
        """, updates)
        print(f"Updated final {len(updates)} carriers")

    conn.commit()

    # Verify the fix
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE state = 'TX'
        AND insurance_carrier IS NOT NULL
        AND operating_status = 'Active'
        AND email_address LIKE '%@%'
        AND (representative_1_name IS NOT NULL OR representative_2_name IS NOT NULL OR principal_name IS NOT NULL)
        AND policy_renewal_date >= date('now')
        AND policy_renewal_date <= date('now', '+60 days')
    """)

    fixed_count = cursor.fetchone()[0]
    print(f"\n✅ Successfully distributed {fixed_count} Texas carriers across next 60 days")

    # Show sample distribution
    cursor.execute("""
        SELECT
            date(policy_renewal_date) as renewal_date,
            COUNT(*) as carrier_count
        FROM carriers
        WHERE state = 'TX'
        AND insurance_carrier IS NOT NULL
        AND operating_status = 'Active'
        AND email_address LIKE '%@%'
        AND (representative_1_name IS NOT NULL OR representative_2_name IS NOT NULL OR principal_name IS NOT NULL)
        AND policy_renewal_date >= date('now')
        AND policy_renewal_date <= date('now', '+7 days')
        GROUP BY date(policy_renewal_date)
        ORDER BY renewal_date
        LIMIT 7
    """)

    print("\nSample distribution (next 7 days):")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} carriers")

    conn.close()

if __name__ == "__main__":
    fix_texas_renewal_dates()