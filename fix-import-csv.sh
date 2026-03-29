#!/bin/bash
# Fixed Import Script - Direct CSV to Database Import
echo "🔧 FIXING CSV IMPORT TO DB-ADVANCED"
echo "=================================="

CSV_FILE="/var/www/vanguard/company-census.csv"
DB_FILE="/var/www/vanguard/DB-advanced.db"

# Backup current database
cp "$DB_FILE" "${DB_FILE}.pre-fix-backup"
echo "💾 Database backup created"

echo "📥 Importing CSV directly to carriers table..."
echo "⏳ This will take several minutes..."

# Direct import to carriers table - SQLite will handle the column mismatch gracefully
sqlite3 "$DB_FILE" <<EOF
-- Optimize for import
PRAGMA journal_mode = OFF;
PRAGMA synchronous = OFF;
PRAGMA cache_size = 1000000;
PRAGMA locking_mode = EXCLUSIVE;
PRAGMA temp_store = MEMORY;

-- Import directly to carriers table
.mode csv
.headers on
.timer on

-- Clear any existing data
DELETE FROM carriers;

-- Import CSV (SQLite will auto-fill missing columns with NULL)
.import $CSV_FILE carriers

-- Get final count
SELECT 'Import completed - Total records: ' || COUNT(*) FROM carriers;

-- Re-enable normal settings
PRAGMA journal_mode = DELETE;
PRAGMA synchronous = NORMAL;
PRAGMA locking_mode = NORMAL;

-- Update statistics
ANALYZE;
EOF

echo ""
echo "✅ Fixed import completed!"
echo "📊 Running verification..."

# Verify import
sqlite3 "$DB_FILE" "SELECT COUNT(*) as total_records FROM carriers;"
sqlite3 "$DB_FILE" "SELECT PHY_STATE, COUNT(*) as count FROM carriers WHERE PHY_STATE IS NOT NULL GROUP BY PHY_STATE ORDER BY count DESC LIMIT 5;"

echo ""
echo "🎯 Import fix complete!"
echo "📁 Database: $DB_FILE"
echo "💾 Backup: ${DB_FILE}.pre-fix-backup"