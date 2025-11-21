#!/usr/bin/env python3

import csv
import os

def test_csv_leads():
    """Test CSV files to verify working lead data"""

    csv_files = [
        "/var/www/vanguard/30_Day_Expiring_Carriers_Nov2024.csv",
        "/var/www/vanguard/public/30_Day_Expiring_Carriers_Nov2024.csv",
        "/var/www/vanguard/public/august_insurance_expirations.csv",
        "/var/www/vanguard/download-portal/ohio_progressive_30days.csv"
    ]

    total_leads = 0
    oh_leads = 0
    oh_with_reps = 0

    for csv_file in csv_files:
        if not os.path.exists(csv_file):
            print(f"❌ File not found: {csv_file}")
            continue

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                file_leads = 0
                file_oh = 0
                file_oh_reps = 0

                for row in reader:
                    file_leads += 1
                    total_leads += 1

                    # Check for OH state
                    if row.get('State', '').upper() == 'OH':
                        file_oh += 1
                        oh_leads += 1

                        # Check for representative name
                        rep_name = (
                            row.get('Representative 1 Name', '') or
                            row.get('Representative_Name', '') or
                            row.get('Representative Name', '') or
                            ''
                        ).strip()

                        if rep_name:
                            file_oh_reps += 1
                            oh_with_reps += 1

                            if file_oh_reps <= 3:  # Show first 3 examples
                                print(f"✅ {row.get('Legal Name', 'N/A')[:30]} - Rep: {rep_name}")

                print(f"📁 {os.path.basename(csv_file)}: {file_leads} total, {file_oh} OH, {file_oh_reps} OH with reps")

        except Exception as e:
            print(f"❌ Error reading {csv_file}: {e}")

    print(f"\n📊 SUMMARY:")
    print(f"Total records across all files: {total_leads}")
    print(f"OH records: {oh_leads}")
    print(f"OH records with representative names: {oh_with_reps}")

    return oh_with_reps

if __name__ == "__main__":
    result = test_csv_leads()
    print(f"\n🎯 Your working lead count: {result} OH leads with representative data")