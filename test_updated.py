import requests
import json

url = "http://127.0.0.1:8897/api/leads/expiring-insurance"
params = {
    "state": "OH",
    "insurance_companies": "Progressive",
    "skip_days": 5,
    "days": 30
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    leads = data.get("leads", [])
    print(f"Total leads found: {len(leads)}")
    
    # Count by quality score
    high_quality = sum(1 for lead in leads if lead.get('quality_score') == 'HIGH')
    medium_quality = sum(1 for lead in leads if lead.get('quality_score') == 'MEDIUM')
    
    print(f"High quality (with rep name): {high_quality}")
    print(f"Medium quality (email/phone only): {medium_quality}")
    
    # Show first few of each type
    print("\nFirst 3 HIGH quality leads:")
    for lead in [l for l in leads if l.get('quality_score') == 'HIGH'][:3]:
        print(f"  DOT: {lead['dot_number']}, {lead['legal_name'][:30]}")
        print(f"    Rep: {lead.get('representative_1_name')}, Days: {lead['days_until_expiry']}")
    
    print("\nFirst 3 MEDIUM quality leads:")
    for lead in [l for l in leads if l.get('quality_score') == 'MEDIUM'][:3]:
        print(f"  DOT: {lead['dot_number']}, {lead['legal_name'][:30]}")
        print(f"    Email: {lead.get('email_address')}, Days: {lead['days_until_expiry']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
