#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime

db = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = db.cursor()

cursor.execute("SELECT id, data FROM leads ORDER BY id")
leads = cursor.fetchall()

print("\n" + "=" * 70)
print("RENEWAL DATES FOR ALL LEADS")
print("=" * 70)

for lead_id, data_json in leads:
    data = json.loads(data_json)

    name = data.get('name', 'Unknown')
    renewal = data.get('renewalDate', 'N/A')
    phone = data.get('phone', 'N/A')
    current_carrier = data.get('currentCarrier', 'N/A')
    current_premium = data.get('currentPremium', 'N/A')

    print(f"\n📋 Lead {lead_id}: {name}")
    print(f"   Phone: {phone}")
    print(f"   Current Carrier: {current_carrier}")
    print(f"   Current Premium: {current_premium}")

    # Highlight renewal date
    if renewal and renewal != 'N/A':
        print(f"   ⚠️  RENEWAL DATE: {renewal}")

        # Check if expiring soon
        try:
            renewal_date = datetime.strptime(renewal, "%m/%d/%Y")
            days_until = (renewal_date - datetime.now()).days

            if days_until < 0:
                print(f"   🔴 EXPIRED {abs(days_until)} days ago!")
            elif days_until < 30:
                print(f"   🟠 Expiring in {days_until} days!")
            elif days_until < 60:
                print(f"   🟡 Expiring in {days_until} days")
            else:
                print(f"   🟢 {days_until} days until renewal")
        except:
            pass
    else:
        print(f"   ❌ No renewal date available")

print("\n" + "=" * 70)
print(f"Total leads with renewal dates: {sum(1 for _, d in leads if json.loads(d).get('renewalDate'))}/{len(leads)}")
print("=" * 70)

db.close()