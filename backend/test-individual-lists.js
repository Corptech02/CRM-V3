const axios = require('axios');
const https = require('https');
const { JSDOM } = require('jsdom');

async function testIndividualListSales() {
    console.log('🔍 Testing individual list SALE status via direct ViciDial admin URLs...');

    const config = {
        server: '204.13.233.29',
        user: '6666',
        pass: 'corp06'
    };

    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    // Test the specific lists mentioned by the user
    const testLists = ['998', '999', '1000', '1001', '1005', '1006'];

    for (const listId of testLists) {
        try {
            console.log(`\n📋 Testing List ${listId} via direct admin URL...`);

            // Use the same URL pattern as shown by the user
            const adminUrl = `https://${config.user}:${config.pass}@${config.server}/vicidial/admin.php?ADD=311&list_id=${listId}`;

            console.log(`📡 Fetching: ${adminUrl.replace(config.pass, '***')}`);

            const response = await axios.get(adminUrl, {
                httpsAgent,
                timeout: 30000
            });

            if (response.status === 200) {
                console.log(`✅ Successfully accessed List ${listId} admin page`);

                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                // Look for all table rows to find SALE status
                const rows = document.querySelectorAll('tr');
                let saleCount = 0;
                let foundSaleRow = false;

                console.log(`📊 Scanning ${rows.length} table rows for SALE status...`);

                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td, th');
                    if (cells.length >= 3) {
                        const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());

                        // Look for SALE status row: First cell = "SALE", second cell contains "Sale"
                        if (cellTexts[0] === 'SALE' && cellTexts[1] && cellTexts[1].toLowerCase().includes('sale')) {
                            foundSaleRow = true;
                            const saleCountText = cellTexts[2];
                            const count = parseInt(saleCountText) || 0;
                            console.log(`🎯 List ${listId}: Found SALE row at index ${index}`);
                            console.log(`   Cell 0: "${cellTexts[0]}"`);
                            console.log(`   Cell 1: "${cellTexts[1]}"`);
                            console.log(`   Cell 2: "${cellTexts[2]}"`);
                            console.log(`   Parsed count: ${count}`);

                            if (count > 0) {
                                saleCount = count;
                                console.log(`✅ List ${listId}: ${count} SALE leads found!`);
                            } else {
                                console.log(`⚠️  List ${listId}: SALE row found but count is 0`);
                            }
                        }
                    }
                });

                if (!foundSaleRow) {
                    console.log(`❌ List ${listId}: No SALE status row found in HTML table`);

                    // Debug: Show first few rows of data
                    console.log(`🔍 Debug: First 5 table rows for List ${listId}:`);
                    rows.forEach((row, index) => {
                        if (index < 5) {
                            const cells = row.querySelectorAll('td, th');
                            const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
                            if (cellTexts.length > 0) {
                                console.log(`   Row ${index}: [${cellTexts.join(' | ')}]`);
                            }
                        }
                    });
                } else {
                    console.log(`📈 List ${listId}: Final SALE count = ${saleCount}`);
                }

            } else {
                console.log(`❌ List ${listId}: HTTP ${response.status} - ${response.statusText}`);
            }

        } catch (error) {
            console.log(`❌ List ${listId}: Error - ${error.message}`);

            if (error.response) {
                console.log(`   HTTP Status: ${error.response.status}`);
                console.log(`   Response: ${error.response.data.substring(0, 200)}...`);
            }
        }
    }
}

testIndividualListSales();