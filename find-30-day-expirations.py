#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timedelta

def find_30_day_expirations():
    # Calculate dates
    today = datetime(2024, 10, 7)  # October 7, 2024
    start_date = today + timedelta(days=25)  # November 1, 2024
    end_date = today + timedelta(days=40)    # November 16, 2024

    print("=" * 100)
    print(f"CARRIERS EXPIRING 30 DAYS FROM TODAY (Oct 7, 2024)")
    print(f"Looking for expirations between {start_date.strftime('%B %d, %Y')} and {end_date.strftime('%B %d, %Y')}")
    print("=" * 100)

    conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
    cursor = conn.cursor()

    # Find carriers expiring in ~30 days WITH representative data
    query = """
        SELECT
            dot_number,
            legal_name,
            dba_name,
            city,
            state,
            phone,
            policy_renewal_date,
            representative_1_name,
            representative_1_title,
            representative_2_name,
            representative_2_title
        FROM carriers
        WHERE policy_renewal_date BETWEEN ? AND ?
        AND representative_1_name IS NOT NULL
        ORDER BY policy_renewal_date
        LIMIT 50
    """

    # Format dates for SQL query
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')

    cursor.execute(query, (start_str, end_str))
    results = cursor.fetchall()

    if not results:
        # Try 2025 dates since most renewals are in 2025
        print("\nNo results for November 2024. Checking November 2025...")
        start_date_2025 = datetime(2025, 11, 1)
        end_date_2025 = datetime(2025, 11, 15)
        start_str = start_date_2025.strftime('%Y-%m-%d')
        end_str = end_date_2025.strftime('%Y-%m-%d')

        cursor.execute(query, (start_str, end_str))
        results = cursor.fetchall()

    print(f"\nFound {len(results)} carriers with representative data expiring in this period")
    print("-" * 100)

    count = 0
    for row in results:
        count += 1
        dot, legal_name, dba, city, state, phone, renewal, rep1_name, rep1_title, rep2_name, rep2_title = row

        # Format renewal date
        renewal_date = datetime.strptime(renewal, '%Y-%m-%d')
        days_until = (renewal_date - today).days

        print(f"\n{count}. DOT #{dot}")
        print(f"   Company: {legal_name}")
        if dba:
            print(f"   DBA: {dba}")
        print(f"   Location: {city}, {state}")
        if phone:
            print(f"   Phone: {phone}")
        print(f"   📅 EXPIRATION DATE: {renewal_date.strftime('%B %d, %Y')} ({days_until} days)")
        print(f"   👤 Representative 1: {rep1_name} - {rep1_title}")
        if rep2_name:
            print(f"   👤 Representative 2: {rep2_name} - {rep2_title}")
        print("-" * 50)

    # Also get count without representative requirement
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE policy_renewal_date BETWEEN ? AND ?
    """, (start_str, end_str))
    total_expiring = cursor.fetchone()[0]

    # Get Ohio specific
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE policy_renewal_date BETWEEN ? AND ?
        AND state = 'OH'
        AND representative_1_name IS NOT NULL
    """, (start_str, end_str))
    ohio_with_rep = cursor.fetchone()[0]

    print("\n" + "=" * 100)
    print("SUMMARY:")
    print("-" * 50)
    print(f"Total carriers expiring in this period: {total_expiring:,}")
    print(f"With representative data: {len(results)}")
    print(f"Ohio carriers with rep data: {ohio_with_rep}")
    print("=" * 100)

    conn.close()

if __name__ == "__main__":
    find_30_day_expirations()