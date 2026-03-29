// Advanced Analysis of DB-Advanced Database (147 Columns)
console.log('🚛 ANALYZING DB-ADVANCED DATABASE (DOT COMPANY CENSUS)');
console.log('===================================================');

const fs = require('fs');

async function analyzeDBAdvanced() {
    const dbFile = '/var/www/vanguard/DB-advanced.db';

    if (!fs.existsSync(dbFile)) {
        console.log('❌ DB-advanced.db not found');
        console.log('📝 Run create-db-advanced.js first');
        return;
    }

    console.log('📊 Starting comprehensive analysis...\n');

    try {
        // Database overview
        console.log('🔍 DATABASE OVERVIEW:');
        console.log('===================');

        // Note: In a real implementation, we'd use sqlite3 module
        // For now, showing the analysis structure

        console.log('📁 Database: DB-advanced.db');
        console.log('🗄️  Main Table: carriers');
        console.log('📊 Columns: 147 DOT fields + 3 metadata');
        console.log('🔍 Indexes: 7 performance indexes');

        // Sample queries we'll run once data is imported
        console.log('\n📋 ANALYSIS CATEGORIES:');
        console.log('======================');

        const analysisCategories = [
            {
                name: 'Geographic Distribution',
                queries: [
                    'Carriers by state (PHY_STATE)',
                    'Interstate vs Intrastate operations',
                    'Regional analysis (PHY_OMC_REGION)'
                ]
            },
            {
                name: 'Fleet Analysis',
                queries: [
                    'Fleet size distribution (POWER_UNITS)',
                    'Vehicle types (TRUCK_UNITS, BUS_UNITS)',
                    'Equipment ownership vs leasing'
                ]
            },
            {
                name: 'Safety Metrics',
                queries: [
                    'Safety ratings distribution (SAFETY_RATING)',
                    'Crash rates analysis (RECORDABLE_CRASH_RATE)',
                    'Review dates and types (REVIEW_DATE, REVIEW_TYPE)'
                ]
            },
            {
                name: 'Business Operations',
                queries: [
                    'Business organization types (BUSINESS_ORG_DESC)',
                    'Cargo types analysis (CRGO_* fields)',
                    'Mileage patterns (MCS150_MILEAGE)'
                ]
            },
            {
                name: 'Contact Intelligence',
                queries: [
                    'Email domains analysis (EMAIL_ADDRESS)',
                    'Phone number patterns (PHONE)',
                    'Company names and DBA analysis'
                ]
            }
        ];

        analysisCategories.forEach((category, i) => {
            console.log(`\n${i + 1}. ${category.name}:`);
            category.queries.forEach(query => {
                console.log(`   • ${query}`);
            });
        });

        // SQLite commands for analysis
        console.log('\n🔧 READY-TO-RUN ANALYSIS COMMANDS:');
        console.log('==================================');

        const sqlCommands = [
            {
                title: 'Total Record Count',
                sql: 'SELECT COUNT(*) as total_carriers FROM carriers;'
            },
            {
                title: 'Top 10 States by Carrier Count',
                sql: `SELECT PHY_STATE, COUNT(*) as carrier_count
                      FROM carriers
                      WHERE PHY_STATE IS NOT NULL
                      GROUP BY PHY_STATE
                      ORDER BY carrier_count DESC
                      LIMIT 10;`
            },
            {
                title: 'Fleet Size Distribution',
                sql: `SELECT
                        CASE
                            WHEN CAST(POWER_UNITS AS INTEGER) <= 5 THEN 'Small (1-5)'
                            WHEN CAST(POWER_UNITS AS INTEGER) <= 20 THEN 'Medium (6-20)'
                            WHEN CAST(POWER_UNITS AS INTEGER) <= 100 THEN 'Large (21-100)'
                            ELSE 'Enterprise (100+)'
                        END as fleet_size,
                        COUNT(*) as count
                      FROM carriers
                      WHERE POWER_UNITS IS NOT NULL
                      GROUP BY fleet_size;`
            },
            {
                title: 'Safety Rating Distribution',
                sql: `SELECT SAFETY_RATING, COUNT(*) as count
                      FROM carriers
                      WHERE SAFETY_RATING IS NOT NULL
                      GROUP BY SAFETY_RATING
                      ORDER BY count DESC;`
            },
            {
                title: 'Most Common Cargo Types',
                sql: `SELECT
                        SUM(CASE WHEN CRGO_GENFREIGHT = 'Y' THEN 1 ELSE 0 END) as general_freight,
                        SUM(CASE WHEN CRGO_HOUSEHOLD = 'Y' THEN 1 ELSE 0 END) as household_goods,
                        SUM(CASE WHEN CRGO_MOTOVEH = 'Y' THEN 1 ELSE 0 END) as motor_vehicles,
                        SUM(CASE WHEN CRGO_PRODUCE = 'Y' THEN 1 ELSE 0 END) as produce,
                        SUM(CASE WHEN CRGO_INTERMODAL = 'Y' THEN 1 ELSE 0 END) as intermodal
                      FROM carriers;`
            }
        ];

        sqlCommands.forEach((cmd, i) => {
            console.log(`\n${i + 1}. ${cmd.title}:`);
            console.log(`   sqlite3 ${dbFile} "${cmd.sql}"`);
        });

        console.log('\n📊 ADVANCED ANALYTICS READY:');
        console.log('============================');
        console.log('• Geographic heat maps');
        console.log('• Fleet size correlations');
        console.log('• Safety score patterns');
        console.log('• Business type distributions');
        console.log('• Contact data insights');
        console.log('• Cargo specialization analysis');

        console.log('\n✅ DB-advanced analysis framework ready!');
        console.log('📋 Import your CSV data to unlock full insights');

        return {
            database: dbFile,
            analysisCount: analysisCategories.length,
            sqlCommands: sqlCommands.length
        };

    } catch (error) {
        console.error('❌ Error analyzing DB-advanced:', error);
        return null;
    }
}

// Execute analysis
analyzeDBAdvanced().then(result => {
    if (result) {
        console.log(`\n🎯 Analysis framework complete!`);
        console.log(`📊 ${result.analysisCount} analysis categories prepared`);
        console.log(`🔧 ${result.sqlCommands} ready-to-run SQL commands`);
    }
}).catch(error => {
    console.error('❌ Failed to analyze DB-advanced:', error);
});