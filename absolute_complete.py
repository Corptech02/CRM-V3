import sqlite3
import json

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=" * 80)
print("ABSOLUTE COMPLETE SEARCH - EVERY POSSIBLE MATCH")
print("=" * 80)

# Get EVERY Ohio Progressive carrier with email for Sept 19-25
query = """
SELECT 
    dot_number,
    legal_name,
    representative_1_name,
    representative_2_name,
    principal_name,
    officers_data,
    email_address,
    phone,
    city,
    insurance_carrier,
    policy_renewal_date
FROM carriers
WHERE state = 'OH'
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL 
    AND email_address != ''
    AND SUBSTR(policy_renewal_date, 6, 5) BETWEEN '09-19' AND '09-25'
ORDER BY policy_renewal_date, legal_name
"""

cursor.execute(query)
all_results = cursor.fetchall()

print(f"Total Ohio Progressive with email (Sept 19-25): {len(all_results)}")

# Now check which ones have ANY form of representative
with_rep = []
without_rep = []

for carrier in all_results:
    has_rep = False
    rep_name = ""
    
    # Check all direct rep fields
    if carrier['representative_1_name'] and carrier['representative_1_name'] not in ['', 'None', None]:
        has_rep = True
        rep_name = carrier['representative_1_name']
    elif carrier['representative_2_name'] and carrier['representative_2_name'] not in ['', 'None', None]:
        has_rep = True
        rep_name = carrier['representative_2_name']
    elif carrier['principal_name'] and carrier['principal_name'] not in ['', 'None', None]:
        has_rep = True
        rep_name = carrier['principal_name']
    elif carrier['officers_data']:
        # Check JSON data
        try:
            officers = json.loads(carrier['officers_data'])
            if 'representatives' in officers and officers['representatives']:
                has_rep = True
                rep_name = officers['representatives'][0].get('name', '')
            elif 'principals' in officers and officers['principals']:
                has_rep = True
                rep_name = officers['principals'][0].get('name', '')
        except:
            pass
    
    if has_rep:
        with_rep.append((carrier, rep_name))
    else:
        without_rep.append(carrier)

print(f"WITH representative names: {len(with_rep)}")
print(f"WITHOUT representative names: {len(without_rep)}")

print("\n" + "=" * 80)
print("CARRIERS WITH REPRESENTATIVES:")
print("=" * 80)

for i, (carrier, rep) in enumerate(with_rep, 1):
    print(f"{i:2}. DOT: {carrier['dot_number']} | {carrier['legal_name']}")
    print(f"    Rep: {rep}")
    print(f"    Email: {carrier['email_address']}")
    print(f"    Date: {carrier['policy_renewal_date']}")

print("\n" + "=" * 80)
print("CARRIERS WITHOUT REPS BUT WITH EMAIL (for reference):")
print("=" * 80)
print("These have email but no representative name in any field:")

for carrier in without_rep[:10]:  # Show first 10
    print(f"DOT: {carrier['dot_number']} | {carrier['legal_name']} | {carrier['email_address']}")

if len(without_rep) > 10:
    print(f"... and {len(without_rep) - 10} more")

conn.close()
