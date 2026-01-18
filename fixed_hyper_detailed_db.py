#!/usr/bin/env python3
"""
Fixed version: Create hyper-detailed database by matching insurance data with DOT carrier data
"""

import json
import csv
import sys
import re
from collections import defaultdict

def parse_dot_carriers_fixed(filename):
    """Parse DOT carriers JSON with improved parsing"""
    print("Parsing DOT carriers database...")
    
    dot_lookup = {}
    mc_lookup = {}
    
    record_count = 0
    
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        # Read file line by line to handle large size
        buffer = ""
        
        for line_num, line in enumerate(f):
            if line_num % 100000 == 0 and line_num > 0:
                print(f"Processed {line_num} lines, found {record_count} valid records...")
            
            # Skip the opening bracket
            if line.strip() == '[':
                continue
            # Skip the closing bracket
            if line.strip() == ']':
                continue
                
            buffer += line.strip()
            
            # Look for complete JSON objects
            if buffer.endswith('}') or buffer.endswith('},'):
                # Clean up the buffer
                json_str = buffer.rstrip(',').strip()
                
                try:
                    carrier = json.loads(json_str)
                    record_count += 1
                    
                    # Extract DOT number
                    dot_num = str(carrier.get('dot_number', '')).strip()
                    
                    # Extract MC numbers from docket fields
                    mc_numbers = []
                    for docket_field in ['docket1', 'docket2', 'docket3']:
                        docket = str(carrier.get(docket_field, '')).strip()
                        if docket and docket != 'None':
                            mc_numbers.append(docket)
                    
                    # Store in lookup dictionaries
                    if dot_num and dot_num != 'None':
                        dot_lookup[dot_num] = carrier
                        # Also try padded version
                        dot_padded = dot_num.zfill(8)
                        dot_lookup[dot_padded] = carrier
                    
                    for mc_num in mc_numbers:
                        if mc_num and mc_num != 'None':
                            mc_lookup[mc_num] = carrier
                            
                except json.JSONDecodeError as e:
                    # Try to fix common JSON issues
                    try:
                        # Handle malformed JSON
                        fixed_json = json_str.replace('""', '"')
                        carrier = json.loads(fixed_json)
                        record_count += 1
                        
                        dot_num = str(carrier.get('dot_number', '')).strip()
                        if dot_num and dot_num != 'None':
                            dot_lookup[dot_num] = carrier
                            dot_lookup[dot_num.zfill(8)] = carrier
                            
                    except:
                        continue  # Skip this record
                
                # Reset buffer
                buffer = ""
    
    print(f"Completed parsing. Found {record_count} total records")
    print(f"Indexed {len(dot_lookup)} DOT entries and {len(mc_lookup)} MC entries")
    return dot_lookup, mc_lookup

def match_insurance_data_improved(insurance_file, dot_lookup, mc_lookup):
    """Improved matching with better number handling"""
    print("Matching insurance data with carrier database...")
    
    matches = []
    no_matches = []
    
    with open(insurance_file, 'r', encoding='utf-8', errors='ignore') as f:
        csv_reader = csv.reader(f)
        
        for i, row in enumerate(csv_reader):
            if i % 10000 == 0:
                print(f"Processed {i} insurance records, found {len(matches)} matches...")
            
            if len(row) < 2:
                continue
                
            # Extract MC and DOT from insurance record
            mc_raw = row[0].strip().strip('"')
            dot_raw = row[1].strip().strip('"') if len(row) > 1 else ''
            
            # Clean MC number (remove MC prefix)
            mc_clean = re.sub(r'^MC', '', mc_raw).strip()
            
            # Clean DOT number
            dot_clean = dot_raw.strip()
            
            # Try to find match with multiple strategies
            carrier = None
            match_type = None
            
            # Strategy 1: Direct MC match
            if mc_clean in mc_lookup:
                carrier = mc_lookup[mc_clean]
                match_type = "MC_DIRECT"
            
            # Strategy 2: Direct DOT match
            elif dot_clean in dot_lookup:
                carrier = dot_lookup[dot_clean]
                match_type = "DOT_DIRECT"
            
            # Strategy 3: Padded DOT match
            elif dot_clean.isdigit():
                dot_padded = dot_clean.zfill(8)
                if dot_padded in dot_lookup:
                    carrier = dot_lookup[dot_padded]
                    match_type = "DOT_PADDED"
            
            # Strategy 4: Try removing leading zeros from DOT
            elif dot_clean.startswith('0'):
                dot_unpadded = dot_clean.lstrip('0')
                if dot_unpadded in dot_lookup:
                    carrier = dot_lookup[dot_unpadded]
                    match_type = "DOT_UNPADDED"
            
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
    
    print(f"Matching complete: {len(matches)} matches, {len(no_matches)} no matches")
    match_rate = len(matches) / (len(matches) + len(no_matches)) * 100
    print(f"Match rate: {match_rate:.1f}%")
    
    return matches, no_matches

