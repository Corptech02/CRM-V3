#!/usr/bin/env python3
"""
FAST Matched Carriers Leads API - Optimized for Speed
Pre-processes and caches data for instant filtering
"""

import csv
import re
import json
import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

CSV_PATH = '/home/corp06/matched_carriers_20251009_183433.csv'
CACHE_FILE = '/tmp/matched_carriers_cache.json'

# Global cache for preprocessed data
CARRIERS_CACHE = None

def extract_expiration_date(insurance_record):
    """Extract the expiration/renewal date from insurance record"""
    if not insurance_record:
        return None

    # Split insurance record by pipe
    parts = insurance_record.split('|')

    if len(parts) >= 10:
        # Try the second to last field first (typically expiration)
        expiration_str = parts[-2].strip()

        # If that's empty or not a date, try the last field
        if not expiration_str or not is_date_like(expiration_str):
            expiration_str = parts[-1].strip()

        # Parse the date
        return parse_date(expiration_str)

    return None

def is_date_like(date_str):
    """Check if string looks like a date"""
    if not date_str:
        return False

    # Look for date patterns MM/DD/YYYY or MM-DD-YYYY
    date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{4}'
    return bool(re.match(date_pattern, date_str))

def parse_date(date_str):
    """Parse date string into datetime object"""
    if not date_str:
        return None

    date_str = date_str.strip()

    date_formats = [
        '%m/%d/%Y',
        '%m-%d-%Y',
        '%Y-%m-%d',
        '%m/%d/%y',
        '%m-%d-%y'
    ]

    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    return None

def load_and_cache_carriers():
    """Load carriers data into memory cache for fast filtering"""
    global CARRIERS_CACHE

    if CARRIERS_CACHE is not None:
        return CARRIERS_CACHE

    print("Loading carriers into memory cache...")
    carriers = []

    with open(CSV_PATH, 'r') as file:
        reader = csv.DictReader(file)

        for row in reader:
            # Extract expiration date
            insurance_record = row.get('insurance_record', '')
            expiration_date = extract_expiration_date(insurance_record)

            if not expiration_date:
                continue

            # Extract insurance details
            insurance_parts = insurance_record.split('|') if insurance_record else []

            # Build optimized carrier record
            carrier = {
                'mc_number': row.get('mc_number', '').strip(),
                'dot_number': row.get('fmcsa_dot_number', '') or row.get('dot_number', ''),
                'legal_name': row.get('legal_name', '').strip(),
                'dba_name': row.get('dba_name', '').strip(),
                'city': row.get('city', '').strip(),
                'state': row.get('state', '').strip().upper(),
                'phone': row.get('phone', '').strip(),
                'email_address': row.get('email_address', '').strip(),
                'operating_status': row.get('operating_status', '').strip(),
                'power_units': int(row.get('power_units', 0) or 0),
                'drivers': int(row.get('drivers', 0) or 0),
                'insurance_carrier': insurance_parts[4] if len(insurance_parts) > 4 else '',
                'policy_number': insurance_parts[5] if len(insurance_parts) > 5 else '',
                'renewal_date': expiration_date.strftime('%Y-%m-%d'),
                'renewal_date_formatted': expiration_date.strftime('%m/%d/%Y'),
                'days_until_renewal': (expiration_date.date() - datetime.now().date()).days,
                'estimated_premium': (int(row.get('power_units', 1) or 1)) * 3500,
                'lead_score': calculate_lead_score_fast(row, expiration_date),
                'insurance_record': insurance_record
            }

            carriers.append(carrier)

    CARRIERS_CACHE = carriers
    print(f"✅ Loaded {len(carriers)} carriers into cache")
    return carriers

def calculate_lead_score_fast(row, expiration_date):
    """Fast lead score calculation"""
    score = 40  # Base score

    # Contact info
    if row.get('email_address', '').strip() and '@' in row.get('email_address', ''):
        score += 25
    if row.get('phone', '').strip():
        score += 20

    # Fleet size
    try:
        power_units = int(row.get('power_units', 0) or 0)
        if power_units > 10:
            score += 15
        elif power_units > 0:
            score += 10
    except:
        pass

    return min(score, 100)

@app.route('/api/matched-carriers-leads', methods=['GET'])
def get_matched_carriers_leads():
    """
    Fast filtered leads from cached carriers data
    """
    try:
        # Load cache if needed
        carriers = load_and_cache_carriers()

        # Get query parameters
        state = request.args.get('state', '').strip().upper()
        insurance_companies = request.args.get('insurance_companies', '')
        limit = int(request.args.get('limit', 1000))

        # Parse insurance companies
        insurance_company_list = []
        if insurance_companies:
            insurance_company_list = [c.strip().upper() for c in insurance_companies.split(',') if c.strip()]

        print(f"🔍 Filtering {len(carriers)} carriers: state={state}, insurance={insurance_company_list}")

        # Fast in-memory filtering
        filtered_leads = []

        for carrier in carriers:
            # State filter
            if state and carrier['state'] != state:
                continue

            # Insurance company filter
            if insurance_company_list:
                insurance_company = carrier['insurance_carrier'].upper()

                company_match = False
                for company in insurance_company_list:
                    if (company in insurance_company or
                        (company == 'PROGRESSIVE' and 'PROGRESSIVE' in insurance_company) or
                        (company == 'GEICO' and 'GEICO' in insurance_company) or
                        (company == 'GREAT WEST' and 'GREAT WEST' in insurance_company)):
                        company_match = True
                        break

                if not company_match:
                    continue

            # Add to results
            filtered_leads.append({
                **carrier,
                'source': 'Matched Carriers CSV Fast'
            })

            # Check limit
            if len(filtered_leads) >= limit:
                break

        print(f"✅ Fast filtering complete: {len(filtered_leads)} leads")

        return jsonify({
            'status': 'success',
            'data_source': 'matched_carriers_20251009_183433.csv',
            'total_leads': len(filtered_leads),
            'cached_carriers': len(carriers),
            'filters': {
                'state': state or 'All',
                'insurance_companies': insurance_company_list,
                'limit': limit
            },
            'leads': filtered_leads
        })

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data_source': 'matched_carriers_20251009_183433.csv'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check with cache status"""
    global CARRIERS_CACHE

    return jsonify({
        'status': 'healthy',
        'service': 'Fast Matched Carriers Leads API',
        'data_source': 'matched_carriers_20251009_183433.csv',
        'cached_records': len(CARRIERS_CACHE) if CARRIERS_CACHE else 0,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/cache/reload', methods=['POST'])
def reload_cache():
    """Force reload the cache"""
    global CARRIERS_CACHE
    CARRIERS_CACHE = None
    carriers = load_and_cache_carriers()

    return jsonify({
        'status': 'success',
        'message': 'Cache reloaded',
        'cached_records': len(carriers)
    })

if __name__ == '__main__':
    print("Starting FAST Matched Carriers Leads API...")
    print(f"Data source: {CSV_PATH}")

    # Pre-load cache on startup
    load_and_cache_carriers()

    app.run(host='0.0.0.0', port=5003, debug=False)  # No debug for speed