#!/bin/bash
# Optimized Import Script for Large DOT Company Census CSV (2GB+)
echo "🚛 IMPORTING LARGE DOT COMPANY CENSUS FILE"
echo "========================================"

CSV_FILE="/var/www/vanguard/company-census.csv"
DB_FILE="/var/www/vanguard/DB-advanced.db"

# Check if files exist
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV file not found: $CSV_FILE"
    exit 1
fi

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database not found: $DB_FILE"
    echo "📝 Run create-db-advanced.js first"
    exit 1
fi

# Get file sizes
CSV_SIZE=$(du -h "$CSV_FILE" | cut -f1)
echo "📁 CSV File Size: $CSV_SIZE"

# Show first few lines to verify structure
echo ""
echo "🔍 CSV Structure Check:"
echo "======================"
head -3 "$CSV_FILE"

echo ""
echo "📊 Starting import process..."
echo "⏳ This may take 15-30 minutes for a 2GB file"

# Create backup of empty database
cp "$DB_FILE" "${DB_FILE}.backup"
echo "💾 Database backup created"

# Import with optimized settings
sqlite3 "$DB_FILE" <<EOF
-- Optimize SQLite for large imports
PRAGMA journal_mode = OFF;
PRAGMA synchronous = OFF;
PRAGMA cache_size = 1000000;
PRAGMA locking_mode = EXCLUSIVE;
PRAGMA temp_store = MEMORY;

-- Create temporary table for import
.mode csv
.headers on
.timer on

-- Import into temporary table first
CREATE TEMP TABLE carriers_import AS SELECT * FROM carriers WHERE 1=0;
.import $CSV_FILE carriers_import

-- Get count
SELECT 'Records imported: ' || COUNT(*) FROM carriers_import;

-- Insert into main table
INSERT OR REPLACE INTO carriers SELECT * FROM carriers_import;

-- Verify final count
SELECT 'Final record count: ' || COUNT(*) FROM carriers;

-- Re-enable normal settings
PRAGMA journal_mode = DELETE;
PRAGMA synchronous = NORMAL;
PRAGMA locking_mode = NORMAL;

-- Update statistics
ANALYZE;
EOF

echo ""
echo "✅ Import completed!"
echo "📊 Running verification..."

# Quick verification
sqlite3 "$DB_FILE" "SELECT COUNT(*) as total_records FROM carriers;"
sqlite3 "$DB_FILE" "SELECT PHY_STATE, COUNT(*) as count FROM carriers WHERE PHY_STATE IS NOT NULL GROUP BY PHY_STATE ORDER BY count DESC LIMIT 5;"

echo ""
echo "🎯 Import successful!"
echo "📁 Database: $DB_FILE"
echo "💾 Backup: ${DB_FILE}.backup"