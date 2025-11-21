#!/usr/bin/env python3
"""
Test if Whisper is working properly
"""

import whisper
import time
import os

print("Testing Whisper setup...")

# Check if audio file exists
audio_file = "/var/www/vanguard/recordings/lead_88546.mp3"

if os.path.exists(audio_file):
    print(f"✓ Audio file found: {audio_file}")
    print(f"  Size: {os.path.getsize(audio_file):,} bytes")
else:
    print(f"✗ Audio file not found: {audio_file}")
    exit(1)

print("\nLoading Whisper tiny model...")
start = time.time()

try:
    model = whisper.load_model("tiny")
    print(f"✓ Model loaded in {time.time() - start:.1f} seconds")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    exit(1)

print("\nTranscribing audio (this may take 30-60 seconds)...")
start = time.time()

try:
    # Try with reduced options for speed
    result = model.transcribe(
        audio_file,
        fp16=False,  # Use FP32 on CPU
        language='en',  # Specify English to skip language detection
        verbose=True  # Show progress
    )

    elapsed = time.time() - start
    print(f"\n✓ Transcription completed in {elapsed:.1f} seconds")
    print(f"  Text length: {len(result['text'])} characters")
    print(f"  First 200 chars: {result['text'][:200]}...")

except Exception as e:
    print(f"\n✗ Transcription failed: {e}")
    exit(1)

print("\n✅ Whisper test successful!")