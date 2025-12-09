#!/usr/bin/env python3
"""
ViciDial Lead Uploader - Adds leads to ViciDial lists via the non_agent_api.php
"""
import requests
import urllib3
import json
import sys
import time
from urllib.parse import urlencode

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ViciDial Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "corp06"
VICIDIAL_SOURCE = "vanguard_crm"

def add_lead_to_vicidial(list_id, lead_data):
    """Add a single lead to ViciDial using the non_agent_api.php endpoint"""

    # Debug: Print the lead data we received
    print(f"DEBUG: Processing lead data keys: {list(lead_data.keys())}")

    # ViciDial API endpoint
    api_url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

    # Clean phone number
    phone = lead_data.get('phone', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
    if not phone:
        return {'success': False, 'error': 'No phone number provided'}

    # Extract company name from various possible fields
    company_name = (lead_data.get('business_name') or
                   lead_data.get('company_name') or
                   lead_data.get('legal_name') or
                   lead_data.get('dba_name') or
                   lead_data.get('name') or
                   'Unknown Company')

    print(f"DEBUG: Company name extracted: '{company_name}'")

    # Extract representative name parts
    rep_name = (lead_data.get('representative_name') or
                lead_data.get('contact') or
                lead_data.get('contact_name') or
                lead_data.get('primary_contact') or
                'Unknown Rep')

    # Build insurance expiry information
    insurance_company = lead_data.get('insurance_company', lead_data.get('current_carrier', ''))
    expiry_date = lead_data.get('insurance_expiry', lead_data.get('renewal_date', ''))
    fleet_size = lead_data.get('fleet_size', '')

    # Build comprehensive comments with all key info and call script
    comments_parts = []
    if expiry_date:
        comments_parts.append(f"Insurance Expires: {expiry_date}")
    if fleet_size:
        comments_parts.append(f"Fleet Size: {fleet_size}")
    if lead_data.get('years_in_business'):
        comments_parts.append(f"Years in Business: {lead_data.get('years_in_business')}")
    if lead_data.get('radius_of_operation'):
        comments_parts.append(f"Radius: {lead_data.get('radius_of_operation')}")
    if lead_data.get('commodity_hauled'):
        comments_parts.append(f"Commodity: {lead_data.get('commodity_hauled')}")

    # Create organized call script with your specified format
    basic_info = ' | '.join(comments_parts)

    # Add organized call script with specific sections
    script_addendum = """
==================QUESTIONS==================
Truck(s) Year:
Truck(s) Brand:
Truck(s) Value:
------------------TRAILER(S)-----------------
Trailer(s) Year:
Trailer(s) Brand:
Trailer(s) Value:
-------------------OWNER---------------------
Owners Year of birth:
Owners CDL length:
------------------DRIVER(S)------------------
Driver(s) Year of birth:
Driver(s) CDL Length:
-----------------OPERATION-------------------
Mile Radius (80% of time):
Years in business: """

    # Combine basic info with organized script
    comments = basic_info + script_addendum

    # Prepare lead data for ViciDial with proper trucking field mapping
    api_params = {
        "source": VICIDIAL_SOURCE,
        "user": VICIDIAL_USER,
        "pass": VICIDIAL_PASS,
        "function": "add_lead",
        "list_id": list_id,
        "phone_number": phone,
        "phone_code": "1",
        "status": "NEW",  # Set status to NEW so leads aren't removed
        "duplicate_check": "DUPUPDATE",  # Update existing leads with same phone

        # TRUCKING-SPECIFIC FIELD MAPPING:
        "title": company_name[:40],  # Company Name in Title field
        "first_name": company_name[:20],  # Company Name in First Name field
        "last_name": rep_name[:30],   # Full Representative Name in Last Name field
        "address1": lead_data.get('usdot_number', lead_data.get('dot_number', ''))[:100],  # USDOT Number
        "address2": insurance_company[:100],  # Insurance Company
        "address3": expiry_date[:100],  # Insurance Expiry Date
        "email": lead_data.get('email', ''),
        "city": lead_data.get('city', ''),
        "state": lead_data.get('state', ''),
        "province": lead_data.get('state', ''),  # ViciDial uses province field
        "postal_code": lead_data.get('postal_code', lead_data.get('zip_code', '')),
        "vendor_lead_code": lead_data.get('usdot_number', lead_data.get('dot_number', '')),  # DOT for tracking
        "comments": comments,  # Insurance Expiry + Fleet Size + other details

        # Additional fields
        "alt_phone": lead_data.get('alt_phone', ''),
    }

    try:
        # Make the API request
        response = requests.post(api_url, data=api_params, verify=False, timeout=30)

        if response.status_code == 200:
            response_text = response.text.strip()

            # Check for success patterns
            if "SUCCESS" in response_text:
                return {'success': True, 'message': response_text}
            elif "DUPLICATE" in response_text:
                return {'success': True, 'message': 'Duplicate lead updated', 'duplicate': True}
            else:
                return {'success': False, 'error': f'ViciDial API error: {response_text}'}
        else:
            return {'success': False, 'error': f'HTTP error: {response.status_code}'}

    except Exception as e:
        return {'success': False, 'error': f'Request failed: {str(e)}'}

def create_vicidial_list(list_id, list_name=None):
    """Create a ViciDial list if it doesn't exist"""

    if not list_name:
        list_name = f"Vanguard List {list_id}"

    api_url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

    print(f"Attempting to create ViciDial list {list_id}: {list_name}")

    # Method 1: Try direct list creation
    api_params_1 = {
        "source": VICIDIAL_SOURCE,
        "user": VICIDIAL_USER,
        "pass": VICIDIAL_PASS,
        "function": "add_list",
        "list_id": list_id,
        "list_name": list_name,
        "campaign_id": "VANGUARD",
        "active": "Y"
    }

    try:
        response = requests.post(api_url, data=api_params_1, timeout=30, verify=False)
        if response.status_code == 200:
            response_text = response.text.strip()
            print(f"Method 1 response: {response_text}")
            if "SUCCESS" in response_text or "GOOD" in response_text:
                return {'success': True, 'message': f'List {list_id} created successfully'}
    except Exception as e:
        print(f"Method 1 failed: {e}")

    # Method 2: Try adding a dummy lead to force list creation
    print(f"Method 1 failed, trying to create list {list_id} by adding dummy lead...")

    dummy_params = {
        "source": VICIDIAL_SOURCE,
        "user": VICIDIAL_USER,
        "pass": VICIDIAL_PASS,
        "function": "add_lead",
        "list_id": list_id,
        "phone_number": "0000000001",  # Dummy phone
        "phone_code": "1",
        "status": "NEW",
        "duplicate_check": "DUPUPDATE",
        "title": list_name,
        "first_name": "LIST",
        "last_name": "CREATOR",
        "comments": f"Dummy lead to create list {list_id} - can be deleted"
    }

    try:
        response = requests.post(api_url, data=dummy_params, timeout=30, verify=False)
        if response.status_code == 200:
            response_text = response.text.strip()
            print(f"Method 2 response: {response_text}")
            if "SUCCESS" in response_text or "GOOD" in response_text:
                print(f"✅ List {list_id} created via dummy lead method")
                return {'success': True, 'message': f'List {list_id} created with dummy lead'}
            else:
                print(f"Method 2 also failed: {response_text}")
                return {'success': False, 'error': f'Could not create list {list_id}: {response_text}'}
    except Exception as e:
        print(f"Method 2 failed: {e}")
        return {'success': False, 'error': f'All list creation methods failed: {str(e)}'}

def upload_leads_batch(list_id, leads):
    """Upload multiple leads to ViciDial"""

    results = {
        'uploaded': 0,
        'duplicates': 0,
        'errors': 0,
        'error_details': []
    }

    # First, ensure the list exists
    print(f"Ensuring ViciDial list {list_id} exists...")
    list_result = create_vicidial_list(list_id)
    if not list_result['success']:
        print(f"Warning: Could not create/verify list {list_id}: {list_result['error']}")
        print("Proceeding with upload anyway...")
    else:
        print(f"✅ List {list_id} is ready")

    print(f"Starting upload of {len(leads)} leads to ViciDial list {list_id}")

    for i, lead in enumerate(leads, 1):
        try:
            # Add lead to ViciDial
            result = add_lead_to_vicidial(list_id, lead)

            if result['success']:
                if result.get('duplicate'):
                    results['duplicates'] += 1
                    print(f"  {i}/{len(leads)}: Duplicate updated - {lead.get('phone', 'no phone')}")
                else:
                    results['uploaded'] += 1
                    print(f"  {i}/{len(leads)}: Uploaded - {lead.get('phone', 'no phone')}")
            else:
                results['errors'] += 1
                error_msg = f"Lead {i}: {result['error']}"
                results['error_details'].append(error_msg)
                print(f"  {i}/{len(leads)}: ERROR - {result['error']}")

            # Progress update every 50 leads
            if i % 50 == 0:
                print(f"Progress: {i}/{len(leads)} leads processed ({results['uploaded']} uploaded, {results['duplicates']} duplicates, {results['errors']} errors)")

            # Small delay to avoid overwhelming ViciDial (reduced for faster uploads)
            time.sleep(0.05)

        except Exception as e:
            results['errors'] += 1
            error_msg = f"Lead {i}: Exception - {str(e)}"
            results['error_details'].append(error_msg)
            print(f"  {i}/{len(leads)}: EXCEPTION - {str(e)}")

    print(f"\nUpload complete:")
    print(f"  Uploaded: {results['uploaded']}")
    print(f"  Duplicates: {results['duplicates']}")
    print(f"  Errors: {results['errors']}")

    return results

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 3:
        print("Usage: python vicidial-lead-uploader.py <list_id> <json_leads_file>")
        sys.exit(1)

    list_id = sys.argv[1]
    json_file = sys.argv[2]

    try:
        # Load leads from JSON file
        with open(json_file, 'r') as f:
            data = json.load(f)

        # Extract leads from the data
        if 'leads' in data:
            leads = data['leads']
        elif isinstance(data, list):
            leads = data
        else:
            print("Error: JSON must contain 'leads' array or be an array of leads")
            sys.exit(1)

        # Upload leads
        results = upload_leads_batch(list_id, leads)

        # Output results as JSON for the calling system
        output = {
            'success': True,
            'list_id': list_id,
            'uploaded': results['uploaded'],
            'duplicates': results['duplicates'],
            'errors': results['errors'],
            'total_processed': len(leads),
            'error_details': results['error_details'][:5]  # Limit error details
        }

        print("\n" + "="*50)
        print(json.dumps(output, indent=2))

    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e),
            'list_id': list_id if 'list_id' in locals() else None
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()