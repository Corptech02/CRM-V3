#!/bin/bash
# Fixed DB-V3 Merge Script
echo "🔧 FIXING DB-V3 MERGE PROCESS"
echo "============================="

INSURANCE_FILE="/var/www/vanguard/actpendins_allwithhistory.3.txt"
DOT_DB="/var/www/vanguard/DB-advanced.db"
TARGET_DB="/var/www/vanguard/DB-V3.db"

# Remove and recreate the database
rm -f "$TARGET_DB"
sqlite3 "$TARGET_DB" < /var/www/vanguard/create-db-v3.sql

echo "✅ DB-V3 structure recreated"

echo ""
echo "🔄 Step 1: Creating and populating insurance temp table..."

# Import insurance data in a single session
sqlite3 "$TARGET_DB" <<EOF
-- Create permanent insurance table (not temp)
CREATE TABLE insurance_data (
    MC_NUMBER TEXT,
    DOT_NUMBER INTEGER,
    FORM_CODE TEXT,
    COVERAGE_TYPE TEXT,
    INSURANCE_COMPANY TEXT,
    POLICY_NUMBER TEXT,
    POLICY_EFFECTIVE_DATE TEXT,
    UNKNOWN_FLAG TEXT,
    COVERAGE_AMOUNT TEXT,
    POLICY_END_DATE TEXT,
    POLICY_CANCELLATION_DATE TEXT
);

.mode csv
.separator ","
.import $INSURANCE_FILE insurance_data

SELECT 'Insurance records imported: ' || COUNT(*) FROM insurance_data;

-- Create index on DOT_NUMBER for faster joins
CREATE INDEX idx_insurance_dot ON insurance_data(DOT_NUMBER);
EOF

echo "✅ Insurance data imported successfully"

echo ""
echo "🔄 Step 2: Attaching DOT database and performing merge..."

# Attach DOT database and merge
sqlite3 "$TARGET_DB" <<EOF
-- Attach the DOT database
ATTACH DATABASE '$DOT_DB' AS dot_db;

-- Verify attachment
SELECT 'DOT database records: ' || COUNT(*) FROM dot_db.carriers;

-- Perform the merge with INNER JOIN (only matching DOT numbers)
INSERT INTO carriers_merged (
    -- DOT columns (selecting key ones first)
    DOT_NUMBER, LEGAL_NAME, PHY_STATE, PHY_CITY, PHONE, EMAIL_ADDRESS,
    STATUS_CODE, BUSINESS_ORG_DESC, SAFETY_RATING, MCS150_DATE,

    -- Insurance columns
    MC_NUMBER, FORM_CODE, COVERAGE_TYPE, INSURANCE_COMPANY, POLICY_NUMBER,
    POLICY_EFFECTIVE_DATE, UNKNOWN_FLAG, COVERAGE_AMOUNT, POLICY_END_DATE, POLICY_CANCELLATION_DATE
)
SELECT
    -- DOT data
    c.DOT_NUMBER, c.LEGAL_NAME, c.PHY_STATE, c.PHY_CITY, c.PHONE, c.EMAIL_ADDRESS,
    c.STATUS_CODE, c.BUSINESS_ORG_DESC, c.SAFETY_RATING, c.MCS150_DATE,

    -- Insurance data
    i.MC_NUMBER, i.FORM_CODE, i.COVERAGE_TYPE, i.INSURANCE_COMPANY, i.POLICY_NUMBER,
    i.POLICY_EFFECTIVE_DATE, i.UNKNOWN_FLAG, i.COVERAGE_AMOUNT, i.POLICY_END_DATE, i.POLICY_CANCELLATION_DATE

FROM insurance_data i
INNER JOIN dot_db.carriers c ON i.DOT_NUMBER = c.DOT_NUMBER;

-- Get results
SELECT 'Records successfully merged: ' || COUNT(*) FROM carriers_merged;

-- Clean up
DROP TABLE insurance_data;
DETACH DATABASE dot_db;
EOF

echo ""
echo "✅ Merge process completed!"

echo ""
echo "📊 DB-V3 Final Results:"
sqlite3 "$TARGET_DB" "
SELECT 'Total merged records: ' || COUNT(*) FROM carriers_merged;
SELECT 'Sample record count check:';
SELECT DOT_NUMBER, LEGAL_NAME, PHY_STATE, MC_NUMBER, INSURANCE_COMPANY FROM carriers_merged LIMIT 3;"

echo ""
echo "🎯 DB-V3 MERGE COMPLETE!"
ls -lh "$TARGET_DB"