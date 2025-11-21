#!/usr/bin/env python3
"""
Analyze matched_carriers for Ohio leads by month/day patterns (ignore year)
"""

import csv
import datetime
from datetime import datetime, timedelta

def parse_insurance_date(insurance_record):
    """Extract month/day from insurance_record field"""
    try:
        parts = insurance_record.split('|')
        if len(parts) >= 7:
            expiry_str = parts[6]
            if expiry_str and expiry_str != '0':
                # Parse MM/DD/YYYY and return month/day
                date_obj = datetime.strptime(expiry_str, '%m/%d/%Y')
                return (date_obj.month, date_obj.day)
    except:
        pass
    return None

def analyze_ohio_by_dates():
    """Analyze Ohio leads by month/day patterns"""

    csv_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    today = datetime.now()

    # Calculate target month/day ranges (ignoring year)
    date_30 = today + timedelta(days=30)
    date_60 = today + timedelta(days=60)
    date_90 = today + timedelta(days=90)

    print(f"Analyzing Ohio leads by month/day patterns")
    print(f"Today: {today.month}/{today.day}")
    print(f"30 days target: {date_30.month}/{date_30.day}")
    print(f"60 days target: {date_60.month}/{date_60.day}")
    print(f"90 days target: {date_90.month}/{date_90.day}")
    print("-" * 60)

    leads_30 = []
    leads_60 = []
    leads_90 = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            if row['state'] != 'OH':
                continue

            # Parse month/day
            month_day = parse_insurance_date(row['insurance_record'])
            if not month_day:
                continue

            month, day = month_day

            # Create date objects for comparison (using current year)
            try:
                expiry_this_year = datetime(today.year, month, day).date()
                today_date = today.date()

                # Calculate days difference
                days_diff = (expiry_this_year - today_date).days

                # Adjust for year boundaries
                if days_diff < -180:  # If date passed this year, check next year
                    expiry_next_year = datetime(today.year + 1, month, day).date()
                    days_diff = (expiry_next_year - today_date).days

                lead_data = {
                    'company': row['legal_name'],
                    'dot_number': row['dot_number'],
                    'city': row['city'],
                    'phone': row['phone'],
                    'email': row['email_address'],
                    'expiry_month_day': f"{month}/{day}",
                    'days_until': days_diff,
                    'insurance_record': row['insurance_record']
                }

                # Categorize by days until expiry
                if 0 <= days_diff <= 30:
                    leads_30.append(lead_data)
                elif 0 <= days_diff <= 60:
                    leads_60.append(lead_data)
                elif 0 <= days_diff <= 90:
                    leads_90.append(lead_data)

            except ValueError:
                # Handle invalid dates like Feb 29 in non-leap years
                continue

    # Sort by days until expiry
    leads_30.sort(key=lambda x: x['days_until'])
    leads_60.sort(key=lambda x: x['days_until'])
    leads_90.sort(key=lambda x: x['days_until'])

    print(f"🎯 OHIO LEADS EXPIRING IN 30 DAYS: {len(leads_30)}")
    print(f"🎯 OHIO LEADS EXPIRING IN 60 DAYS: {len(leads_60)}")
    print(f"🎯 OHIO LEADS EXPIRING IN 90 DAYS: {len(leads_90)}")
    print()

    # Show samples
    if leads_30:
        print("📋 30-DAY LEADS SAMPLE:")
        for i, lead in enumerate(leads_30[:10]):
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Pattern: {lead['expiry_month_day']} ({lead['days_until']} days)")
            print()

    if leads_60:
        print("📋 60-DAY LEADS SAMPLE:")
        for i, lead in enumerate(leads_60[:5]):
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Pattern: {lead['expiry_month_day']} ({lead['days_until']} days)")
            print()

    if leads_90:
        print("📋 90-DAY LEADS SAMPLE:")
        for i, lead in enumerate(leads_90[:5]):
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Pattern: {lead['expiry_month_day']} ({lead['days_until']} days)")
            print()

if __name__ == "__main__":
    analyze_ohio_by_dates()