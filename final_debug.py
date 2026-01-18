import sqlite3

conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
conn.row_factory = sqlite3.Row

# Get ALL carriers for Ohio Progressive including our known ones
cursor = conn.cursor()
cursor.execute("""
    SELECT dot_number, legal_name
    FROM carriers
    WHERE state = 'OH'
    AND insurance_carrier LIKE '%Progressive%'
    AND email_address IS NOT NULL
    AND (
        representative_1_name IS NOT NULL AND representative_1_name != '' AND representative_1_name != 'None'
    )
""")

all_dots = [row['dot_number'] for row in cursor.fetchall()]
print(f"Total with rep1 name: {len(all_dots)}")
print(f"Has 3436361: {'3436361' in all_dots}")
print(f"Has 2482178: {'2482178' in all_dots}")
print(f"Has 4030578: {'4030578' in all_dots}")

conn.close()
