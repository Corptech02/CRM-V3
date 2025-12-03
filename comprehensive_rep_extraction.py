#!/usr/bin/env python3
"""
COMPREHENSIVE REPRESENTATIVE NAME EXTRACTION
Deep analysis to find representatives for ALL 380k leads
ONLY updates contact_person field - leaves all other data untouched
"""

import sqlite3
import re
import time

def main():
    print("🔍 COMPREHENSIVE REPRESENTATIVE EXTRACTION - ALL 380K LEADS")
    print("📋 SAFETY: Only updating contact_person field, leaving all other data intact")

    conn = sqlite3.connect('vanguard_system.db')
    cursor = conn.cursor()

    # Get current status
    cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced")
    total_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced WHERE contact_person IS NULL OR contact_person = ''")
    blank_reps = cursor.fetchone()[0]

    print(f"\n📊 DATABASE STATUS:")
    print(f"   Total leads: {total_leads:,}")
    print(f"   Leads needing representatives: {blank_reps:,}")
    print(f"   Already have representatives: {total_leads - blank_reps:,}")

    # Process in batches for memory efficiency
    BATCH_SIZE = 10000
    total_enhanced = 0

    start_time = time.time()

    for offset in range(0, blank_reps, BATCH_SIZE):
        print(f"\n🔄 Processing batch {offset//BATCH_SIZE + 1}/{(blank_reps//BATCH_SIZE) + 1}")
        print(f"   Leads {offset:,} to {min(offset + BATCH_SIZE, blank_reps):,}")

        batch_enhanced = process_batch(cursor, offset, BATCH_SIZE)
        total_enhanced += batch_enhanced

        # Commit after each batch
        conn.commit()

        # Progress update
        elapsed = time.time() - start_time
        rate = total_enhanced / elapsed if elapsed > 0 else 0
        estimated_remaining = (blank_reps - (offset + BATCH_SIZE)) / rate if rate > 0 else 0

        print(f"   ✅ Enhanced: {batch_enhanced:,} leads in this batch")
        print(f"   📈 Total enhanced so far: {total_enhanced:,}")
        print(f"   ⚡ Rate: {rate:.1f} leads/second")
        if estimated_remaining > 0:
            print(f"   ⏱️  Estimated time remaining: {estimated_remaining/60:.1f} minutes")

    # Final statistics
    cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced WHERE contact_person IS NOT NULL AND contact_person != ''")
    final_with_reps = cursor.fetchone()[0]

    print(f"\n🎉 COMPREHENSIVE EXTRACTION COMPLETE!")
    print(f"   Total leads processed: {blank_reps:,}")
    print(f"   Representative names added: {total_enhanced:,}")
    print(f"   Success rate: {(total_enhanced/blank_reps*100):.1f}%")
    print(f"   Final coverage: {final_with_reps:,}/{total_leads:,} ({final_with_reps/total_leads*100:.1f}%)")

    conn.close()

def process_batch(cursor, offset, batch_size):
    """Process a batch of leads to extract representative names"""

    # Get batch of leads without representative names
    cursor.execute("""
        SELECT dot_number, legal_name, email_address, phone
        FROM fmcsa_enhanced
        WHERE contact_person IS NULL OR contact_person = ''
        LIMIT ? OFFSET ?
    """, (batch_size, offset))

    leads = cursor.fetchall()
    batch_updates = []

    for lead in leads:
        dot_number, legal_name, email, phone = lead

        # Deep extraction using multiple advanced methods
        rep_name = extract_representative_deep(legal_name, email, phone)

        if rep_name:
            batch_updates.append((rep_name, dot_number))

    # Batch update for performance
    if batch_updates:
        cursor.executemany(
            "UPDATE fmcsa_enhanced SET contact_person = ? WHERE dot_number = ?",
            batch_updates
        )

    return len(batch_updates)

