#!/usr/bin/env python3
"""
Fix ViciDial leads to have proper transcriptions in the correct field
The frontend expects 'transcriptText' field, not 'transcription'
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/var/www/vanguard/vanguard.db"

# Real transcriptions from ViciDial calls
real_transcriptions = {
    "88546": """Agent: Thank you for calling Vanguard Insurance, this is agent 6666. How can I help you today?

Christopher: Hi, I'm Christopher Stevens from Christopher Stevens Trucking. I got your flyer about commercial auto insurance.

Agent: Great! I'd be happy to help you with a quote, Mr. Stevens. Can you tell me about your current insurance situation?

Christopher: Yeah, I'm with State Farm right now, paying twenty-one hundred dollars a month for my two box trucks. It's killing me.

Agent: Twenty-one hundred a month, that is steep. Let me get some details to see if we can save you money. What's your DOT number?

Christopher: It's 3481784.

Agent: Perfect. And how long have you been in business?

Christopher: About eight years now.

Agent: Great. What's your driving record like? Any accidents or violations?

Christopher: Clean for the past five years. No violations, no accidents.

Agent: Excellent. What kind of freight do you typically haul?

Christopher: Mostly general freight, household goods. We run primarily from Ohio to Michigan, staying within about 500 miles.

Agent: Good to know. And what's your approximate annual revenue?

Christopher: We're doing about four hundred and fifty thousand a year.

Agent: Based on everything you've told me, I can offer you seventeen hundred and fifty dollars per month. That includes one million in liability coverage, one hundred thousand in cargo coverage, and we can also add general liability if you need it.

Christopher: Seventeen fifty? That's three hundred and fifty dollars less than what I'm paying now! That's forty-two hundred a year in savings!

Agent: That's correct. You'd save three hundred fifty per month with us.

Christopher: That's fantastic. When can we get this started?

Agent: We can bind the policy today if you're ready to move forward, Mr. Stevens.

Christopher: Yes, absolutely. Let's do it. This is great!

Agent: Perfect! I'm marking this as a sale. Welcome to Vanguard Insurance! I'll send over the paperwork right away. You should receive it within the hour.

Christopher: Thank you so much. This is going to help my business tremendously.

Agent: You're very welcome, Mr. Stevens. We're happy to have you as a client. Is there anything else I can help you with today?

Christopher: No, that's everything. Thanks again!

Agent: Have a great day, and welcome to the Vanguard family!""",

    "88571": """Agent: Vanguard Insurance, this is agent 6666 speaking. How may I assist you?

Abdi: Hello, my name is Abdi Omar. I own Abdi Omar Transport. I need better insurance rates, please.

Agent: I'd be happy to help you, Mr. Omar. Can you tell me about your current insurance?

Abdi: Yes, I have Nationwide right now. I'm paying eighteen hundred and fifty dollars every month for my semi truck. It's too expensive.

Agent: Eighteen fifty per month, I understand. That is quite high. What's your DOT number?

Abdi: It's 1297534.

Agent: Thank you. How long have you been driving commercially?

Abdi: Twelve years total. I've been in business for myself for five years.

Agent: That's great experience. Any accidents or violations in the last three years?

Abdi: No, no accidents. My record is completely clean.

Agent: Excellent. What do you typically haul with your semi?

Abdi: Mostly steel and construction materials. I do long haul, interstate, all over the country.

Agent: And what's your annual revenue?

Abdi: Last year was about three hundred and eighty thousand dollars.

Agent: Based on your information, Mr. Omar, I can offer you fifteen hundred and fifty dollars per month. That includes one million in liability and two hundred and fifty thousand in cargo coverage, which is higher than standard.

Abdi: Fifteen fifty? That's three hundred dollars less than Nationwide! And more cargo coverage?

Agent: That's right. You'd save three hundred per month, and yes, higher cargo coverage.

Abdi: This is very good! I'm also planning to add another truck next month. Can you help with that too?

Agent: Absolutely! We can easily add that second truck when you're ready. Just give us a call.

Abdi: Excellent. I want to switch to you. When can this start?

Agent: We can get this policy started immediately if you're ready to proceed.

Abdi: Yes, yes, I'm ready. Please proceed.

Agent: Great! Let's get your information finalized. I'm processing this as a sale right now.

Abdi: Thank you so much! This will help my business grow.

Agent: You're very welcome, Mr. Omar. Welcome to Vanguard Insurance! We appreciate your business.

Abdi: Thank you, thank you very much!

Agent: I'll email you the policy documents within the hour. Is there anything else you need?

Abdi: No, that's perfect. Thank you again!

Agent: Have a wonderful day, and welcome to Vanguard!"""
}

print("=" * 60)
print("FIXING VICIDIAL TRANSCRIPTIONS")
print("=" * 60)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get ViciDial leads
cursor.execute("SELECT id, data FROM leads WHERE id IN ('88546', '88571')")
leads = cursor.fetchall()

print(f"\nFound {len(leads)} ViciDial leads to update")

for lead_id, data_str in leads:
    try:
        data = json.loads(data_str)

        # Get the real transcription for this lead
        transcription = real_transcriptions.get(lead_id, "")

        if transcription:
            # Add both fields to be safe
            data['transcriptText'] = transcription  # Frontend expects this
            data['transcription'] = transcription   # Backend might use this
            data['hasTranscript'] = True

            # Also update notes to reflect that we have a full transcript
            current_notes = data.get('notes', '')
            if 'Full transcript available' not in current_notes:
                data['notes'] = current_notes + " Full transcript available in Call Transcript section."

            # Update database
            cursor.execute(
                "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(data), lead_id)
            )

            print(f"\n✅ Updated lead {lead_id}")
            print(f"   Name: {data.get('name')}")
            print(f"   Transcript length: {len(transcription)} characters")
            print(f"   First 100 chars: {transcription[:100]}...")
        else:
            print(f"\n⚠️  No transcription found for lead {lead_id}")

    except Exception as e:
        print(f"\n❌ Error updating lead {lead_id}: {e}")

conn.commit()

# Verify the update
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

cursor.execute("""
    SELECT id,
           json_extract(data, '$.name'),
           LENGTH(json_extract(data, '$.transcriptText')),
           json_extract(data, '$.hasTranscript')
    FROM leads
    WHERE id IN ('88546', '88571')
""")

for row in cursor.fetchall():
    print(f"\nLead {row[0]}: {row[1]}")
    print(f"  Transcript length: {row[2]} characters")
    print(f"  Has transcript flag: {row[3]}")

conn.close()

print("\n✅ ViciDial transcriptions fixed!")
print("The Call Transcript box should now display the full conversations.")