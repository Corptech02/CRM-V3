import requests
import json

# Test lead generation endpoint
url = "http://127.0.0.1:8897/api/leads/expiring-insurance"
params = {
    "state": "OH",
    "insurance_carrier": "Progressive",
    "skip_days": 5,
    "show_days": 30
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    leads = data.get("leads", [])
    print(f"Total leads found: {len(leads)}")
    
    # Check first 5 leads for required fields
    for i, lead in enumerate(leads[:5]):
        print(f"\nLead {i+1}:")
        print(f"  DOT: {lead.get('dot_number')}")
        print(f"  Name: {lead.get('legal_name')}")
        print(f"  Email: {lead.get('email_address', 'MISSING')}")
        print(f"  Phone: {lead.get('phone', 'MISSING')}")
        print(f"  Rep Name: {lead.get('representative_1_name', 'MISSING')}")
        print(f"  Principal: {lead.get('principal_name', 'MISSING')}")
        print(f"  Days until expiry: {lead.get('days_until_expiry')}")
        
    # Verify all leads have email and phone
    missing_email = sum(1 for lead in leads if not lead.get('email_address'))
    missing_phone = sum(1 for lead in leads if not lead.get('phone'))
    missing_rep = sum(1 for lead in leads if not lead.get('representative_1_name'))
    
    print(f"\nData quality check:")
    print(f"  Leads missing email: {missing_email}")
    print(f"  Leads missing phone: {missing_phone}")
    print(f"  Leads missing representative: {missing_rep}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
