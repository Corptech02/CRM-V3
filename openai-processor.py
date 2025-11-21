#!/usr/bin/env python3
"""
OpenAI Integration for processing ViciDial transcriptions
Extracts structured insurance information from call transcripts
"""

import os
import json
from openai import OpenAI

# Set your OpenAI API key
OPENAI_API_KEY = "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"

class OpenAIProcessor:
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def process_transcription(self, raw_transcription, lead_info=None):
        """
        Process raw transcription with OpenAI to extract structured data
        """

        # Create a context-aware prompt
        context = ""
        if lead_info:
            context = f"""
Lead Information:
- Lead ID: {lead_info.get('lead_id', 'Unknown')}
- Phone: {lead_info.get('phone', 'Unknown')}
- Name: {lead_info.get('full_name', 'Unknown')}
- City: {lead_info.get('city', 'Unknown')}
- DOT Number: {lead_info.get('vendor_code', 'Unknown')}
"""

        prompt = f"""{context}

Please analyze this insurance sales call transcription and extract the following information in JSON format:

Transcription:
{raw_transcription}

Extract and return ONLY a JSON object with these fields:
{{
    "customer_name": "Full name of the customer",
    "business_name": "Name of the business/trucking company",
    "dot_number": "DOT number if mentioned",
    "mc_number": "MC number if mentioned",
    "phone": "Phone number if mentioned",
    "email": "Email address if mentioned",
    "city": "City/location",
    "state": "State (2-letter code like OH, TX)",
    "years_in_business": "Years in business or years driving",
    "fleet_size": "Number of trucks/vehicles in fleet (number only)",
    "radius_of_operation": "Local/Regional/National or specific mile radius",
    "commodity_hauled": "Type of cargo/freight hauled",
    "operating_states": "List of states they operate in",
    "vehicles": [
        {{
            "year": "Year if mentioned",
            "make": "Make (Peterbilt, Kenworth, Freightliner, etc.)",
            "model": "Model number (379, 389, T680, etc.)",
            "vin": "VIN if mentioned",
            "value": "Value if mentioned",
            "gvwr": "GVWR if mentioned"
        }}
    ],
    "trailers": [
        {{
            "year": "Year if mentioned",
            "make": "Make if mentioned",
            "type": "Type (Dump, Flatbed, Reefer, etc.)",
            "vin": "VIN if mentioned",
            "length": "Length if mentioned",
            "value": "Value if mentioned"
        }}
    ],
    "drivers": [
        {{
            "name": "Driver name if mentioned",
            "cdl_years": "Years with CDL",
            "experience": "Years of experience"
        }}
    ],
    "current_carrier": "Current insurance company",
    "current_premium": "Current premium amount (number only)",
    "quoted_premium": "Quoted premium amount (number only)",
    "savings": "Amount saved (number only)",
    "renewal_date": "Policy renewal/expiration date if mentioned (format: MM/DD/YYYY or relative like 'next month', '30 days')",
    "policy_expiring_soon": "true/false - true if mentioned as expiring soon, near expiration, coming up",
    "coverage_liability": "Liability coverage amount",
    "coverage_cargo": "Cargo coverage amount",
    "physical_damage": "Physical damage coverage if mentioned",
    "deductible": "Deductible amount if mentioned",
    "call_outcome": "SALE, QUOTE, CALLBACK, or OTHER",
    "agent_name": "Agent name or ID",
    "key_points": ["List of key points from the call"],
    "follow_up_needed": true/false,
    "follow_up_notes": "Any follow-up notes"
}}

If a field is not mentioned in the transcription, use null for that field.

IMPORTANT INSTRUCTIONS for vehicles and trailers:
- Create ONE ENTRY for EACH individual vehicle (if they say "6 trucks", create 6 vehicle entries)
- Create ONE ENTRY for EACH individual trailer (if they say "8 trailers", create 8 trailer entries)
- If they mention "3 Kenworth and 3 Peterbilt", create 6 entries total (3 with make: Kenworth, 3 with make: Peterbilt)
- If they mention specific models like "379, 389, T680", assign these to individual entries
- For example: "I have 3 Peterbilt 379s" should create 3 separate vehicle entries, each with make: "Peterbilt" and model: "379"

Pay special attention to extracting:
- Exact count and create that many individual entries
- Vehicle details (makes, models, years) distributed across entries
- Specific model numbers (379, 389, T680, W900, etc.)
- Values for individual vehicles if mentioned
- Operating radius and states
- Type of freight/commodity hauled
- RENEWAL/EXPIRATION DATES: Listen for "expiring soon", "near expiration", "coming up for renewal", "expires in X days/months"
  If they mention the policy is expiring soon but no exact date, estimate based on today's date (9/21/2025) plus typical renewal periods (30-60 days)"""

        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Using 3.5 for cost efficiency
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing insurance sales calls and extracting structured data. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent extraction
                max_tokens=1000
            )

            # Parse the response
            result = response.choices[0].message.content

            # Try to parse as JSON
            try:
                data = json.loads(result)
                return {
                    "success": True,
                    "data": data,
                    "tokens_used": response.usage.total_tokens
                }
            except json.JSONDecodeError:
                # If not valid JSON, try to extract JSON from the response
                import re
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                    return {
                        "success": True,
                        "data": data,
                        "tokens_used": response.usage.total_tokens
                    }
                else:
                    return {
                        "success": False,
                        "error": "Could not parse JSON from response",
                        "raw_response": result
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def format_conversation(self, raw_text):
        """
        Use OpenAI to format a raw transcription into a clean conversation
        """

        prompt = f"""Format this transcription into a clean conversation format with clear Agent: and Customer: labels.
Fix any transcription errors and make it easy to read.

Raw transcription:
{raw_text}

Return ONLY the formatted conversation, nothing else."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert at formatting call transcriptions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"Error formatting: {str(e)}"

    def extract_policy_details(self, transcription):
        """
        Extract specific insurance policy details
        """

        prompt = f"""From this insurance call, extract policy-specific details.

Transcription:
{transcription}

Return a JSON object with:
{{
    "policy_type": "Commercial Auto/Trucking/Other",
    "effective_date": "Date if mentioned",
    "vehicles": [
        {{
            "type": "Vehicle type",
            "year": "Year if mentioned",
            "make": "Make if mentioned",
            "model": "Model if mentioned",
            "vin": "VIN if mentioned",
            "value": "Value if mentioned"
        }}
    ],
    "coverage_details": {{
        "liability_limit": "Amount",
        "cargo_limit": "Amount",
        "physical_damage": "Yes/No/Amount",
        "deductible": "Amount",
        "additional_coverage": ["List any additional coverage mentioned"]
    }},
    "driver_info": {{
        "name": "Driver name",
        "cdl": "Yes/No",
        "years_experience": "Years",
        "violations": "Any mentioned violations",
        "accidents": "Any mentioned accidents"
    }}
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an insurance policy data extractor. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=800
            )

            result = response.choices[0].message.content
            return json.loads(result)

        except Exception as e:
            return {"error": str(e)}


def test_with_sample():
    """Test the processor with a sample transcription"""

    processor = OpenAIProcessor()

    # Sample transcription
    sample_transcription = """
    hello thank you for calling vanguard insurance this is agent 6666 how can i help you today
    hi im christopher stevens from christopher stevens trucking i need a quote for commercial auto insurance
    id be happy to help you mister stevens what are you currently paying
    im with state farm right now paying twenty one hundred dollars a month for my two box trucks
    thats quite high let me see what we can do whats your dot number
    its three four eight one seven eight four
    perfect and how long have you been in business
    about eight years now operating out of toledo
    excellent based on your clean record and experience i can offer you seventeen hundred and fifty dollars per month
    that includes one million in liability and hundred thousand in cargo coverage
    thats three hundred and fifty dollars less per month thats great
    yes youd save forty two hundred per year with us
    lets do it when can we start
    we can bind the policy today if youre ready
    yes absolutely lets proceed
    perfect im marking this as a sale welcome to vanguard insurance
    """

    # Test with lead context
    lead_info = {
        'lead_id': '88546',
        'phone': '4195600189',
        'full_name': 'CHRISTOPHER STEVENS',
        'city': 'TOLEDO',
        'vendor_code': '3481784'
    }

    print("Processing transcription with OpenAI...")
    result = processor.process_transcription(sample_transcription, lead_info)

    if result['success']:
        print("\n✅ Successfully processed!")
        print(f"Tokens used: {result.get('tokens_used', 'Unknown')}")
        print("\nExtracted Data:")
        print(json.dumps(result['data'], indent=2))
    else:
        print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
        if 'raw_response' in result:
            print(f"Raw response: {result['raw_response']}")


if __name__ == "__main__":
    import sys
    import json

    # Check if we have input data from Node.js
    try:
        # Read JSON data from stdin
        input_data = sys.stdin.read().strip()

        if input_data:
            # Parse input data
            data = json.loads(input_data)
            transcript = data.get('transcript', '')
            lead_info = data.get('lead_info', {})

            if transcript:
                processor = OpenAIProcessor()
                result = processor.process_transcription(transcript, lead_info)

                # Output JSON result for Node.js
                print(json.dumps(result))
            else:
                print(json.dumps({
                    "success": False,
                    "error": "No transcript provided"
                }))
        else:
            # No input, run test
            test_with_sample()

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))