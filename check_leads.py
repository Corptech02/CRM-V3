#!/usr/bin/env python3
import sqlite3
import json

conn = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = conn.cursor()

cursor.execute('SELECT id, data FROM leads')
leads = cursor.fetchall()

print('\nLeads with stages or premiums:')
print('=' * 80)
print(f'{"ID":<20} | {"Name":<30} | {"Stage":<15} | {"Premium":<10}')
print('-' * 80)

for lead_id, data_str in leads:
    data = json.loads(data_str)
    stage = data.get('stage', 'new')
    premium = data.get('premium') or 0
    name = data.get('name', 'Unknown')

    if stage != 'new' or premium > 0:
        print(f'{lead_id[:20]:<20} | {name[:30]:<30} | {stage:<15} | ${premium:<10}')

conn.close()