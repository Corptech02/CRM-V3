#!/usr/bin/env python3
"""
Debug the actual date ranges in the matched carriers file
"""

import csv
import datetime
from datetime import datetime, timedelta
from collections import Counter

def parse_insurance_date(insurance_record):
    """Extract expiration date from insurance_record field"""
    try:
        parts = insurance_record.split('|')
        if len(parts) >= 7:
            expiry_str = parts[6]
            if expiry_str and expiry_str != '0':
                return datetime.strptime(expiry_str, '%m/%d/%Y').date()
    except:
        pass
    return None

def debug_dates():
    csv_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    today = datetime.now().date()

    years = Counter()
    months = Counter()
    recent_dates = []
    sample_records = []

    print(f"Debugging dates in {csv_file}")
    print(f"Today: {today}")
    print("-" * 60)

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for i, row in enumerate(reader):
            if row['state'] != 'OH':
                continue

            if i < 10:  # Sample first 10 Ohio records
                sample_records.append(row['insurance_record'])

            expiry_date = parse_insurance_date(row['insurance_record'])
            if expiry_date:
                years[expiry_date.year] += 1
                months[f"{expiry_date.year}-{expiry_date.month:02d}"] += 1

                # Check for dates in 2025-2026
                if expiry_date.year >= 2025:
                    recent_dates.append(expiry_date)

    print("📊 SAMPLE INSURANCE RECORDS (first 10 Ohio):")
    for i, record in enumerate(sample_records[:5]):
        print(f"  {i+1}. {record}")
    print()

    print("📅 EXPIRATION YEARS DISTRIBUTION:")
    for year in sorted(years.keys()):
        print(f"  {year}: {years[year]:,} leads")
    print()

    print("📅 RECENT MONTHS (2025+):")
    recent_months = {k: v for k, v in months.items() if k.startswith('2025') or k.startswith('2026')}
    for month in sorted(recent_months.keys()):
        print(f"  {month}: {recent_months[month]:,} leads")
    print()

    if recent_dates:
        recent_dates.sort()
        print(f"📈 FUTURE DATES FOUND: {len(recent_dates)}")
        print(f"  Earliest: {min(recent_dates)}")
        print(f"  Latest: {max(recent_dates)}")
        print(f"  Next 10 dates: {recent_dates[:10]}")
    else:
        print("❌ NO FUTURE DATES FOUND")

if __name__ == "__main__":
    debug_dates()