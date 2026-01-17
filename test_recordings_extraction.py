#!/usr/bin/env python3
"""
Test script to validate RECORDINGS table extraction patterns
"""

import re

# Test HTML content based on your ViciDial example
test_html = """
RECORDINGS FOR THIS LEAD:
#    LEAD    DATE/TIME    SECONDS      RECID    FILENAME    LOCATION    TSR
1    132078    2026-01-08 20:43:03    1288    6057      20260108-204303_4078013822    http://204.13.233.29/RECORD...    1002

Click here to see Lead Modify changes to this lead
"""

# Test patterns from the updated script
duration_patterns = [
    # HIGHEST PRIORITY: RECORDINGS table seconds column (most accurate)
    r'RECORDINGS FOR THIS LEAD:.*?(?:\d+\s+\d+\s+[\d\-:\s]+)\s+(\d{3,4})\s+(?:\d+\s+)',  # Specific RECORDINGS row format
    # More specific pattern to avoid false matches
    r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?\n.*?(\d{3,4})\s+\d+\s+',  # Line after SECONDS header with proper format
    r'(?s)RECORDINGS FOR THIS LEAD:.*?(\d{3,4})\s+\d{4,}\s+',              # Duration followed by RECID (4+ digits)
    r'RECORDINGS FOR THIS LEAD:.*?<td[^>]*>\s*(\d+)\s*</td>',              # HTML table format
]

print("🧪 Testing RECORDINGS table extraction patterns...")
print("📄 Test HTML content:")
print(test_html)
print("\n" + "="*60 + "\n")

for i, pattern in enumerate(duration_patterns):
    print(f"🔍 Pattern {i+1}: {pattern}")
    matches = re.findall(pattern, test_html, re.IGNORECASE | re.DOTALL)
    if matches:
        for match in matches:
            try:
                seconds = int(match if isinstance(match, str) else match[0] if isinstance(match, tuple) else match)
                minutes = seconds // 60
                remaining_seconds = seconds % 60
                formatted_time = f"{minutes} min {remaining_seconds} sec" if minutes > 0 else f"{seconds} sec"
                print(f"  ✅ Found: {seconds} seconds → {formatted_time}")
            except (ValueError, IndexError) as e:
                print(f"  ❌ Error parsing match '{match}': {e}")
    else:
        print("  ❌ No matches found")
    print()

# Also test with more specific RECORDINGS section extraction
print("🎬 Testing RECORDINGS section extraction...")
recordings_match = re.search(r'RECORDINGS FOR THIS LEAD:(.*?)(?:Click here|$)', test_html, re.DOTALL)
if recordings_match:
    recordings_section = recordings_match.group(1)
    print("📋 RECORDINGS section found:")
    print(recordings_section)

    # Look for numbers in the section
    numbers = re.findall(r'(\d{2,4})', recordings_section)
    print(f"🔢 Numbers found: {numbers}")

    # The correct duration should be the 4th number after the header
    if len(numbers) >= 4:
        potential_duration = numbers[3]  # Index 3 for 4th number (1288 in your example)
        print(f"🎯 Potential duration (4th number): {potential_duration}")
else:
    print("❌ No RECORDINGS section found")

print("\n🏁 Test complete!")