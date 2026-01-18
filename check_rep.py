import sqlite3

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
cursor = conn.cursor()

# Step by step test
tests = [
    ("Basic", "SELECT COUNT(*) FROM carriers WHERE dot_number = '3436361'"),
    ("With rep not null", "SELECT COUNT(*) FROM carriers WHERE representative_1_name IS NOT NULL AND dot_number = '3436361'"),
    ("With rep not empty", "SELECT COUNT(*) FROM carriers WHERE representative_1_name IS NOT NULL AND representative_1_name != '' AND dot_number = '3436361'"),
    ("With rep not None", "SELECT COUNT(*) FROM carriers WHERE representative_1_name IS NOT NULL AND representative_1_name != '' AND representative_1_name != 'None' AND dot_number = '3436361'"),
]

for name, query in tests:
    cursor.execute(query)
    count = cursor.fetchone()[0]
    print(f"{name}: {count}")

conn.close()
