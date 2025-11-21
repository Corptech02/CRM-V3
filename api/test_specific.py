#!/usr/bin/env python3
"""
Test specific DOT numbers with known representative data
"""

import sqlite3

# Database paths
DB_PATH = '/home/corp06/vanguard-vps-package/vanguard_system.db'
FMCSA_COMPLETE_DB_PATH = '/var/www/vanguard/fmcsa_complete.db'

def test_specific_dots():
    # Test with DOT numbers we know have representative data
    test_dots = ['2453787', '1253', '2451', '12330', '12351', '14762']

    print("🎯 Testing specific DOT numbers with known representative data...")

    # Check which exist in insurance database
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        placeholders = ','.join(['?' for _ in test_dots])
        cursor.execute(f"SELECT dot_number, legal_name FROM fmcsa_enhanced WHERE dot_number IN ({placeholders})", test_dots)
        insurance_records = cursor.fetchall()

    print(f"📊 Found {len(insurance_records)} in insurance database:")
    for dot_num, name in insurance_records:
        print(f"   {dot_num}: {name}")

    # Convert to integers and test join
    dot_ints = []
    for dot_num, name in insurance_records:
        try:
            dot_ints.append(int(dot_num))
        except (ValueError, TypeError):
            continue

    # Query complete database for these specific DOTs
    with sqlite3.connect(FMCSA_COMPLETE_DB_PATH) as conn:
        cursor = conn.cursor()
        placeholders = ','.join(['?' for _ in dot_ints])
        cursor.execute(f"""
            SELECT dot_number, legal_name, street, city, state, zip_code,
                   representative_1_name, representative_1_title
            FROM carriers
            WHERE dot_number IN ({placeholders})
        """, dot_ints)
        complete_records = cursor.fetchall()

    print(f"\n🔍 Results from complete database ({len(complete_records)} matches):")

    enhanced_count = 0
    for record in complete_records:
        dot_num, name, street, city, state, zip_code, rep_name, rep_title = record

        has_address = bool(street)
        has_rep = bool(rep_name)

        if has_address or has_rep:
            enhanced_count += 1
            print(f"   ✅ DOT {dot_num}: {name}")
            if has_rep:
                print(f"      👤 Representative: {rep_name} ({rep_title})")
            if has_address:
                print(f"      🏠 Address: {street}, {city}, {state} {zip_code}")
        else:
            print(f"   ❌ DOT {dot_num}: {name} (no enhanced data)")

    print(f"\n📋 SUMMARY:")
    print(f"   Records with enhanced data: {enhanced_count}/{len(complete_records)}")

    if enhanced_count > 0:
        print("✅ DATA TYPE FIX IS WORKING! Enhanced data available.")
        print("🔧 The API should now include this data in exports.")
    else:
        print("❌ No enhanced data found for these records.")

if __name__ == '__main__':
    test_specific_dots()