#!/usr/bin/env python3
"""
FCSMA Lead Generation Database Creator
Processes the actpendins_2025_10_08.txt file to create a searchable lead generation database
"""

import sqlite3
import csv
import sys
from datetime import datetime
import re

def clean_phone(phone_str):
    """Clean and format phone numbers"""
    if not phone_str:
        return ""
    # Remove all non-digits
    digits = re.sub(r'\D', '', str(phone_str))
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    return phone_str

def parse_date(date_str):
    """Parse date string to YYYY-MM-DD format"""
    if not date_str or date_str.strip() == "":
        return None
    try:
        # Handle MM/DD/YYYY format
        if '/' in date_str:
            month, day, year = date_str.split('/')
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return date_str
    except:
        return None

def create_database():
    """Create the FCSMA lead generation database"""

    print("Creating FCSMA Lead Generation Database...")

    # Create database connection
    conn = sqlite3.connect('/home/corp06/fcsma_leads.db')
    cursor = conn.cursor()

    # Drop existing table if it exists
    cursor.execute('DROP TABLE IF EXISTS insurance_policies')

    # Create the insurance policies table
    cursor.execute('''
        CREATE TABLE insurance_policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mc_number TEXT,
            dot_number TEXT,
            coverage_type TEXT,
            coverage_level TEXT,
            insurance_carrier TEXT,
            policy_number TEXT,
            policy_start_date TEXT,
            excess_coverage_amount INTEGER,
            primary_coverage_amount INTEGER,
            policy_end_date TEXT,
            additional_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create indexes for better search performance
    cursor.execute('CREATE INDEX idx_mc_number ON insurance_policies(mc_number)')
    cursor.execute('CREATE INDEX idx_dot_number ON insurance_policies(dot_number)')
    cursor.execute('CREATE INDEX idx_insurance_carrier ON insurance_policies(insurance_carrier)')
    cursor.execute('CREATE INDEX idx_policy_end_date ON insurance_policies(policy_end_date)')
    cursor.execute('CREATE INDEX idx_coverage_amount ON insurance_policies(primary_coverage_amount)')

    print("Database structure created successfully.")

    # Read and process the FCSMA data file
    total_records = 0
    processed_records = 0

    print("Processing FCSMA data file...")

    try:
        with open('/home/corp06/actpendins_2025_10_08.txt', 'r', encoding='utf-8') as file:
            # Read as CSV (assuming comma-separated values based on the sample)
            reader = csv.reader(file)

            for row_num, row in enumerate(reader, 1):
                total_records += 1

                if len(row) >= 11:  # Ensure we have all required columns
                    try:
                        mc_number = row[0].strip().strip('"')
                        dot_number = row[1].strip().strip('"')
                        coverage_type = row[2].strip().strip('"')
                        coverage_level = row[3].strip().strip('"')
                        insurance_carrier = row[4].strip().strip('"')
                        policy_number = row[5].strip().strip('"')
                        policy_start_date = parse_date(row[6].strip().strip('"'))
                        excess_coverage_amount = int(row[7]) if row[7] and row[7].strip() else 0
                        primary_coverage_amount = int(row[8]) if row[8] and row[8].strip() else 0
                        policy_end_date = parse_date(row[9].strip().strip('"'))
                        additional_date = parse_date(row[10].strip().strip('"')) if len(row) > 10 else None

                        # Insert into database
                        cursor.execute('''
                            INSERT INTO insurance_policies
                            (mc_number, dot_number, coverage_type, coverage_level,
                             insurance_carrier, policy_number, policy_start_date,
                             excess_coverage_amount, primary_coverage_amount,
                             policy_end_date, additional_date)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (mc_number, dot_number, coverage_type, coverage_level,
                              insurance_carrier, policy_number, policy_start_date,
                              excess_coverage_amount, primary_coverage_amount,
                              policy_end_date, additional_date))

                        processed_records += 1

                        if processed_records % 1000 == 0:
                            print(f"Processed {processed_records:,} records...")

                    except Exception as e:
                        print(f"Error processing row {row_num}: {e}")
                        print(f"Row data: {row}")
                        continue
                else:
                    print(f"Skipping row {row_num} - insufficient columns: {len(row)}")

    except FileNotFoundError:
        print("ERROR: actpendins_2025_10_08.txt file not found!")
        return False
    except Exception as e:
        print(f"ERROR reading file: {e}")
        return False

    # Commit changes
    conn.commit()

    # Get some statistics
    cursor.execute('SELECT COUNT(*) FROM insurance_policies')
    total_count = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(DISTINCT insurance_carrier) FROM insurance_policies')
    carrier_count = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(DISTINCT dot_number) FROM insurance_policies')
    dot_count = cursor.fetchone()[0]

    cursor.execute('''
        SELECT insurance_carrier, COUNT(*) as count
        FROM insurance_policies
        GROUP BY insurance_carrier
        ORDER BY count DESC
        LIMIT 10
    ''')
    top_carriers = cursor.fetchall()

    print(f"\n" + "="*60)
    print("DATABASE CREATION COMPLETED")
    print("="*60)
    print(f"Total records processed: {processed_records:,}")
    print(f"Total records in database: {total_count:,}")
    print(f"Unique insurance carriers: {carrier_count:,}")
    print(f"Unique DOT numbers: {dot_count:,}")
    print(f"\nTop 10 Insurance Carriers by Policy Count:")
    print("-" * 50)
    for carrier, count in top_carriers:
        print(f"{carrier:<40} {count:>8,}")

    conn.close()

    print(f"\nDatabase saved as: /home/corp06/fcsma_leads.db")
    print("Ready for lead generation queries!")

    return True

if __name__ == "__main__":
    success = create_database()
    if success:
        print("\n✅ FCSMA lead generation database created successfully!")
    else:
        print("\n❌ Failed to create database!")
        sys.exit(1)