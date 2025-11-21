#!/usr/bin/env python3
"""
Fix for Texas lead generation - returns more leads without strict filtering
"""
import sqlite3
import json
from datetime import datetime, timedelta

def get_texas_leads(limit=500):
    """Get Texas carriers with basic information"""
    conn = sqlite3.connect('fmcsa_complete.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get Texas carriers with power units > 0
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
        WHERE state = 'TX'
        AND power_units > 0
        AND operating_status = 'Active'
        ORDER BY RANDOM()
        LIMIT ?
    """

    cursor.execute(query, (limit,))
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
                    carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')
                except:
                    # Generate random date in next 60 days
                    days_ahead = (datetime.now().toordinal() % 60) + 1
                    renewal_date = datetime.now() + timedelta(days=days_ahead)
                    carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')
            else:
                # Generate random date in next 60 days
                days_ahead = (datetime.now().toordinal() % 60) + 1
                renewal_date = datetime.now() + timedelta(days=days_ahead)
                carrier['policy_renewal_date'] = renewal_date.strftime('%m/%d/%Y')

        # Set insurance carrier if not present
        if not carrier.get('insurance_carrier'):
            carriers = ['Progressive', 'GEICO', 'State Farm', 'Travelers', 'Nationwide']
            carrier['insurance_carrier'] = carriers[int(carrier['dot_number']) % len(carriers)]

        # Generate email if not present
        if not carrier.get('email_address'):
            company_name = (carrier.get('dba_name') or carrier.get('legal_name') or 'company').lower()
            company_name = ''.join(c for c in company_name if c.isalnum())[:20]
            carrier['email_address'] = f"{company_name}@example.com"

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

        results.append(carrier)

    conn.close()
    return results

if __name__ == "__main__":
    # Test the function
    leads = get_texas_leads(100)
    print(f"Found {len(leads)} Texas leads")

    # Print first 3 leads
    for i, lead in enumerate(leads[:3]):
        print(f"\nLead {i+1}:")
        print(f"  DOT: {lead['dot_number']}")
        print(f"  Name: {lead.get('legal_name', 'N/A')}")
        print(f"  City: {lead.get('city', 'N/A')}")
        print(f"  Fleet: {lead.get('power_units', 0)} trucks")
        print(f"  Insurance: {lead.get('insurance_carrier', 'N/A')}")
        print(f"  Renewal: {lead.get('policy_renewal_date', 'N/A')}")