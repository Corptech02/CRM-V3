#!/usr/bin/env python3
"""
Fast version: Process smaller chunks and show immediate results
"""

import json
import csv
import sys
import re
from collections import defaultdict

def quick_sample_match(insurance_file, carrier_file, sample_size=10000):
    """Quick sample matching to show immediate results"""
    print(f"QUICK SAMPLE PROCESSING ({sample_size} records)...")
    print("=" * 50)
    
    # Quick parse of first N carrier records
    print("Parsing sample carrier records...")
    dot_lookup = {}
    mc_lookup = {}
    
    with open(carrier_file, 'r', encoding='utf-8', errors='ignore') as f:
        count = 0
        for line in f:
            if count >= sample_size:
                break
            
            if line.strip() in ['[', ']']:
                continue
                
            try:
                # Clean and parse JSON
                clean_line = line.strip().rstrip(',')
                if clean_line:
                    carrier = json.loads(clean_line)
                    
                    # Index by DOT
                    dot_num = str(carrier.get('dot_number', '')).strip()
                    if dot_num:
                        dot_lookup[dot_num] = carrier
                        dot_lookup[dot_num.zfill(8)] = carrier
                    
                    # Index by MC from dockets
                    for docket_field in ['docket1', 'docket2']:
                        docket = str(carrier.get(docket_field, '')).strip()
                        if docket and docket != 'None':
                            mc_lookup[docket] = carrier
                    
                    count += 1
                    if count % 1000 == 0:
                        print(f"  Parsed {count} carriers...")
                        
            except:
                continue
    
    print(f"Sample indexed: {len(dot_lookup)} DOT entries, {len(mc_lookup)} MC entries")
    
    # Quick match with insurance data
    print("Matching with insurance data...")
    matches = []
    
    with open(insurance_file, 'r', encoding='utf-8', errors='ignore') as f:
        csv_reader = csv.reader(f)
        
        for i, row in enumerate(csv_reader):
            if i >= sample_size:  # Limit insurance records too
                break
                
            if len(row) < 2:
                continue
                
            mc_raw = row[0].strip().strip('"')
            dot_raw = row[1].strip().strip('"') if len(row) > 1 else ''
            
            # Clean numbers
            mc_clean = re.sub(r'^MC', '', mc_raw).strip()
            dot_clean = dot_raw.strip()
            
            # Try to match
            carrier = None
            match_type = None
            
            if mc_clean in mc_lookup:
                carrier = mc_lookup[mc_clean]
                match_type = "MC"
            elif dot_clean in dot_lookup:
                carrier = dot_lookup[dot_clean]
                match_type = "DOT"
            elif dot_clean.zfill(8) in dot_lookup:
                carrier = dot_lookup[dot_clean.zfill(8)]
                match_type = "DOT_PAD"
            
            if carrier:
                matches.append({
                    'match_type': match_type,
                    'insurance_mc': mc_raw,
                    'insurance_dot': dot_raw,
                    'insurance_data': row,
                    'carrier_data': carrier
                })
            
            if i % 1000 == 0 and i > 0:
                print(f"  Processed {i} insurance records, {len(matches)} matches...")
    
    print(f"\nSAMPLE RESULTS:")
    print(f"  Insurance records: {i+1}")
    print(f"  Matches found: {len(matches)}")
    if i > 0:
        print(f"  Sample match rate: {len(matches)/(i+1)*100:.1f}%")
    
    return matches

def create_sample_csv(matches, output_file):
    """Create sample CSV with key fields"""
    print(f"Creating sample database: {output_file}")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Key fields header
        header = [
            'match_type', 'ins_mc', 'ins_dot', 'ins_company', 'ins_policy', 'ins_expiration',
            'carrier_dot', 'carrier_legal_name', 'carrier_dba', 'carrier_phone', 'carrier_email',
            'carrier_street', 'carrier_city', 'carrier_state', 'carrier_zip',
            'fleet_trucks', 'fleet_drivers', 'safety_rating', 'business_type'
        ]
        writer.writerow(header)
        
        for match in matches:
            carrier = match['carrier_data']
            ins_data = match['insurance_data']
            
            # Pad insurance data
            while len(ins_data) < 11:
                ins_data.append('')
            
            row = [
                match['match_type'],
                match['insurance_mc'],
                match['insurance_dot'],
                ins_data[4] if len(ins_data) > 4 else '',  # Insurance company
                ins_data[5] if len(ins_data) > 5 else '',  # Policy
                ins_data[6] if len(ins_data) > 6 else '',  # Expiration
                
                carrier.get('dot_number', ''),
                carrier.get('legal_name', ''),
                carrier.get('dba_name', ''),
                carrier.get('phone', ''),
                carrier.get('email_address', ''),
                carrier.get('phy_street', ''),
                carrier.get('phy_city', ''),
                carrier.get('phy_state', ''),
                carrier.get('phy_zip', ''),
                carrier.get('truck_units', ''),
                carrier.get('total_drivers', ''),
                carrier.get('safety_rating', ''),
                carrier.get('business_org_desc', '')
            ]
            
            writer.writerow(row)

def main():
    print("FAST SAMPLE HYPER-DETAILED DATABASE")
    print("====================================")
    
    # Process sample to show immediate results
    matches = quick_sample_match('final_deduplicated_leads.txt', 'dot_carriers_full.json', 50000)
    
    if matches:
        create_sample_csv(matches, 'sample_hyper_detailed_v3.csv')
        
        print(f"\nSAMPLE COMPLETE!")
        print(f"File: sample_hyper_detailed_v3.csv")
        print(f"Records: {len(matches)}")
        
        # Show sample match types
        match_types = {}
        for match in matches:
            mt = match['match_type']
            match_types[mt] = match_types.get(mt, 0) + 1
        
        print(f"\nMatch types:")
        for mt, count in match_types.items():
            print(f"  {mt}: {count}")
            
        # Show sample records
        print(f"\nSample matched companies:")
        for i, match in enumerate(matches[:5]):
            carrier = match['carrier_data']
            print(f"  {i+1}. {carrier.get('legal_name', 'N/A')} ({carrier.get('phy_state', 'N/A')})")
    
    else:
        print("No matches found in sample - may need to adjust matching logic")

if __name__ == "__main__":
    main()
