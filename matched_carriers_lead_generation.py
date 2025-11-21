#!/usr/bin/env python3
"""
Enhanced Lead Generation using Matched Carriers CSV
Uses the comprehensive matched dataset with both insurance and FMCSA data
File: /home/corp06/matched_carriers_20251009_183433.csv
"""

import csv
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json

class MatchedCarriersLeadGenerator:
    def __init__(self):
        self.csv_path = '/home/corp06/matched_carriers_20251009_183433.csv'

    def extract_expiration_date(self, insurance_record):
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
            if not expiration_str or not self.is_date_like(expiration_str):
                expiration_str = parts[-1].strip()

            # Parse the date
            return self.parse_date(expiration_str)

        return None

    def is_date_like(self, date_str):
        """Check if string looks like a date"""
        if not date_str:
            return False

        # Look for date patterns MM/DD/YYYY or MM-DD-YYYY
        date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{4}'
        return bool(re.match(date_pattern, date_str))

    def parse_date(self, date_str):
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

    def get_leads_by_criteria(
        self,
        state: Optional[str] = None,
        renewal_month: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        days_until_renewal_min: Optional[int] = None,
        days_until_renewal_max: Optional[int] = None,
        require_email: bool = True,
        require_phone: bool = True,
        min_power_units: Optional[int] = None,
        limit: int = 1000
    ) -> List[Dict]:
        """
        Get leads from matched carriers CSV with comprehensive filtering

        This uses REAL matched data combining insurance and FMCSA information
        """

        leads = []
        today = datetime.now().date()
        processed_count = 0

        with open(self.csv_path, 'r') as file:
            reader = csv.DictReader(file)

            for row in reader:
                processed_count += 1

                # Apply filters
                # State filter
                if state and row.get('state', '').strip().upper() != state.upper():
                    continue

                # Email requirement
                if require_email and not (row.get('email_address', '').strip() and '@' in row.get('email_address', '')):
                    continue

                # Phone requirement
                if require_phone and not row.get('phone', '').strip():
                    continue

                # Power units filter
                if min_power_units:
                    try:
                        power_units = int(row.get('power_units', 0) or 0)
                        if power_units < min_power_units:
                            continue
                    except:
                        continue

                # Extract and parse expiration date
                insurance_record = row.get('insurance_record', '')
                expiration_date = self.extract_expiration_date(insurance_record)

                if not expiration_date:
                    continue

                # Calculate days until renewal
                days_until = (expiration_date.date() - today).days

                # Apply renewal date filters
                if renewal_month and expiration_date.month != renewal_month:
                    continue

                if start_date:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    if expiration_date.date() < start:
                        continue

                if end_date:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    if expiration_date.date() > end:
                        continue

                if days_until_renewal_min is not None and days_until < days_until_renewal_min:
                    continue

                if days_until_renewal_max is not None and days_until > days_until_renewal_max:
                    continue

                # Extract insurance details from insurance_record
                insurance_parts = insurance_record.split('|') if insurance_record else []
                insurance_company = insurance_parts[4] if len(insurance_parts) > 4 else ''
                policy_number = insurance_parts[5] if len(insurance_parts) > 5 else ''
                effective_date = insurance_parts[6] if len(insurance_parts) > 6 else ''
                coverage_amount = insurance_parts[8] if len(insurance_parts) > 8 else ''

                # Build lead record
                lead = {
                    # Identification
                    'mc_number': row.get('mc_number', '').strip(),
                    'dot_number': row.get('dot_number', '').strip(),
                    'fmcsa_dot_number': row.get('fmcsa_dot_number', '').strip(),

                    # Company Info
                    'legal_name': row.get('legal_name', '').strip(),
                    'dba_name': row.get('dba_name', '').strip(),
                    'company_name': row.get('legal_name', '').strip() or row.get('dba_name', '').strip(),

                    # Contact Information
                    'phone': self.format_phone(row.get('phone', '').strip()),
                    'email_address': row.get('email_address', '').strip(),

                    # Address
                    'street': row.get('street', '').strip(),
                    'city': row.get('city', '').strip(),
                    'state': row.get('state', '').strip(),
                    'zip_code': row.get('zip_code', '').strip(),
                    'full_address': f"{row.get('street', '').strip()}, {row.get('city', '').strip()}, {row.get('state', '').strip()} {row.get('zip_code', '').strip()}".strip(', '),

                    # Business Details
                    'entity_type': row.get('entity_type', '').strip(),
                    'operating_status': row.get('operating_status', '').strip(),
                    'carrier_operation': row.get('carrier_operation', '').strip(),

                    # Fleet Information
                    'drivers': int(row.get('drivers', 0) or 0),
                    'power_units': int(row.get('power_units', 0) or 0),

                    # Insurance Details
                    'insurance_company': insurance_company,
                    'policy_number': policy_number,
                    'effective_date': effective_date,
                    'coverage_amount': coverage_amount,
                    'renewal_date': expiration_date.strftime('%Y-%m-%d'),
                    'renewal_date_formatted': expiration_date.strftime('%m/%d/%Y'),
                    'days_until_renewal': days_until,
                    'renewal_month': expiration_date.month,
                    'renewal_year': expiration_date.year,

                    # Lead Scoring
                    'estimated_premium': self.calculate_estimated_premium(row),
                    'lead_score': self.calculate_lead_score(row, days_until),
                    'urgency': self.get_urgency_level(days_until),

                    # Metadata
                    'source': 'Matched Carriers Database',
                    'generated_at': datetime.now().isoformat(),
                    'full_insurance_record': insurance_record
                }

                leads.append(lead)

                # Check limit
                if len(leads) >= limit:
                    break

        return leads

    def format_phone(self, phone):
        """Format phone number"""
        if not phone:
            return ''

        # Remove all non-digits
        digits = re.sub(r'\D', '', phone)

        # Format as (XXX) XXX-XXXX if 10 digits
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"

        return phone

    def calculate_estimated_premium(self, row):
        """Calculate estimated premium based on power units"""
        try:
            power_units = int(row.get('power_units', 1) or 1)
            # Base premium calculation: $3,500 per power unit
            return max(power_units * 3500, 5000)  # Minimum $5,000
        except:
            return 5000

    def calculate_lead_score(self, row, days_until_renewal):
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

    def get_urgency_level(self, days_until_renewal):
        """Get urgency level based on days until renewal"""
        if days_until_renewal < 0:
            return 'EXPIRED'
        elif days_until_renewal <= 30:
            return 'CRITICAL'
        elif days_until_renewal <= 60:
            return 'HIGH'
        elif days_until_renewal <= 90:
            return 'MEDIUM'
        elif days_until_renewal <= 180:
            return 'LOW'
        else:
            return 'FUTURE'

    def get_leads_summary_by_state(self, limit_per_state: int = 100) -> Dict:
        """Get summary of available leads by state"""

        state_summary = {}

        with open(self.csv_path, 'r') as file:
            reader = csv.DictReader(file)

            for row in reader:
                state = row.get('state', '').strip().upper()
                if not state:
                    continue

                if state not in state_summary:
                    state_summary[state] = {
                        'total_carriers': 0,
                        'with_email': 0,
                        'with_phone': 0,
                        'active_carriers': 0,
                        'avg_power_units': 0,
                        'power_units_total': 0
                    }

                state_summary[state]['total_carriers'] += 1

                if row.get('email_address', '').strip() and '@' in row.get('email_address', ''):
                    state_summary[state]['with_email'] += 1

                if row.get('phone', '').strip():
                    state_summary[state]['with_phone'] += 1

                if row.get('operating_status', '').strip().lower() == 'active':
                    state_summary[state]['active_carriers'] += 1

                try:
                    power_units = int(row.get('power_units', 0) or 0)
                    state_summary[state]['power_units_total'] += power_units
                except:
                    pass

        # Calculate averages
        for state_data in state_summary.values():
            if state_data['total_carriers'] > 0:
                state_data['avg_power_units'] = round(
                    state_data['power_units_total'] / state_data['total_carriers'], 1
                )

        return state_summary

    def get_monthly_renewal_summary(self, state: Optional[str] = None) -> Dict:
        """Get summary of renewals by month"""

        monthly_summary = {}

        with open(self.csv_path, 'r') as file:
            reader = csv.DictReader(file)

            for row in reader:
                # State filter
                if state and row.get('state', '').strip().upper() != state.upper():
                    continue

                # Extract expiration date
                insurance_record = row.get('insurance_record', '')
                expiration_date = self.extract_expiration_date(insurance_record)

                if not expiration_date:
                    continue

                month_key = expiration_date.strftime('%Y-%m')
                month_name = expiration_date.strftime('%B %Y')

                if month_key not in monthly_summary:
                    monthly_summary[month_key] = {
                        'month_name': month_name,
                        'total_renewals': 0,
                        'with_email': 0,
                        'with_phone': 0,
                        'avg_lead_score': 0,
                        'lead_scores': []
                    }

                monthly_summary[month_key]['total_renewals'] += 1

                if row.get('email_address', '').strip() and '@' in row.get('email_address', ''):
                    monthly_summary[month_key]['with_email'] += 1

                if row.get('phone', '').strip():
                    monthly_summary[month_key]['with_phone'] += 1

                # Calculate lead score for this record
                days_until = (expiration_date.date() - datetime.now().date()).days
                lead_score = self.calculate_lead_score(row, days_until)
                monthly_summary[month_key]['lead_scores'].append(lead_score)

        # Calculate average lead scores
        for month_data in monthly_summary.values():
            if month_data['lead_scores']:
                month_data['avg_lead_score'] = round(
                    sum(month_data['lead_scores']) / len(month_data['lead_scores']), 1
                )
            del month_data['lead_scores']  # Remove the raw scores

        return monthly_summary


