#!/usr/bin/env python3
"""ViciDial Sync Service - Uses the new Vanguard sync system adapted from Lead-Transfer"""

import os
import sys
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Add parent directory to path to import the main sync script
sys.path.append('/var/www/vanguard')

def sync_vicidial_leads():
    """Main sync function - uses the adapted Lead-Transfer system"""
    try:
        # Import here to avoid issues if file doesn't exist yet
        from vanguard_vicidial_sync import VanguardViciDialSync

        logging.info("Starting ViciDial sync using Vanguard sync system...")
        sync = VanguardViciDialSync()
        result = sync.sync_vicidial_leads()

        # Return result for API endpoint
        return result
    except ImportError as e:
        logging.error(f"Import error: {e}")
        return {"success": False, "error": "Sync module not found", "imported": 0}
    except Exception as e:
        logging.error(f"Sync error: {e}")
        return {"success": False, "error": str(e), "imported": 0}

def main():
    """Main entry point for both manual and PM2 execution"""
    result = sync_vicidial_leads()

    # Output result as JSON for the API endpoint
    print(json.dumps(result))

    # Return exit code based on success
    sys.exit(0 if result.get("success") else 1)

if __name__ == "__main__":
    import time

    # Check if running in continuous mode
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        logging.info("Running in continuous mode (every 5 minutes)")
        while True:
            main()
            time.sleep(300)  # 5 minutes
    else:
        main()