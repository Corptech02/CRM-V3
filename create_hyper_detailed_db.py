#!/usr/bin/env python3
"""
Create hyper-detailed database by matching insurance data with DOT carrier data
"""

import json
import csv
import sys
import re
from collections import defaultdict

def parse_dot_carriers(filename):
    """Parse DOT carriers JSON and create lookup dictionaries"""
    print("Parsing DOT carriers database...")
    
    dot_lookup = {}
    mc_lookup = {}
    
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        # Read the file in chunks to handle the large size
        content = f.read()
        
        # Remove the outer array brackets
        content = content.strip()
        if content.startswith('['):
            content = content[1:]
        if content.endswith(']'):
            content = content[:-1]
        
        # Split by },{ to get individual records
        records = content.split('},{')
        
        print(f"Processing {len(records)} carrier records...")
        
        for i, record in enumerate(records):
            if i % 50000 == 0:
                print(f"Processed {i} records...")
            
            # Fix JSON format
            if not record.startswith('{'):
                record = '{' + record
            if not record.endswith('}'):
                record = record + '}'
            
            try:
                carrier = json.loads(record)
                
                # Extract DOT number
                dot_num = carrier.get('dot_number', '').strip()
                
                # Extract MC numbers from docket fields
                mc_numbers = []
                for docket_field in ['docket1', 'docket2', 'docket3']:
                    docket = carrier.get(docket_field, '')
                    if docket:
                        mc_numbers.append(docket.strip())
                
                # Store in lookup dictionaries
                if dot_num:
                    dot_lookup[dot_num] = carrier
                
                for mc_num in mc_numbers:
                    if mc_num:
                        mc_lookup[mc_num] = carrier
                        
            except json.JSONDecodeError as e:
                continue  # Skip malformed records
    
    print(f"Indexed {len(dot_lookup)} DOT numbers and {len(mc_lookup)} MC numbers")
    return dot_lookup, mc_lookup

def match_insurance_data(insurance_file, dot_lookup, mc_lookup):
    """Match insurance data with carrier data"""
    print("Matching insurance data with carrier database...")
    
    matches = []
    no_matches = []
    
    with open(insurance_file, 'r', encoding='utf-8', errors='ignore') as f:
        csv_reader = csv.reader(f)
        
        for i, row in enumerate(csv_reader):
            if i % 10000 == 0:
                print(f"Processed {i} insurance records...")
            
            if len(row) < 2:
                continue
                
            # Extract MC and DOT from insurance record
            mc_raw = row[0].strip().strip('"')
            dot_raw = row[1].strip().strip('"') if len(row) > 1 else ''
            
            # Clean MC number (remove MC prefix)
            mc_clean = re.sub(r'^MC', '', mc_raw).strip()
            
            # Clean DOT number (pad with zeros if needed)
            dot_clean = dot_raw.zfill(8) if dot_raw.isdigit() else dot_raw
            
            # Try to find match
            carrier = None
            match_type = None
            
            # Try MC number match first
            if mc_clean in mc_lookup:
                carrier = mc_lookup[mc_clean]
                match_type = "MC"
            # Try DOT number match
            elif dot_clean in dot_lookup:
                carrier = dot_lookup[dot_clean]
                match_type = "DOT"
            # Try original DOT format
            elif dot_raw in dot_lookup:
                carrier = dot_lookup[dot_raw]
                match_type = "DOT"
            
            if carrier:
                # Combine insurance and carrier data
                combined_record = {
                    'match_type': match_type,
                    'insurance_mc': mc_raw,
                    'insurance_dot': dot_raw,
                    'insurance_data': row,
                    'carrier_data': carrier
                }
                matches.append(combined_record)
            else:
                no_matches.append({
                    'mc': mc_raw,
                    'dot': dot_raw,
                    'insurance_data': row
                })
    
    print(f"Found {len(matches)} matches, {len(no_matches)} no matches")
    return matches, no_matches