# Test the new generator
if __name__ == "__main__":
    generator = MatchedCarriersLeadGenerator()

    print("=" * 80)
    print("MATCHED CARRIERS LEAD GENERATION TEST")
    print("=" * 80)
    print(f"Data Source: {generator.csv_path}")

    # Test leads for specific criteria
    print("\n📊 TESTING LEAD GENERATION:")
    print("-" * 50)

    # Get leads expiring in next 60 days for Ohio
    ohio_leads = generator.get_leads_by_criteria(
        state='OH',
        days_until_renewal_min=0,
        days_until_renewal_max=60,
        require_email=True,
        require_phone=True,
        min_power_units=1,
        limit=10
    )

    print(f"Ohio leads expiring in next 60 days: {len(ohio_leads)}")

    if ohio_leads:
        print("\nSample Ohio lead:")
        lead = ohio_leads[0]
        print(f"  Company: {lead['company_name']}")
        print(f"  DOT: {lead['dot_number']}")
        print(f"  Contact: {lead['email_address']}")
        print(f"  Phone: {lead['phone']}")
        print(f"  Renewal: {lead['renewal_date_formatted']}")
        print(f"  Days until renewal: {lead['days_until_renewal']}")
        print(f"  Lead score: {lead['lead_score']}")
        print(f"  Urgency: {lead['urgency']}")
        print(f"  Estimated premium: ${lead['estimated_premium']:,}")

    # Test monthly summary for Ohio
    print(f"\n📅 OHIO MONTHLY RENEWAL SUMMARY:")
    print("-" * 50)

    ohio_monthly = generator.get_monthly_renewal_summary('OH')
    for month_key in sorted(ohio_monthly.keys())[:6]:  # Show next 6 months
        data = ohio_monthly[month_key]
        print(f"{data['month_name']:15} - Renewals: {data['total_renewals']:,}, "
              f"Email: {data['with_email']:,}, Phone: {data['with_phone']:,}, "
              f"Avg Score: {data['avg_lead_score']}")

    print(f"\n✅ Enhanced lead generator ready!")
    print(f"   - Uses matched carriers CSV with both insurance + FMCSA data")
    print(f"   - 383,510 carriers available")
    print(f"   - Real renewal dates and contact information")
    print(f"   - Advanced filtering and scoring capabilities")