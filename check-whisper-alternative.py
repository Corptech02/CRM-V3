#!/usr/bin/env python3
"""
Alternative check - try different API approach
"""

import requests
import json

api_key = "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"

print("Checking account status via API...\n")

# Try direct API call
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Check models endpoint directly
print("1. Checking models endpoint directly...")
response = requests.get("https://api.openai.com/v1/models", headers=headers)
if response.status_code == 200:
    models = response.json()['data']
    model_ids = [m['id'] for m in models]
    print(f"   Total models: {len(model_ids)}")

    # Check for specific models
    has_whisper = any('whisper' in m for m in model_ids)
    has_gpt4 = any('gpt-4' in m for m in model_ids)

    print(f"   Has GPT-4: {has_gpt4}")
    print(f"   Has Whisper: {has_whisper}")

    if not has_whisper:
        print("\n   ⚠️  Whisper not available yet")
else:
    print(f"   Error: {response.status_code}")

print("\n" + "="*60)
print("IMPORTANT: Your account settings need to be checked")
print("="*60)

print("""
Since you have $15 balance but only project-specific keys:

1. Go to: https://platform.openai.com/settings/organization/limits
   → Check if "Whisper" is listed under available models

2. Go to: https://platform.openai.com/settings/organization/projects
   → Click on your "Default project"
   → Check the "Limits" or "Permissions" tab
   → Make sure Whisper is enabled

3. Sometimes new accounts need manual approval for Whisper:
   → Email support@openai.com mentioning:
     "I have $15 credit but can't access Whisper API"

4. Alternative: The account might be on a restricted tier
   → Some educational/trial accounts don't get Whisper
   → You may need a regular paid account (not credits)

For now, the local Whisper is working, just slower.
""")