def create_hyper_detailed_csv(matches, output_file):
    """Create comprehensive CSV with all available data"""
    print("Creating hyper-detailed database...")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write comprehensive header
        header = [
            # Match info
            'match_type', 'insurance_mc', 'insurance_dot',
            
            # Insurance data (from original columns)
            'ins_mc', 'ins_dot', 'ins_coverage_type', 'ins_coverage_desc',
            'ins_company', 'ins_policy_num', 'ins_expiration_date',
            'ins_amount1', 'ins_amount2', 'ins_effective_date', 'ins_renewal_date',
            
            # Carrier basic info
            'dot_number', 'legal_name', 'dba_name', 'status_code',
            
            # Contact information
            'phone', 'fax', 'cell_phone', 'email_address',
            
            # Physical address
            'phy_street', 'phy_city', 'phy_state', 'phy_zip', 'phy_country', 'phy_cnty',
            
            # Mailing address
            'mail_street', 'mail_city', 'mail_state', 'mail_zip', 'mail_country', 'mail_cnty',
            
            # Business information
            'business_org_desc', 'carrier_operation', 'dun_bradstreet_no',
            'company_officer_1', 'company_officer_2',
            
            # Fleet information
            'truck_units', 'power_units', 'bus_units', 'fleetsize',
            'total_drivers', 'total_cdl', 'total_intrastate_drivers',
            'driver_inter_total', 'avg_drivers_leased_per_month',
            
            # Operations
            'interstate_beyond_100_miles', 'interstate_within_100_miles',
            'intrastate_beyond_100_miles', 'intrastate_within_100_miles',
            
            # Safety and compliance
            'safety_rating', 'safety_rating_date', 'review_type', 'review_date',
            'hm_ind', 'mcs150_date', 'mcs150_mileage', 'mcs150_mileage_year',
            
            # Classification
            'classdef',
            
            # Equipment
            'owntruck', 'owntract', 'owntrail', 'trmtract', 'trmtrail', 'trptract',
            
            # Additional MC/Docket info
            'docket1', 'docket2', 'docket3',
            
            # Cargo types (sample key ones)
            'crgo_genfreight', 'crgo_household', 'crgo_metalsheet', 'crgo_motoveh',
            'crgo_logpole', 'crgo_bldgmat', 'crgo_produce', 'crgo_livestock',
            'crgo_grainfeed', 'crgo_coldfood', 'crgo_beverages', 'crgo_chem'
        ]
        
        writer.writerow(header)
        
        # Write data rows
        for match in matches:
            carrier = match['carrier_data']
            ins_data = match['insurance_data']
            
            # Pad insurance data to handle variable lengths
            while len(ins_data) < 11:
                ins_data.append('')
            
            row = [
                # Match info
                match['match_type'], match['insurance_mc'], match['insurance_dot'],
                
                # Insurance data
                ins_data[0] if len(ins_data) > 0 else '',  # MC
                ins_data[1] if len(ins_data) > 1 else '',  # DOT
                ins_data[2] if len(ins_data) > 2 else '',  # Coverage type
                ins_data[3] if len(ins_data) > 3 else '',  # Coverage desc
                ins_data[4] if len(ins_data) > 4 else '',  # Insurance company
                ins_data[5] if len(ins_data) > 5 else '',  # Policy number
                ins_data[6] if len(ins_data) > 6 else '',  # Expiration date
                ins_data[7] if len(ins_data) > 7 else '',  # Amount 1
                ins_data[8] if len(ins_data) > 8 else '',  # Amount 2
                ins_data[9] if len(ins_data) > 9 else '',  # Effective date
                ins_data[10] if len(ins_data) > 10 else '', # Renewal date
                
                # Carrier data
                carrier.get('dot_number', ''),
                carrier.get('legal_name', ''),
                carrier.get('dba_name', ''),
                carrier.get('status_code', ''),
                
                # Contact
                carrier.get('phone', ''),
                carrier.get('fax', ''),
                carrier.get('cell_phone', ''),
                carrier.get('email_address', ''),
                
                # Physical address
                carrier.get('phy_street', ''),
                carrier.get('phy_city', ''),
                carrier.get('phy_state', ''),
                carrier.get('phy_zip', ''),
                carrier.get('phy_country', ''),
                carrier.get('phy_cnty', ''),
                
                # Mailing address
                carrier.get('carrier_mailing_street', ''),
                carrier.get('carrier_mailing_city', ''),
                carrier.get('carrier_mailing_state', ''),
                carrier.get('carrier_mailing_zip', ''),
                carrier.get('carrier_mailing_country', ''),
                carrier.get('carrier_mailing_cnty', ''),
                
                # Business info
                carrier.get('business_org_desc', ''),
                carrier.get('carrier_operation', ''),
                carrier.get('dun_bradstreet_no', ''),
                carrier.get('company_officer_1', ''),
                carrier.get('company_officer_2', ''),
                
                # Fleet
                carrier.get('truck_units', ''),
                carrier.get('power_units', ''),
                carrier.get('bus_units', ''),
                carrier.get('fleetsize', ''),
                carrier.get('total_drivers', ''),
                carrier.get('total_cdl', ''),
                carrier.get('total_intrastate_drivers', ''),
                carrier.get('driver_inter_total', ''),
                carrier.get('avg_drivers_leased_per_month', ''),
                
                # Operations
                carrier.get('interstate_beyond_100_miles', ''),
                carrier.get('interstate_within_100_miles', ''),
                carrier.get('intrastate_beyond_100_miles', ''),
                carrier.get('intrastate_within_100_miles', ''),
                
                # Safety
                carrier.get('safety_rating', ''),
                carrier.get('safety_rating_date', ''),
                carrier.get('review_type', ''),
                carrier.get('review_date', ''),
                carrier.get('hm_ind', ''),
                carrier.get('mcs150_date', ''),
                carrier.get('mcs150_mileage', ''),
                carrier.get('mcs150_mileage_year', ''),
                
                # Classification
                carrier.get('classdef', ''),
                
                # Equipment
                carrier.get('owntruck', ''),
                carrier.get('owntract', ''),
                carrier.get('owntrail', ''),
                carrier.get('trmtract', ''),
                carrier.get('trmtrail', ''),
                carrier.get('trptract', ''),
                
                # Dockets
                carrier.get('docket1', ''),
                carrier.get('docket2', ''),
                carrier.get('docket3', ''),
                
                # Cargo types
                carrier.get('crgo_genfreight', ''),
                carrier.get('crgo_household', ''),
                carrier.get('crgo_metalsheet', ''),
                carrier.get('crgo_motoveh', ''),
                carrier.get('crgo_logpole', ''),
                carrier.get('crgo_bldgmat', ''),
                carrier.get('crgo_produce', ''),
                carrier.get('crgo_livestock', ''),
                carrier.get('crgo_grainfeed', ''),
                carrier.get('crgo_coldfood', ''),
                carrier.get('crgo_beverages', ''),
                carrier.get('crgo_chem', '')
            ]
            
            writer.writerow(row)

def main():
    # Parse DOT carrier database
    dot_lookup, mc_lookup = parse_dot_carriers('dot_carriers_full.json')
    
    # Match with insurance data
    matches, no_matches = match_insurance_data('final_deduplicated_leads.txt', dot_lookup, mc_lookup)
    
    # Create hyper-detailed database
    create_hyper_detailed_csv(matches, 'hyper_detailed_insurance_carriers.csv')
    
    # Create unmatched records file
    with open('unmatched_insurance_records.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['mc', 'dot', 'insurance_record'])
        for record in no_matches:
            writer.writerow([record['mc'], record['dot'], '|'.join(record['insurance_data'])])
    
    print(f"\nCOMPLETE!")
    print(f"Hyper-detailed database: hyper_detailed_insurance_carriers.csv ({len(matches)} records)")
    print(f"Unmatched records: unmatched_insurance_records.csv ({len(no_matches)} records)")
    print(f"Match rate: {len(matches) / (len(matches) + len(no_matches)) * 100:.1f}%")

if __name__ == "__main__":
    main()
