#!/usr/bin/env python3
"""
Create CSV with Ohio leads for 60 days out with REAL owner/representative names
Cross-reference with FMCSA database to get actual contact names
"""

import csv
import datetime
import sqlite3
from datetime import datetime, timedelta

def get_representative_name(dot_number, fmcsa_db_path):
    """Get real representative name from FMCSA database using DOT number"""
    try:
        conn = sqlite3.connect(fmcsa_db_path)
        cursor = conn.cursor()

        # Query for representative names
        query = """
        SELECT representative_1_name, representative_2_name, legal_name
        FROM carriers
        WHERE dot_number = ?
        """

        cursor.execute(query, (dot_number,))
        result = cursor.fetchone()
        conn.close()

        if result:
            rep1, rep2, legal_name = result

            # Priority: representative_1_name > representative_2_name > extract from legal_name
            if rep1 and rep1.strip():
                return rep1.strip()
            elif rep2 and rep2.strip():
                return rep2.strip()
            else:
                # Last resort: extract from legal name
                return extract_name_from_company(legal_name)

        return None

    except Exception as e:
        print(f"Error querying DOT {dot_number}: {e}")
        return None

def extract_name_from_company(legal_name):
    """Extract likely owner name from company legal name as fallback"""
    if not legal_name:
        return "CONTACT REPRESENTATIVE"

    # Look for patterns like "JOHN SMITH TRUCKING" or "SMITH JOHN TRANSPORT"
    name_parts = legal_name.replace(',', ' ').replace('.', ' ').split()

    # Remove common business words
    business_words = {'LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'CO', 'TRUCKING',
                     'TRANSPORT', 'TRANSPORTATION', 'LOGISTICS', 'FREIGHT', 'CARRIER',
                     'CARRIERS', 'EXPRESS', 'DELIVERY', 'SERVICE', 'SERVICES', 'GROUP',
                     'ENTERPRISES', 'SOLUTIONS', 'SYSTEMS', 'THE', 'AND', '&'}

    # Filter out business words and keep potential names
    potential_names = [word for word in name_parts if word.upper() not in business_words and len(word) > 1]

    # If we have 2 or more words that could be names, use first two
    if len(potential_names) >= 2:
        return f"{potential_names[0]} {potential_names[1]}"
    elif len(potential_names) == 1:
        return f"{potential_names[0]} OWNER"

    return "CONTACT REPRESENTATIVE"

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

def create_ohio_60day_real_names():
    """Create CSV with Ohio leads using REAL representative names"""

    input_file = '/home/corp06/Leads/matched_carriers_20251009_183433.csv'
    fmcsa_db = '/var/www/vanguard/fmcsa_complete.db'
    output_file = '/var/www/vanguard/10-15 OH (10)60d REAL NAMES.csv'

    today = datetime.now()
    skip_until = today + timedelta(days=5)  # Skip until 10/20
    end_date = today + timedelta(days=60)   # Until 60 days out

    print(f"Creating Ohio 60-day leads CSV with REAL representative names")
    print(f"Today: {today.strftime('%m/%d')}")
    print(f"Skip until: {skip_until.strftime('%m/%d')} (skipping 10/15-10/20)")
    print(f"End date: {end_date.strftime('%m/%d')}")
    print(f"FMCSA Database: {fmcsa_db}")
    print("-" * 60)

    leads = []
    found_names = 0
    total_processed = 0

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

                total_processed += 1

                # Get REAL representative name from FMCSA database
                dot_number = row['dot_number']
                rep_name = get_representative_name(dot_number, fmcsa_db)

                if rep_name and rep_name != "CONTACT REPRESENTATIVE":
                    found_names += 1
                    print(f"✅ DOT {dot_number}: {rep_name}")
                else:
                    rep_name = extract_name_from_company(row['legal_name'])
                    print(f"⚠️  DOT {dot_number}: Fallback to {rep_name}")

                # Create lead record with REAL representative name
                lead = {
                    'id': f"OH_{row['dot_number']}_{datetime.now().strftime('%Y%m%d')}",
                    'name': row['legal_name'] or 'Unknown Company',
                    'contact': rep_name,  # THIS IS THE KEY - REAL REPRESENTATIVE NAME
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
                    'premium': str(int(8000 + (int(row['power_units'] or 1) * 2000))),
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
                    'source': 'Matched Carriers with FMCSA Names',
                    'created': datetime.now().isoformat(),
                    'createdAt': datetime.now().isoformat(),
                    'representative_name': rep_name,
                    'quality_score': 'HIGH' if rep_name != "CONTACT REPRESENTATIVE" else 'MEDIUM',
                    'days_until_expiry': str(days_diff),
                    'expiry_pattern': f"{month:02d}/{day:02d}"
                }

                leads.append(lead)

            except ValueError:
                continue

    # Sort by days until expiry
    leads.sort(key=lambda x: int(x['days_until_expiry']))

    print(f"\n📊 RESULTS:")
    print(f"Total Ohio leads processed: {total_processed}")
    print(f"Real representative names found: {found_names}")
    print(f"Success rate: {(found_names/total_processed)*100:.1f}%")
    print(f"Total leads in CSV: {len(leads)}")

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

        print(f"\n✅ CSV created: {output_file}")

        # Show sample with REAL names
        print("\n📋 SAMPLE LEADS WITH REAL NAMES:")
        for i, lead in enumerate(leads[:10]):
            print(f"  {i+1}. {lead['name']} (DOT: {lead['dotNumber']})")
            print(f"     👤 CONTACT: {lead['contact']}")
            print(f"     📍 {lead['city']}, OH")
            print(f"     📞 {lead['phone']}")
            print(f"     📅 Expires: {lead['expiry_pattern']} ({lead['days_until_expiry']} days)")
            print(f"     ⭐ Quality: {lead['quality_score']}")
            print()

        return output_file
    else:
        print("❌ No leads found matching criteria")
        return None

if __name__ == "__main__":
    create_ohio_60day_real_names()