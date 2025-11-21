const axios = require('axios');
const https = require('https');
const { JSDOM } = require('jsdom');

async function testMultipleLists() {
    console.log('🧪 Testing HTML parsing for multiple ViciDial lists...');

    const config = {
        server: '204.13.233.29',
        user: '6666',
        pass: 'corp06'
    };

    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    // Test these lists that are showing 0
    const listsToTest = ['998', '999', '1000', '1005', '1006'];

    for (const listId of listsToTest) {
        console.log(`\n📋 Testing List ${listId}...`);

        const url = `https://${config.user}:${config.pass}@${config.server}/vicidial/admin.php?ADD=311&list_id=${listId}`;

        try {
            console.log(`📡 Fetching: ${url}`);

            const response = await axios.get(url, {
                httpsAgent,
                timeout: 30000
            });

            console.log(`✅ Response received (${response.status})`);

            // Parse the HTML
            const dom = new JSDOM(response.data);
            const document = dom.window.document;

            // Search for SALE status using the same logic as the backend
            const allRows = document.querySelectorAll('tr');
            let saleCount = 0;

            allRows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length >= 3) {
                    const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());

                    // Look for SALE status row: First cell = "SALE", second cell = "Sale Made"
                    if (cellTexts[0] === 'SALE' && cellTexts[1] && cellTexts[1].includes('Sale')) {
                        console.log(`🎯 FOUND SALE STATUS ROW ${rowIndex}:`);
                        console.log(`   Cells: [${cellTexts.slice(0, 6).join(', ')}]`);

                        // Third cell should contain the count
                        const saleCountText = cellTexts[2];
                        const count = parseInt(saleCountText) || 0;

                        if (count >= 0) { // Check for 0 or positive numbers
                            console.log(`   SALE count: "${saleCountText}" -> ${count} leads`);
                            saleCount = count;
                        }
                    }
                }
            });

            console.log(`📊 List ${listId}: Final SALE count = ${saleCount}`);

        } catch (error) {
            console.error(`❌ Error testing List ${listId}:`, error.message);
        }
    }
}

testMultipleLists();