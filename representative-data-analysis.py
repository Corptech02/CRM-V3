#!/usr/bin/env python3
import sqlite3

def analyze_representative_data():
    print("=" * 80)
    print("REPRESENTATIVE DATA ANALYSIS - WHO HAS REP INFO?")
    print("=" * 80)

    conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
    cursor = conn.cursor()

    # Total carriers
    cursor.execute("SELECT COUNT(*) FROM carriers")
    total = cursor.fetchone()[0]
    print(f"\n📊 TOTAL CARRIERS IN DATABASE: {total:,}")

    # Carriers with representative data
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE representative_1_name IS NOT NULL
        OR representative_2_name IS NOT NULL
    """)
    with_reps = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE representative_1_name IS NOT NULL")
    with_rep1 = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE representative_2_name IS NOT NULL")
    with_rep2 = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT representative_1_name) FROM carriers WHERE representative_1_name IS NOT NULL")
    unique_reps = cursor.fetchone()[0]

    print("\n🔍 REPRESENTATIVE DATA SUMMARY:")
    print("-" * 50)
    print(f"Carriers with ANY representative: {with_reps:,} ({with_reps/total*100:.2f}%)")
    print(f"Carriers with representative_1: {with_rep1:,} ({with_rep1/total*100:.2f}%)")
    print(f"Carriers with representative_2: {with_rep2:,} ({with_rep2/total*100:.2f}%)")
    print(f"Unique representative names: {unique_reps:,}")

    # Check for carriers with renewal dates AND representative data
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE policy_renewal_date IS NOT NULL
        AND representative_1_name IS NOT NULL
    """)
    with_both = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE policy_renewal_date BETWEEN '2025-01-01' AND '2025-12-31'
        AND representative_1_name IS NOT NULL
    """)
    exp_2025_with_rep = cursor.fetchone()[0]

    print("\n📅 CARRIERS WITH BOTH RENEWAL DATES AND REPS:")
    print("-" * 50)
    print(f"With renewal date AND representative: {with_both:,}")
    print(f"Expiring in 2025 with representative: {exp_2025_with_rep:,}")

    # Ohio specific
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE state = 'OH'
        AND representative_1_name IS NOT NULL
    """)
    ohio_with_rep = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE state = 'OH'")
    ohio_total = cursor.fetchone()[0]

    print("\n🏢 OHIO CARRIERS WITH REPRESENTATIVE DATA:")
    print("-" * 50)
    print(f"Total Ohio carriers: {ohio_total:,}")
    print(f"Ohio with representative: {ohio_with_rep:,} ({ohio_with_rep/ohio_total*100:.2f}%)")

    # Top states with representative data
    print("\n📍 TOP STATES WITH REPRESENTATIVE DATA:")
    print("-" * 50)
    cursor.execute("""
        SELECT state, COUNT(*) as count
        FROM carriers
        WHERE representative_1_name IS NOT NULL
        GROUP BY state
        ORDER BY count DESC
        LIMIT 10
    """)
    for state, count in cursor.fetchall():
        print(f"{state}: {count:,} carriers")

    # Most common representatives
    print("\n👥 TOP REPRESENTATIVES (BY CARRIER COUNT):")
    print("-" * 50)
    cursor.execute("""
        SELECT representative_1_name, representative_1_title, COUNT(*) as count
        FROM carriers
        WHERE representative_1_name IS NOT NULL
        GROUP BY representative_1_name, representative_1_title
        ORDER BY count DESC
        LIMIT 20
    """)
    for name, title, count in cursor.fetchall():
        print(f"{name} ({title}): {count} carriers")

    # Carriers with BOTH rep 1 and rep 2
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE representative_1_name IS NOT NULL
        AND representative_2_name IS NOT NULL
    """)
    with_both_reps = cursor.fetchone()[0]

    print(f"\n📊 Carriers with BOTH rep 1 AND rep 2: {with_both_reps:,}")

    # Sample some actual representative data
    print("\n📋 SAMPLE REPRESENTATIVE DATA:")
    print("-" * 50)
    cursor.execute("""
        SELECT dot_number, legal_name, representative_1_name, representative_1_title, policy_renewal_date
        FROM carriers
        WHERE representative_1_name IS NOT NULL
        AND policy_renewal_date BETWEEN '2025-01-01' AND '2025-12-31'
        ORDER BY policy_renewal_date
        LIMIT 5
    """)
    for dot, name, rep, title, renewal in cursor.fetchall():
        print(f"DOT: {dot}")
        print(f"  Company: {name}")
        print(f"  Rep: {rep} ({title})")
        print(f"  Renewal: {renewal}")
        print()

    conn.close()

    print("=" * 80)
    print("KEY FINDINGS:")
    print("-" * 50)
    print(f"✅ {with_reps:,} carriers have representative data ({with_reps/total*100:.2f}% of total)")
    print(f"✅ {unique_reps:,} unique representative names")
    print(f"✅ {exp_2025_with_rep:,} carriers expiring in 2025 have reps")
    print(f"❌ {total - with_reps:,} carriers have NO representative data ({(total-with_reps)/total*100:.2f}%)")
    print("=" * 80)

if __name__ == "__main__":
    analyze_representative_data()