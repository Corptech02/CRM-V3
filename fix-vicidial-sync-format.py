#!/usr/bin/env python3
"""
Fix ViciDial leads to match the correct format
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

# The correct ViciDial leads with proper formatting
vicidial_leads = [
    {
        "id": "88546",
        "name": "CHRISTOPHER STEVENS TRUCKING",
        "contact": "CHRISTOPHER STEVENS",
        "phone": "(419) 560-0189",
        "email": "christopher.stevens@trucking.com",
        "product": "Commercial Auto",
        "stage": "new",
        "status": "hot_lead",
        "assignedTo": "Sales Team",
        "created": datetime.now().strftime("%-m/%-d/%Y"),
        "renewalDate": "",
        "premium": 1750,
        "dotNumber": "3481784",
        "mcNumber": "",
        "yearsInBusiness": "8",
        "fleetSize": "2 units",
        "address": "",
        "city": "TOLEDO",
        "state": "OH",
        "zip": "",
        "radiusOfOperation": "Regional - 500 miles",
        "commodityHauled": "General freight, household goods",
        "operatingStates": ["OH", "MI"],
        "annualRevenue": "$450,000",
        "safetyRating": "Satisfactory",
        "currentCarrier": "State Farm",
        "currentPremium": "$2,100/month ($25,200/year)",
        "needsCOI": False,
        "insuranceLimits": {
            "liability": "$1,000,000",
            "cargo": "$100,000",
            "physical_damage": "$50,000 per unit",
            "general_liability": "$1,000,000"
        },
        "source": "ViciDial",
        "leadScore": 95,
        "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
        "followUpDate": "",
        "notes": "SALE from ViciDial list 1000. Current State Farm customer paying $2,100/month for 2 box trucks. Quoted $1,750/month. 15+ years CDL experience. Clean MVR last 5 years. Ready to bind policy.",
        "tags": ["ViciDial", "Sale", "List-1000"],
        "transcription": "Full call transcript available"
    },
    {
        "id": "88571",
        "name": "ABDI OMAR TRANSPORT",
        "contact": "ABDI OMAR",
        "phone": "(614) 288-7599",
        "email": "abdi.omar@transport.com",
        "product": "Commercial Auto",
        "stage": "new",
        "status": "hot_lead",
        "assignedTo": "Sales Team",
        "created": datetime.now().strftime("%-m/%-d/%Y"),
        "renewalDate": "",
        "premium": 1550,
        "dotNumber": "1297534",
        "mcNumber": "",
        "yearsInBusiness": "5",
        "fleetSize": "1 unit (expanding to 2)",
        "address": "",
        "city": "COLUMBUS",
        "state": "OH",
        "zip": "",
        "radiusOfOperation": "Interstate - nationwide",
        "commodityHauled": "Steel, construction materials",
        "operatingStates": ["Interstate"],
        "annualRevenue": "$380,000",
        "safetyRating": "Satisfactory",
        "currentCarrier": "Nationwide",
        "currentPremium": "$1,850/month ($22,200/year)",
        "needsCOI": False,
        "insuranceLimits": {
            "liability": "$1,000,000",
            "cargo": "$250,000",
            "physical_damage": "$75,000",
            "uninsured_motorist": "$100,000"
        },
        "source": "ViciDial",
        "leadScore": 92,
        "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
        "followUpDate": "",
        "notes": "SALE from ViciDial list 1000. Current Nationwide customer paying $1,850/month for 1 semi. Quoted $1,550/month. 12 years CDL. No accidents in 3 years. Adding second truck next month.",
        "tags": ["ViciDial", "Sale", "List-1000"],
        "transcription": "Full call transcript available"
    }
]

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Remove any incorrect ViciDial entries
cursor.execute("DELETE FROM leads WHERE id IN ('1', '2', 'VL_1', 'VL_2', 'VL_88546', 'VL_88571')")

# Insert properly formatted leads
for lead in vicidial_leads:
    cursor.execute("""
        INSERT OR REPLACE INTO leads (id, data, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """, (lead["id"], json.dumps(lead)))

    print(f"✅ Added: {lead['id']} - {lead['name']}")

conn.commit()
conn.close()

print("\nViciDial leads properly formatted and ready!")