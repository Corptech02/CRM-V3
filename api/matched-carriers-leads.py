#!/usr/bin/env python3
"""
Matched Carriers Leads API
Serves filtered leads from the matched carriers CSV file
"""

import csv
import re
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])  # Enable CORS for all routes

CSV_PATH = '/home/corp06/matched_carriers_20251009_183433.csv'

def extract_expiration_date(insurance_record):
    """Extract the expiration/renewal date from insurance record"""
    if not insurance_record:
        return None

    # Split insurance record by pipe
    parts = insurance_record.split('|')

    # The format appears to be: MC|DOT|Type|Coverage|Company|Policy|Effective|?|Amount|Expiration|
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

    # Clean the date string
    date_str = date_str.strip()

    # Try different date formats
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

@app.route('/api/matched-carriers-leads', methods=['GET'])
def get_matched_carriers_leads():
    """
    Get filtered leads from matched carriers CSV
    """
    try:
        # Get query parameters
        state = request.args.get('state', '').strip().upper()
        days = int(request.args.get('days', 30))
        skip_days = int(request.args.get('skip_days', 0))
        insurance_companies = request.args.get('insurance_companies', '')
        limit = int(request.args.get('limit', 50000))  # Very high default limit
        require_email = request.args.get('require_email', 'true').lower() == 'true'
        require_phone = request.args.get('require_phone', 'true').lower() == 'true'
        min_fleet = int(request.args.get('min_fleet', 1))
        max_fleet = int(request.args.get('max_fleet', 9999))
        month_based = request.args.get('month_based', 'false').lower() == 'true'

        # Parse insurance companies
        insurance_company_list = []
        if insurance_companies:
            insurance_company_list = [c.strip() for c in insurance_companies.split(',') if c.strip()]

        # Calculate date range
        today = datetime.now().date()
        start_date = today + timedelta(days=skip_days)
        end_date = today + timedelta(days=days + skip_days)

        # For month-based filtering, get target month/day combinations for next X days
        target_month_days = set()
        if month_based:
            for i in range(1, days + 1):  # Start from 1 (tomorrow) to exclude today
                target_date = today + timedelta(days=i)
                target_month_days.add((target_date.month, target_date.day))

        leads = []
        processed_count = 0

        with open(CSV_PATH, 'r') as file:
            reader = csv.DictReader(file)

            for row in reader:
                processed_count += 1

                # Apply state filter
                if state and row.get('state', '').strip().upper() != state:
                    continue

                # Apply email requirement
                if require_email and not (row.get('email_address', '').strip() and '@' in row.get('email_address', '')):
                    continue

                # Apply phone requirement
                if require_phone and not row.get('phone', '').strip():
                    continue

                # Apply fleet size filter
                try:
                    power_units = int(row.get('power_units', 0) or 0)
                    if power_units < min_fleet or power_units > max_fleet:
                        continue
                except:
                    # If power_units is not a valid number, check against min_fleet
                    if min_fleet > 0:
                        continue

                # Extract expiration date from insurance record
                insurance_record = row.get('insurance_record', '')
                expiration_date = extract_expiration_date(insurance_record)

                if not expiration_date:
                    continue

                # Apply date filtering based on mode
                if month_based:
                    # Month-based filtering: project expiry to current/next year and check if it's in future range
                    expiry_month_day = (expiration_date.month, expiration_date.day)

                    # Project this month/day to the current year first
                    try:
                        current_year_expiry = today.replace(month=expiry_month_day[0], day=expiry_month_day[1])
                    except ValueError:
                        # Handle invalid dates like Feb 29 in non-leap years
                        continue

                    # If current year expiry has already passed, try next year
                    if current_year_expiry <= today:
                        try:
                            projected_expiry = current_year_expiry.replace(year=today.year + 1)
                        except ValueError:
                            continue
                    else:
                        projected_expiry = current_year_expiry

                    # Now check if this projected date falls within our target range
                    if projected_expiry < start_date or projected_expiry > end_date:
                        continue
                else:
                    # Year-based filtering (original logic)
                    # Only include leads that are expiring in the future
                    if expiration_date.date() <= today:
                        continue  # Skip already expired leads

                    # If skip_days is set, only include dates after skip_days
                    if skip_days > 0 and expiration_date.date() < start_date:
                        continue

                    # Include leads expiring within the specified date range
                    if expiration_date.date() > end_date:
                        continue

                # Apply insurance company filter
                if insurance_company_list:
                    insurance_parts = insurance_record.split('|')
                    insurance_company = insurance_parts[4] if len(insurance_parts) > 4 else ''

                    company_match = False
                    for company in insurance_company_list:
                        if company.upper() in insurance_company.upper():
                            company_match = True
                            break

                    if not company_match:
                        continue

                # Calculate days until renewal using projected date for month-based filtering
                if month_based:
                    days_until = (projected_expiry - today).days
                else:
                    days_until = (expiration_date.date() - today).days

                # Extract insurance details
                insurance_parts = insurance_record.split('|') if insurance_record else []

                # Build lead record
                lead = {
                    'mc_number': row.get('mc_number', '').strip(),
                    'dot_number': row.get('fmcsa_dot_number', '') or row.get('dot_number', ''),
                    'fmcsa_dot_number': row.get('fmcsa_dot_number', '').strip(),
                    'legal_name': row.get('legal_name', '').strip(),
                    'dba_name': row.get('dba_name', '').strip(),
                    'city': row.get('city', '').strip(),
                    'state': row.get('state', '').strip(),
                    'phone': row.get('phone', '').strip(),
                    'email_address': row.get('email_address', '').strip(),
                    'operating_status': row.get('operating_status', '').strip(),
                    'power_units': int(row.get('power_units', 0) or 0),
                    'drivers': int(row.get('drivers', 0) or 0),
                    'insurance_carrier': insurance_parts[4] if len(insurance_parts) > 4 else '',
                    'policy_number': insurance_parts[5] if len(insurance_parts) > 5 else '',
                    'renewal_date': (projected_expiry.strftime('%Y-%m-%d') if month_based else expiration_date.strftime('%Y-%m-%d')),
                    'renewal_date_formatted': (projected_expiry.strftime('%m/%d/%Y') if month_based else expiration_date.strftime('%m/%d/%Y')),
                    'days_until_renewal': days_until,
                    'estimated_premium': (int(row.get('power_units', 1) or 1)) * 3500,
                    'lead_score': calculate_lead_score(row, days_until),
                    'insurance_record': insurance_record,
                    'source': 'Matched Carriers CSV'
                }

                leads.append(lead)

        # Shuffle leads randomly for variety (like it was before)
        random.shuffle(leads)

        # Apply limit after collecting all matches
        if limit and len(leads) > limit:
            leads = leads[:limit]

        return jsonify({
            'status': 'success',
            'data_source': 'matched_carriers_20251009_183433.csv',
            'total_leads': len(leads),
            'processed_records': processed_count,
            'filters': {
                'state': state or 'All',
                'days': days,
                'skip_days': skip_days,
                'insurance_companies': insurance_company_list,
                'limit': limit,
                'require_email': require_email,
                'require_phone': require_phone,
                'min_fleet': min_fleet,
                'max_fleet': max_fleet
            },
            'date_range': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            },
            'leads': leads
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data_source': 'matched_carriers_20251009_183433.csv'
        }), 500

