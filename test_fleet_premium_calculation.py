#!/usr/bin/env python3
"""
Test script to verify fleet size premium calculation functionality
"""
import sys
import os

# Add the parent directory to sys.path so we can import the sync module
sys.path.insert(0, '/var/www/vanguard')

from vanguard_vicidial_sync import VanguardViciDialSync
import json

def test_fleet_premium_calculation():
    """Test the fleet size extraction and premium calculation"""

    print("🚛 FLEET SIZE PREMIUM CALCULATION TEST")
    print("=" * 50)

    # Create sync instance
    sync = VanguardViciDialSync()

    # Test cases with different fleet sizes
    test_cases = [
        {
            "comments": "Insurance Expires: 2024-12-15 | Fleet Size: 5",
            "expected_fleet": 5,
            "expected_premium": 78000
        },
        {
            "comments": "Current carrier: Progressive. Insurance Expires: 2025-03-20 | Fleet Size: 10 | Current premium: $120,000",
            "expected_fleet": 10,
            "expected_premium": 156000
        },
        {
            "comments": "Insurance Expires: 2024-08-30 | Fleet Size: 3",
            "expected_fleet": 3,
            "expected_premium": 46800
        },
        {
            "comments": "No fleet size info here",
            "expected_fleet": 0,
            "expected_premium": 0
        },
        {
            "comments": "Multiple lines\nInsurance Expires: 2025-01-15 | Fleet Size: 8\nOther notes here",
            "expected_fleet": 8,
            "expected_premium": 124800
        }
    ]

    print(f"\n📋 Testing {len(test_cases)} scenarios:")
    print("-" * 50)

    all_passed = True

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['comments'][:50]}...")

        # Extract policy info using the enhanced method
        policy_info = sync.extract_policy_from_comments(test_case['comments'])

        actual_fleet = policy_info['fleet_size']
        actual_premium = policy_info['calculated_premium']

        # Check fleet size
        if actual_fleet == test_case['expected_fleet']:
            print(f"  ✅ Fleet Size: {actual_fleet} (PASS)")
        else:
            print(f"  ❌ Fleet Size: Expected {test_case['expected_fleet']}, Got {actual_fleet} (FAIL)")
            all_passed = False

        # Check premium calculation
        if actual_premium == test_case['expected_premium']:
            print(f"  ✅ Premium: ${actual_premium:,} (PASS)")
        else:
            print(f"  ❌ Premium: Expected ${test_case['expected_premium']:,}, Got ${actual_premium:,} (FAIL)")
            all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Fleet size extraction working correctly")
        print("✅ Premium calculation ($15,600 per vehicle) working correctly")
        print("✅ Integration ready for production use")
    else:
        print("❌ SOME TESTS FAILED!")
        print("🔧 Check the extract_policy_from_comments method")

    print("\n💡 EXAMPLE CALCULATION:")
    print(f"  Fleet Size: 5 vehicles")
    print(f"  Rate: $15,600 per vehicle")
    print(f"  Total Premium: 5 × $15,600 = ${5 * 15600:,}")

if __name__ == "__main__":
    test_fleet_premium_calculation()