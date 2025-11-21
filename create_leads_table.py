#!/usr/bin/env python3
"""
Create/Update leads table with all necessary fields
"""

import sqlite3

def create_leads_table():
    conn = sqlite3.connect('vanguard_system.db')
    cursor = conn.cursor()

    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='leads'")
    table_exists = cursor.fetchone() is not None

    if table_exists:
        print("Leads table exists, adding missing columns...")

        # Get existing columns
        cursor.execute("PRAGMA table_info(leads)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        # Add missing columns
        new_columns = {
            'name': 'TEXT',  # Alias for company_name or contact_name
            'contact': 'TEXT',  # Another alias
            'stage': 'TEXT DEFAULT "new"',
            'years_in_business': 'INTEGER',
            'fleet_size': 'INTEGER',
            'radius_of_operation': 'TEXT',
            'commodity_hauled': 'TEXT',
            'operating_states': 'TEXT',
            'premium': 'REAL',
            'transcript_text': 'TEXT',
            'vehicles': 'TEXT',
            'trailers': 'TEXT',
            'drivers': 'TEXT',
            'last_modified': 'DATETIME DEFAULT CURRENT_TIMESTAMP',
            'dba': 'TEXT',
            'owner_name': 'TEXT',
            'owner_address': 'TEXT',
            'mailing_address': 'TEXT',
            'garaging_address': 'TEXT',
            'usdot_number': 'TEXT',
            'haul_for_hire': 'BOOLEAN DEFAULT 0',
            'non_trucking': 'BOOLEAN DEFAULT 0',
            'other_operation': 'TEXT',
            'loads_0to100': 'TEXT',
            'loads_101to300': 'TEXT',
            'loads_301to500': 'TEXT',
            'loads_500plus': 'TEXT',
            'dry_van': 'TEXT',
            'dump_truck': 'TEXT',
            'flat_bed': 'TEXT',
            'van_buses': 'TEXT',
            'auto_hauler': 'TEXT',
            'box_truck': 'TEXT',
            'reefer': 'TEXT',
            'other_class': 'TEXT',
            'auto_liability': 'TEXT',
            'medical_payments': 'TEXT',
            'comprehensive_deductible': 'TEXT',
            'collision_deductible': 'TEXT',
            'general_liability': 'TEXT',
            'cargo_limit': 'TEXT',
            'cargo_deductible': 'TEXT',
            'commodities': 'TEXT',
            'additional_interests': 'TEXT'
        }

        for col_name, col_type in new_columns.items():
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE leads ADD COLUMN {col_name} {col_type}")
                    print(f"  ✓ Added column: {col_name}")
                except sqlite3.OperationalError as e:
                    if "duplicate column" not in str(e):
                        print(f"  ✗ Error adding column {col_name}: {e}")

        conn.commit()

    else:
        print("Creating new leads table...")
        # Create comprehensive leads table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id TEXT UNIQUE,

            -- Basic Information
            company_name TEXT,
            contact_name TEXT,
            name TEXT,  -- Alias for contact_name
            phone TEXT,
            email TEXT,

            -- Address Information
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            mailing_address TEXT,
            garaging_address TEXT,

            -- DOT/MC Information
            dot_number TEXT,
            mc_number TEXT,
            usdot_number TEXT,  -- Alias for dot_number

            -- Business Information
            years_in_business INTEGER,
            fleet_size INTEGER,
            established_year INTEGER,
            dba TEXT,
            owner_name TEXT,
            owner_address TEXT,

            -- Operation Details
            radius_of_operation TEXT,
            commodity_hauled TEXT,
            operating_states TEXT,
            haul_for_hire BOOLEAN DEFAULT 0,
            non_trucking BOOLEAN DEFAULT 0,
            other_operation TEXT,

            -- Load Distribution
            loads_0to100 TEXT,
            loads_101to300 TEXT,
            loads_301to500 TEXT,
            loads_500plus TEXT,

            -- Risk Classification
            dry_van TEXT,
            dump_truck TEXT,
            flat_bed TEXT,
            van_buses TEXT,
            auto_hauler TEXT,
            box_truck TEXT,
            reefer TEXT,
            other_class TEXT,

            -- Insurance Information
            current_insurance TEXT,
            policy_expiry_date DATE,
            coverage_amount TEXT,
            premium_quoted REAL,
            premium REAL,
            auto_liability TEXT,
            medical_payments TEXT,
            comprehensive_deductible TEXT,
            collision_deductible TEXT,
            general_liability TEXT,
            cargo_limit TEXT,
            cargo_deductible TEXT,

            -- Lead Management
            status TEXT DEFAULT 'active',
            stage TEXT DEFAULT 'new',
            priority TEXT DEFAULT 'medium',
            assigned_to TEXT,
            source TEXT,
            tags TEXT,  -- JSON array

            -- Notes and Transcripts
            notes TEXT,
            transcript_text TEXT,

            -- Vehicles and Drivers (JSON arrays)
            vehicles TEXT,
            trailers TEXT,
            drivers TEXT,
            commodities TEXT,
            additional_interests TEXT,

            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_contact_date DATETIME,
            next_followup_date DATE
        )
    """)

    # Create indexes for better performance (only for columns that exist)
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_dot ON leads(dot_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_mc ON leads(mc_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)")

        # Check if stage column exists before creating index
        cursor.execute("PRAGMA table_info(leads)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'stage' in columns:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)")
    except Exception as e:
        print(f"Note: Some indexes couldn't be created: {e}")

    conn.commit()
    print("✓ Leads table created/updated with all fields")

    # Check existing columns
    cursor.execute("PRAGMA table_info(leads)")
    columns = cursor.fetchall()
    print(f"✓ Table has {len(columns)} columns")

    conn.close()

if __name__ == "__main__":
    create_leads_table()