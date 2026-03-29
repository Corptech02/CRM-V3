// Create DB-Advanced Database with All 147 DOT Columns
console.log('🚛 CREATING DB-ADVANCED DATABASE (147 COLUMNS)');
console.log('==============================================');

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

async function createDBAdvanced() {
    try {
        // Define all 147 columns from DOT Company Census File
        const columns = [
            'MCS150_DATE TEXT',
            'ADD_DATE TEXT',
            'STATUS_CODE TEXT',
            'DOT_NUMBER INTEGER PRIMARY KEY',
            'DUN_BRADSTREET_NO TEXT',
            'PHY_OMC_REGION TEXT',
            'SAFETY_INV_TERR TEXT',
            'CARRIER_OPERATION TEXT',
            'BUSINESS_ORG_ID TEXT',
            'MCS150_MILEAGE TEXT',
            'MCS150_MILEAGE_YEAR TEXT',
            'MCS151_MILEAGE TEXT',
            'TOTAL_CARS TEXT',
            'MCS150_UPDATE_CODE_ID TEXT',
            'PRIOR_REVOKE_FLAG TEXT',
            'PRIOR_REVOKE_DOT_NUMBER TEXT',
            'PHONE TEXT',
            'FAX TEXT',
            'CELL_PHONE TEXT',
            'COMPANY_OFFICER_1 TEXT',
            'COMPANY_OFFICER_2 TEXT',
            'BUSINESS_ORG_DESC TEXT',
            'TRUCK_UNITS TEXT',
            'POWER_UNITS TEXT',
            'BUS_UNITS TEXT',
            'FLEETSIZE TEXT',
            'REVIEW_ID TEXT',
            'RECORDABLE_CRASH_RATE TEXT',
            'MAIL_NATIONALITY_INDICATOR TEXT',
            'PHY_NATIONALITY_INDICATOR TEXT',
            'PHY_BARRIO TEXT',
            'MAIL_BARRIO TEXT',
            'CARSHIP TEXT',
            'DOCKET1PREFIX TEXT',
            'DOCKET1 TEXT',
            'DOCKET2PREFIX TEXT',
            'DOCKET2 TEXT',
            'DOCKET3PREFIX TEXT',
            'DOCKET3 TEXT',
            'POINTNUM TEXT',
            'TOTAL_INTRASTATE_DRIVERS TEXT',
            'MCSIPSTEP TEXT',
            'MCSIPDATE TEXT',
            'HM_Ind TEXT',
            'INTERSTATE_BEYOND_100_MILES TEXT',
            'INTERSTATE_WITHIN_100_MILES TEXT',
            'INTRASTATE_BEYOND_100_MILES TEXT',
            'INTRASTATE_WITHIN_100_MILES TEXT',
            'TOTAL_CDL TEXT',
            'TOTAL_DRIVERS TEXT',
            'AVG_DRIVERS_LEASED_PER_MONTH TEXT',
            'CLASSDEF TEXT',
            'LEGAL_NAME TEXT',
            'DBA_NAME TEXT',
            'PHY_STREET TEXT',
            'PHY_CITY TEXT',
            'PHY_COUNTRY TEXT',
            'PHY_STATE TEXT',
            'PHY_ZIP TEXT',
            'PHY_CNTY TEXT',
            'CARRIER_MAILING_STREET TEXT',
            'CARRIER_MAILING_STATE TEXT',
            'CARRIER_MAILING_CITY TEXT',
            'CARRIER_MAILING_COUNTRY TEXT',
            'CARRIER_MAILING_ZIP TEXT',
            'CARRIER_MAILING_CNTY TEXT',
            'CARRIER_MAILING_UND_DATE TEXT',
            'DRIVER_INTER_TOTAL TEXT',
            'EMAIL_ADDRESS TEXT',
            'REVIEW_TYPE TEXT',
            'REVIEW_DATE TEXT',
            'SAFETY_RATING TEXT',
            'SAFETY_RATING_DATE TEXT',
            'UNDELIV_PHY TEXT',
            'CRGO_GENFREIGHT TEXT',
            'CRGO_HOUSEHOLD TEXT',
            'CRGO_METALSHEET TEXT',
            'CRGO_MOTOVEH TEXT',
            'CRGO_DRIVETOW TEXT',
            'CRGO_LOGPOLE TEXT',
            'CRGO_BLDGMAT TEXT',
            'CRGO_MOBILEHOME TEXT',
            'CRGO_MACHLRG TEXT',
            'CRGO_PRODUCE TEXT',
            'CRGO_LIQGAS TEXT',
            'CRGO_INTERMODAL TEXT',
            'CRGO_PASSENGERS TEXT',
            'CRGO_OILFIELD TEXT',
            'CRGO_LIVESTOCK TEXT',
            'CRGO_GRAINFEED TEXT',
            'CRGO_COALCOKE TEXT',
            'CRGO_MEAT TEXT',
            'CRGO_GARBAGE TEXT',
            'CRGO_USMAIL TEXT',
            'CRGO_CHEM TEXT',
            'CRGO_DRYBULK TEXT',
            'CRGO_COLDFOOD TEXT',
            'CRGO_BEVERAGES TEXT',
            'CRGO_PAPERPROD TEXT',
            'CRGO_UTILITY TEXT',
            'CRGO_FARMSUPP TEXT',
            'CRGO_CONSTRUCT TEXT',
            'CRGO_WATERWELL TEXT',
            'CRGO_CARGOOTHR TEXT',
            'CRGO_CARGOOTHR_DESC TEXT',
            'OWNTRUCK TEXT',
            'OWNTRACT TEXT',
            'OWNTRAIL TEXT',
            'OWNCOACH TEXT',
            'OWNSCHOOL_1_8 TEXT',
            'OWNSCHOOL_9_15 TEXT',
            'OWNSCHOOL_16 TEXT',
            'OWNBUS_16 TEXT',
            'OWNVAN_1_8 TEXT',
            'OWNVAN_9_15 TEXT',
            'OWNLIMO_1_8 TEXT',
            'OWNLIMO_9_15 TEXT',
            'OWNLIMO_16 TEXT',
            'TRMTRUCK TEXT',
            'TRMTRACT TEXT',
            'TRMTRAIL TEXT',
            'TRMCOACH TEXT',
            'TRMSCHOOL_1_8 TEXT',
            'TRMSCHOOL_9_15 TEXT',
            'TRMSCHOOL_16 TEXT',
            'TRMBUS_16 TEXT',
            'TRMVAN_1_8 TEXT',
            'TRMVAN_9_15 TEXT',
            'TRMLIMO_1_8 TEXT',
            'TRMLIMO_9_15 TEXT',
            'TRMLIMO_16 TEXT',
            'TRPTRUCK TEXT',
            'TRPTRACT TEXT',
            'TRPTRAIL TEXT',
            'TRPCOACH TEXT',
            'TRPSCHOOL_1_8 TEXT',
            'TRPSCHOOL_9_15 TEXT',
            'TRPSCHOOL_16 TEXT',
            'TRPBUS_16 TEXT',
            'TRPVAN_1_8 TEXT',
            'TRPVAN_9_15 TEXT',
            'TRPLIMO_1_8 TEXT',
            'TRPLIMO_9_15 TEXT',
            'TRPLIMO_16 TEXT',
            'DOCKET1_STATUS_CODE TEXT',
            'DOCKET2_STATUS_CODE TEXT',
            'DOCKET3_STATUS_CODE TEXT',

            // Additional metadata columns
            'CREATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP',
            'UPDATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP',
            'DATA_SOURCE TEXT DEFAULT "DOT_COMPANY_CENSUS"'
        ];

        console.log('📁 Creating database file: DB-advanced.db');

        // Create the database
        const db = new sqlite3.Database('/var/www/vanguard/DB-advanced.db', (err) => {
            if (err) {
                console.error('❌ Error creating database:', err);
                return;
            }
            console.log('✅ Connected to DB-advanced database');
        });

        // Create the main carriers table
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS carriers (
            ${columns.join(',\n            ')}
        )`;

        console.log('🔨 Creating carriers table with 147 columns...');

        await new Promise((resolve, reject) => {
            db.run(createTableSQL, (err) => {
                if (err) {
                    console.error('❌ Error creating table:', err);
                    reject(err);
                } else {
                    console.log('✅ Carriers table created successfully');
                    resolve();
                }
            });
        });

        // Create indexes for performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_dot_number ON carriers(DOT_NUMBER)',
            'CREATE INDEX IF NOT EXISTS idx_legal_name ON carriers(LEGAL_NAME)',
            'CREATE INDEX IF NOT EXISTS idx_state ON carriers(PHY_STATE)',
            'CREATE INDEX IF NOT EXISTS idx_status ON carriers(STATUS_CODE)',
            'CREATE INDEX IF NOT EXISTS idx_safety_rating ON carriers(SAFETY_RATING)',
            'CREATE INDEX IF NOT EXISTS idx_email ON carriers(EMAIL_ADDRESS)',
            'CREATE INDEX IF NOT EXISTS idx_phone ON carriers(PHONE)'
        ];

        console.log('📇 Creating performance indexes...');
        for (const indexSQL of indexes) {
            await new Promise((resolve, reject) => {
                db.run(indexSQL, (err) => {
                    if (err) {
                        console.error('❌ Error creating index:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        console.log('✅ All indexes created');

        // Create a sample API connection table
        const apiTableSQL = `
        CREATE TABLE IF NOT EXISTS api_connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_name TEXT NOT NULL,
            endpoint_url TEXT NOT NULL,
            api_key TEXT,
            last_sync DATETIME,
            total_records INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

        await new Promise((resolve, reject) => {
            db.run(apiTableSQL, (err) => {
                if (err) {
                    console.error('❌ Error creating api_connections table:', err);
                    reject(err);
                } else {
                    console.log('✅ API connections table created');
                    resolve();
                }
            });
        });

        // Insert DOT API connection record
        const insertAPISQL = `
        INSERT INTO api_connections (api_name, endpoint_url, api_key, status)
        VALUES (?, ?, ?, ?)`;

        await new Promise((resolve, reject) => {
            db.run(insertAPISQL, [
                'DOT Company Census',
                'https://data.transportation.gov/api/v3/views/az4n-8mr2/query.json',
                'REQUIRES_APPLICATION_TOKEN',
                'ready_for_auth'
            ], (err) => {
                if (err) {
                    console.error('❌ Error inserting API connection:', err);
                    reject(err);
                } else {
                    console.log('✅ DOT API connection record added');
                    resolve();
                }
            });
        });

        // Get database info
        await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table'", (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`\n📊 DATABASE SUMMARY:`);
                    console.log(`   📁 File: DB-advanced.db`);
                    console.log(`   🗄️  Tables created: ${row.table_count}`);
                    console.log(`   📋 Columns in carriers table: 150 (147 DOT + 3 metadata)`);
                    console.log(`   🔍 Indexes: 7 performance indexes`);
                    console.log(`   🔌 API connections: 1 (DOT Company Census)`);
                    resolve();
                }
            });
        });

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err);
            } else {
                console.log('✅ Database connection closed');
            }
        });

        console.log('\n🎯 NEXT STEPS FOR DATA ACCESS:');
        console.log('1. Register at data.transportation.gov for API token');
        console.log('2. Get webkey from FMCSA developer portal');
        console.log('3. Use authenticated requests to populate database');
        console.log('4. The database is now ready as a "plug and play" container');
        console.log('\n✅ DB-advanced.db created successfully with all 147 DOT columns!');

    } catch (error) {
        console.error('❌ Critical error creating DB-advanced:', error);
    }
}

// Execute database creation
createDBAdvanced();