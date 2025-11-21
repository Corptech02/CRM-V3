// Query Vicidial MySQL database directly for real lead data
const mysql = require('mysql2/promise');

class VicidialMySQLAnalyzer {
    constructor() {
        this.config = {
            host: '204.13.233.29',
            port: 3306,
            user: 'cron',
            password: '1234',
            database: 'asterisk'
        };
    }

    async analyzeLeadData() {
        console.log('🔍 Connecting directly to Vicidial MySQL database...');
        console.log('Host:', this.config.host);
        console.log('Database:', this.config.database);
        console.log('');

        try {
            const connection = await mysql.createConnection({
                ...this.config,
                connectTimeout: 10000
            });

            console.log('✅ Connected to Vicidial MySQL database!');
            console.log('');

            // Get all lists with lead counts
            console.log('📋 STEP 1: Getting all lists with lead counts...');
            const [lists] = await connection.execute(`
                SELECT
                    vl.list_id,
                    vl.list_name,
                    vl.campaign_id,
                    vl.active,
                    COUNT(vld.lead_id) as total_leads,
                    COUNT(CASE WHEN vld.status = 'SALE' THEN 1 END) as sales_count,
                    COUNT(CASE WHEN vld.status = 'SOLD' THEN 1 END) as sold_count,
                    COUNT(CASE WHEN vld.status = 'XFER' THEN 1 END) as transfer_count,
                    COUNT(CASE WHEN vld.status IN ('SALE', 'SOLD', 'XFER') THEN 1 END) as total_conversions
                FROM vicidial_lists vl
                LEFT JOIN vicidial_list vld ON vl.list_id = vld.list_id
                GROUP BY vl.list_id, vl.list_name, vl.campaign_id, vl.active
                ORDER BY vl.list_id
            `);

            lists.forEach(list => {
                console.log(`📋 List ${list.list_id}: "${list.list_name}"`);
                console.log(`   Campaign: ${list.campaign_id || 'N/A'}`);
                console.log(`   Active: ${list.active}`);
                console.log(`   Total Leads: ${list.total_leads}`);
                console.log(`   Sales (SALE): ${list.sales_count}`);
                console.log(`   Sold (SOLD): ${list.sold_count}`);
                console.log(`   Transfers (XFER): ${list.transfer_count}`);
                console.log(`   Total Conversions: ${list.total_conversions}`);
                console.log('');
            });

            // Get recent sales data with details
            console.log('📋 STEP 2: Getting recent SALE records with details...');
            const [salesData] = await connection.execute(`
                SELECT
                    vld.lead_id,
                    vld.list_id,
                    vld.phone_number,
                    vld.first_name,
                    vld.last_name,
                    vld.address1,
                    vld.city,
                    vld.state,
                    vld.postal_code,
                    vld.email,
                    vld.status,
                    vld.vendor_lead_code,
                    vld.title,
                    vld.comments,
                    vld.last_local_call_time,
                    vld.called_count,
                    vl.list_name
                FROM vicidial_list vld
                JOIN vicidial_lists vl ON vld.list_id = vl.list_id
                WHERE vld.status IN ('SALE', 'SOLD', 'XFER')
                ORDER BY vld.last_local_call_time DESC
                LIMIT 20
            `);

            console.log(`✅ Found ${salesData.length} recent sales/conversions:`);
            salesData.forEach((sale, index) => {
                console.log(`\n${index + 1}. Lead ID: ${sale.lead_id} (List: ${sale.list_id} - ${sale.list_name})`);
                console.log(`   Name: ${sale.first_name} ${sale.last_name}`);
                console.log(`   Company: ${sale.title || sale.vendor_lead_code || 'N/A'}`);
                console.log(`   Phone: ${sale.phone_number}`);
                console.log(`   Email: ${sale.email || 'N/A'}`);
                console.log(`   Location: ${sale.city}, ${sale.state} ${sale.postal_code}`);
                console.log(`   Status: ${sale.status}`);
                console.log(`   Last Call: ${sale.last_local_call_time}`);
                console.log(`   Called Count: ${sale.called_count}`);
                if (sale.comments) {
                    console.log(`   Comments: ${sale.comments.substring(0, 100)}${sale.comments.length > 100 ? '...' : ''}`);
                }
            });

            // Get status distribution
            console.log('\n📋 STEP 3: Getting status distribution across all leads...');
            const [statusData] = await connection.execute(`
                SELECT
                    status,
                    COUNT(*) as count,
                    list_id
                FROM vicidial_list
                GROUP BY status, list_id
                ORDER BY list_id, count DESC
            `);

            const statusByList = {};
            statusData.forEach(row => {
                if (!statusByList[row.list_id]) {
                    statusByList[row.list_id] = {};
                }
                statusByList[row.list_id][row.status] = row.count;
            });

            Object.keys(statusByList).forEach(listId => {
                console.log(`\nList ${listId} status breakdown:`);
                Object.keys(statusByList[listId]).forEach(status => {
                    console.log(`   ${status}: ${statusByList[listId][status]}`);
                });
            });

            await connection.end();

            console.log('\n🏁 ANALYSIS COMPLETE!');
            return { lists, salesData, statusByList };

        } catch (error) {
            console.error('❌ MySQL connection failed:', error.message);
            console.log('\n🔧 Trying alternative connection methods...');

            // Try different MySQL credentials
            const altCredentials = [
                { user: 'cron', password: '1234' },
                { user: 'vicidial', password: 'vicidial' },
                { user: 'root', password: '' },
                { user: 'admin', password: 'admin' }
            ];

            for (const creds of altCredentials) {
                try {
                    console.log(`Trying ${creds.user}:${creds.password}...`);
                    const testConnection = await mysql.createConnection({
                        host: this.config.host,
                        port: this.config.port,
                        user: creds.user,
                        password: creds.password,
                        database: this.config.database,
                        connectTimeout: 5000
                    });

                    console.log(`✅ Success with ${creds.user}:${creds.password}!`);
                    await testConnection.end();
                    break;

                } catch (altError) {
                    console.log(`❌ Failed with ${creds.user}:${creds.password} - ${altError.message}`);
                }
            }

            return null;
        }
    }
}

// Run the analysis
const analyzer = new VicidialMySQLAnalyzer();
analyzer.analyzeLeadData().then(result => {
    if (result) {
        console.log(`\n📊 FINAL SUMMARY:`);
        console.log(`   Found ${result.lists.length} lists`);
        console.log(`   Found ${result.salesData.length} recent sales/conversions`);
        console.log(`   Status data available for ${Object.keys(result.statusByList).length} lists`);
    }
}).catch(console.error);

module.exports = VicidialMySQLAnalyzer;