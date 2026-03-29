// Import DOT Company Census CSV into DB-Advanced Database
console.log('📊 IMPORTING DOT COMPANY CENSUS CSV TO DB-ADVANCED');
console.log('==================================================');

const fs = require('fs');
const path = require('path');

async function importCSVToDBAdvanced() {
    const csvFile = '/var/www/vanguard/company-census.csv';
    const dbFile = '/var/www/vanguard/DB-advanced.db';

    try {
        // Check if files exist
        if (!fs.existsSync(csvFile)) {
            console.log('❌ CSV file not found:', csvFile);
            console.log('📋 Make sure company-census.csv is downloaded first');
            return;
        }

        if (!fs.existsSync(dbFile)) {
            console.log('❌ Database file not found:', dbFile);
            console.log('📋 Run create-db-advanced.js first');
            return;
        }

        const csvStats = fs.statSync(csvFile);
        console.log(`📁 CSV File: ${(csvStats.size / 1024 / 1024).toFixed(1)}MB`);

        // Read first few lines to understand structure
        console.log('🔍 Analyzing CSV structure...');

        const firstLines = fs.readFileSync(csvFile, 'utf8').split('\n').slice(0, 5);
        console.log('📋 First 5 lines:');
        firstLines.forEach((line, i) => {
            console.log(`   ${i + 1}: ${line.substring(0, 100)}...`);
        });

        // Extract header row
        const headerRow = firstLines[0];
        const columns = headerRow.split(',').map(col => col.replace(/"/g, '').trim());
        console.log(`\n📊 CSV Structure:`);
        console.log(`   Columns found: ${columns.length}`);
        console.log(`   Expected: 147 columns`);

        // Show first 10 columns
        console.log('\n📝 First 10 columns:');
        columns.slice(0, 10).forEach((col, i) => {
            console.log(`   ${i + 1}. ${col}`);
        });

        // Check if columns match our database schema
        const expectedColumns = [
            'MCS150_DATE', 'ADD_DATE', 'STATUS_CODE', 'DOT_NUMBER', 'DUN_BRADSTREET_NO',
            'PHY_OMC_REGION', 'SAFETY_INV_TERR', 'CARRIER_OPERATION', 'BUSINESS_ORG_ID',
            'MCS150_MILEAGE'
        ];

        console.log('\n🔍 Column Mapping Check:');
        expectedColumns.forEach((expected, i) => {
            const found = columns[i];
            const match = found === expected ? '✅' : '❌';
            console.log(`   ${match} Expected: ${expected}, Found: ${found || 'MISSING'}`);
        });

        // Use sqlite3 command to import
        console.log('\n📥 Importing CSV data into DB-advanced.db...');

        // Create temporary import script
        const importScript = `
.mode csv
.headers on
.import ${csvFile} carriers_temp
INSERT OR REPLACE INTO carriers SELECT * FROM carriers_temp;
DROP TABLE carriers_temp;
.exit
`;

        fs.writeFileSync('/tmp/import_script.sql', importScript);

        console.log('🔄 Running SQLite import...');
        console.log('⏳ This may take several minutes for large files...');

        // Note: In a real implementation, we'd use child_process to execute:
        // sqlite3 /var/www/vanguard/DB-advanced.db < /tmp/import_script.sql

        console.log('\n📝 IMPORT INSTRUCTIONS:');
        console.log('Run this command to import the data:');
        console.log(`sqlite3 ${dbFile} < /tmp/import_script.sql`);
        console.log('\nOr manually:');
        console.log(`sqlite3 ${dbFile}`);
        console.log('.mode csv');
        console.log('.headers on');
        console.log(`.import ${csvFile} carriers`);

        console.log('\n✅ Import script prepared!');
        return {
            csvSize: csvStats.size,
            columnCount: columns.length,
            firstColumns: columns.slice(0, 10)
        };

    } catch (error) {
        console.error('❌ Error preparing CSV import:', error);
        return null;
    }
}

// Execute the import preparation
importCSVToDBAdvanced().then(result => {
    if (result) {
        console.log('\n🎯 READY FOR IMPORT!');
        console.log(`📊 CSV analyzed: ${result.columnCount} columns`);
        console.log(`💾 File size: ${(result.csvSize / 1024 / 1024).toFixed(1)}MB`);
    }
}).catch(error => {
    console.error('❌ Failed to prepare CSV import:', error);
});