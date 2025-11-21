import requests
import json

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
    
    # Find any lead with a representative name
    leads_with_rep = [lead for lead in leads if lead.get('representative_1_name') not in [None, '', 'None']]
    
    if leads_with_rep:
        print(f"Found {len(leads_with_rep)} leads WITH representative names:")
        for lead in leads_with_rep[:3]:
            print(f"  DOT: {lead['dot_number']}, Rep: {lead['representative_1_name']}")
    else:
        print("NO leads have representative names in the results")
        
    # Check if any have principal names instead
    leads_with_principal = [lead for lead in leads if lead.get('principal_name') not in [None, '', 'None']]
    print(f"\nLeads with principal names: {len(leads_with_principal)}")
    
    # Check officers_data field
    leads_with_officers = [lead for lead in leads if lead.get('officers_data') not in [None, '', 'None']]
    print(f"Leads with officers data: {len(leads_with_officers)}")
