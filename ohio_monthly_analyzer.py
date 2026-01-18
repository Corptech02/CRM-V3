#!/usr/bin/env python3

import csv
import re
from datetime import datetime
from collections import defaultdict

def extract_expiration_date(insurance_record):
    """Extract the expiration/renewal date from insurance record"""
    if not insurance_record:
        return None

    # Split insurance record by pipe
    parts = insurance_record.split('|')

    # The format appears to be: MC|DOT|Type|Coverage|Company|Policy|Effective|?|Amount|Expiration|
    # Expiration date should be the last meaningful field (index -2 or -1)

    if len(parts) >= 10:
        # Try the second to last field first (typically expiration)
        expiration_str = parts[-2].strip()

        # If that's empty or not a date, try the last field
        if not expiration_str or not is_date_like(expiration_str):
            expiration_str = parts[-1].strip()

        # Parse the date
        return parse_date(expiration_str)

    return None

def is_date_like(date_str):
    """Check if string looks like a date"""
    if not date_str:
        return False

    # Look for date patterns MM/DD/YYYY or MM-DD-YYYY
    date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{4}'
    return bool(re.match(date_pattern, date_str))

def parse_date(date_str):
    """Parse date string into datetime object"""
    if not date_str:
        return None

    # Clean the date string
    date_str = date_str.strip()

    # Try different date formats
    date_formats = [
        '%m/%d/%Y',
        '%m-%d-%Y',
        '%Y-%m-%d',
        '%m/%d/%y',
        '%m-%d-%y'
    ]

    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    return None

def analyze_ohio_monthly_expirations():
    """Analyze monthly expiration patterns for Ohio carriers only"""

    print("Analyzing Ohio carrier insurance policy expirations by month...")
    print(f"Processing file: /home/corp06/matched_carriers_20251009_183433.csv")

    # Track expirations by month for Ohio only
    monthly_expirations = defaultdict(int)
    yearly_monthly_expirations = defaultdict(lambda: defaultdict(int))

    total_records = 0
    ohio_records = 0
    ohio_records_with_dates = 0
    ohio_invalid_dates = 0

    with open('/home/corp06/matched_carriers_20251009_183433.csv', 'r') as file:
        reader = csv.DictReader(file)

        for row in reader:
            total_records += 1

            if total_records % 50000 == 0:
                print(f"Processed {total_records} records...")

            # Filter for Ohio only
            state = row.get('state', '').strip().upper()

            if state == 'OH':
                ohio_records += 1

                insurance_record = row.get('insurance_record', '')
                expiration_date = extract_expiration_date(insurance_record)

                if expiration_date:
                    ohio_records_with_dates += 1

                    # Group by month name
                    month_name = expiration_date.strftime('%B')  # Full month name
                    year = expiration_date.year

                    monthly_expirations[month_name] += 1
                    yearly_monthly_expirations[year][month_name] += 1
                else:
                    ohio_invalid_dates += 1

    print(f"\nOhio Analysis completed!")
    print(f"Total records processed: {total_records:,}")
    print(f"Ohio records found: {ohio_records:,}")
    print(f"Ohio records with valid expiration dates: {ohio_records_with_dates:,}")
    print(f"Ohio records with invalid/missing dates: {ohio_invalid_dates:,}")
    print(f"Ohio date extraction rate: {(ohio_records_with_dates/ohio_records)*100:.2f}%")

    # Sort months in calendar order
    month_order = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']

    print(f"\n=== OHIO MONTHLY EXPIRATION SUMMARY ===")
    print(f"{'Month':<12} {'Leads Expiring':<15} {'Percentage':<10}")
    print("-" * 40)

    total_ohio_with_dates = sum(monthly_expirations.values())

    for month in month_order:
        count = monthly_expirations[month]
        percentage = (count / total_ohio_with_dates * 100) if total_ohio_with_dates > 0 else 0
        print(f"{month:<12} {count:<15,} {percentage:<10.2f}%")

    # Show year-by-year breakdown for recent years
    print(f"\n=== OHIO YEAR-BY-YEAR BREAKDOWN ===")
    years = sorted([year for year in yearly_monthly_expirations.keys() if year >= 2020])

    for year in years[-5:]:  # Show last 5 years
        print(f"\n{year}:")
        year_total = sum(yearly_monthly_expirations[year].values())
        print(f"Total Ohio leads expiring in {year}: {year_total:,}")

        if year_total > 0:
            print(f"{'Month':<12} {'Count':<10} {'%':<6}")
            print("-" * 30)
            for month in month_order:
                count = yearly_monthly_expirations[year][month]
                pct = (count / year_total * 100) if year_total > 0 else 0
                if count > 0:
                    print(f"{month:<12} {count:<10,} {pct:<6.1f}%")

    # Peak months analysis
    peak_months = sorted(monthly_expirations.items(), key=lambda x: x[1], reverse=True)
    print(f"\n=== OHIO PEAK EXPIRATION MONTHS ===")
    print(f"{'Rank':<4} {'Month':<12} {'Leads':<10} {'Percentage':<10}")
    print("-" * 40)

    for i, (month, count) in enumerate(peak_months[:12], 1):
        percentage = (count / total_ohio_with_dates * 100) if total_ohio_with_dates > 0 else 0
        print(f"{i:<4} {month:<12} {count:<10,} {percentage:<10.2f}%")

    # Save Ohio-specific results to file
    output_file = f'/home/corp06/ohio_monthly_expiration_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

    with open(output_file, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Month', 'Ohio_Leads_Expiring', 'Percentage'])

        for month in month_order:
            count = monthly_expirations[month]
            percentage = (count / total_ohio_with_dates * 100) if total_ohio_with_dates > 0 else 0
            writer.writerow([month, count, f"{percentage:.2f}"])

    print(f"\nOhio detailed results saved to: {output_file}")

    # Summary statistics
    print(f"\n=== OHIO SUMMARY STATISTICS ===")
    print(f"Total Ohio leads with expiration dates: {total_ohio_with_dates:,}")
    print(f"Average leads per month: {total_ohio_with_dates // 12:,}")
    print(f"Peak month: {peak_months[0][0]} ({peak_months[0][1]:,} leads)")
    print(f"Lowest month: {peak_months[-1][0]} ({peak_months[-1][1]:,} leads)")

    return monthly_expirations, yearly_monthly_expirations, ohio_records

if __name__ == "__main__":
    try:
        monthly_data, yearly_data, total_ohio = analyze_ohio_monthly_expirations()
    except Exception as e:
        print(f"Error during Ohio analysis: {e}")
        import traceback
        traceback.print_exc()