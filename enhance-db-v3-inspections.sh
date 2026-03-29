#!/bin/bash
# Enhance DB-V3 with Inspection Data - Only Matched DOT Numbers
echo "🚛 ENHANCING DB-V3 WITH INSPECTION DATA"
echo "======================================"

INSPECTION_FILE="/var/www/vanguard/inspection-data.csv"
TARGET_DB="/var/www/vanguard/DB-V3.db"

echo "📊 Source Data:"
echo "   Inspection records: $(wc -l < $INSPECTION_FILE | tr -d ' ') (5.76M)"
echo "   Current carriers: $(sqlite3 $TARGET_DB 'SELECT COUNT(*) FROM carriers;') (428k)"

echo ""
echo "🔨 Step 1: Adding inspection table to DB-V3..."

# Add inspection table to existing DB-V3
sqlite3 "$TARGET_DB" <<EOF
-- Create inspection table with all columns
CREATE TABLE IF NOT EXISTS inspections (
    Unique_ID TEXT PRIMARY KEY,
    Report_Number TEXT,
    Report_State TEXT,
    DOT_Number INTEGER,
    Insp_Date TEXT,
    County_code_State TEXT,
    Insp_level_ID TEXT,
    Time_Weight TEXT,
    Driver_OOS_Total INTEGER,
    Vehicle_OOS_Total INTEGER,
    Total_Hazmat_Sent INTEGER,
    OOS_Total INTEGER,
    Hazmat_OOS_Total INTEGER,
    Hazmat_Placard_req TEXT,

    -- Unit 1 Information
    Unit_Type_Desc TEXT,
    Unit_Make TEXT,
    Unit_License TEXT,
    Unit_License_State TEXT,
    VIN TEXT,
    Unit_Decal_Number TEXT,

    -- Unit 2 Information
    Unit_Type_Desc2 TEXT,
    Unit_Make2 TEXT,
    Unit_License2 TEXT,
    Unit_License_State2 TEXT,
    VIN2 TEXT,
    Unit_Decal_Number2 TEXT,

    -- Inspection Categories
    Unsafe_Insp TEXT,
    Fatigued_Insp TEXT,
    Dr_Fitness_Insp TEXT,
    Subt_Alcohol_Insp TEXT,
    Vh_Maint_Insp TEXT,
    BASIC_Viol INTEGER,
    HM_Insp TEXT,

    -- Violation Counts
    Unsafe_Viol INTEGER,
    Fatigued_Viol INTEGER,
    Dr_Fitness_Viol INTEGER,
    Subt_Alcohol_Viol INTEGER,
    Vh_Maint_Viol INTEGER,
    HM_Viol INTEGER,

    -- Metadata
    CREATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DOT_Number) REFERENCES carriers(DOT_NUMBER)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspections_dot ON inspections(DOT_Number);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(Insp_Date);
CREATE INDEX IF NOT EXISTS idx_inspections_state ON inspections(Report_State);
CREATE INDEX IF NOT EXISTS idx_inspections_oos ON inspections(OOS_Total);
CREATE INDEX IF NOT EXISTS idx_inspections_violations ON inspections(BASIC_Viol);

SELECT 'Inspection table structure created';
EOF

echo "✅ Inspection table added to DB-V3"

echo ""
echo "🔄 Step 2: Importing and filtering inspection data..."

# Import only inspections that match existing carriers
sqlite3 "$TARGET_DB" <<EOF
-- Create temporary table for all inspection data
CREATE TEMP TABLE inspections_raw (
    Unique_ID TEXT,
    Report_Number TEXT,
    Report_State TEXT,
    DOT_Number INTEGER,
    Insp_Date TEXT,
    County_code_State TEXT,
    Insp_level_ID TEXT,
    Time_Weight TEXT,
    Driver_OOS_Total INTEGER,
    Vehicle_OOS_Total INTEGER,
    Total_Hazmat_Sent INTEGER,
    OOS_Total INTEGER,
    Hazmat_OOS_Total INTEGER,
    Hazmat_Placard_req TEXT,
    Unit_Type_Desc TEXT,
    Unit_Make TEXT,
    Unit_License TEXT,
    Unit_License_State TEXT,
    VIN TEXT,
    Unit_Decal_Number TEXT,
    Unit_Type_Desc2 TEXT,
    Unit_Make2 TEXT,
    Unit_License2 TEXT,
    Unit_License_State2 TEXT,
    VIN2 TEXT,
    Unit_Decal_Number2 TEXT,
    Unsafe_Insp TEXT,
    Fatigued_Insp TEXT,
    Dr_Fitness_Insp TEXT,
    Subt_Alcohol_Insp TEXT,
    Vh_Maint_Insp TEXT,
    BASIC_Viol INTEGER,
    HM_Insp TEXT,
    Unsafe_Viol INTEGER,
    Fatigued_Viol INTEGER,
    Dr_Fitness_Viol INTEGER,
    Subt_Alcohol_Viol INTEGER,
    Vh_Maint_Viol INTEGER,
    HM_Viol INTEGER
);