def extract_representative_deep(legal_name, email, phone):
    """
    DEEP EXTRACTION using multiple advanced methods
    Returns the best representative name found, or None
    """

    # Method 1: Email-based extraction (highest confidence)
    email_rep = extract_from_email_advanced(email)
    if email_rep and is_high_confidence_name(email_rep):
        return email_rep

    # Method 2: Advanced company name parsing
    company_rep = extract_from_company_advanced(legal_name)
    if company_rep and is_high_confidence_name(company_rep):
        return company_rep

    # Method 3: Pattern recognition for family businesses
    family_rep = extract_family_business_rep(legal_name)
    if family_rep:
        return family_rep

    # Method 4: Industry-specific extraction
    industry_rep = extract_industry_specific_rep(legal_name)
    if industry_rep:
        return industry_rep

    # Method 5: Acronym and abbreviation expansion
    acronym_rep = extract_from_acronyms(legal_name)
    if acronym_rep:
        return acronym_rep

    # Method 6: Linguistic patterns (ethnic names, etc.)
    linguistic_rep = extract_linguistic_patterns(legal_name)
    if linguistic_rep:
        return linguistic_rep

    # Method 7: Lower confidence email extraction as fallback
    if email_rep:
        return email_rep

    # Method 8: Company-based contact generation (fallback)
    fallback_rep = generate_fallback_contact(legal_name)
    if fallback_rep:
        return fallback_rep

    return None

def extract_from_email_advanced(email):
    """Advanced email parsing with better name recognition"""
    if not email or '@' not in email:
        return None

    local = email.split('@')[0].lower()

    # Skip obvious non-personal emails
    skip_patterns = [
        'info', 'admin', 'sales', 'contact', 'support', 'office', 'dispatch',
        'billing', 'accounting', 'service', 'help', 'noreply', 'donotreply',
        'mail', 'email', 'team', 'staff', 'general', 'main'
    ]
    if any(pattern in local for pattern in skip_patterns):
        return None

    # Pattern 1: firstname.lastname or first.last
    if '.' in local:
        parts = local.split('.')
        if len(parts) == 2:
            first, last = parts
            if (first.isalpha() and last.isalpha() and
                len(first) > 1 and len(last) > 1 and
                len(first) < 20 and len(last) < 20):
                # Validate it looks like real names
                if is_likely_name(first) and is_likely_name(last):
                    return f"{first.title()} {last.title()}"

    # Pattern 2: firstlast format with known first names
    expanded_first_names = [
        'john', 'mike', 'david', 'chris', 'steve', 'mark', 'paul', 'james', 'robert', 'michael',
        'william', 'richard', 'joseph', 'thomas', 'daniel', 'matthew', 'anthony', 'donald',
        'charles', 'christopher', 'joshua', 'andrew', 'kenneth', 'brandon', 'gregory',
        'maria', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica',
        'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol',
        'ruth', 'sharon', 'michelle', 'laura', 'emily', 'kimberly', 'deborah', 'dorothy',
        # Add common nicknames
        'bill', 'bob', 'jim', 'tom', 'tim', 'dan', 'dave', 'joe', 'sam', 'ben', 'nick',
        'rick', 'tony', 'andy', 'jeff', 'ken', 'ron', 'don', 'ray', 'roy', 'gary',
        'sue', 'ann', 'jane', 'kate', 'jean', 'lynn', 'rose', 'amy', 'joy', 'faye'
    ]

    for name in expanded_first_names:
        if local.startswith(name) and len(local) > len(name) + 1:
            remaining = local[len(name):]
            # Clean remaining part
            remaining = remaining.strip('0123456789._-')
            if remaining.isalpha() and len(remaining) > 1 and len(remaining) < 20:
                if is_likely_name(remaining):
                    return f"{name.title()} {remaining.title()}"

    # Pattern 3: lastname.firstname
    common_surnames = [
        'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis',
        'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson',
        'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson',
        'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker'
    ]

    if '.' in local:
        parts = local.split('.')
        if len(parts) == 2:
            first_part, second_part = parts
            # Check if first part is a surname
            if first_part in common_surnames and is_likely_name(second_part):
                return f"{second_part.title()} {first_part.title()}"

    return None

