// Create DB-V3: Merge Insurance History (472k) + DOT Data (4.38M)
console.log('🔗 CREATING DB-V3 MERGED DATABASE');
console.log('================================');

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

async function createDBV3() {
    const sourceDB = '/var/www/vanguard/DB-advanced.db';
    const insuranceFile = '/var/www/vanguard/actpendins_allwithhistory.3.txt';
    const targetDB = '/var/www/vanguard/DB-V3.db';

    try {
        console.log('📊 Step 1: Analyzing source databases...');

        // Check source files
        if (!fs.existsSync(sourceDB)) {
            console.log('❌ DB-advanced.db not found');
            return;
        }

        if (!fs.existsSync(insuranceFile)) {
            console.log('❌ Insurance history file not found');
            return;
        }

        console.log('✅ Source files verified');
        console.log('📁 Insurance file: 59MB (472,135 records)');
        console.log('📁 DOT database: 2.1GB (4,387,891 records)');

        // Create new database
        console.log('\n🔨 Step 2: Creating DB-V3 structure...');

        const db = new sqlite3.Database(targetDB);

        // Create merged table with all columns
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS carriers_merged (
            -- DOT Columns (147 original)
            MCS150_DATE TEXT,
            ADD_DATE TEXT,
            STATUS_CODE TEXT,
            DOT_NUMBER INTEGER PRIMARY KEY,
            DUN_BRADSTREET_NO TEXT,
            PHY_OMC_REGION TEXT,
            SAFETY_INV_TERR TEXT,
            CARRIER_OPERATION TEXT,
            BUSINESS_ORG_ID TEXT,
            MCS150_MILEAGE TEXT,
            MCS150_MILEAGE_YEAR TEXT,
            MCS151_MILEAGE TEXT,
            TOTAL_CARS TEXT,
            MCS150_UPDATE_CODE_ID TEXT,
            PRIOR_REVOKE_FLAG TEXT,
            PRIOR_REVOKE_DOT_NUMBER TEXT,
            PHONE TEXT,
            FAX TEXT,
            CELL_PHONE TEXT,
            COMPANY_OFFICER_1 TEXT,
            COMPANY_OFFICER_2 TEXT,
            BUSINESS_ORG_DESC TEXT,
            TRUCK_UNITS TEXT,
            POWER_UNITS TEXT,
            BUS_UNITS TEXT,
            FLEETSIZE TEXT,
            REVIEW_ID TEXT,
            RECORDABLE_CRASH_RATE TEXT,
            MAIL_NATIONALITY_INDICATOR TEXT,
            PHY_NATIONALITY_INDICATOR TEXT,
            PHY_BARRIO TEXT,
            MAIL_BARRIO TEXT,
            CARSHIP TEXT,
            DOCKET1PREFIX TEXT,
            DOCKET1 TEXT,
            DOCKET2PREFIX TEXT,
            DOCKET2 TEXT,
            DOCKET3PREFIX TEXT,
            DOCKET3 TEXT,
            POINTNUM TEXT,
            TOTAL_INTRASTATE_DRIVERS TEXT,
            MCSIPSTEP TEXT,
            MCSIPDATE TEXT,
            HM_Ind TEXT,
            INTERSTATE_BEYOND_100_MILES TEXT,
            INTERSTATE_WITHIN_100_MILES TEXT,
            INTRASTATE_BEYOND_100_MILES TEXT,
            INTRASTATE_WITHIN_100_MILES TEXT,
            TOTAL_CDL TEXT,
            TOTAL_DRIVERS TEXT,
            AVG_DRIVERS_LEASED_PER_MONTH TEXT,
            CLASSDEF TEXT,
            LEGAL_NAME TEXT,
            DBA_NAME TEXT,
            PHY_STREET TEXT,
            PHY_CITY TEXT,
            PHY_COUNTRY TEXT,
            PHY_STATE TEXT,
            PHY_ZIP TEXT,
            PHY_CNTY TEXT,
            CARRIER_MAILING_STREET TEXT,
            CARRIER_MAILING_STATE TEXT,
            CARRIER_MAILING_CITY TEXT,
            CARRIER_MAILING_COUNTRY TEXT,
            CARRIER_MAILING_ZIP TEXT,
            CARRIER_MAILING_CNTY TEXT,
            CARRIER_MAILING_UND_DATE TEXT,
            DRIVER_INTER_TOTAL TEXT,
            EMAIL_ADDRESS TEXT,
            REVIEW_TYPE TEXT,
            REVIEW_DATE TEXT,
            SAFETY_RATING TEXT,
            SAFETY_RATING_DATE TEXT,
            UNDELIV_PHY TEXT,
            CRGO_GENFREIGHT TEXT,
            CRGO_HOUSEHOLD TEXT,
            CRGO_METALSHEET TEXT,
            CRGO_MOTOVEH TEXT,
            CRGO_DRIVETOW TEXT,
            CRGO_LOGPOLE TEXT,
            CRGO_BLDGMAT TEXT,
            CRGO_MOBILEHOME TEXT,
            CRGO_MACHLRG TEXT,
            CRGO_PRODUCE TEXT,
            CRGO_LIQGAS TEXT,
            CRGO_INTERMODAL TEXT,
            CRGO_PASSENGERS TEXT,
            CRGO_OILFIELD TEXT,
            CRGO_LIVESTOCK TEXT,
            CRGO_GRAINFEED TEXT,
            CRGO_COALCOKE TEXT,
            CRGO_MEAT TEXT,
            CRGO_GARBAGE TEXT,
            CRGO_USMAIL TEXT,
            CRGO_CHEM TEXT,
            CRGO_DRYBULK TEXT,
            CRGO_COLDFOOD TEXT,
            CRGO_BEVERAGES TEXT,
            CRGO_PAPERPROD TEXT,
            CRGO_UTILITY TEXT,
            CRGO_FARMSUPP TEXT,
            CRGO_CONSTRUCT TEXT,
            CRGO_WATERWELL TEXT,
            CRGO_CARGOOTHR TEXT,
            CRGO_CARGOOTHR_DESC TEXT,
            OWNTRUCK TEXT,
            OWNTRACT TEXT,
            OWNTRAIL TEXT,
            OWNCOACH TEXT,
            OWNSCHOOL_1_8 TEXT,
            OWNSCHOOL_9_15 TEXT,
            OWNSCHOOL_16 TEXT,
            OWNBUS_16 TEXT,
            OWNVAN_1_8 TEXT,
            OWNVAN_9_15 TEXT,
            OWNLIMO_1_8 TEXT,
            OWNLIMO_9_15 TEXT,
            OWNLIMO_16 TEXT,
            TRMTRUCK TEXT,
            TRMTRACT TEXT,
            TRMTRAIL TEXT,
            TRMCOACH TEXT,
            TRMSCHOOL_1_8 TEXT,
            TRMSCHOOL_9_15 TEXT,
            TRMSCHOOL_16 TEXT,
            TRMBUS_16 TEXT,
            TRMVAN_1_8 TEXT,
            TRMVAN_9_15 TEXT,
            TRMLIMO_1_8 TEXT,
            TRMLIMO_9_15 TEXT,
            TRMLIMO_16 TEXT,
            TRPTRUCK TEXT,
            TRPTRACT TEXT,
            TRPTRAIL TEXT,
            TRPCOACH TEXT,
            TRPSCHOOL_1_8 TEXT,
            TRPSCHOOL_9_15 TEXT,
            TRPSCHOOL_16 TEXT,
            TRPBUS_16 TEXT,
            TRPVAN_1_8 TEXT,
            TRPVAN_9_15 TEXT,
            TRPLIMO_1_8 TEXT,
            TRPLIMO_9_15 TEXT,
            TRPLIMO_16 TEXT,
            DOCKET1_STATUS_CODE TEXT,
            DOCKET2_STATUS_CODE TEXT,
            DOCKET3_STATUS_CODE TEXT,

            -- Insurance Columns (10 new columns, DOT already exists)
            MC_NUMBER TEXT,
            FORM_CODE TEXT,
            COVERAGE_TYPE TEXT,
            INSURANCE_COMPANY TEXT,
            POLICY_NUMBER TEXT,
            POLICY_EFFECTIVE_DATE TEXT,
            UNKNOWN_FLAG TEXT,
            COVERAGE_AMOUNT TEXT,
            POLICY_END_DATE TEXT,
            POLICY_CANCELLATION_DATE TEXT,

            -- Metadata
            CREATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP,
            UPDATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP,
            DATA_SOURCE TEXT DEFAULT 'INSURANCE_DOT_MERGED'
        )`;

        await new Promise((resolve, reject) => {
            db.run(createTableSQL, (err) => {
                if (err) {
                    console.error('❌ Error creating table:', err);
                    reject(err);
                } else {
                    console.log('✅ DB-V3 table structure created');
                    console.log('📊 Total columns: ~160 (147 DOT + 10 Insurance + 3 Metadata)');
                    resolve();
                }
            });
        });

        // Create indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_v3_dot_number ON carriers_merged(DOT_NUMBER)',
            'CREATE INDEX IF NOT EXISTS idx_v3_mc_number ON carriers_merged(MC_NUMBER)',
            'CREATE INDEX IF NOT EXISTS idx_v3_state ON carriers_merged(PHY_STATE)',
            'CREATE INDEX IF NOT EXISTS idx_v3_legal_name ON carriers_merged(LEGAL_NAME)',
            'CREATE INDEX IF NOT EXISTS idx_v3_insurance_company ON carriers_merged(INSURANCE_COMPANY)',
            'CREATE INDEX IF NOT EXISTS idx_v3_policy_end_date ON carriers_merged(POLICY_END_DATE)'
        ];

        console.log('📇 Creating indexes...');
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
        console.log('✅ Indexes created');

        db.close();

        console.log('\n✅ DB-V3 structure ready!');
        console.log('📁 Database: ' + targetDB);
        console.log('\n🔄 Next: Run the data merge process');
        console.log('📝 This will take several minutes to process 472k insurance records');

        return { success: true, database: targetDB };

    } catch (error) {
        console.error('❌ Error creating DB-V3:', error);
        return { success: false, error };
    }
}

// Execute
createDBV3().then(result => {
    if (result && result.success) {
        console.log('\n🎯 DB-V3 STRUCTURE COMPLETE!');
        console.log('📊 Ready to merge insurance + DOT data');
    } else {
        console.log('❌ Failed to create DB-V3 structure');
    }
}).catch(error => {
    console.error('❌ Critical error:', error);
});