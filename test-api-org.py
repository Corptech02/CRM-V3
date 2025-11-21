#!/usr/bin/env python3
"""
Check OpenAI organization and project settings
"""

from openai import OpenAI
import json

api_key = "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"

client = OpenAI(api_key=api_key)

print("Checking API key details...\n")

# Try to decode the project ID from the key
if "proj_" in api_key:
    proj_start = api_key.find("proj_")
    proj_end = api_key.find("-", proj_start + 5)
    if proj_end == -1:
        proj_end = api_key.find("_", proj_start + 5)
    project_id = api_key[proj_start:proj_end] if proj_end != -1 else "Unknown"
    print(f"Project ID in key: {project_id}")

# List all available models
print("\nChecking all available models...")
try:
    models = list(client.models.list())

    # Group models by type
    model_types = {}
    for model in models:
        model_type = model.id.split('-')[0]
        if model_type not in model_types:
            model_types[model_type] = []
        model_types[model_type].append(model.id)

    print(f"Total models available: {len(models)}")
    print("\nModels by type:")
    for mtype, mlist in sorted(model_types.items()):
        print(f"  {mtype}: {len(mlist)} models")
        if mtype in ['whisper', 'tts', 'dall']:
            print(f"    → {', '.join(mlist[:3])}")

    # Specifically check for audio models
    audio_models = [m.id for m in models if any(x in m.id.lower() for x in ['whisper', 'tts', 'audio'])]
    if audio_models:
        print(f"\n✓ Audio models found: {audio_models}")
    else:
        print("\n✗ No audio models (Whisper/TTS) found")
        print("\nThis means your project doesn't have audio API access enabled yet.")

except Exception as e:
    print(f"Error listing models: {e}")

print("\n" + "="*50)
print("SOLUTION:")
print("="*50)
print("Since you have $15 balance but no Whisper access, try:")
print("1. Create a NEW API key (not project-specific):")
print("   → Go to https://platform.openai.com/api-keys")
print("   → Click 'Create new secret key'")
print("   → DON'T select a specific project - leave it as 'Default'")
print("   → This gives access to ALL APIs including Whisper")
print("\n2. Or wait ~10 minutes for current project to update")
print("\n3. Or check project settings at:")
print("   https://platform.openai.com/settings/organization/projects")