def create_hyper_detailed_csv_improved(matches, output_file):
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
            
            def safe_get(d, key, default=''):
                """Safely get value from dict"""
                value = d.get(key, default)
                return str(value) if value is not None else default
            
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
                safe_get(carrier, 'dot_number'),
                safe_get(carrier, 'legal_name'),
                safe_get(carrier, 'dba_name'),
                safe_get(carrier, 'status_code'),
                
                # Contact
                safe_get(carrier, 'phone'),
                safe_get(carrier, 'fax'),
                safe_get(carrier, 'cell_phone'),
                safe_get(carrier, 'email_address'),
                
                # Physical address
                safe_get(carrier, 'phy_street'),
                safe_get(carrier, 'phy_city'),
                safe_get(carrier, 'phy_state'),
                safe_get(carrier, 'phy_zip'),
                safe_get(carrier, 'phy_country'),
                safe_get(carrier, 'phy_cnty'),
                
                # Mailing address
                safe_get(carrier, 'carrier_mailing_street'),
                safe_get(carrier, 'carrier_mailing_city'),
                safe_get(carrier, 'carrier_mailing_state'),
                safe_get(carrier, 'carrier_mailing_zip'),
                safe_get(carrier, 'carrier_mailing_country'),
                safe_get(carrier, 'carrier_mailing_cnty'),
                
                # Business info
                safe_get(carrier, 'business_org_desc'),
                safe_get(carrier, 'carrier_operation'),
                safe_get(carrier, 'dun_bradstreet_no'),
                safe_get(carrier, 'company_officer_1'),
                safe_get(carrier, 'company_officer_2'),
                
                # Fleet
                safe_get(carrier, 'truck_units'),
                safe_get(carrier, 'power_units'),
                safe_get(carrier, 'bus_units'),
                safe_get(carrier, 'fleetsize'),
                safe_get(carrier, 'total_drivers'),
                safe_get(carrier, 'total_cdl'),
                safe_get(carrier, 'total_intrastate_drivers'),
                safe_get(carrier, 'driver_inter_total'),
                safe_get(carrier, 'avg_drivers_leased_per_month'),
                
                # Operations
                safe_get(carrier, 'interstate_beyond_100_miles'),
                safe_get(carrier, 'interstate_within_100_miles'),
                safe_get(carrier, 'intrastate_beyond_100_miles'),
                safe_get(carrier, 'intrastate_within_100_miles'),
                
                # Safety
                safe_get(carrier, 'safety_rating'),
                safe_get(carrier, 'safety_rating_date'),
                safe_get(carrier, 'review_type'),
                safe_get(carrier, 'review_date'),
                safe_get(carrier, 'hm_ind'),
                safe_get(carrier, 'mcs150_date'),
                safe_get(carrier, 'mcs150_mileage'),
                safe_get(carrier, 'mcs150_mileage_year'),
                
                # Classification
                safe_get(carrier, 'classdef'),
                
                # Equipment
                safe_get(carrier, 'owntruck'),
                safe_get(carrier, 'owntract'),
                safe_get(carrier, 'owntrail'),
                safe_get(carrier, 'trmtract'),
                safe_get(carrier, 'trmtrail'),
                safe_get(carrier, 'trptract'),
                
                # Dockets
                safe_get(carrier, 'docket1'),
                safe_get(carrier, 'docket2'),
                safe_get(carrier, 'docket3'),
                
                # Cargo types
                safe_get(carrier, 'crgo_genfreight'),
                safe_get(carrier, 'crgo_household'),
                safe_get(carrier, 'crgo_metalsheet'),
                safe_get(carrier, 'crgo_motoveh'),
                safe_get(carrier, 'crgo_logpole'),
                safe_get(carrier, 'crgo_bldgmat'),
                safe_get(carrier, 'crgo_produce'),
                safe_get(carrier, 'crgo_livestock'),
                safe_get(carrier, 'crgo_grainfeed'),
                safe_get(carrier, 'crgo_coldfood'),
                safe_get(carrier, 'crgo_beverages'),
                safe_get(carrier, 'crgo_chem')
            ]
            
            writer.writerow(row)

def main():
    print("ENHANCED HYPER-DETAILED DATABASE CREATION")
    print("=========================================")
    
    # Parse DOT carrier database with improved method
    dot_lookup, mc_lookup = parse_dot_carriers_fixed('dot_carriers_full.json')
    
    # Match with insurance data using improved matching
    matches, no_matches = match_insurance_data_improved('final_deduplicated_leads.txt', dot_lookup, mc_lookup)
    
    # Create hyper-detailed database
    create_hyper_detailed_csv_improved(matches, 'hyper_detailed_insurance_carriers_v2.csv')
    
    # Create unmatched records file
    with open('unmatched_insurance_records_v2.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['mc', 'dot', 'insurance_record'])
        for record in no_matches:
            writer.writerow([record['mc'], record['dot'], '|'.join(record['insurance_data'])])
    
    print(f"\nENHANCED PROCESSING COMPLETE!")
    print(f"==============================")
    print(f"Hyper-detailed database: hyper_detailed_insurance_carriers_v2.csv ({len(matches)} records)")
    print(f"Unmatched records: unmatched_insurance_records_v2.csv ({len(no_matches)} records)")
    
    if len(matches) + len(no_matches) > 0:
        match_rate = len(matches) / (len(matches) + len(no_matches)) * 100
        print(f"Final match rate: {match_rate:.1f}%")
    
    # Show sample match types
    if matches:
        match_types = {}
        for match in matches:
            match_type = match['match_type']
            match_types[match_type] = match_types.get(match_type, 0) + 1
        
        print(f"\nMatch breakdown:")
        for mt, count in match_types.items():
            print(f"  {mt}: {count} records")

if __name__ == "__main__":
    main()
