#!/usr/bin/env python3
"""
Optimized version: Memory-efficient streaming processing
"""

import json
import csv
import sys
import re
from collections import defaultdict

def stream_process_carriers_and_match(carrier_file, insurance_file, output_file):
    """Stream process both files simultaneously to save memory"""
    print("OPTIMIZED HYPER-DETAILED DATABASE CREATION")
    print("==========================================")
    
    # First pass: Load insurance data (smaller file)
    print("Loading insurance data...")
    insurance_records = []
    insurance_by_mc = {}
    insurance_by_dot = {}
    
    with open(insurance_file, 'r', encoding='utf-8', errors='ignore') as f:
        csv_reader = csv.reader(f)
        
        for i, row in enumerate(csv_reader):
            if i % 50000 == 0 and i > 0:
                print(f"  Loaded {i} insurance records...")
            
            if len(row) < 2:
                continue
                
            mc_raw = row[0].strip().strip('"')
            dot_raw = row[1].strip().strip('"') if len(row) > 1 else ''
            
            # Clean numbers for matching
            mc_clean = re.sub(r'^MC', '', mc_raw).strip()
            dot_clean = dot_raw.strip()
            
            record = {
                'index': i,
                'mc_raw': mc_raw,
                'dot_raw': dot_raw,
                'mc_clean': mc_clean,
                'dot_clean': dot_clean,
                'data': row
            }
            
            insurance_records.append(record)
            
            # Index by cleaned numbers
            if mc_clean:
                insurance_by_mc[mc_clean] = record
            if dot_clean:
                insurance_by_dot[dot_clean] = record
                if dot_clean.isdigit():
                    insurance_by_dot[dot_clean.zfill(8)] = record
    
    print(f"Loaded {len(insurance_records)} insurance records")
    print(f"Indexed {len(insurance_by_mc)} by MC, {len(insurance_by_dot)} by DOT")
    
    # Second pass: Stream through carriers and match
    print("Streaming through carrier data and matching...")
    
    matches = []
    carrier_count = 0
    
    with open(output_file, 'w', newline='', encoding='utf-8') as out_f:
        writer = csv.writer(out_f)
        
        # Write header
        header = [
            'match_type', 'ins_mc', 'ins_dot', 'ins_company', 'ins_policy', 'ins_expiration',
            'ins_amount1', 'ins_amount2', 'ins_effective_date', 'ins_renewal_date',
            'carrier_dot', 'carrier_legal_name', 'carrier_dba', 'carrier_phone', 'carrier_email',
            'carrier_street', 'carrier_city', 'carrier_state', 'carrier_zip',
            'carrier_mail_street', 'carrier_mail_city', 'carrier_mail_state', 'carrier_mail_zip',
            'business_org', 'carrier_operation', 'company_officer_1', 'company_officer_2',
            'fleet_trucks', 'fleet_drivers', 'fleet_cdl', 'safety_rating', 'safety_date',
            'docket1', 'docket2', 'docket3', 'mcs150_date', 'mcs150_mileage'
        ]
        writer.writerow(header)
        
        with open(carrier_file, 'r', encoding='utf-8', errors='ignore') as carrier_f:
            buffer = ""
            
            for line_num, line in enumerate(carrier_f):
                if line_num % 100000 == 0 and line_num > 0:
                    print(f"  Processed {line_num} carrier lines, found {len(matches)} matches...")
                
                # Skip brackets
                if line.strip() in ['[', ']']:
                    continue
                
                buffer += line.strip()
                
                # Process complete JSON objects
                if buffer.endswith('}') or buffer.endswith('},'):
                    json_str = buffer.rstrip(',').strip()
                    
                    try:
                        carrier = json.loads(json_str)
                        carrier_count += 1
                        
                        # Extract carrier identifiers
                        dot_num = str(carrier.get('dot_number', '')).strip()
                        
                        # Check for matches
                        matched_insurance = None
                        match_type = None
                        
                        # Try DOT match first (most reliable)
                        if dot_num and dot_num in insurance_by_dot:
                            matched_insurance = insurance_by_dot[dot_num]
                            match_type = "DOT"
                        elif dot_num and dot_num.zfill(8) in insurance_by_dot:
                            matched_insurance = insurance_by_dot[dot_num.zfill(8)]
                            match_type = "DOT_PAD"
                        else:
                            # Try MC matches from docket fields
                            for docket_field in ['docket1', 'docket2', 'docket3']:
                                docket = str(carrier.get(docket_field, '')).strip()
                                if docket and docket in insurance_by_mc:
                                    matched_insurance = insurance_by_mc[docket]
                                    match_type = f"MC_{docket_field.upper()}"
                                    break
                        
                        if matched_insurance:
                            # Create combined record
                            ins_data = matched_insurance['data']
                            
                            # Pad insurance data
                            while len(ins_data) < 11:
                                ins_data.append('')
                            
                            def safe_get(d, key, default=''):
                                value = d.get(key, default)
                                return str(value) if value is not None else default
                            
                            combined_row = [
                                match_type,
                                matched_insurance['mc_raw'],
                                matched_insurance['dot_raw'],
                                ins_data[4] if len(ins_data) > 4 else '',  # Insurance company
                                ins_data[5] if len(ins_data) > 5 else '',  # Policy
                                ins_data[6] if len(ins_data) > 6 else '',  # Expiration
                                ins_data[7] if len(ins_data) > 7 else '',  # Amount 1
                                ins_data[8] if len(ins_data) > 8 else '',  # Amount 2
                                ins_data[9] if len(ins_data) > 9 else '',  # Effective
                                ins_data[10] if len(ins_data) > 10 else '', # Renewal
                                
                                safe_get(carrier, 'dot_number'),
                                safe_get(carrier, 'legal_name'),
                                safe_get(carrier, 'dba_name'),
                                safe_get(carrier, 'phone'),
                                safe_get(carrier, 'email_address'),
                                safe_get(carrier, 'phy_street'),
                                safe_get(carrier, 'phy_city'),
                                safe_get(carrier, 'phy_state'),
                                safe_get(carrier, 'phy_zip'),
                                safe_get(carrier, 'carrier_mailing_street'),
                                safe_get(carrier, 'carrier_mailing_city'),
                                safe_get(carrier, 'carrier_mailing_state'),
                                safe_get(carrier, 'carrier_mailing_zip'),
                                safe_get(carrier, 'business_org_desc'),
                                safe_get(carrier, 'carrier_operation'),
                                safe_get(carrier, 'company_officer_1'),
                                safe_get(carrier, 'company_officer_2'),
                                safe_get(carrier, 'truck_units'),
                                safe_get(carrier, 'total_drivers'),
                                safe_get(carrier, 'total_cdl'),
                                safe_get(carrier, 'safety_rating'),
                                safe_get(carrier, 'safety_rating_date'),
                                safe_get(carrier, 'docket1'),
                                safe_get(carrier, 'docket2'),
                                safe_get(carrier, 'docket3'),
                                safe_get(carrier, 'mcs150_date'),
                                safe_get(carrier, 'mcs150_mileage')
                            ]
                            
                            writer.writerow(combined_row)
                            matches.append(match_type)
                        
                    except json.JSONDecodeError:
                        pass  # Skip malformed records
                    
                    buffer = ""
    
    print(f"\nOPTIMIZED PROCESSING COMPLETE!")
    print(f"==============================")
    print(f"Carrier records processed: {carrier_count}")
    print(f"Total matches found: {len(matches)}")
    print(f"Output file: {output_file}")
    
    if len(matches) > 0:
        match_rate = len(matches) / len(insurance_records) * 100
        print(f"Match rate: {match_rate:.1f}%")
        
        # Show match type breakdown
        match_types = {}
        for mt in matches:
            match_types[mt] = match_types.get(mt, 0) + 1
        
        print(f"\nMatch breakdown:")
        for mt, count in match_types.items():
            print(f"  {mt}: {count} records")

def main():
    stream_process_carriers_and_match(
        'dot_carriers_full.json',
        'final_deduplicated_leads.txt',
        'hyper_detailed_final.csv'
    )

if __name__ == "__main__":
    main()
