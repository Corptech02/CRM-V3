#!/usr/bin/env python3
"""
Fix the analysis to show CUMULATIVE counts (0-30, 0-60, 0-90 days)
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

def analyze_ohio_cumulative():
    """Analyze Ohio leads with CUMULATIVE counts"""

    csv_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    today = datetime.now()

    print(f"Analyzing Ohio leads with CUMULATIVE counts")
    print(f"Today: {today.month}/{today.day}")
    print("-" * 60)

    leads_30 = []  # 0-30 days
    leads_60 = []  # 0-60 days
    leads_90 = []  # 0-90 days

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

                # CUMULATIVE categorization
                if 0 <= days_diff <= 30:
                    leads_30.append(lead_data)

                if 0 <= days_diff <= 60:  # This includes the 0-30 day leads PLUS 31-60 day leads
                    leads_60.append(lead_data)

                if 0 <= days_diff <= 90:  # This includes ALL leads from 0-90 days
                    leads_90.append(lead_data)

            except ValueError:
                continue

    # Sort by days until expiry
    leads_30.sort(key=lambda x: x['days_until'])
    leads_60.sort(key=lambda x: x['days_until'])
    leads_90.sort(key=lambda x: x['days_until'])

    print(f"🎯 OHIO LEADS EXPIRING IN 0-30 DAYS: {len(leads_30)}")
    print(f"🎯 OHIO LEADS EXPIRING IN 0-60 DAYS: {len(leads_60)}")
    print(f"🎯 OHIO LEADS EXPIRING IN 0-90 DAYS: {len(leads_90)}")
    print()

    # Show breakdown
    leads_31_60 = [lead for lead in leads_60 if lead['days_until'] > 30]
    leads_61_90 = [lead for lead in leads_90 if lead['days_until'] > 60]

    print("📊 BREAKDOWN BY PERIODS:")
    print(f"   0-30 days: {len(leads_30)} leads")
    print(f"  31-60 days: {len(leads_31_60)} leads")
    print(f"  61-90 days: {len(leads_61_90)} leads")
    print(f"  TOTAL 0-90: {len(leads_90)} leads")
    print()

    # Verify math
    print("🔍 VERIFICATION:")
    print(f"  0-30: {len(leads_30)}")
    print(f"  + 31-60: {len(leads_31_60)} = {len(leads_30) + len(leads_31_60)} (should equal 0-60: {len(leads_60)})")
    print(f"  + 61-90: {len(leads_61_90)} = {len(leads_60) + len(leads_61_90)} (should equal 0-90: {len(leads_90)})")

if __name__ == "__main__":
    analyze_ohio_cumulative()