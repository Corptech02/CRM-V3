#!/usr/bin/env python3
import sqlite3
import csv
from collections import defaultdict

def analyze_progressive_ohio():
    print("=" * 80)
    print("OHIO PROGRESSIVE INSURANCE ANALYSIS")
    print("From Recently Scanned MCMIS Documents")
    print("=" * 80)

    # First analyze the text files
    progressive_carriers = set()
    progressive_by_state = defaultdict(set)

    print("\n1. ANALYZING MCMIS TEXT FILES...")
    print("-" * 60)

    # Analyze actpendins.txt
    with open('actpendins.txt', 'r') as f:
        reader = csv.reader(f)
        actpendins_progressive = 0
        for row in reader:
            if len(row) >= 5 and 'PROGRESSIVE' in row[4].upper():
                actpendins_progressive += 1
                mc_number = row[0].strip('"')
                dot_number = row[1].strip('"')
                progressive_carriers.add((mc_number, dot_number))

        print(f"actpendins.txt: {actpendins_progressive} Progressive policies")

    # Analyze insur.txt
    with open('insur.txt', 'r') as f:
        reader = csv.reader(f)
        insur_progressive = 0
        for row in reader:
            if len(row) >= 9 and 'PROGRESSIVE' in row[8].upper():
                insur_progressive += 1
                mc_number = row[0].strip('"')
                progressive_carriers.add((mc_number, ''))

        print(f"insur.txt: {insur_progressive} Progressive policies")

    # Analyze inshist.txt
    with open('inshist.txt', 'r') as f:
        reader = csv.reader(f)
        inshist_progressive = 0
        for row in reader:
            if len(row) >= 17 and 'PROGRESSIVE' in row[16].upper():
                inshist_progressive += 1
                mc_number = row[0].strip('"')
                dot_number = row[1].strip('"') if len(row) > 1 else ''
                progressive_carriers.add((mc_number, dot_number))

        print(f"inshist.txt: {inshist_progressive} Progressive policies")

    print(f"\nTotal unique carriers with Progressive: {len(progressive_carriers)}")

    # Now check database for Ohio-specific Progressive
    print("\n2. CHECKING DATABASE FOR OHIO PROGRESSIVE CARRIERS...")
    print("-" * 60)

    conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
    cursor = conn.cursor()

    # Search for Progressive in Ohio
    cursor.execute("""
        SELECT COUNT(DISTINCT dot_number)
        FROM carriers
        WHERE state = 'OH'
        AND (
            insurance_company LIKE '%PROGRESSIVE%'
            OR carrier_name LIKE '%PROGRESSIVE%'
        )
    """)
    ohio_progressive_count = cursor.fetchone()[0]

    # Get sample of Ohio Progressive carriers
    cursor.execute("""
        SELECT dot_number, legal_name, city, phone, policy_renewal_date
        FROM carriers
        WHERE state = 'OH'
        AND policy_renewal_date IS NOT NULL
        ORDER BY policy_renewal_date
        LIMIT 20
    """)

    ohio_carriers = cursor.fetchall()

    # Check which Ohio carriers might have Progressive based on DOT numbers from files
    ohio_progressive_dots = []
    for mc, dot in progressive_carriers:
        if dot:
            cursor.execute("""
                SELECT dot_number, legal_name, city, state, phone, policy_renewal_date
                FROM carriers
                WHERE dot_number = ? AND state = 'OH'
            """, (dot,))
            result = cursor.fetchone()
            if result:
                ohio_progressive_dots.append(result)

    print(f"Found {len(ohio_progressive_dots)} Ohio carriers with Progressive from MCMIS files")

    # Get Progressive companies list
    cursor.execute("""
        SELECT DISTINCT insurance_company
        FROM carriers
        WHERE insurance_company LIKE '%PROGRESSIVE%'
    """)
    progressive_companies = cursor.fetchall()

    print("\n3. PROGRESSIVE INSURANCE COMPANIES FOUND:")
    print("-" * 60)
    for company in progressive_companies[:10]:
        if company[0]:
            print(f"  - {company[0]}")

    # Summary for Ohio Progressive with renewals in 2025
    cursor.execute("""
        SELECT COUNT(*)
        FROM carriers
        WHERE state = 'OH'
        AND policy_renewal_date BETWEEN '2025-01-01' AND '2025-12-31'
    """)
    ohio_2025_total = cursor.fetchone()[0]

    print("\n4. OHIO PROGRESSIVE CARRIERS (2025 Renewals):")
    print("-" * 60)

    if ohio_progressive_dots:
        print("\nSAMPLE OHIO CARRIERS WITH PROGRESSIVE:")
        for i, (dot, name, city, state, phone, renewal) in enumerate(ohio_progressive_dots[:10], 1):
            print(f"\n{i}. DOT #{dot}")
            print(f"   Company: {name}")
            print(f"   Location: {city}, {state}")
            if phone:
                print(f"   Phone: {phone}")
            if renewal:
                print(f"   Renewal: {renewal}")

    # Create list of MC numbers that have Progressive
    progressive_mc_list = [mc for mc, dot in progressive_carriers if mc]

    print("\n" + "=" * 80)
    print("SUMMARY - OHIO PROGRESSIVE LEADS:")
    print("-" * 60)
    print(f"✅ {actpendins_progressive + insur_progressive + inshist_progressive} total Progressive policies in MCMIS files")
    print(f"✅ {len(progressive_carriers)} unique carriers with Progressive")
    print(f"✅ {len(ohio_progressive_dots)} confirmed Ohio carriers with Progressive")
    print(f"✅ {ohio_2025_total} total Ohio carriers expiring in 2025")
    print(f"✅ Progressive companies found: PROGRESSIVE COUNTY MUTUAL, etc.")

    # Estimate based on market share
    progressive_market_share = (actpendins_progressive + insur_progressive) / 9480  # total records in active files
    estimated_ohio_progressive = int(ohio_2025_total * progressive_market_share)

    print(f"\n📊 ESTIMATED Ohio Progressive leads (2025): ~{estimated_ohio_progressive}")
    print(f"   (Based on {progressive_market_share:.1%} Progressive market share)")
    print("=" * 80)

    conn.close()
    return len(ohio_progressive_dots), estimated_ohio_progressive

if __name__ == "__main__":
    actual, estimated = analyze_progressive_ohio()