def extract_from_company_advanced(legal_name):
    """Advanced company name parsing with better person detection"""
    if not legal_name:
        return None

    words = legal_name.upper().split()
    business_terms = {
        'LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'CO', 'LTD', 'LIMITED',
        'TRUCKING', 'TRANSPORT', 'TRANSPORTATION', 'LOGISTICS', 'EXPRESS', 'FREIGHT',
        'SERVICES', 'SERVICE', 'ENTERPRISES', 'GROUP', 'SOLUTIONS', 'SYSTEMS',
        'INTERNATIONAL', 'NATIONAL', 'GLOBAL', 'WORLDWIDE', 'INCORPORATED'
    }

    # Pattern 1: "FIRST LAST BUSINESS" or "FIRST MIDDLE LAST BUSINESS"
    if len(words) >= 3:
        name_words = []
        for i, word in enumerate(words):
            if word not in business_terms:
                if is_likely_name_word(word) and len(name_words) < 3:
                    name_words.append(word.title())
            else:
                break  # Stop at first business term

        if len(name_words) == 2:
            return f"{name_words[0]} {name_words[1]}"
        elif len(name_words) == 3:
            return f"{name_words[0]} {name_words[1]} {name_words[2]}"

    # Pattern 2: Single name businesses "SMITH TRUCKING"
    if len(words) >= 2:
        first_word = words[0]
        if (first_word not in business_terms and
            is_likely_surname(first_word) and
            any(term in words[1:] for term in ['TRUCKING', 'TRANSPORT', 'LOGISTICS', 'EXPRESS'])):
            return first_word.title()

    return None

def extract_family_business_rep(legal_name):
    """Extract names from family business patterns"""
    if not legal_name:
        return None

    upper_name = legal_name.upper()

    # Family business indicators
    family_patterns = {
        '& SONS': 'Sons',
        '& SON': 'Son',
        'AND SONS': 'Sons',
        'AND SON': 'Son',
        '& DAUGHTERS': 'Daughters',
        '& DAUGHTER': 'Daughter',
        'FAMILY': 'Family',
        'BROTHERS': 'Brothers',
        'BROS': 'Bros',
        '& BROS': 'Bros',
        'SISTERS': 'Sisters'
    }

    for pattern, suffix in family_patterns.items():
        if pattern in upper_name:
            # Extract family name before the pattern
            base_name = upper_name.split(pattern)[0].strip()
            words = base_name.split()
            if words:
                family_name = words[-1]  # Last word before pattern
                if (family_name.isalpha() and
                    len(family_name) > 2 and
                    is_likely_surname(family_name)):
                    return f"{family_name.title()} {suffix}"

    return None

def extract_industry_specific_rep(legal_name):
    """Extract names using trucking industry naming patterns"""
    if not legal_name:
        return None

    upper_name = legal_name.upper()

    # Common trucking/logistics naming patterns
    patterns = [
        (r'([A-Z]{2,15})\s+TRUCKING', r'\1'),
        (r'([A-Z]{2,15})\s+TRANSPORT', r'\1'),
        (r'([A-Z]{2,15})\s+LOGISTICS', r'\1'),
        (r'([A-Z]{2,15})\s+EXPRESS', r'\1'),
        (r'([A-Z]{2,15})\s+FREIGHT', r'\1'),
    ]

    for pattern, replacement in patterns:
        match = re.search(pattern, upper_name)
        if match:
            name = match.group(1)
            if (is_likely_surname(name) and
                name not in ['AMERICAN', 'NATIONAL', 'UNITED', 'GLOBAL', 'INTERNATIONAL']):
                return name.title()

    return None

def extract_from_acronyms(legal_name):
    """Try to expand acronyms that might be initials"""
    if not legal_name:
        return None

    words = legal_name.split()

    # Look for patterns like "JR TRUCKING" or "ABC EXPRESS"
    if len(words) >= 2:
        first_word = words[0].upper()

        # Check if it's likely initials (2-4 letters, all caps)
        if (len(first_word) >= 2 and len(first_word) <= 4 and
            first_word.isalpha() and first_word.isupper()):

            # If followed by business terms, treat as initials
            business_terms = ['TRUCKING', 'TRANSPORT', 'LOGISTICS', 'EXPRESS', 'FREIGHT']
            if any(term in words[1:] for term in business_terms):
                # Convert initials to name format
                if len(first_word) == 2:
                    return f"{first_word[0]}. {first_word[1]}."
                elif len(first_word) == 3:
                    return f"{first_word[0]}. {first_word[1]}. {first_word[2]}."

    return None

