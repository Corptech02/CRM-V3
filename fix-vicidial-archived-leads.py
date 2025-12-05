#!/usr/bin/env python3
"""
Fix ViciDial Archived Leads - One-time script to fix any ViciDial leads
that were incorrectly marked as archived.
"""

import sqlite3
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_PATH = "/var/www/vanguard/vanguard.db"

def fix_vicidial_archived_leads():
    """Fix any ViciDial leads that were incorrectly marked as archived"""

    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    logger.info("🔍 Checking for ViciDial leads marked as archived...")

    # Find all ViciDial leads that are marked as archived
    cursor.execute("""
        SELECT id, data FROM leads
        WHERE json_extract(data, '$.source') = 'ViciDial'
        AND (json_extract(data, '$.archived') = true OR json_extract(data, '$.archived') = 1)
    """)

    archived_vicidial = cursor.fetchall()

    if not archived_vicidial:
        logger.info("✅ No archived ViciDial leads found - all good!")
        db.close()
        return

    logger.info(f"⚠️ Found {len(archived_vicidial)} ViciDial leads marked as archived")

    fixed_count = 0
    for lead_id, data_json in archived_vicidial:
        try:
            # Parse the lead data
            lead_data = json.loads(data_json)

            logger.info(f"🔧 Fixing archived ViciDial lead: {lead_id} - {lead_data.get('name', 'Unknown')}")

            # Set archived to false
            lead_data['archived'] = False

            # Update in database
            cursor.execute(
                "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(lead_data), lead_id)
            )

            fixed_count += 1

        except Exception as e:
            logger.error(f"❌ Error fixing lead {lead_id}: {e}")

    # Commit changes
    db.commit()
    db.close()

    logger.info(f"✅ Fixed {fixed_count} ViciDial leads!")

    return {
        "fixed_count": fixed_count,
        "total_found": len(archived_vicidial)
    }

def verify_vicidial_leads():
    """Verify all ViciDial leads are properly configured"""

    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    # Get all ViciDial leads
    cursor.execute("""
        SELECT id, data FROM leads
        WHERE json_extract(data, '$.source') = 'ViciDial'
        ORDER BY json_extract(data, '$.created') DESC
    """)

    vicidial_leads = cursor.fetchall()
    db.close()

    logger.info(f"📊 ViciDial Lead Status Report:")
    logger.info(f"   Total ViciDial leads: {len(vicidial_leads)}")

    active_count = 0
    archived_count = 0

    for lead_id, data_json in vicidial_leads:
        try:
            lead_data = json.loads(data_json)
            name = lead_data.get('name', 'Unknown')
            archived = lead_data.get('archived', False)

            if archived:
                archived_count += 1
                logger.info(f"   ⚠️ ARCHIVED: {lead_id} - {name}")
            else:
                active_count += 1
                logger.info(f"   ✅ ACTIVE: {lead_id} - {name}")

        except Exception as e:
            logger.error(f"   ❌ ERROR parsing lead {lead_id}: {e}")

    logger.info(f"📈 Summary: {active_count} active, {archived_count} archived")

    return {
        "total": len(vicidial_leads),
        "active": active_count,
        "archived": archived_count
    }

def main():
    logger.info("=" * 60)
    logger.info("🚀 ViciDial Lead Archive Status Fix")
    logger.info("=" * 60)

    # First, verify current status
    verify_result = verify_vicidial_leads()

    if verify_result['archived'] > 0:
        logger.info("🔧 Fixing archived ViciDial leads...")
        fix_result = fix_vicidial_archived_leads()

        # Verify after fix
        logger.info("📋 Verifying after fix...")
        verify_vicidial_leads()

    logger.info("=" * 60)
    logger.info("✅ ViciDial lead fix completed!")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()