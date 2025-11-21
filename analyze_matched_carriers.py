#!/usr/bin/env python3
"""
Analyze matched_carriers_20251009_183433.csv for Ohio leads by expiration periods
"""

import csv
import datetime
from datetime import datetime, timedelta

def parse_insurance_date(insurance_record):
    """Extract expiration date from insurance_record field"""
    try:
        # Format: MC#|DOT#|91X|BIPD/Primary|COMPANY|POLICY#|EXPIRATION_DATE|0|AMOUNT|DATE|
        parts = insurance_record.split('|')
        if len(parts) >= 7:
            expiry_str = parts[6]  # 7th element (0-indexed)
            if expiry_str and expiry_str != '0':
                # Parse MM/DD/YYYY format
                return datetime.strptime(expiry_str, '%m/%d/%Y').date()
    except:
        pass
    return None

def analyze_ohio_leads():
    """Analyze Ohio leads by expiration periods"""

    csv_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    today = datetime.now().date()

    # Define date ranges
    date_30 = today + timedelta(days=30)
    date_60 = today + timedelta(days=60)
    date_90 = today + timedelta(days=90)

    leads_30 = []
    leads_60 = []
    leads_90 = []

    total_ohio = 0
    ohio_with_dates = 0

    print(f"Analyzing Ohio leads from {csv_file}")
    print(f"Today: {today}")
    print(f"30 days: {date_30}")
    print(f"60 days: {date_60}")
    print(f"90 days: {date_90}")
    print("-" * 60)

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Filter for Ohio
            if row['state'] != 'OH':
                continue

            total_ohio += 1

            # Parse insurance expiration date
            expiry_date = parse_insurance_date(row['insurance_record'])
            if not expiry_date:
                continue

            ohio_with_dates += 1

            # Check if date falls within our windows
            if today <= expiry_date <= date_30:
                leads_30.append({
                    'company': row['legal_name'],
                    'dot_number': row['dot_number'],
                    'city': row['city'],
                    'phone': row['phone'],
                    'email': row['email_address'],
                    'expiry_date': expiry_date,
                    'insurance_record': row['insurance_record']
                })
            elif today <= expiry_date <= date_60:
                leads_60.append({
                    'company': row['legal_name'],
                    'dot_number': row['dot_number'],
                    'city': row['city'],
                    'phone': row['phone'],
                    'email': row['email_address'],
                    'expiry_date': expiry_date,
                    'insurance_record': row['insurance_record']
                })
            elif today <= expiry_date <= date_90:
                leads_90.append({
                    'company': row['legal_name'],
                    'dot_number': row['dot_number'],
                    'city': row['city'],
                    'phone': row['phone'],
                    'email': row['email_address'],
                    'expiry_date': expiry_date,
                    'insurance_record': row['insurance_record']
                })

    # Print results
    print(f"Total Ohio records: {total_ohio:,}")
    print(f"Ohio with valid expiry dates: {ohio_with_dates:,}")
    print()

    print(f"🎯 OHIO LEADS EXPIRING IN 30 DAYS: {len(leads_30)}")
    print(f"🎯 OHIO LEADS EXPIRING IN 60 DAYS: {len(leads_60)}")
    print(f"🎯 OHIO LEADS EXPIRING IN 90 DAYS: {len(leads_90)}")
    print()

    # Show samples
    if leads_30:
        print("📋 SAMPLE 30-DAY LEADS:")
        for i, lead in enumerate(leads_30[:5]):
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Expires: {lead['expiry_date']}")
            print()

    if leads_60:
        print("📋 SAMPLE 60-DAY LEADS:")
        for i, lead in enumerate(leads_60[:3]):
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Expires: {lead['expiry_date']}")
            print()

    if leads_90:
        print("📋 SAMPLE 90-DAY LEADS:")
        for i, lead in enumerate(leads_90[:3]):
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Expires: {lead['expiry_date']}")
            print()

if __name__ == "__main__":
    analyze_ohio_leads()