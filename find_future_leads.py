#!/usr/bin/env python3
"""
Find Ohio leads with expiration dates after today
"""

import csv
import datetime
from datetime import datetime, timedelta

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

def find_future_leads():
    csv_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    today = datetime.now().date()

    print(f"Looking for Ohio leads with expiration dates AFTER {today}")
    print("-" * 60)

    future_leads = []
    past_leads_sample = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            if row['state'] != 'OH':
                continue

            expiry_date = parse_insurance_date(row['insurance_record'])
            if not expiry_date:
                continue

            if expiry_date > today:
                future_leads.append({
                    'company': row['legal_name'],
                    'dot_number': row['dot_number'],
                    'city': row['city'],
                    'phone': row['phone'],
                    'email': row['email_address'],
                    'expiry_date': expiry_date,
                    'insurance_record': row['insurance_record']
                })
            elif len(past_leads_sample) < 10:
                past_leads_sample.append({
                    'company': row['legal_name'],
                    'expiry_date': expiry_date,
                    'insurance_record': row['insurance_record']
                })

    print(f"🎯 FUTURE LEADS FOUND: {len(future_leads)}")

    if future_leads:
        # Sort by expiry date
        future_leads.sort(key=lambda x: x['expiry_date'])

        print("\n📋 ALL FUTURE EXPIRING LEADS:")
        for i, lead in enumerate(future_leads):
            days_until = (lead['expiry_date'] - today).days
            print(f"  {i+1}. {lead['company']} (DOT: {lead['dot_number']})")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📧 {lead['email']}")
            print(f"     📅 Expires: {lead['expiry_date']} ({days_until} days from now)")
            print()
    else:
        print("\n❌ NO FUTURE LEADS FOUND")
        print("\n📋 SAMPLE RECENT PAST LEADS:")
        for i, lead in enumerate(past_leads_sample[:5]):
            print(f"  {i+1}. {lead['company']} - Expired: {lead['expiry_date']}")

if __name__ == "__main__":
    find_future_leads()