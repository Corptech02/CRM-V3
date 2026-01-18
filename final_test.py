import requests

# Test with exact 30-day criteria
url = "http://localhost:8897/api/leads/expiring-insurance"
params = {
    "state": "OH",
    "insurance_companies": "Progressive",
    "days": 30,
    "skip_days": 0,
    "limit": 500
}

print("=" * 80)
print("FINAL TEST: Ohio Progressive 30-Day Lead Generation")
print("=" * 80)

response = requests.get(url, params=params)

if response.ok:
    data = response.json()
    total = data.get('total', 0)
    leads = data.get('leads', [])
    
    print(f"\n✅ SUCCESS: Found {total} leads")
    
    # Count quality
    with_reps = sum(1 for l in leads if l.get('representative_name') or l.get('representative_1_name'))
    print(f"With representative names: {with_reps}")
    
    # Check for known carriers that should be included
    known_carriers = {
        '3436361': 'THOMAS TRANSPORT LLC',
        '2482178': 'KENDRICK FARMS LLC',
        '4030578': 'CLAYTON PHILLIP CROWDER',
        '2099485': 'COMBUS CARRIER LLC',
        '3940983': 'NEW AGE HAULING',
        '2924817': 'LV EXPRESS LLC'
    }
    
    print("\nVerifying known carriers:")
    found_count = 0
    for dot, name in known_carriers.items():
        carrier = next((l for l in leads if l.get('dot_number') == dot), None)
        if carrier:
            found_count += 1
            print(f"  ✅ {name}: Found (renewal: {carrier.get('policy_renewal_date')})")
        else:
            print(f"  ❌ {name}: Missing")
    
    print(f"\nFound {found_count}/{len(known_carriers)} expected carriers")
    
    # Show date distribution
    date_counts = {}
    for lead in leads:
        renewal = lead.get('policy_renewal_date', '')
        if renewal:
            date = renewal[5:10]  # MM-DD
            date_counts[date] = date_counts.get(date, 0) + 1
    
    print("\nDate distribution (top 10):")
    for date, count in sorted(date_counts.items())[:10]:
        print(f"  {date}: {count} carriers")
    
    # Expected result: ~272 carriers
    if total >= 260 and total <= 280:
        print(f"\n✅ VERIFICATION PASSED: {total} is within expected range (260-280)")
    else:
        print(f"\n⚠️ VERIFICATION WARNING: {total} is outside expected range (260-280)")
else:
    print(f"❌ ERROR: {response.status_code}")