-- Import all inspection data
.mode csv
.separator ","
.headers on
.import $INSPECTION_FILE inspections_raw

SELECT 'Total inspection records imported: ' || COUNT(*) FROM inspections_raw;

-- Insert only inspections that match existing carriers (INNER JOIN)
INSERT INTO inspections (
    Unique_ID, Report_Number, Report_State, DOT_Number, Insp_Date,
    County_code_State, Insp_level_ID, Time_Weight, Driver_OOS_Total, Vehicle_OOS_Total,
    Total_Hazmat_Sent, OOS_Total, Hazmat_OOS_Total, Hazmat_Placard_req, Unit_Type_Desc,
    Unit_Make, Unit_License, Unit_License_State, VIN, Unit_Decal_Number,
    Unit_Type_Desc2, Unit_Make2, Unit_License2, Unit_License_State2, VIN2,
    Unit_Decal_Number2, Unsafe_Insp, Fatigued_Insp, Dr_Fitness_Insp, Subt_Alcohol_Insp,
    Vh_Maint_Insp, BASIC_Viol, HM_Insp, Unsafe_Viol, Fatigued_Viol,
    Dr_Fitness_Viol, Subt_Alcohol_Viol, Vh_Maint_Viol, HM_Viol
)
SELECT
    i.Unique_ID, i.Report_Number, i.Report_State, i.DOT_Number, i.Insp_Date,
    i.County_code_State, i.Insp_level_ID, i.Time_Weight, i.Driver_OOS_Total, i.Vehicle_OOS_Total,
    i.Total_Hazmat_Sent, i.OOS_Total, i.Hazmat_OOS_Total, i.Hazmat_Placard_req, i.Unit_Type_Desc,
    i.Unit_Make, i.Unit_License, i.Unit_License_State, i.VIN, i.Unit_Decal_Number,
    i.Unit_Type_Desc2, i.Unit_Make2, i.Unit_License2, i.Unit_License_State2, i.VIN2,
    i.Unit_Decal_Number2, i.Unsafe_Insp, i.Fatigued_Insp, i.Dr_Fitness_Insp, i.Subt_Alcohol_Insp,
    i.Vh_Maint_Insp, i.BASIC_Viol, i.HM_Insp, i.Unsafe_Viol, i.Fatigued_Viol,
    i.Dr_Fitness_Viol, i.Subt_Alcohol_Viol, i.Vh_Maint_Viol, i.HM_Viol
FROM inspections_raw i
INNER JOIN carriers c ON i.DOT_Number = c.DOT_NUMBER
WHERE i.DOT_Number IS NOT NULL AND i.DOT_Number != '';

SELECT 'Matched inspection records imported: ' || COUNT(*) FROM inspections;

-- Clean up
DROP TABLE inspections_raw;
EOF

echo "✅ Matched inspection data imported"

echo ""
echo "📊 Enhanced DB-V3 Results:"

sqlite3 "$TARGET_DB" <<EOF
-- Summary statistics
SELECT 'Total carriers: ' || COUNT(*) FROM carriers;
SELECT 'Total insurance policies: ' || COUNT(*) FROM insurance_policies;
SELECT 'Total inspections: ' || COUNT(*) FROM inspections;

-- Inspection statistics
SELECT 'Carriers with inspections: ' || COUNT(DISTINCT DOT_Number) FROM inspections;
SELECT 'Average inspections per carrier: ' ||
       ROUND(CAST(COUNT(*) AS REAL) / COUNT(DISTINCT DOT_Number), 2)
FROM inspections;

-- Recent inspection activity (2023-2024)
SELECT 'Recent inspections (2023-2024): ' || COUNT(*)
FROM inspections
WHERE Insp_Date LIKE '%2023%' OR Insp_Date LIKE '%2024%';

-- Out of Service Statistics
SELECT 'Total OOS events: ' || COUNT(*)
FROM inspections
WHERE OOS_Total > 0;

-- Top 5 states by inspection count
SELECT 'Top inspection states:';
SELECT Report_State, COUNT(*) as inspection_count
FROM inspections
WHERE Report_State IS NOT NULL
GROUP BY Report_State
ORDER BY inspection_count DESC
LIMIT 5;
EOF

echo ""
echo "🎯 DB-V3 INSPECTION ENHANCEMENT COMPLETE!"
echo "📁 Database: $TARGET_DB"
ls -lh "$TARGET_DB"

echo ""
echo "✅ Enhanced DB-V3 now includes:"
echo "   • 428k+ carriers with full DOT data"
echo "   • 464k+ insurance policies"
echo "   • Inspection records with VIN, violations, OOS data"
echo "   • Cross-referenced by DOT number"
echo "   • Multiple inspections per carrier supported"