import requests

# Test with exact parameter names from the API
url = "http://127.0.0.1:8897/api/leads/expiring-insurance"
params = {
    "state": "OH",
    "insurance_companies": "Progressive",  # Note: insurance_companies not insurance_carrier
    "skip_days": 5,
    "days": 30,
    "limit": 2000
}

print(f"Testing with params: {params}")
response = requests.get(url, params=params)

if response.status_code == 200:
    data = response.json()
    print(f"Success! Found {data.get('total', 0)} leads")
    if data.get('leads'):
        lead = data['leads'][0]
        print(f"First lead: DOT {lead.get('dot_number')}, {lead.get('legal_name')}")
else:
    print(f"Error {response.status_code}: {response.text[:500]}")
