#!/usr/bin/env python3
"""Test the specific lead the user mentioned"""

import requests
from bs4 import BeautifulSoup
import urllib3
import re
urllib3.disable_warnings()

VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USERNAME = "6666"
VICIDIAL_PASSWORD = "corp06"

# Create session with HTTP Basic Auth
session = requests.Session()
session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
session.verify = False

lead_id = "109038"  # The specific lead the user mentioned
print(f"Testing lead {lead_id} from user's example...")
print("=" * 80)

# Get lead details directly
detail_url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
detail_params = {
    'lead_id': lead_id
}

print("Fetching lead details...")
detail_response = session.get(detail_url, params=detail_params, verify=False)

if detail_response.status_code == 200:
    detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

    print("Extracting all form fields...")
    print("-" * 40)

    # Extract all input fields
    for input_field in detail_soup.find_all('input'):
        name = input_field.get('name', '')
        value = input_field.get('value', '')
        if name and value:
            print(f"  {name}: '{value}'")

    print("\nExtracting textarea fields...")
    print("-" * 40)

    # Extract all textarea fields
    for textarea in detail_soup.find_all('textarea'):
        name = textarea.get('name', '')
        content = textarea.text.strip()
        if name:
            print(f"  {name}: '{content[:100]}{'...' if len(content) > 100 else ''}'")

    # Look specifically for address1, address2, comments
    print("\nSpecifically looking for key fields...")
    print("-" * 40)

    address1_input = detail_soup.find('input', {'name': 'address1'})
    address2_input = detail_soup.find('input', {'name': 'address2'})
    address3_input = detail_soup.find('input', {'name': 'address3'})
    comments_textarea = detail_soup.find('textarea', {'name': 'comments'})

    print(f"  🔍 Found address1 input: {address1_input is not None}")
    print(f"  🔍 Found address2 input: {address2_input is not None}")
    print(f"  🔍 Found address3 input: {address3_input is not None}")
    print(f"  🔍 Found comments textarea: {comments_textarea is not None}")

    if address1_input:
        address1 = address1_input.get('value', '')
        print(f"  📍 ADDRESS1: '{address1}'")

        # Check for insurance patterns
        insurance_patterns = [
            r'(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty|USAA|Farmers|Travelers)',
            r'(\w+\s+Insurance)',
            r'(\w+\s+Mutual)',
        ]

        for pattern in insurance_patterns:
            match = re.search(pattern, address1, re.I)
            if match:
                print(f"    🏢 FOUND INSURANCE: '{match.group(1)}'")
                break
    else:
        print("  ❌ No ADDRESS1 field found")

    if address2_input:
        address2 = address2_input.get('value', '')
        print(f"  📍 ADDRESS2: '{address2}'")

        # Check for insurance patterns in address2 too
        insurance_patterns = [
            r'(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty|USAA|Farmers|Travelers)',
            r'(\w+\s+Insurance)',
            r'(\w+\s+Mutual)',
        ]

        for pattern in insurance_patterns:
            match = re.search(pattern, address2, re.I)
            if match:
                print(f"    🏢 FOUND INSURANCE IN ADDRESS2: '{match.group(1)}'")
                break
    else:
        print("  ❌ No ADDRESS2 field found")

    if address3_input:
        address3 = address3_input.get('value', '')
        print(f"  📍 ADDRESS3: '{address3}' (usually renewal date)")
    else:
        print("  ❌ No ADDRESS3 field found")

    if comments_textarea:
        comments = comments_textarea.text.strip()
        print(f"  📝 COMMENTS: '{comments}'")

        # Check for fleet size patterns
        fleet_patterns = [
            r'Fleet Size:?\s*(\d+)',
            r'(\d+)\s*vehicles?',
            r'fleet\s*of\s*(\d+)',
            r'(\d+)\s*units?',
            r'(\d+)\s*trucks?',
            r'Insurance Expires:.*?\|\s*Fleet Size:?\s*(\d+)',
        ]

        for pattern in fleet_patterns:
            match = re.search(pattern, comments, re.I)
            if match:
                fleet_size = int(match.group(1))
                premium = fleet_size * 14400
                print(f"    🚛 FOUND FLEET SIZE: {fleet_size} vehicles = ${premium:,} premium")
                break
        else:
            print("    ⚠️ No fleet size pattern found in comments")
    else:
        print("  ❌ No COMMENTS field found")

    # Debug: Print a snippet of the HTML to see what fields are actually available
    print("\nDebugging: Looking for all inputs and textareas...")
    print("-" * 60)
    all_inputs = detail_soup.find_all(['input', 'textarea'])
    for elem in all_inputs[:20]:  # Show first 20 elements
        tag_name = elem.name
        name = elem.get('name', 'NO_NAME')
        value = elem.get('value', elem.text.strip() if elem.text else 'NO_VALUE')[:50]
        print(f"  {tag_name.upper()}: name='{name}' value='{value}'")

    if len(all_inputs) > 20:
        print(f"  ... and {len(all_inputs) - 20} more elements")

else:
    print(f"❌ Failed to fetch lead details (status: {detail_response.status_code})")

print("\n" + "=" * 80)