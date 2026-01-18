import requests

# Check specific missing carriers
missing_dots = {
    '3436361': 'THOMAS TRANSPORT LLC',
    '2482178': 'KENDRICK FARMS LLC', 
    '4030578': 'CLAYTON PHILLIP CROWDER'
}

for dot, name in missing_dots.items():
    # Test direct search
    url = f"http://localhost:8897/api/search"
    response = requests.post(url, json={"dot_number": dot})
    
    if response.ok:
        data = response.json()
        if data.get('results'):
            carrier = data['results'][0]
            print(f"\n{name} (DOT: {dot})")
            print(f"  Renewal: {carrier.get('policy_renewal_date', 'N/A')}")
            print(f"  Email: {carrier.get('email_address', 'N/A')}")
            print(f"  Rep1: {carrier.get('representative_1_name', 'N/A')}")
            print(f"  Insurance: {carrier.get('insurance_carrier', 'N/A')}")
