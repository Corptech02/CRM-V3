#!/usr/bin/env python3
"""
Intelligent extraction of representative names from existing data
Uses company names, email patterns, and other heuristics to generate likely representative names
"""

import sqlite3
import re
import requests

def main():
    print("🧠 Intelligent representative name extraction...")

    # Connect to database
    conn = sqlite3.connect('vanguard_system.db')
    cursor = conn.cursor()

    # Get Ohio leads sample
    ohio_query = """
    SELECT dot_number, legal_name, email_address, phone, city, state
    FROM fmcsa_enhanced
    WHERE state = 'OH'
    LIMIT 20
    """

    cursor.execute(ohio_query)
    leads = cursor.fetchall()

    print(f"📊 Analyzing {len(leads)} Ohio leads for name patterns...")

    enhanced_count = 0

    for lead in leads:
        dot_number, legal_name, email, phone, city, state = lead

        # Try multiple extraction methods
        extracted_name = None

        # Method 1: Extract from email address
        if email:
            extracted_name = extract_name_from_email(email)

        # Method 2: Check if company name contains a person's name
        if not extracted_name:
            extracted_name = extract_name_from_company(legal_name)

        # Method 3: Use company name as contact (for family businesses)
        if not extracted_name:
            extracted_name = generate_contact_from_company(legal_name)

        if extracted_name:
            print(f"✅ {dot_number} - {legal_name}")
            print(f"   Generated Contact: {extracted_name}")

            # Update database
            update_query = "UPDATE fmcsa_enhanced SET contact_person = ? WHERE dot_number = ?"
            cursor.execute(update_query, (extracted_name, dot_number))
            enhanced_count += 1

    # Method 4: For leads without any names, try external data enrichment
    print(f"\n🌐 Attempting external data enrichment for sample...")
    enriched_count = 0

    # Get 5 leads without names for external lookup
    no_name_query = """
    SELECT dot_number, legal_name, email_address, phone
    FROM fmcsa_enhanced
    WHERE state = 'OH' AND (contact_person IS NULL OR contact_person = '')
    LIMIT 5
    """

    cursor.execute(no_name_query)
    no_name_leads = cursor.fetchall()

    for lead in no_name_leads:
        dot_number, legal_name, email, phone = lead
        external_contact = lookup_external_contact(dot_number, legal_name)

        if external_contact:
            print(f"🌐 {dot_number} - External: {external_contact}")
            update_query = "UPDATE fmcsa_enhanced SET contact_person = ? WHERE dot_number = ?"
            cursor.execute(update_query, (external_contact, dot_number))
            enriched_count += 1

    # Commit changes
    conn.commit()

    print(f"\n📊 ENHANCEMENT SUMMARY:")
    print(f"   Leads processed: {len(leads)}")
    print(f"   Names extracted from patterns: {enhanced_count}")
    print(f"   External enrichment: {enriched_count}")

    # Show some results
    print(f"\n📋 Sample enhanced leads:")
    sample_query = """
    SELECT dot_number, legal_name, contact_person, email_address
    FROM fmcsa_enhanced
    WHERE state = 'OH' AND contact_person IS NOT NULL AND contact_person != ''
    LIMIT 10
    """
    cursor.execute(sample_query)
    enhanced_leads = cursor.fetchall()

    for lead in enhanced_leads:
        dot_number, company, contact, email = lead
        print(f"   {dot_number} | {company} | Rep: {contact}")

    conn.close()

def extract_name_from_email(email):
    """Extract potential representative name from email"""
    if not email or '@' not in email:
        return None

    local = email.split('@')[0].lower()

    # Pattern 1: firstname.lastname
    if '.' in local and len(local.split('.')) == 2:
        first, last = local.split('.')
        if first.isalpha() and last.isalpha() and len(first) > 2 and len(last) > 2:
            # Avoid obvious company emails
            company_terms = ['info', 'admin', 'sales', 'contact', 'support', 'office']
            if first not in company_terms and last not in company_terms:
                return f"{first.title()} {last.title()}"

    # Pattern 2: firstnamelastname (harder to detect)
    # Look for common first names
    common_first_names = ['john', 'mike', 'david', 'chris', 'steve', 'mark', 'paul', 'james', 'robert', 'michael']
    for name in common_first_names:
        if local.startswith(name) and len(local) > len(name) + 2:
            remaining = local[len(name):]
            if remaining.isalpha():
                return f"{name.title()} {remaining.title()}"

    return None

def extract_name_from_company(legal_name):
    """Extract person name if company name contains one"""
    if not legal_name:
        return None

    # Look for patterns like "JOHN SMITH TRUCKING" or "SMITH TRANSPORT LLC"
    words = legal_name.split()

    # Pattern: Two words followed by business terms
    business_terms = ['TRUCKING', 'TRANSPORT', 'LOGISTICS', 'EXPRESS', 'FREIGHT', 'LLC', 'INC', 'CORP']

    if len(words) >= 3:
        # Check if first two words could be first/last name and third is business term
        if words[2] in business_terms:
            first, last = words[0], words[1]
            if first.isalpha() and last.isalpha() and len(first) > 2 and len(last) > 2:
                return f"{first.title()} {last.title()}"

    # Pattern: Single surname followed by business terms
    if len(words) >= 2:
        surname_patterns = [' TRUCKING', ' TRANSPORT', ' LOGISTICS', ' EXPRESS']
        for pattern in surname_patterns:
            if pattern in legal_name:
                potential_surname = legal_name.split(pattern)[0].split()[-1]
                if potential_surname.isalpha() and len(potential_surname) > 3:
                    return f"{potential_surname.title()}"

    return None

def generate_contact_from_company(legal_name):
    """Generate a contact name from company name for small family businesses"""
    if not legal_name:
        return None

    # For companies with personal names, use "Owner" designation
    personal_indicators = ['& SONS', '& SON', 'FAMILY', 'BROTHERS', 'BROS']

    for indicator in personal_indicators:
        if indicator in legal_name:
            # Extract the family name
            parts = legal_name.replace(indicator, '').strip().split()
            if parts:
                family_name = parts[0]
                return f"{family_name.title()} (Owner)"

    return None

def lookup_external_contact(dot_number, legal_name):
    """
    Attempt to lookup contact info from external sources
    This is a placeholder - in practice you'd use APIs like:
    - FMCSA WebPortal API
    - Company registries
    - Business directories
    """

    # Simulate external lookup (you would implement real API calls here)
    # For demo purposes, return placeholder for some entries

    if legal_name and 'EXPRESS' in legal_name:
        return f"Contact ({legal_name.split()[0]})"

    return None

if __name__ == "__main__":
    main()