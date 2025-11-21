#!/usr/bin/env python3
import csv
from datetime import datetime
from collections import defaultdict
import sys

def analyze_insurance_files():
    print("=" * 80)
    print("DEEP ANALYSIS OF MCMIS INSURANCE DATA FILES")
    print("=" * 80)

    # Initialize counters
    total_records = 0
    unique_mc_numbers = set()
    unique_dot_numbers = set()
    expiration_by_month = defaultdict(int)
    expiration_by_year = defaultdict(int)
    companies_by_state = defaultdict(set)
    insurance_companies = defaultdict(int)

    # Analyze actpendins.txt (Active/Pending Insurance)
    print("\n1. ANALYZING actpendins_2025_09_03.txt (Active/Pending Insurance)")
    print("-" * 60)

    with open('actpendins.txt', 'r') as f:
        reader = csv.reader(f)
        actpendins_count = 0
        for row in reader:
            if len(row) >= 11:
                actpendins_count += 1
                mc_number = row[0].strip('"')
                dot_number = row[1].strip('"')
                insurance_company = row[4].strip('"')
                effective_date = row[6].strip('"')
                expiration_date1 = row[9].strip('"')
                expiration_date2 = row[10].strip('"')

                unique_mc_numbers.add(mc_number)
                unique_dot_numbers.add(dot_number)
                insurance_companies[insurance_company] += 1

                # Process expiration dates
                for exp_date in [expiration_date1, expiration_date2]:
                    if exp_date and exp_date != '""':
                        try:
                            date_obj = datetime.strptime(exp_date, '%m/%d/%Y')
                            month_key = date_obj.strftime('%Y-%m')
                            year_key = str(date_obj.year)
                            expiration_by_month[month_key] += 1
                            expiration_by_year[year_key] += 1
                        except:
                            pass

        print(f"Records processed: {actpendins_count:,}")
        print(f"Unique MC numbers: {len(unique_mc_numbers):,}")
        print(f"Unique DOT numbers: {len(unique_dot_numbers):,}")

    # Analyze insur.txt (Current Insurance)
    print("\n2. ANALYZING insur_2025_09_03.txt (Current Insurance)")
    print("-" * 60)

    with open('insur.txt', 'r') as f:
        reader = csv.reader(f)
        insur_count = 0
        for row in reader:
            if len(row) >= 9:
                insur_count += 1
                mc_number = row[0].strip('"')
                expiration_date = row[6].strip('"')
                insurance_company = row[8].strip('"')

                unique_mc_numbers.add(mc_number)
                insurance_companies[insurance_company] += 1

                # Process expiration date
                if expiration_date and expiration_date != '""':
                    try:
                        date_obj = datetime.strptime(expiration_date, '%m/%d/%Y')
                        month_key = date_obj.strftime('%Y-%m')
                        year_key = str(date_obj.year)
                        expiration_by_month[month_key] += 1
                        expiration_by_year[year_key] += 1
                    except:
                        pass

        print(f"Records processed: {insur_count:,}")
        print(f"Total unique MC numbers so far: {len(unique_mc_numbers):,}")

    # Analyze inshist.txt (Insurance History)
    print("\n3. ANALYZING inshist_2025_09_03.txt (Insurance History)")
    print("-" * 60)

    with open('inshist.txt', 'r') as f:
        reader = csv.reader(f)
        inshist_count = 0
        for row in reader:
            if len(row) >= 17:
                inshist_count += 1
                mc_number = row[0].strip('"')
                dot_number = row[1].strip('"')
                effective_date = row[10].strip('"') if len(row) > 10 else ""
                expiration_date = row[13].strip('"') if len(row) > 13 else ""
                insurance_company = row[16].strip('"') if len(row) > 16 else ""

                unique_mc_numbers.add(mc_number)
                unique_dot_numbers.add(dot_number)
                if insurance_company:
                    insurance_companies[insurance_company] += 1

                # Process expiration date
                if expiration_date and expiration_date != '""':
                    try:
                        date_obj = datetime.strptime(expiration_date, '%m/%d/%Y')
                        month_key = date_obj.strftime('%Y-%m')
                        year_key = str(date_obj.year)
                        expiration_by_month[month_key] += 1
                        expiration_by_year[year_key] += 1
                    except:
                        pass

        print(f"Records processed: {inshist_count:,}")
        print(f"Total unique MC numbers: {len(unique_mc_numbers):,}")
        print(f"Total unique DOT numbers: {len(unique_dot_numbers):,}")

    # Final Report
    print("\n" + "=" * 80)
    print("COMPREHENSIVE REPORT - REAL INSURANCE EXPIRATION DATA")
    print("=" * 80)

    print("\n📊 TOTAL STATISTICS:")
    print("-" * 40)
    total_records = actpendins_count + insur_count + inshist_count
    print(f"Total records analyzed: {total_records:,}")
    print(f"Unique MC numbers (leads): {len(unique_mc_numbers):,}")
    print(f"Unique DOT numbers: {len(unique_dot_numbers):,}")
    print(f"Unique insurance companies: {len(insurance_companies):,}")

    print("\n📅 EXPIRATION DATES BY YEAR:")
    print("-" * 40)
    for year in sorted(expiration_by_year.keys()):
        if 2024 <= int(year) <= 2035:  # Focus on relevant years
            print(f"{year}: {expiration_by_year[year]:,} policies")

    print("\n📅 2025 MONTHLY BREAKDOWN (REAL EXPIRATION DATES):")
    print("-" * 40)
    months_2025 = [f"2025-{str(m).zfill(2)}" for m in range(1, 13)]
    total_2025 = 0
    for month in months_2025:
        count = expiration_by_month.get(month, 0)
        total_2025 += count
        print(f"{month}: {count:,} policies expiring")
    print(f"TOTAL 2025: {total_2025:,} policies")

    print("\n📅 2026 MONTHLY BREAKDOWN:")
    print("-" * 40)
    months_2026 = [f"2026-{str(m).zfill(2)}" for m in range(1, 13)]
    total_2026 = 0
    for month in months_2026:
        count = expiration_by_month.get(month, 0)
        total_2026 += count
        if count > 0:
            print(f"{month}: {count:,} policies expiring")
    print(f"TOTAL 2026: {total_2026:,} policies")

    print("\n🏆 TOP 10 INSURANCE COMPANIES:")
    print("-" * 40)
    top_companies = sorted(insurance_companies.items(), key=lambda x: x[1], reverse=True)[:10]
    for company, count in top_companies:
        if company:
            print(f"{company}: {count:,} policies")

    print("\n" + "=" * 80)
    print("KEY FINDINGS:")
    print("-" * 40)
    print(f"✅ {len(unique_mc_numbers):,} UNIQUE MC numbers (potential leads)")
    print(f"✅ {len(unique_dot_numbers):,} UNIQUE DOT numbers")
    print(f"✅ {total_2025:,} policies expiring in 2025")
    print(f"✅ {total_2026:,} policies expiring in 2026")
    print(f"✅ Data from REAL FMCSA insurance filings (NOT fake dates)")
    print("=" * 80)

if __name__ == "__main__":
    analyze_insurance_files()