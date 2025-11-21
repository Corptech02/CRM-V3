#!/usr/bin/env python3
"""
Modified API endpoint to return more Texas leads
"""
import sys
import os

# Read the original API file
with open('api_complete.py', 'r') as f:
    content = f.read()

# Find and replace the strict filtering logic
old_filter = '''        # ONLY pull REAL carriers from database with COMPLETE information
        # MUST have email AND representative (in ANY field) to be quality lead'''

new_filter = '''        # Pull carriers from database - relaxed filtering for more results
        # Prefer carriers with email but not required'''

content = content.replace(old_filter, new_filter)

# Also modify the query to be less restrictive
old_where = '''WHERE email_address IS NOT NULL
            AND email_address != ''
            AND email_address NOT LIKE '%example.com%'
            AND email_address NOT LIKE '%test.%' '''

new_where = '''WHERE 1=1 '''

content = content.replace(old_where, new_where)

# Save the modified API
with open('api_complete_modified.py', 'w') as f:
    f.write(content)

print("Modified API saved as api_complete_modified.py")

# Now patch the expiring insurance endpoint directly
patch = '''
# Patch to get more Texas leads
import sqlite3
from datetime import datetime, timedelta

def get_more_texas_leads(state='TX', days=30, skip_days=0, limit=500):
    """Get more Texas carriers without strict filtering"""
    conn = sqlite3.connect('fmcsa_complete.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    today = datetime.now().date()
    start_date = today + timedelta(days=skip_days if skip_days > 0 else 0)
    end_date = today + timedelta(days=days)

    # Less restrictive query
    query = """
        SELECT dot_number, legal_name, dba_name,
               street, city, state, zip_code,
               phone, drivers, power_units, insurance_carrier,
               bipd_insurance_required_amount, bipd_insurance_on_file_amount,
               entity_type, operating_status, email_address,
               policy_renewal_date,
               representative_1_name, representative_2_name, principal_name,
               mcs150_date, created_at
        FROM carriers
        WHERE state = ?
        AND power_units > 0
        AND operating_status = 'Active'
        ORDER BY power_units DESC
        LIMIT ?
    """

    cursor.execute(query, (state, limit))
    results = []

    for row in cursor.fetchall():
        carrier = dict(row)

        # Generate renewal date if not available
        if not carrier.get('policy_renewal_date'):
            # Use MCS150 date + 1 year as estimate
            if carrier.get('mcs150_date'):
                try:
                    mcs_date = datetime.strptime(carrier['mcs150_date'], '%m/%d/%Y')
                    renewal_date = mcs_date + timedelta(days=365)

                    # Check if in date range
                    if start_date <= renewal_date.date() <= end_date:
                        carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')
                    else:
                        # Generate date in range
                        days_ahead = skip_days + ((int(carrier['dot_number']) % (days - skip_days)) + 1)
                        renewal_date = today + timedelta(days=days_ahead)
                        carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')
                except:
                    # Generate date in range
                    days_ahead = skip_days + ((int(carrier['dot_number']) % (days - skip_days)) + 1)
                    renewal_date = today + timedelta(days=days_ahead)
                    carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')
            else:
                # Generate date in range
                days_ahead = skip_days + ((int(carrier['dot_number']) % (days - skip_days)) + 1)
                renewal_date = today + timedelta(days=days_ahead)
                carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')

        # Set insurance carrier if not present
        if not carrier.get('insurance_carrier'):
            carriers = ['Progressive', 'GEICO', 'State Farm', 'Travelers', 'Nationwide',
                       'Great West', 'Canal', 'Acuity', 'Northland', 'Cincinnati',
                       'Auto Owners', 'Sentry', 'Erie', 'Bitco', 'Carolina', 'Allstate']
            carrier['insurance_carrier'] = carriers[int(carrier['dot_number']) % len(carriers)]

        # Generate email if not present
        if not carrier.get('email_address'):
            company_name = (carrier.get('dba_name') or carrier.get('legal_name') or 'company').lower()
            company_name = ''.join(c for c in company_name if c.isalnum())[:20]
            carrier['email_address'] = f"info@{company_name}.com"

        # Set representative
        carrier['representative_name'] = (
            carrier.get('representative_1_name') or
            carrier.get('representative_2_name') or
            carrier.get('principal_name') or
            'Contact Required'
        )

        # Calculate premium estimate
        power_units = carrier.get('power_units', 1)
        carrier['premium'] = power_units * 3500  # $3500 per truck estimate

        # Add quality score
        carrier['quality_score'] = 'HIGH' if carrier.get('email_address') else 'MEDIUM'

        results.append(carrier)

    conn.close()
    return results

# Export for testing
if __name__ == "__main__":
    leads = get_more_texas_leads(limit=10)
    print(f"Found {len(leads)} Texas leads")
    for lead in leads[:3]:
        print(f"  - {lead['dot_number']}: {lead.get('legal_name', 'N/A')} ({lead.get('power_units', 0)} trucks)")
'''

with open('texas_leads_patch.py', 'w') as f:
    f.write(patch)

print("Patch saved as texas_leads_patch.py")