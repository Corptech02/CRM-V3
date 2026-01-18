#!/usr/bin/env python3
"""
Create FCSMA Full Database from actpendins_allwithhistory.3.txt
"""

import sqlite3
import csv
import sys
from datetime import datetime

def create_full_database():
    print("Creating Full FCSMA Database...")

    # Create database connection
    conn = sqlite3.connect('/home/corp06/fcsma_full_leads.db')
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

    print("Processing Full FCSMA data file...")

    try:
        with open('/home/corp06/actpendins_allwithhistory.3.txt', 'r', encoding='utf-8') as file:
            reader = csv.reader(file)

            for row_num, row in enumerate(reader, 1):
                total_records += 1

                if len(row) >= 11:
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
                        additional_date = parse_date(row[10].strip().strip('"')) if len(row) > 10 and row[10].strip() else None

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

                        if processed_records % 10000 == 0:
                            print(f"Processed {processed_records:,} records...")
                            conn.commit()  # Commit every 10k records

                    except Exception as e:
                        print(f"Error processing row {row_num}: {e}")
                        continue
                else:
                    print(f"Skipping row {row_num} - insufficient columns: {len(row)}")

    except FileNotFoundError:
        print("ERROR: actpendins_allwithhistory.3.txt file not found!")
        return False
    except Exception as e:
        print(f"ERROR reading file: {e}")
        return False

    # Final commit
    conn.commit()

    # Get statistics
    cursor.execute('SELECT COUNT(*) FROM insurance_policies')
    total_count = cursor.fetchone()[0]

    print(f"\n" + "="*60)
    print("FULL FCSMA DATABASE CREATION COMPLETED")
    print("="*60)
    print(f"Total records processed: {processed_records:,}")
    print(f"Total records in database: {total_count:,}")

    conn.close()
    print(f"Database saved as: /home/corp06/fcsma_full_leads.db")
    return True

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

if __name__ == "__main__":
    success = create_full_database()
    if success:
        print("\n✅ Full FCSMA database created successfully!")
    else:
        print("\n❌ Failed to create database!")
        sys.exit(1)