def calculate_lead_score(row, days_until_renewal):
    """Calculate lead quality score (0-100)"""
    score = 0

    # Contact information scoring
    if row.get('email_address', '').strip() and '@' in row.get('email_address', ''):
        score += 25
    if row.get('phone', '').strip():
        score += 20

    # Company size scoring
    try:
        power_units = int(row.get('power_units', 0) or 0)
        if power_units > 10:
            score += 20
        elif power_units > 5:
            score += 15
        elif power_units > 0:
            score += 10
    except:
        pass

    # Timing scoring (urgency)
    if 0 <= days_until_renewal <= 30:
        score += 20  # Very urgent
    elif 31 <= days_until_renewal <= 60:
        score += 15  # Urgent
    elif 61 <= days_until_renewal <= 90:
        score += 10  # Moderate
    elif 91 <= days_until_renewal <= 120:
        score += 5   # Low urgency

    # Operating status
    if row.get('operating_status', '').strip().lower() == 'active':
        score += 15

    return min(score, 100)

@app.route('/api/optimized-leads', methods=['GET'])
def get_optimized_leads():
    """Get leads using month-based filtering from state CSV files"""
    import os
    import pandas as pd

    # Get parameters
    state = request.args.get('state', '').upper()
    days = int(request.args.get('days', 30))
    insurance_companies = request.args.get('insurance_companies', '')
    limit = int(request.args.get('limit', 50000))  # Very high default limit

    if not state or not insurance_companies:
        return jsonify({
            'success': False,
            'error': 'State and insurance_companies parameters are required',
            'leads': []
        }), 400

    try:
        # Use state-based CSV files
        states_dir = "/home/corp06/Leads/states"
        state_file = os.path.join(states_dir, f"{state}_carriers.csv")

        if not os.path.exists(state_file):
            return jsonify({
                'success': False,
                'error': f'State file not found: {state}',
                'leads': []
            }), 404

        # Load state data
        df = pd.read_csv(state_file, low_memory=False)

        # Parse insurance companies
        company_list = [company.strip() for company in insurance_companies.split(',')]

        # Filter by insurance companies (partial matching)
        company_pattern = '|'.join(company_list)
        matching_companies = df[
            df['insurance_company'].str.contains(company_pattern, case=False, na=False)
        ].copy()

        if len(matching_companies) == 0:
            return jsonify({
                'success': True,
                'total': 0,
                'leads': [],
                'message': f'No carriers found with insurance from: {", ".join(company_list)}'
            })

        # Get target month/day combinations for month-based filtering
        today = datetime.now()
        target_dates = set()
        for i in range(days + 1):
            target_date = today + timedelta(days=i)
            target_dates.add((target_date.month, target_date.day))

        # Apply month-based date filtering
        matching_leads = []

        for _, row in matching_companies.iterrows():
            expiry_str = str(row.get('insurance_expiration', ''))
            if not expiry_str or expiry_str.lower() in ['nan', 'none', '']:
                continue

            # Parse expiry date to month/day
            month_day = None
            formats = ['%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d', '%d/%m/%Y', '%m-%d-%Y']

            for fmt in formats:
                try:
                    date_obj = datetime.strptime(expiry_str, fmt)
                    month_day = (date_obj.month, date_obj.day)
                    break
                except ValueError:
                    continue

            if not month_day or month_day not in target_dates:
                continue

            # Create lead record
            lead = {
                'dot_number': str(row.get('dot_number', '')),
                'mc_number': str(row.get('mc_number', '')),
                'legal_name': str(row.get('legal_name', '')),
                'dba_name': str(row.get('dba_name', '')),
                'street': str(row.get('street', '')),
                'city': str(row.get('city', '')),
                'state': str(row.get('state', '')),
                'zip_code': str(row.get('zip_code', '')),
                'phone': str(row.get('phone', '')),
                'email_address': str(row.get('email_address', '')),
                'power_units': int(row.get('power_units', 0)) if pd.notna(row.get('power_units')) else 0,
                'drivers': int(row.get('drivers', 0)) if pd.notna(row.get('drivers')) else 0,
                'insurance_company': str(row.get('insurance_company', '')),
                'insurance_expiry': expiry_str,
                'expiry_month_day': f"{month_day[0]}/{month_day[1]}",
                'operating_status': str(row.get('operating_status', '')),
                'entity_type': str(row.get('entity_type', ''))
            }

            matching_leads.append(lead)

        # Shuffle leads randomly for variety (like it was before)
        random.shuffle(matching_leads)

        # Apply limit after collecting all matches
        if limit and len(matching_leads) > limit:
            matching_leads = matching_leads[:limit]

        return jsonify({
            'success': True,
            'total': len(matching_leads),
            'leads': matching_leads,
            'criteria': {
                'state': state,
                'days': days,
                'insurance_companies': company_list,
                'method': 'month_based_filtering'
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'leads': []
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Matched Carriers Leads API',
        'data_source': 'matched_carriers_20251009_183433.csv',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Matched Carriers Leads API...")
    print(f"Data source: {CSV_PATH}")
    app.run(host='0.0.0.0', port=5002, debug=True)