#!/usr/bin/env python3
"""
Cross-reference databases to enhance representative names
Looks for DBA names, contact info, and other sources to populate missing rep names
"""

import sqlite3
import pandas as pd
import re

def main():
    print("🔍 Analyzing representative name data across databases...")

    # Connect to our main database
    conn = sqlite3.connect('vanguard_system.db')

    # Get sample of Ohio leads without rep names
    print("📊 Getting Ohio leads sample...")
    ohio_query = """
    SELECT dot_number, legal_name, contact_person, email_address, city, state
    FROM fmcsa_enhanced
    WHERE state = 'OH'
    LIMIT 50
    """

    ohio_leads = pd.read_sql_query(ohio_query, conn)
    print(f"Found {len(ohio_leads)} Ohio leads to analyze")

    # Load the CSV with more complete data
    try:
        print("📁 Loading expiring carriers CSV...")
        csv_data = pd.read_csv('expiring_carriers_50_days_20251010_061758.csv')
        print(f"CSV contains {len(csv_data)} records")

        # Find matches and extract representative names
        matches_found = 0
        rep_names_extracted = 0

        print("\n🔍 Cross-referencing data...")
        for idx, lead in ohio_leads.iterrows():
            dot_number = str(lead['dot_number'])
            legal_name = lead['legal_name']

            # Look for this DOT number in CSV
            csv_match = csv_data[csv_data['dot_number'].astype(str) == dot_number]

            if not csv_match.empty:
                matches_found += 1
                csv_record = csv_match.iloc[0]

                # Try to extract representative name from DBA field
                dba_name = csv_record['dba_name'] if 'dba_name' in csv_record and pd.notna(csv_record['dba_name']) else None

                if dba_name and dba_name != 'nan' and dba_name.strip():
                    # Check if DBA name looks like a person's name (not just another company name)
                    if is_person_name(dba_name, legal_name):
                        print(f"✅ {dot_number} - {legal_name}")
                        print(f"   Representative: {dba_name}")
                        rep_names_extracted += 1

                        # Update the database
                        update_query = "UPDATE fmcsa_enhanced SET contact_person = ? WHERE dot_number = ?"
                        conn.execute(update_query, (dba_name, dot_number))

        # Look for patterns in email addresses that might indicate names
        print("\n📧 Analyzing email patterns for names...")
        email_names = 0
        for idx, lead in ohio_leads.iterrows():
            if pd.notna(lead['email_address']):
                email = lead['email_address'].lower()
                # Extract potential name from email
                potential_name = extract_name_from_email(email)
                if potential_name:
                    print(f"📧 {lead['dot_number']} - Potential name from email: {potential_name}")
                    email_names += 1

        # Commit changes
        conn.commit()

        print(f"\n📊 SUMMARY:")
        print(f"   Ohio leads analyzed: {len(ohio_leads)}")
        print(f"   Matches found in CSV: {matches_found}")
        print(f"   Representative names extracted: {rep_names_extracted}")
        print(f"   Potential names from emails: {email_names}")

    except Exception as e:
        print(f"❌ Error processing CSV: {e}")

    finally:
        conn.close()

def is_person_name(dba_name, legal_name):
    """
    Determine if a DBA name looks like a person's name rather than a company name
    """
    dba_lower = dba_name.lower().strip()
    legal_lower = legal_name.lower().strip()

    # Skip if it's just the same as legal name
    if dba_lower == legal_lower:
        return False

    # Skip obvious company indicators
    company_keywords = ['llc', 'inc', 'corp', 'company', 'enterprises', 'transport', 'trucking', 'logistics', 'express', 'freight']
    if any(keyword in dba_lower for keyword in company_keywords):
        return False

    # Check for typical name patterns
    words = dba_name.split()
    if len(words) >= 2:
        # Likely a first/last name combination
        if all(word.istitle() for word in words[:2]):
            return True

    return False

def extract_name_from_email(email):
    """
    Try to extract a person's name from an email address
    """
    if '@' not in email:
        return None

    local_part = email.split('@')[0]

    # Common patterns: firstname.lastname, firstnamelastname, etc.
    # Look for potential name patterns
    if '.' in local_part:
        parts = local_part.split('.')
        if len(parts) == 2:
            first, last = parts
            if first.isalpha() and last.isalpha() and len(first) > 2 and len(last) > 2:
                return f"{first.title()} {last.title()}"

    return None

if __name__ == "__main__":
    main()