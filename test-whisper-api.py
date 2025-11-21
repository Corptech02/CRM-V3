#!/usr/bin/env python3
"""
Test OpenAI Whisper API access with new key
"""

from openai import OpenAI
import sys

# Your new funded API key
api_key = "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"

print("Testing OpenAI API key...")

try:
    client = OpenAI(api_key=api_key)

    # Test 1: Check GPT access
    print("\n1. Testing GPT-3.5 access...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Say 'API works'"}],
        max_tokens=10
    )
    print(f"   ✓ GPT-3.5 works: {response.choices[0].message.content}")

    # Test 2: List available models
    print("\n2. Checking available models...")
    models = client.models.list()
    whisper_models = [m.id for m in models if 'whisper' in m.id.lower()]
    if whisper_models:
        print(f"   ✓ Whisper models available: {whisper_models}")
    else:
        print("   ✗ No Whisper models found in available models")

    # Test 3: Try Whisper with a small audio file
    print("\n3. Testing Whisper API...")
    audio_file = "/var/www/vanguard/recordings/lead_88546.mp3"

    with open(audio_file, 'rb') as audio:
        try:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                response_format="text"
            )
            print(f"   ✓ Whisper API works! Transcribed {len(response)} characters")
        except Exception as e:
            print(f"   ✗ Whisper API error: {e}")

            # Check error details
            if "model_not_found" in str(e):
                print("\n   Note: Your API key doesn't have Whisper access yet.")
                print("   Please check:")
                print("   1. Your payment method is active at https://platform.openai.com/settings/organization/billing")
                print("   2. You may need to wait a few minutes after adding payment")
                print("   3. Try generating a new API key after payment is confirmed")

except Exception as e:
    print(f"\n✗ API key error: {e}")
    print("\nPlease verify your API key is correct and has proper permissions.")