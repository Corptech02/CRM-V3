// Get actual lead data from Vicibox lists
const VicidialDirectSync = require('./vicidial-direct-sync');
const axios = require('axios');
const https = require('https');

class VicidialLeadAnalyzer {
    constructor() {
        this.sync = new VicidialDirectSync();
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    async analyzeAllLists() {
        console.log('🔍 Analyzing all Vicibox lead lists for real data...');
        console.log('Server:', this.sync.config.server);
        console.log('User:', this.sync.config.user);
        console.log('');

        const url = `https://${this.sync.config.server}/vicidial/non_agent_api.php`;
        const listIds = ['999', '1000', '1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010'];
        const foundLists = [];

        // First, get all available lists
        console.log('📋 STEP 1: Getting all available lists...');
        for (const listId of listIds) {
            try {
                const listResponse = await axios.get(url, {
                    params: {
                        source: this.sync.config.source,
                        user: this.sync.config.user,
                        pass: this.sync.config.pass,
                        function: 'list_info',
                        list_id: listId
                    },
                    httpsAgent: this.httpsAgent,
                    timeout: 3000
                });

                if (listResponse.data && !listResponse.data.includes('ERROR')) {
                    const listData = listResponse.data.split('|');
                    foundLists.push({
                        id: listId,
                        name: listData[1] || 'Unknown',
                        campaign: listData[2] || 'Unknown',
                        active: listData[3] || 'Unknown',
                        created: listData[4] || 'Unknown',
                        modified: listData[5] || 'Unknown',
                        raw: listResponse.data
                    });
                    console.log(`✅ List ${listId}: "${listData[1]}" (Campaign: ${listData[2]})`);
                }
            } catch (error) {
                // Skip non-existent lists
            }
        }

        console.log(`\n📊 Found ${foundLists.length} active lists total\n`);

        // Now try different methods to get lead counts and sales data
        console.log('📋 STEP 2: Analyzing lead data in each list...\n');

        for (const list of foundLists) {
            console.log(`🔍 Analyzing List ${list.id}: "${list.name}"`);
            console.log(`   Campaign: ${list.campaign}`);
            console.log(`   Active: ${list.active}`);
            console.log(`   Created: ${list.created}`);
            console.log(`   Modified: ${list.modified}`);

            // Try method 1: call_log_search
            await this.tryCallLogSearch(url, list);

            // Try method 2: lead_search with different parameters
            await this.tryLeadSearch(url, list);

            // Try method 3: search for SALE status specifically
            await this.trySaleSearch(url, list);

            console.log('');
        }

        return foundLists;
    }

    async tryCallLogSearch(url, list) {
        console.log('   🔍 Trying call_log_search...');
        try {
            const response = await axios.get(url, {
                params: {
                    source: this.sync.config.source,
                    user: this.sync.config.user,
                    pass: this.sync.config.pass,
                    function: 'call_log_search',
                    list_id: list.id,
                    status: 'SALE',
                    records: '10'
                },
                httpsAgent: this.httpsAgent,
                timeout: 5000
            });

            if (response.data && !response.data.includes('ERROR')) {
                const lines = response.data.split('\n').filter(line => line.trim().length > 0);
                console.log(`   ✅ call_log_search returned ${lines.length} records`);
                if (lines.length > 0) {
                    console.log(`   📄 Sample data: ${lines[0].substring(0, 100)}...`);
                }
            } else {
                console.log(`   ❌ call_log_search failed: ${response.data.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`   ❌ call_log_search error: ${error.message}`);
        }
    }

    async tryLeadSearch(url, list) {
        console.log('   🔍 Trying lead_search...');

        const searchMethods = ['LIST', 'PHONE', 'STATUS'];

        for (const method of searchMethods) {
            try {
                const params = {
                    source: this.sync.config.source,
                    user: this.sync.config.user,
                    pass: this.sync.config.pass,
                    function: 'lead_search',
                    list_id: list.id,
                    search_method: method,
                    records: '5'
                };

                if (method === 'STATUS') {
                    params.search_location = 'STATUS';
                    params.search_value = 'SALE';
                }

                const response = await axios.get(url, {
                    params: params,
                    httpsAgent: this.httpsAgent,
                    timeout: 5000
                });

                if (response.data && !response.data.includes('ERROR')) {
                    const lines = response.data.split('\n').filter(line => line.trim().length > 0);
                    console.log(`   ✅ lead_search (${method}) returned ${lines.length} records`);
                    if (lines.length > 0) {
                        console.log(`   📄 Sample: ${lines[0].substring(0, 80)}...`);
                    }
                    return; // Stop at first successful method
                } else {
                    console.log(`   ❌ lead_search (${method}) failed: ${response.data.substring(0, 60)}`);
                }
            } catch (error) {
                console.log(`   ❌ lead_search (${method}) error: ${error.message}`);
            }
        }
    }

    async trySaleSearch(url, list) {
        console.log('   🔍 Trying SALE status search...');
        try {
            const response = await axios.get(url, {
                params: {
                    source: this.sync.config.source,
                    user: this.sync.config.user,
                    pass: this.sync.config.pass,
                    function: 'search_list',
                    search_method: 'STATUSLIST',
                    list_id: list.id,
                    status_list: 'SALE|SOLD|XFER',
                    records: '10'
                },
                httpsAgent: this.httpsAgent,
                timeout: 5000
            });

            if (response.data && !response.data.includes('ERROR')) {
                const lines = response.data.split('\n').filter(line => line.trim().length > 0);
                console.log(`   ✅ SALE search returned ${lines.length} records`);
                if (lines.length > 0) {
                    console.log(`   📄 Sample SALE: ${lines[0].substring(0, 80)}...`);
                }
            } else {
                console.log(`   ❌ SALE search failed: ${response.data.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`   ❌ SALE search error: ${error.message}`);
        }
    }
}

// Run the analysis
const analyzer = new VicidialLeadAnalyzer();
analyzer.analyzeAllLists().then(lists => {
    console.log('\n🏁 ANALYSIS COMPLETE!');
    console.log(`\n📊 SUMMARY:`);
    lists.forEach(list => {
        console.log(`   List ${list.id}: "${list.name}" (${list.campaign})`);
    });
    console.log(`\nTotal active lists: ${lists.length}`);
}).catch(console.error);

module.exports = VicidialLeadAnalyzer;