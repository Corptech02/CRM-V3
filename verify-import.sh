#!/bin/bash
# Quick verification script for DB-Advanced import
echo "🔍 VERIFYING DB-ADVANCED IMPORT"
echo "=============================="

DB_FILE="/var/www/vanguard/DB-advanced.db"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database not found: $DB_FILE"
    exit 1
fi

echo "📊 Database file size:"
ls -lh "$DB_FILE"

echo ""
echo "📋 Quick verification queries:"
echo "============================="

echo "1. Total records imported:"
sqlite3 "$DB_FILE" "SELECT COUNT(*) as total_records FROM carriers;"

echo ""
echo "2. Top 5 states by carrier count:"
sqlite3 "$DB_FILE" "SELECT PHY_STATE, COUNT(*) as count FROM carriers WHERE PHY_STATE IS NOT NULL GROUP BY PHY_STATE ORDER BY count DESC LIMIT 5;"

echo ""
echo "3. Sample records:"
sqlite3 "$DB_FILE" "SELECT DOT_NUMBER, LEGAL_NAME, PHY_STATE FROM carriers LIMIT 3;"

echo ""
echo "4. Data source verification:"
sqlite3 "$DB_FILE" "SELECT DATA_SOURCE, COUNT(*) FROM carriers GROUP BY DATA_SOURCE;"

echo ""
echo "✅ Import verification complete!"