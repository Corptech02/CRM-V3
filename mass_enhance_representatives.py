#!/usr/bin/env python3
"""
Mass enhancement of representative names across the entire database
"""

import sqlite3
import re

def main():
    print("🚀 Mass Enhancement: Adding representative names to all leads...")

    # Connect to database
    conn = sqlite3.connect('vanguard_system.db')
    cursor = conn.cursor()

    # Get count of leads without representative names by state
    cursor.execute("""
        SELECT state, COUNT(*) as count
        FROM fmcsa_enhanced
        WHERE contact_person IS NULL OR contact_person = ''
        GROUP BY state
        ORDER BY count DESC
        LIMIT 10
    """)

    states_data = cursor.fetchall()
    print("\n📊 Top states needing representative names:")
    for state, count in states_data:
        print(f"   {state}: {count:,} leads")

    # Process Ohio first (our test case)
    print(f"\n🎯 Processing Ohio leads...")
    process_state_leads(cursor, 'OH')

    # Process a few more high-volume states
    high_priority_states = ['CA', 'TX', 'FL', 'IL', 'PA']
    for state in high_priority_states:
        print(f"\n🎯 Processing {state} leads...")
        process_state_leads(cursor, state)

    # Commit all changes
    conn.commit()

    # Final statistics
    cursor.execute("""
        SELECT COUNT(*) as total_with_reps
        FROM fmcsa_enhanced
        WHERE contact_person IS NOT NULL AND contact_person != ''
    """)
    total_with_reps = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) as total_leads FROM fmcsa_enhanced")
    total_leads = cursor.fetchone()[0]

    print(f"\n📈 FINAL STATISTICS:")
    print(f"   Total leads: {total_leads:,}")
    print(f"   Leads with representatives: {total_with_reps:,}")
    print(f"   Coverage: {(total_with_reps/total_leads*100):.1f}%")

    conn.close()

def process_state_leads(cursor, state):
    """Process all leads for a specific state"""

    # Get leads for this state that need representative names
    cursor.execute("""
        SELECT dot_number, legal_name, email_address, phone
        FROM fmcsa_enhanced
        WHERE state = ? AND (contact_person IS NULL OR contact_person = '')
        LIMIT 5000
    """, (state,))

    leads = cursor.fetchall()
    print(f"   Processing {len(leads)} {state} leads...")

    enhanced_count = 0
    batch_size = 1000
    batch_updates = []

    for i, lead in enumerate(leads):
        dot_number, legal_name, email, phone = lead

        # Extract representative name using multiple methods
        rep_name = extract_representative_name(legal_name, email)

        if rep_name:
            batch_updates.append((rep_name, dot_number))
            enhanced_count += 1

        # Process in batches for better performance
        if len(batch_updates) >= batch_size or i == len(leads) - 1:
            if batch_updates:
                cursor.executemany(
                    "UPDATE fmcsa_enhanced SET contact_person = ? WHERE dot_number = ?",
                    batch_updates
                )
                batch_updates = []

        # Progress indicator
        if (i + 1) % 1000 == 0:
            print(f"   Progress: {i + 1:,}/{len(leads):,} processed...")

    print(f"   ✅ Enhanced {enhanced_count:,} leads with representative names ({enhanced_count/len(leads)*100:.1f}%)")

def extract_representative_name(legal_name, email):
    """Extract representative name using multiple methods"""

    # Method 1: Email-based extraction (highest confidence)
    if email:
        email_name = extract_name_from_email(email)
        if email_name:
            return email_name

    # Method 2: Company name contains person name
    if legal_name:
        person_name = extract_person_from_company(legal_name)
        if person_name:
            return person_name

    # Method 3: Generate contact from company patterns
    if legal_name:
        company_contact = generate_company_contact(legal_name)
        if company_contact:
            return company_contact

    return None

def extract_name_from_email(email):
    """Extract person name from email address"""
    if not email or '@' not in email:
        return None

    local = email.split('@')[0].lower()

    # Skip obvious company/generic emails
    skip_patterns = ['info', 'admin', 'sales', 'contact', 'support', 'office', 'dispatch', 'billing']
    if any(pattern in local for pattern in skip_patterns):
        return None

    # Pattern 1: firstname.lastname
    if '.' in local:
        parts = local.split('.')
        if len(parts) == 2:
            first, last = parts
            if (first.isalpha() and last.isalpha() and
                len(first) > 2 and len(last) > 2 and
                len(first) < 15 and len(last) < 15):
                return f"{first.title()} {last.title()}"

    # Pattern 2: Detect common first names at start
    common_names = [
        'john', 'mike', 'david', 'chris', 'steve', 'mark', 'paul', 'james', 'robert', 'michael',
        'william', 'richard', 'joseph', 'thomas', 'daniel', 'matthew', 'anthony', 'donald',
        'maria', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica',
        'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol'
    ]

    for name in common_names:
        if local.startswith(name) and len(local) > len(name) + 2:
            remaining = local[len(name):].strip('0123456789._-')
            if remaining.isalpha() and len(remaining) > 2:
                return f"{name.title()} {remaining.title()}"

    return None

def extract_person_from_company(legal_name):
    """Extract person name from company name"""
    if not legal_name:
        return None

    words = legal_name.upper().split()
    business_terms = {
        'LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'CO', 'LTD', 'LIMITED',
        'TRUCKING', 'TRANSPORT', 'TRANSPORTATION', 'LOGISTICS', 'EXPRESS', 'FREIGHT',
        'SERVICES', 'SERVICE', 'ENTERPRISES', 'GROUP', 'SOLUTIONS'
    }

    # Pattern 1: "FIRST LAST BUSINESS_TERM"
    if len(words) >= 3:
        # Check if last word(s) are business terms
        if words[-1] in business_terms or words[-2] in business_terms:
            # Take first two non-business words as name
            name_words = []
            for word in words:
                if word not in business_terms and len(name_words) < 2:
                    name_words.append(word.title())
                elif word in business_terms:
                    break

            if len(name_words) == 2 and all(w.isalpha() for w in name_words):
                return f"{name_words[0]} {name_words[1]}"

    # Pattern 2: Single surname + business terms
    surname_patterns = ['TRUCKING', 'TRANSPORT', 'LOGISTICS', 'EXPRESS']
    for pattern in surname_patterns:
        if f' {pattern}' in legal_name:
            potential_surname = legal_name.split(f' {pattern}')[0].split()[-1]
            if (potential_surname.isalpha() and
                len(potential_surname) > 3 and
                potential_surname not in business_terms):
                return potential_surname.title()

    return None

def generate_company_contact(legal_name):
    """Generate a contact name from company characteristics"""
    if not legal_name:
        return None

    # Family business indicators
    family_indicators = ['& SONS', '& SON', 'FAMILY', 'BROTHERS', 'BROS', '& DAUGHTERS']

    for indicator in family_indicators:
        if indicator in legal_name.upper():
            # Extract family name
            base_name = legal_name.upper().replace(indicator, '').strip()
            words = base_name.split()
            if words:
                family_name = words[0]
                if family_name.isalpha() and len(family_name) > 2:
                    return f"{family_name.title()} Family"

    # Personal name indicators in company name
    if len(legal_name.split()) >= 2:
        first_word = legal_name.split()[0]
        # If first word looks like a person's name
        if (first_word.isalpha() and
            len(first_word) > 3 and
            first_word.upper() not in ['THE', 'AMERICAN', 'NATIONAL', 'UNITED']):
            return f"{first_word.title()} (Owner)"

    return None

if __name__ == "__main__":
    main()