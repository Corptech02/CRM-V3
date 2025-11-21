#!/usr/bin/env python3
"""Import test leads to verify sync is working"""

import sqlite3
import json
from datetime import datetime
import sys

# Database path
DB_PATH = "/var/www/vanguard/backend/vanguard.db"

def create_test_leads():
    """Create test ViciDial sales leads"""
    test_leads = [
        {
            "id": "VICI-TEST-001",
            "viciDialLeadId": "TEST001",
            "source": "ViciDial Test Sale",
            "status": "hot",
            "priority": "high",
            "name": "John Smith",
            "company": "Smith Trucking LLC",
            "phone": "555-0001",
            "email": "john@smithtrucking.com",
            "address": "123 Main St",
            "city": "Dallas",
            "state": "TX",
            "zip": "75201",
            "dotNumber": "DOT123456",
            "notes": "Test ViciDial Sale - Ready to buy commercial auto insurance",
            "dateAdded": datetime.now().isoformat(),
            "importedAt": datetime.now().isoformat(),
            "tags": ["ViciDial", "Sale", "Test"]
        },
        {
            "id": "VICI-TEST-002",
            "viciDialLeadId": "TEST002",
            "source": "ViciDial Test Sale",
            "status": "hot",
            "priority": "high",
            "name": "Jane Doe",
            "company": "Doe Transport Inc",
            "phone": "555-0002",
            "email": "jane@doetransport.com",
            "address": "456 Oak Ave",
            "city": "Houston",
            "state": "TX",
            "zip": "77001",
            "dotNumber": "DOT789012",
            "notes": "Test ViciDial Sale - Needs quote ASAP",
            "dateAdded": datetime.now().isoformat(),
            "importedAt": datetime.now().isoformat(),
            "tags": ["ViciDial", "Sale", "Test", "Urgent"]
        }
    ]

    return test_leads

def import_to_database(leads):
    """Import leads to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    imported_count = 0

    for lead in leads:
        try:
            # Check if lead already exists
            cursor.execute("SELECT id FROM leads WHERE id = ?", (lead['id'],))
            if cursor.fetchone():
                print(f"Lead {lead['id']} already exists, skipping")
                continue

            # Insert new lead
            cursor.execute("""
                INSERT INTO leads (id, data, created_at, updated_at)
                VALUES (?, ?, datetime('now'), datetime('now'))
            """, (lead['id'], json.dumps(lead)))

            imported_count += 1
            print(f"Imported: {lead['id']} - {lead['name']} ({lead['company']})")

        except Exception as e:
            print(f"Error importing lead {lead['id']}: {e}")

    conn.commit()
    conn.close()

    return imported_count

def main():
    print("=" * 50)
    print("ViciDial Test Lead Import")
    print("=" * 50)

    # Create test leads
    test_leads = create_test_leads()
    print(f"\nCreated {len(test_leads)} test leads")

    # Import to database
    imported = import_to_database(test_leads)
    print(f"\nSuccessfully imported {imported} new test leads")

    if imported > 0:
        print("\n✅ Test leads imported successfully!")
        print("Go to Lead Management to see the new ViciDial sales")
    else:
        print("\n⚠️ No new leads imported (may already exist)")

if __name__ == "__main__":
    main()