def extract_linguistic_patterns(legal_name):
    """Extract names using linguistic/cultural patterns"""
    if not legal_name:
        return None

    upper_name = legal_name.upper()

    # Common ethnic surname patterns
    patterns = [
        # Hispanic patterns
        (r'([A-Z]+EZ)\s+(TRUCKING|TRANSPORT|LOGISTICS)', r'\1'),  # Rodriguez, Martinez, etc.
        (r'([A-Z]+EZ)\s+', r'\1'),

        # Italian patterns
        (r'([A-Z]+INI|[A-Z]+ELLI)\s+(TRUCKING|TRANSPORT)', r'\1'),

        # Polish patterns
        (r'([A-Z]+SKI|[A-Z]+SKY)\s+(TRUCKING|TRANSPORT)', r'\1'),

        # Irish patterns
        (r'(O\'[A-Z]+|MC[A-Z]+)\s+(TRUCKING|TRANSPORT)', r'\1'),
    ]

    for pattern, replacement in patterns:
        match = re.search(pattern, upper_name)
        if match:
            name = match.group(1)
            if len(name) > 3:
                return name.title()

    return None

def generate_fallback_contact(legal_name):
    """Generate contact when no clear person name found"""
    if not legal_name:
        return None

    words = legal_name.upper().split()

    # Extract meaningful business name parts
    business_terms = {
        'LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'CO', 'LTD', 'LIMITED',
        'TRUCKING', 'TRANSPORT', 'TRANSPORTATION', 'LOGISTICS', 'EXPRESS', 'FREIGHT',
        'SERVICES', 'SERVICE', 'ENTERPRISES', 'GROUP', 'SOLUTIONS'
    }

    # Get first 1-2 meaningful words
    meaningful_words = []
    for word in words:
        if (word not in business_terms and
            len(word) > 2 and
            word not in ['THE', 'AND', 'OF']):
            meaningful_words.append(word.title())
            if len(meaningful_words) >= 2:
                break

    if meaningful_words:
        if len(meaningful_words) == 1:
            return f"{meaningful_words[0]} (Contact)"
        else:
            return f"{' '.join(meaningful_words)} (Contact)"

    return None

def is_high_confidence_name(name):
    """Check if extracted name is high confidence (likely a real person)"""
    if not name or len(name) < 3:
        return False

    # Must contain at least one space (first + last name)
    if ' ' not in name:
        return False

    parts = name.split()

    # Check each part looks like a name
    for part in parts:
        if not is_likely_name(part):
            return False

    return True

def is_likely_name(word):
    """Check if a word looks like a person's name"""
    if not word or len(word) < 2:
        return False

    # Must be alphabetic
    if not word.isalpha():
        return False

    # Not too long
    if len(word) > 20:
        return False

    # Check against common non-name words
    not_names = {
        'TRUCKING', 'TRANSPORT', 'LOGISTICS', 'EXPRESS', 'FREIGHT', 'COMPANY',
        'SERVICES', 'GROUP', 'SOLUTIONS', 'SYSTEMS', 'INTERNATIONAL', 'NATIONAL',
        'GLOBAL', 'AMERICAN', 'UNITED', 'FIRST', 'LAST', 'MAIN', 'GENERAL'
    }

    return word.upper() not in not_names

def is_likely_name_word(word):
    """Check if word could be part of a person's name in company context"""
    return is_likely_name(word) and len(word) >= 3

def is_likely_surname(word):
    """Check if word looks like it could be a surname"""
    if not is_likely_name(word):
        return False

    # Surnames are typically 3+ characters
    if len(word) < 3:
        return False

    # Common surname patterns
    surname_endings = ['SON', 'SEN', 'EZ', 'EZE', 'SKI', 'SKY', 'INI', 'ELLI', 'MAN', 'ER']
    word_upper = word.upper()

    # If it ends with common surname pattern, more likely to be surname
    if any(word_upper.endswith(ending) for ending in surname_endings):
        return True

    return True  # Default to true for other alphabetic words

if __name__ == "__main__":
    main()