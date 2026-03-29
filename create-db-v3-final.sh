#!/bin/bash
# Final DB-V3 Creation - Handle Multiple Insurance Policies per DOT
echo "🏆 CREATING DB-V3 FINAL - HANDLING MULTIPLE POLICIES"
echo "================================================="

INSURANCE_FILE="/var/www/vanguard/actpendins_allwithhistory.3.txt"
DOT_DB="/var/www/vanguard/DB-advanced.db"
TARGET_DB="/var/www/vanguard/DB-V3.db"

# Remove and recreate
rm -f "$TARGET_DB"

echo "🔨 Creating DB-V3 with insurance policies table..."

# Create the new structure with separate tables
sqlite3 "$TARGET_DB" <<EOF
-- Main carriers table with DOT data
CREATE TABLE carriers (
    DOT_NUMBER INTEGER PRIMARY KEY,
    LEGAL_NAME TEXT,
    PHY_STATE TEXT,
    PHY_CITY TEXT,
    PHY_ZIP TEXT,
    PHONE TEXT,
    EMAIL_ADDRESS TEXT,
    STATUS_CODE TEXT,
    BUSINESS_ORG_DESC TEXT,
    SAFETY_RATING TEXT,
    MCS150_DATE TEXT,
    POWER_UNITS TEXT,
    TRUCK_UNITS TEXT,
    CREATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insurance policies table (multiple per carrier)
CREATE TABLE insurance_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    DOT_NUMBER INTEGER,
    MC_NUMBER TEXT,
    FORM_CODE TEXT,
    COVERAGE_TYPE TEXT,
    INSURANCE_COMPANY TEXT,
    POLICY_NUMBER TEXT,
    POLICY_EFFECTIVE_DATE TEXT,
    COVERAGE_AMOUNT TEXT,
    POLICY_END_DATE TEXT,
    POLICY_CANCELLATION_DATE TEXT,
    FOREIGN KEY (DOT_NUMBER) REFERENCES carriers(DOT_NUMBER)
);

-- Indexes
CREATE INDEX idx_carriers_dot ON carriers(DOT_NUMBER);
CREATE INDEX idx_carriers_state ON carriers(PHY_STATE);
CREATE INDEX idx_policies_dot ON insurance_policies(DOT_NUMBER);
CREATE INDEX idx_policies_mc ON insurance_policies(MC_NUMBER);
CREATE INDEX idx_policies_end_date ON insurance_policies(POLICY_END_DATE);
EOF

echo "✅ Database structure created"

echo ""
echo "📊 Step 1: Import insurance data..."

# Import all insurance data first
sqlite3 "$TARGET_DB" <<EOF
CREATE TEMP TABLE insurance_raw (
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
.import $INSURANCE_FILE insurance_raw

-- Remove records with DOT_NUMBER 0 (invalid)
DELETE FROM insurance_raw WHERE DOT_NUMBER = 0 OR DOT_NUMBER IS NULL;

SELECT 'Valid insurance records: ' || COUNT(*) FROM insurance_raw;

-- Insert into policies table
INSERT INTO insurance_policies (
    DOT_NUMBER, MC_NUMBER, FORM_CODE, COVERAGE_TYPE, INSURANCE_COMPANY,
    POLICY_NUMBER, POLICY_EFFECTIVE_DATE, COVERAGE_AMOUNT, POLICY_END_DATE, POLICY_CANCELLATION_DATE
)
SELECT
    DOT_NUMBER, MC_NUMBER, FORM_CODE, COVERAGE_TYPE, INSURANCE_COMPANY,
    POLICY_NUMBER, POLICY_EFFECTIVE_DATE, COVERAGE_AMOUNT, POLICY_END_DATE, POLICY_CANCELLATION_DATE
FROM insurance_raw;

SELECT 'Insurance policies imported: ' || COUNT(*) FROM insurance_policies;
EOF

echo "✅ Insurance data imported"

echo ""
echo "📊 Step 2: Import matching DOT carriers..."

# Import only carriers that have insurance
sqlite3 "$TARGET_DB" <<EOF
ATTACH DATABASE '$DOT_DB' AS dot_db;

-- Get unique DOT numbers from insurance
CREATE TEMP TABLE unique_dots AS
SELECT DISTINCT DOT_NUMBER FROM insurance_policies;

SELECT 'Unique DOT numbers with insurance: ' || COUNT(*) FROM unique_dots;

-- Import matching carriers
INSERT INTO carriers (
    DOT_NUMBER, LEGAL_NAME, PHY_STATE, PHY_CITY, PHY_ZIP, PHONE, EMAIL_ADDRESS,
    STATUS_CODE, BUSINESS_ORG_DESC, SAFETY_RATING, MCS150_DATE, POWER_UNITS, TRUCK_UNITS
)
SELECT
    c.DOT_NUMBER, c.LEGAL_NAME, c.PHY_STATE, c.PHY_CITY, c.PHY_ZIP, c.PHONE, c.EMAIL_ADDRESS,
    c.STATUS_CODE, c.BUSINESS_ORG_DESC, c.SAFETY_RATING, c.MCS150_DATE, c.POWER_UNITS, c.TRUCK_UNITS
FROM dot_db.carriers c
INNER JOIN unique_dots u ON c.DOT_NUMBER = u.DOT_NUMBER;

SELECT 'Carriers with insurance imported: ' || COUNT(*) FROM carriers;

DETACH DATABASE dot_db;
EOF

echo "✅ Matching DOT carriers imported"

echo ""
echo "📊 DB-V3 Final Results:"

sqlite3 "$TARGET_DB" <<EOF
SELECT 'Total carriers: ' || COUNT(*) FROM carriers;
SELECT 'Total insurance policies: ' || COUNT(*) FROM insurance_policies;
SELECT 'Avg policies per carrier: ' || ROUND(CAST(COUNT(p.id) AS REAL) / COUNT(DISTINCT c.DOT_NUMBER), 2)
FROM carriers c
JOIN insurance_policies p ON c.DOT_NUMBER = p.DOT_NUMBER;

-- Top 5 states
SELECT 'Top 5 states:';
SELECT PHY_STATE, COUNT(*) as count FROM carriers WHERE PHY_STATE IS NOT NULL GROUP BY PHY_STATE ORDER BY count DESC LIMIT 5;

-- Sample records
SELECT 'Sample merged data:';
SELECT c.DOT_NUMBER, c.LEGAL_NAME, c.PHY_STATE, COUNT(p.id) as policy_count
FROM carriers c
JOIN insurance_policies p ON c.DOT_NUMBER = p.DOT_NUMBER
GROUP BY c.DOT_NUMBER, c.LEGAL_NAME, c.PHY_STATE
ORDER BY policy_count DESC
LIMIT 5;
EOF

echo ""
echo "🎯 DB-V3 CREATION COMPLETE!"
echo "📁 Database: $TARGET_DB"
ls -lh "$TARGET_DB"

echo ""
echo "💡 DATABASE STRUCTURE:"
echo "   • carriers: Main carrier info (1 per DOT number)"
echo "   • insurance_policies: All policies (multiple per carrier)"
echo "   • Use JOINs to get complete data for each carrier"