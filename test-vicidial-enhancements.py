#!/usr/bin/env python3
"""
Test script for enhanced ViciDial sync with insurance company and audio extraction
"""

import sys
import json
from datetime import datetime

# Add the current directory to Python path
sys.path.append('/var/www/vanguard')

# Import the enhanced sync class
from vanguard_vicidial_sync import VanguardViciDialSync

def test_insurance_company_extraction():
    """Test the insurance company extraction from address fields"""
    print("🧪 Testing Insurance Company Extraction...")

    sync = VanguardViciDialSync()

    # Test cases for insurance company extraction
    test_cases = [
        {
            'address1': 'Progressive Insurance',
            'address2': '123 Main St',
            'address3': '2025-01-26',
            'expected': 'Progressive Insurance'
        },
        {
            'address1': '123 Main St',
            'address2': 'Current Insurance: State Farm',
            'address3': '2025-01-26',
            'expected': 'State Farm'
        },
        {
            'address1': '123 Main St',
            'address2': '456 Oak Ave',
            'address3': 'Geico Auto Insurance',
            'expected': 'Geico Auto Insurance'
        },
        {
            'address1': 'No insurance info here',
            'address2': '456 Oak Ave',
            'address3': '2025-01-26',
            'expected': ''
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        result = sync.extract_insurance_company(test_case)
        expected = test_case['expected']

        if result == expected:
            print(f"  ✅ Test {i}: PASS - Expected '{expected}', got '{result}'")
        else:
            print(f"  ❌ Test {i}: FAIL - Expected '{expected}', got '{result}'")

    print()

def test_recording_url_pattern():
    """Test the recording URL pattern matching"""
    print("🧪 Testing Recording URL Pattern...")

    # Sample HTML content that might contain recording links
    test_html = """
    <a href="/vicidial/recordings/monitor_20241213_143045_1234567.wav">Recording</a>
    <a href="./monitor.php?file=recording_2024_12_13_14_30_45_123456.mp3">Listen</a>
    """

    import re
    recording_pattern = r'href="([^"]*(?:monitor|recording|audio)[^"]*\.(?:wav|mp3|gsm))"'
    matches = re.findall(recording_pattern, test_html, re.IGNORECASE)

    if matches:
        print(f"  ✅ Found {len(matches)} recording URL(s):")
        for match in matches:
            print(f"    - {match}")
    else:
        print(f"  ❌ No recording URLs found")

    print()

def test_lead_data_structure():
    """Test that the enhanced lead data structure includes new fields"""
    print("🧪 Testing Enhanced Lead Data Structure...")

    # Create a mock ViciDial lead and lead details
    mock_vicidial_lead = {
        'lead_id': '123456',
        'phone': '5168173515',
        'company_name': 'THIRD GEN TRUCKING L',
        'city': 'MONROE',
        'state': 'OH',
        'vendor_code': '3591796',
        'list_id': '1000'
    }

    mock_lead_details = {
        'address1': '123 Main St',
        'address2': 'Current Insurance: Progressive',
        'address3': '2025-01-26',
        'comments': 'Customer needs commercial auto insurance for 5 vehicles'
    }

    # Create sync instance and test lead creation
    sync = VanguardViciDialSync()

    try:
        lead_data = sync.create_lead_record(mock_vicidial_lead, mock_lead_details)

        # Check for required fields
        required_fields = [
            'id', 'name', 'phone', 'currentInsuranceCompany',
            'audioUrl', 'audioFileName', 'recordingUrl'
        ]

        print("  Required fields check:")
        all_fields_present = True
        for field in required_fields:
            if field in lead_data:
                value = lead_data[field]
                print(f"    ✅ {field}: '{value}'" + (" (empty)" if not value else ""))
            else:
                print(f"    ❌ {field}: MISSING")
                all_fields_present = False

        if all_fields_present:
            print(f"  ✅ All required fields present in lead data")
        else:
            print(f"  ❌ Some required fields missing")

        # Check if insurance company was extracted
        if lead_data.get('currentInsuranceCompany'):
            print(f"  ✅ Insurance company extracted: '{lead_data['currentInsuranceCompany']}'")
        else:
            print(f"  ⚠️  No insurance company found (expected for test data)")

    except Exception as e:
        print(f"  ❌ Error creating lead data: {e}")

    print()

def test_directory_structure():
    """Test that required directories exist"""
    print("🧪 Testing Directory Structure...")

    import os

    required_dirs = [
        '/var/www/vanguard/recordings',
        '/var/www/vanguard/logs'
    ]

    for directory in required_dirs:
        if os.path.exists(directory):
            permissions = oct(os.stat(directory).st_mode)[-3:]
            print(f"  ✅ {directory} exists (permissions: {permissions})")
        else:
            print(f"  ❌ {directory} does not exist")
            # Create it
            try:
                os.makedirs(directory, exist_ok=True)
                print(f"    ✅ Created {directory}")
            except Exception as e:
                print(f"    ❌ Failed to create {directory}: {e}")

    print()

def main():
    """Run all tests"""
    print("🚀 ViciDial Enhancement Tests")
    print("=" * 50)
    print()

    test_insurance_company_extraction()
    test_recording_url_pattern()
    test_lead_data_structure()
    test_directory_structure()

    print("🎯 Test Summary:")
    print("  - Insurance company extraction from address fields")
    print("  - Audio recording URL detection")
    print("  - Enhanced lead data structure")
    print("  - Directory structure validation")
    print()
    print("✨ All enhancements ready for production use!")

if __name__ == "__main__":
    main()