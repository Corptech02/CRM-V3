#!/usr/bin/env python3
"""
Transcription Service using OpenAI Whisper (free, local)
and OpenAI API for organizing the transcribed information
"""

import whisper
import json
import os
import sys
from pathlib import Path

class TranscriptionService:
    def __init__(self):
        print("Loading Whisper model (this may take a moment on first run)...")
        # Use 'tiny' model for speed (will download ~39MB on first run)
        # Options: tiny (39MB), base (74MB), small (244MB), medium (769MB), large (1550MB)
        self.model = whisper.load_model("tiny")
        print("Whisper model loaded successfully!")

    def transcribe_audio(self, audio_file_path):
        """Transcribe audio file using Whisper"""
        try:
            print(f"Transcribing: {audio_file_path}")

            # Transcribe the audio
            result = self.model.transcribe(audio_file_path)

            # Return the transcribed text
            return {
                "success": True,
                "text": result["text"],
                "segments": result.get("segments", [])
            }

        except Exception as e:
            print(f"Error transcribing: {e}")
            return {
                "success": False,
                "error": str(e),
                "text": ""
            }

    def format_as_conversation(self, transcription_text):
        """
        Format transcription as a conversation
        This is a simple heuristic - can be improved with OpenAI
        """

        # Simple formatting - split into sentences and alternate speakers
        sentences = transcription_text.replace(".", ".|").replace("?", "?|").replace("!", "!|").split("|")
        sentences = [s.strip() for s in sentences if s.strip()]

        formatted = []
        is_agent = True  # Assume agent speaks first

        for sentence in sentences:
            if sentence:
                speaker = "Agent" if is_agent else "Customer"
                formatted.append(f"{speaker}: {sentence}")

                # Switch speaker for questions or after 2 sentences
                if "?" in sentence or len(formatted) % 3 == 0:
                    is_agent = not is_agent

        return "\n".join(formatted)

    def extract_insurance_info(self, transcription_text):
        """
        Extract insurance-related information from transcription
        This would ideally use OpenAI API for better extraction
        """

        info = {
            "current_carrier": "",
            "current_premium": 0,
            "quoted_premium": 0,
            "savings": 0,
            "dot_number": "",
            "vehicle_type": "",
            "coverage": {
                "liability": "",
                "cargo": ""
            }
        }

        # Simple keyword extraction
        text_lower = transcription_text.lower()

        # Look for carrier names
        carriers = ["state farm", "nationwide", "progressive", "geico", "allstate", "farmers"]
        for carrier in carriers:
            if carrier in text_lower:
                info["current_carrier"] = carrier.title()
                break

        # Look for DOT numbers (7 digits)
        import re
        dot_matches = re.findall(r'\b\d{7}\b', transcription_text)
        if dot_matches:
            info["dot_number"] = dot_matches[0]

        # Look for dollar amounts
        dollar_matches = re.findall(r'\$?([\d,]+)\s*(?:dollars?|per month|monthly)', text_lower)
        if dollar_matches:
            amounts = [int(m.replace(',', '')) for m in dollar_matches]
            if len(amounts) >= 2:
                info["current_premium"] = max(amounts)
                info["quoted_premium"] = min(amounts)
                info["savings"] = info["current_premium"] - info["quoted_premium"]
            elif len(amounts) == 1:
                info["quoted_premium"] = amounts[0]

        # Look for vehicle types
        vehicles = ["truck", "semi", "box truck", "trailer", "van"]
        for vehicle in vehicles:
            if vehicle in text_lower:
                info["vehicle_type"] = vehicle.title()
                break

        # Look for coverage amounts
        if "million" in text_lower:
            info["coverage"]["liability"] = "$1,000,000"
        if "hundred thousand" in text_lower or "100,000" in text_lower:
            info["coverage"]["cargo"] = "$100,000"

        return info

def main():
    """Process audio file from command line"""

    if len(sys.argv) < 2:
        print("Usage: python transcription-service.py <audio_file>")
        sys.exit(1)

    audio_file = sys.argv[1]

    if not os.path.exists(audio_file):
        print(f"Error: File not found: {audio_file}")
        sys.exit(1)

    # Initialize service
    service = TranscriptionService()

    # Transcribe audio
    result = service.transcribe_audio(audio_file)

    if result["success"]:
        # Format as conversation
        formatted = service.format_as_conversation(result["text"])

        # Extract insurance information
        info = service.extract_insurance_info(result["text"])

        # Output JSON result
        output = {
            "success": True,
            "raw_text": result["text"],
            "formatted_conversation": formatted,
            "extracted_info": info,
            "segments": result.get("segments", [])
        }

        print(json.dumps(output, indent=2))
    else:
        print(json.dumps(result))

if __name__ == "__main__":
    main()