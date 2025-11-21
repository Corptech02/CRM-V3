const axios = require('axios');
const https = require('https');
const { JSDOM } = require('jsdom');

async function scanAllViciDialLists() {
    console.log('🔍 Attempting to find ALL ViciDial lists from the system...');

    const config = {
        server: '204.13.233.29',
        user: '6666',
        pass: 'corp06'
    };

    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    // Try to access the ViciDial lists management page
    const listsPageUrl = `https://${config.user}:${config.pass}@${config.server}/vicidial/admin.php?ADD=31&DB=0`;

    try {
        console.log(`📡 Fetching ViciDial lists page: ${listsPageUrl}`);

        const response = await axios.get(listsPageUrl, {
            httpsAgent,
            timeout: 30000
        });

        if (response.status === 200) {
            console.log(`✅ Successfully accessed ViciDial lists page`);

            const dom = new JSDOM(response.data);
            const document = dom.window.document;

            // Look for list links or dropdowns that might contain list IDs
            const links = document.querySelectorAll('a[href*="list_id="]');
            const foundLists = new Set();

            links.forEach(link => {
                const href = link.getAttribute('href');
                const match = href.match(/list_id=(\d+)/);
                if (match) {
                    foundLists.add(match[1]);
                }
            });

            // Also check select options
            const options = document.querySelectorAll('option[value]');
            options.forEach(option => {
                const value = option.getAttribute('value');
                if (value && /^\d+$/.test(value)) {
                    foundLists.add(value);
                }
            });

            console.log(`📋 Found ${foundLists.size} list IDs from ViciDial admin interface:`);
            const sortedLists = Array.from(foundLists).sort((a, b) => parseInt(a) - parseInt(b));
            sortedLists.forEach(listId => console.log(`   - List ${listId}`));

            return sortedLists;
        }
    } catch (error) {
        console.error(`❌ Error accessing ViciDial lists page: ${error.message}`);
    }

    return [];
}

scanAllViciDialLists();