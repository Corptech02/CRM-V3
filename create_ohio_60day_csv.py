#!/usr/bin/env python3
"""
Create CSV with Ohio leads for 60 days out, skipping first 5 days (10/15-10/20)
Include representative information and format like lead generation
"""

import csv
import datetime
from datetime import datetime, timedelta

def parse_insurance_date(insurance_record):
    """Extract month/day and insurance company from insurance_record field"""
    try:
        parts = insurance_record.split('|')
        if len(parts) >= 7:
            expiry_str = parts[6]
            insurance_company = parts[4] if len(parts) > 4 else ''
            if expiry_str and expiry_str != '0':
                date_obj = datetime.strptime(expiry_str, '%m/%d/%Y')
                return (date_obj.month, date_obj.day), insurance_company
    except:
        pass
    return None, None

def extract_representative_name(insurance_record, legal_name):
    """Extract or generate representative name"""
    # For now, we'll use a simple approach - extract from company name or use generic
    if legal_name:
        # Try to extract a name from the company name
        name_parts = legal_name.replace('LLC', '').replace('INC', '').replace('CORP', '').strip().split()
        if len(name_parts) >= 2:
            return f"{name_parts[0]} {name_parts[1]}"
        elif len(name_parts) == 1:
            return f"{name_parts[0]} MANAGER"
    return "CONTACT REPRESENTATIVE"

def create_ohio_60day_csv():
    """Create CSV with Ohio leads for 60 days, skipping first 5 days"""

    input_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    output_file = '/var/www/vanguard/10-15 OH (10)60d.csv'

    today = datetime.now()
    skip_until = today + timedelta(days=5)  # Skip until 10/20
    end_date = today + timedelta(days=60)   # Until 60 days out

    print(f"Creating Ohio 60-day leads CSV")
    print(f"Today: {today.strftime('%m/%d')}")
    print(f"Skip until: {skip_until.strftime('%m/%d')} (skipping 10/15-10/20)")
    print(f"End date: {end_date.strftime('%m/%d')}")
    print("-" * 60)

    leads = []

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            if row['state'] != 'OH':
                continue

            # Parse month/day and insurance company
            month_day, insurance_company = parse_insurance_date(row['insurance_record'])
            if not month_day:
                continue

            month, day = month_day

            # Create date objects for comparison (using current year)
            try:
                expiry_this_year = datetime(today.year, month, day).date()
                today_date = today.date()
                skip_until_date = skip_until.date()
                end_date_obj = end_date.date()

                # Calculate days difference
                days_diff = (expiry_this_year - today_date).days

                # Adjust for year boundaries
                if days_diff < -180:  # If date passed this year, check next year
                    expiry_next_year = datetime(today.year + 1, month, day).date()
                    days_diff = (expiry_next_year - today_date).days
                    expiry_date = expiry_next_year
                else:
                    expiry_date = expiry_this_year

                # Skip first 5 days and only include up to 60 days
                if days_diff <= 5 or days_diff > 60:
                    continue

                # Extract representative name
                rep_name = extract_representative_name(row['insurance_record'], row['legal_name'])

                # Create lead record matching lead generation format
                lead = {
                    'id': f"OH_{row['dot_number']}_{datetime.now().strftime('%Y%m%d')}",
                    'name': row['legal_name'] or 'Unknown Company',
                    'contact': rep_name,
                    'phone': row['phone'] or '',
                    'email': row['email_address'] or '',
                    'company': row['legal_name'] or 'Unknown Company',
                    'dotNumber': row['dot_number'] or '',
                    'mcNumber': row['mc_number'] or '',
                    'yearsInBusiness': '',
                    'fleetSize': row['power_units'] or '1',
                    'radiusOfOperation': row['carrier_operation'] or '',
                    'commodityHauled': '',
                    'operatingStates': 'OH',
                    'product': 'Commercial Auto',
                    'premium': str(int(8000 + (int(row['power_units'] or 1) * 2000))),  # Estimated premium
                    'stage': 'new',
                    'status': 'Active',
                    'currentInsurer': insurance_company or '',
                    'expirationDate': expiry_date.strftime('%Y-%m-%d'),
                    'city': row['city'] or '',
                    'state': 'OH',
                    'address': row['street'] or '',
                    'zipCode': row['zip_code'] or '',
                    'entityType': row['entity_type'] or '',
                    'insuranceOnFile': '750000',
                    'insuranceRequired': '750000',
                    'policyNumber': '',
                    'source': 'Matched Carriers Database',
                    'created': datetime.now().isoformat(),
                    'createdAt': datetime.now().isoformat(),
                    'representative_name': rep_name,
                    'quality_score': 'HIGH',
                    'days_until_expiry': str(days_diff),
                    'expiry_pattern': f"{month:02d}/{day:02d}"
                }

                leads.append(lead)

            except ValueError:
                continue

    # Sort by days until expiry
    leads.sort(key=lambda x: int(x['days_until_expiry']))

    print(f"Found {len(leads)} Ohio leads for 60-day period (skipping first 5 days)")

    # Write CSV file
    if leads:
        fieldnames = [
            'id', 'name', 'contact', 'phone', 'email', 'company', 'dotNumber', 'mcNumber',
            'yearsInBusiness', 'fleetSize', 'radiusOfOperation', 'commodityHauled',
            'operatingStates', 'product', 'premium', 'stage', 'status', 'currentInsurer',
            'expirationDate', 'city', 'state', 'address', 'zipCode', 'entityType',
            'insuranceOnFile', 'insuranceRequired', 'policyNumber', 'source',
            'created', 'createdAt', 'representative_name', 'quality_score',
            'days_until_expiry', 'expiry_pattern'
        ]

        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(leads)

        print(f"✅ CSV created: {output_file}")
        print(f"📊 Total leads: {len(leads)}")

        # Show sample
        print("\n📋 SAMPLE LEADS:")
        for i, lead in enumerate(leads[:5]):
            print(f"  {i+1}. {lead['name']} (DOT: {lead['dotNumber']})")
            print(f"     Rep: {lead['representative_name']}")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📅 Expires: {lead['expiry_pattern']} ({lead['days_until_expiry']} days)")
            print()

        return output_file
    else:
        print("❌ No leads found matching criteria")
        return None

if __name__ == "__main__":
    create_ohio_60day_csv()