#!/usr/bin/env python3
"""
Test script to verify the database join is working
"""

import sqlite3

# Database paths
DB_PATH = '/home/corp06/vanguard-vps-package/vanguard_system.db'
FMCSA_COMPLETE_DB_PATH = '/var/www/vanguard/fmcsa_complete.db'

def test_join():
    # Get some DOT numbers from insurance database
    print("🔍 Testing database join...")

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT dot_number, legal_name FROM fmcsa_enhanced LIMIT 10")
        insurance_records = cursor.fetchall()

    print(f"📊 Got {len(insurance_records)} records from insurance DB")
    for dot_num, name in insurance_records[:3]:
        print(f"   Insurance: DOT {dot_num} = {name}")

    # Convert DOT numbers to integers and query complete database
    dot_numbers = []
    for dot_num, name in insurance_records:
        try:
            dot_numbers.append(int(dot_num))
        except (ValueError, TypeError):
            continue

    print(f"🔢 Converted {len(dot_numbers)} DOT numbers to integers for join")

    # Query complete database
    with sqlite3.connect(FMCSA_COMPLETE_DB_PATH) as conn:
        cursor = conn.cursor()
        dot_placeholders = ','.join(['?' for _ in dot_numbers])
        query = f"""
            SELECT dot_number, legal_name, street, representative_1_name
            FROM carriers
            WHERE dot_number IN ({dot_placeholders})
        """
        cursor.execute(query, dot_numbers)
        complete_records = cursor.fetchall()

    print(f"🎯 Found {len(complete_records)} matches in complete database")

    # Show matches with representative data
    matches_with_reps = 0
    matches_with_addresses = 0

    for dot_num, name, street, rep_name in complete_records:
        if rep_name:
            matches_with_reps += 1
            print(f"   ✅ Representative: DOT {dot_num} = {name} | Rep: {rep_name}")
        if street:
            matches_with_addresses += 1
            print(f"   🏠 Address: DOT {dot_num} = {name} | Street: {street}")

    print(f"\n📋 RESULTS:")
    print(f"   Total insurance records: {len(insurance_records)}")
    print(f"   Matches in complete DB: {len(complete_records)}")
    print(f"   With representatives: {matches_with_reps}")
    print(f"   With addresses: {matches_with_addresses}")

    if matches_with_reps > 0 or matches_with_addresses > 0:
        print("✅ JOIN IS WORKING - Data type fix successful!")
    else:
        print("❌ No representative/address data found in this sample")

if __name__ == '__main__':
    test_join()