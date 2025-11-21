const axios = require('axios');
const https = require('https');

async function testNewListIds() {
    console.log('🧪 Testing newly discovered list IDs...');

    const config = {
        server: '204.13.233.29',
        user: '6666',
        pass: 'corp06'
    };

    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    const url = `https://${config.server}/vicidial/non_agent_api.php`;

    // Test a few of the lower numbered lists that should exist
    const testListIds = ['1', '2', '10', '50', '101'];

    for (const listId of testListIds) {
        try {
            console.log(`\n📋 Testing List ${listId} via API...`);

            const response = await axios.get(url, {
                params: {
                    source: 'vanguard_crm',
                    user: config.user,
                    pass: config.pass,
                    function: 'list_info',
                    list_id: listId
                },
                httpsAgent,
                timeout: 10000
            });

            console.log(`✅ Response: ${response.data}`);

            if (response.data && !response.data.includes('ERROR')) {
                const listData = response.data.split('|');
                const isActive = listData[3] === 'Y';
                console.log(`   List ${listId}: ${listData[1] || 'Unknown'} (Active: ${isActive})`);
            }

        } catch (error) {
            console.log(`❌ Error testing List ${listId}: ${error.message}`);
        }
    }
}

testNewListIds();