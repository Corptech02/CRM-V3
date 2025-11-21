const axios = require('axios');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ignore SSL certificate errors for self-signed certs
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Database connection
const db = new sqlite3.Database(path.join(__dirname, '../vanguard.db'));

// Vicidial configuration from environment
const VICIDIAL_CONFIG = {
    server: process.env.VICIDIAL_SERVER || '204.13.233.29',
    user: process.env.VICIDIAL_USER || '6666',
    pass: process.env.VICIDIAL_PASS || 'corp06',
    source: process.env.VICIDIAL_SOURCE || 'vanguard_crm'
};

// OpenAI configuration (we'll use regex parsing for now if no API key)
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Connect to Vicidial and get real lead data
 */
async function fetchVicidialLeads() {
    console.log('📞 Connecting to real Vicidial server at', VICIDIAL_CONFIG.server);

    try {
        // First, get all lists
        const listsUrl = `https://${VICIDIAL_CONFIG.server}/vicidial/non_agent_api.php`;
        const listsParams = {
            source: VICIDIAL_CONFIG.source,
            user: VICIDIAL_CONFIG.user,
            pass: VICIDIAL_CONFIG.pass,
            function: 'list_info',
            list_id: '999,1000,1001,1002,1003,1004,1005,1006' // Check multiple lists
        };

        console.log('Fetching lead lists...');
        const listsResponse = await axios.get(listsUrl, {
            params: listsParams,
            httpsAgent,
            timeout: 60000
        });

        console.log('Lists response:', listsResponse.data?.substring(0, 200));

        // Get call log data for sales
        const callLogUrl = `https://${VICIDIAL_CONFIG.server}/vicidial/non_agent_api.php`;
        const callLogParams = {
            source: VICIDIAL_CONFIG.source,
            user: VICIDIAL_CONFIG.user,
            pass: VICIDIAL_CONFIG.pass,
            function: 'call_log_list',
            stage: 'SALE|SOLD|XFER', // Get sales and transfers
            date: '2024-01-01+2025-12-31' // Date range
        };

        console.log('Fetching call logs...');
        const callLogResponse = await axios.get(callLogUrl, {
            params: callLogParams,
            httpsAgent,
            timeout: 60000
        });

        // Parse the response data
        const leads = parseVicidialResponse(callLogResponse.data, listsResponse.data);

        return leads;

    } catch (error) {
        console.error('Error connecting to Vicidial:', error.message);

        // If connection fails, try MySQL direct connection as backup
        return await tryMySQLConnection();
    }
}

/**
 * Try direct MySQL connection to Vicidial database
 */
async function tryMySQLConnection() {
    console.log('Attempting direct MySQL connection to Vicidial...');

    const mysql = require('mysql2/promise');

    try {
        const connection = await mysql.createConnection({
            host: VICIDIAL_CONFIG.server,
            port: 3306,
            user: 'cron',
            password: '1234',
            database: 'asterisk'
        });

        // Query for recent sales
        const [rows] = await connection.execute(`
            SELECT
                vl.lead_id,
                vl.phone_number,
                vl.first_name,
                vl.last_name,
                vl.address1,
                vl.city,
                vl.state,
                vl.postal_code,
                vl.email,
                vl.comments,
                vl.status,
                vl.vendor_lead_code,
                vl.source_id,
                vl.list_id,
                vl.called_count,
                vl.last_local_call_time,
                vc.campaign_name,
                vl.title as company_name
            FROM vicidial_list vl
            LEFT JOIN vicidial_campaigns vc ON vl.campaign_id = vc.campaign_id
            WHERE vl.status IN ('SALE', 'SOLD', 'XFER', 'CALLBK', 'A')
            AND vl.last_local_call_time > DATE_SUB(NOW(), INTERVAL 90 DAY)
            ORDER BY vl.last_local_call_time DESC
            LIMIT 100
        `);

        await connection.end();

        // Convert MySQL results to lead format
        return rows.map(row => parseMySQLLead(row));

    } catch (error) {
        console.error('MySQL connection failed:', error.message);
        return [];
    }
}

/**
 * Parse Vicidial API response into structured leads
 */
function parseVicidialResponse(callLogData, listsData) {
    const leads = [];

    try {
        // Parse the response (Vicidial returns pipe-delimited data)
        const lines = callLogData.split('\n');

        for (const line of lines) {
            if (line.includes('SALE') || line.includes('XFER')) {
                const parts = line.split('|');

                if (parts.length > 5) {
                    const lead = {
                        id: `vicidial_${Date.now()}_${leads.length + 1}`,
                        phone: parts[0] || '',
                        name: parseNameFromCallData(parts),
                        status: parts[2] || 'SALE',
                        callTime: parts[3] || '',
                        agent: parts[4] || '',
                        listId: parts[5] || '',
                        leadId: parts[6] || '',
                        comments: parts[7] || ''
                    };

                    // Use AI or regex to extract structured data from comments
                    const parsedData = parseLeadDetails(lead.comments);

                    leads.push({
                        ...lead,
                        ...parsedData,
                        source: 'Vicidial Direct',
                        created: new Date().toISOString()
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error parsing Vicidial response:', error);
    }

    return leads;
}

/**
 * Parse lead details from unstructured text using patterns
 */
function parseLeadDetails(text) {
    const details = {
        company: '',
        contact: '',
        email: '',
        premium: 0,
        product: 'Commercial Auto',
        dotNumber: '',
        mcNumber: '',
        fleetSize: 0,
        commodityHauled: '',
        currentCarrier: ''
    };

    if (!text) return details;

    // Extract company name
    const companyMatch = text.match(/company[:\s]+([^,\n]+)/i);
    if (companyMatch) details.company = companyMatch[1].trim();

    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) details.email = emailMatch[1];

    // Extract premium/price
    const premiumMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (premiumMatch) details.premium = parseFloat(premiumMatch[1].replace(/,/g, ''));

    // Extract DOT number
    const dotMatch = text.match(/DOT[:\s#]*(\d{6,8})/i);
    if (dotMatch) details.dotNumber = dotMatch[1];

    // Extract MC number
    const mcMatch = text.match(/MC[:\s#]*(\d{6,7})/i);
    if (mcMatch) details.mcNumber = 'MC' + mcMatch[1];

    // Extract fleet size
    const fleetMatch = text.match(/(\d+)\s*(?:trucks?|vehicles?|units?)/i);
    if (fleetMatch) details.fleetSize = parseInt(fleetMatch[1]);

    // Extract commodity
    const commodityMatch = text.match(/(?:haul|transport|carry|commodity)[:\s]+([^,\n]+)/i);
    if (commodityMatch) details.commodityHauled = commodityMatch[1].trim();

    // Extract carrier
    const carrierMatch = text.match(/(?:progressive|geico|state farm|allstate|nationwide|liberty mutual)/i);
    if (carrierMatch) details.currentCarrier = carrierMatch[0];

    return details;
}

/**
 * Parse MySQL lead row into structured format
 */
function parseMySQLLead(row) {
    return {
        id: `vicidial_${row.lead_id}`,
        name: row.company_name || `${row.first_name} ${row.last_name}`.trim(),
        company: row.company_name || row.vendor_lead_code || '',
        contact: `${row.first_name} ${row.last_name}`.trim(),
        phone: row.phone_number,
        email: row.email || '',
        address: row.address1 || '',
        city: row.city || '',
        state: row.state || '',
        zip: row.postal_code || '',
        status: row.status,
        stage: row.status === 'SALE' ? 'new' : 'qualified',
        source: 'Vicidial MySQL',
        listId: row.list_id,
        calledCount: row.called_count,
        lastCall: row.last_local_call_time,
        campaign: row.campaign_name || '',
        notes: row.comments || '',
        created: new Date().toISOString()
    };
}

/**
 * Parse name from call data parts
 */
function parseNameFromCallData(parts) {
    // Try to extract name from various positions
    for (let i = 1; i < Math.min(parts.length, 5); i++) {
        const part = parts[i];
        if (part && part.length > 2 && !part.match(/^\d+$/)) {
            return part;
        }
    }
    return 'Unknown Contact';
}

/**
 * Use OpenAI to enhance lead parsing (if API key available)
 */
async function enhanceWithOpenAI(leadText) {
    if (!OPENAI_KEY || OPENAI_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
        return null; // Use regex parsing instead
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Extract lead information from text and return JSON with: company, contact, phone, email, premium, product, dotNumber, mcNumber, fleetSize, commodityHauled, currentCarrier, notes'
                },
                {
                    role: 'user',
                    content: leadText
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const result = response.data.choices[0].message.content;
        return JSON.parse(result);

    } catch (error) {
        console.error('OpenAI parsing failed:', error.message);
        return null;
    }
}

/**
 * Main sync function
 */
async function syncVicidialSales() {
    console.log('🔄 Starting real Vicidial sync...');

    try {
        // Fetch real leads from Vicidial
        const vicidialLeads = await fetchVicidialLeads();

        if (vicidialLeads.length === 0) {
            console.log('No leads found in Vicidial, checking for recent recordings...');

            // Check for recordings as another source
            const recordingsLeads = await fetchVicidialRecordings();
            vicidialLeads.push(...recordingsLeads);
        }

        // Store leads in database
        const storedLeads = [];

        for (const lead of vicidialLeads) {
            // Enhance with OpenAI if available
            if (lead.notes || lead.comments) {
                const enhanced = await enhanceWithOpenAI(lead.notes || lead.comments);
                if (enhanced) {
                    Object.assign(lead, enhanced);
                }
            }

            // Store in database
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR REPLACE INTO leads (id, data, created_at) VALUES (?, ?, ?)',
                    [lead.id, JSON.stringify(lead), new Date().toISOString()],
                    function(err) {
                        if (err) {
                            console.error('Error storing lead:', err);
                            reject(err);
                        } else {
                            storedLeads.push(lead);
                            resolve();
                        }
                    }
                );
            });
        }

        console.log(`✅ Synced ${storedLeads.length} real leads from Vicidial`);

        return {
            success: true,
            leads: storedLeads,
            message: `Successfully synced ${storedLeads.length} real leads from Vicidial server`
        };

    } catch (error) {
        console.error('Vicidial sync error:', error);
        throw error;
    }
}

/**
 * Fetch recordings and parse them for lead data
 */
async function fetchVicidialRecordings() {
    console.log('Checking Vicidial recordings...');

    try {
        // Get recordings list
        const recordingsUrl = `https://${VICIDIAL_CONFIG.server}/RECORDINGS/`;

        const response = await axios.get(recordingsUrl, {
            httpsAgent,
            auth: {
                username: VICIDIAL_CONFIG.user,
                password: VICIDIAL_CONFIG.pass
            },
            timeout: 60000
        });

        // Parse HTML for MP3 files
        const mp3Matches = response.data.match(/href="([^"]+\.mp3)"/gi) || [];
        const recordings = mp3Matches.slice(0, 10).map(match => {
            const filename = match.match(/href="([^"]+)"/)[1];
            return {
                filename,
                url: `https://${VICIDIAL_CONFIG.server}/RECORDINGS/${filename}`,
                date: filename.match(/\d{8}/)?.[0] || '',
                phone: filename.match(/\d{10}/)?.[0] || ''
            };
        });

        console.log(`Found ${recordings.length} recordings`);

        // Convert recordings to lead format
        return recordings.map((rec, index) => ({
            id: `vicidial_rec_${Date.now()}_${index}`,
            phone: rec.phone,
            recordingUrl: rec.url,
            status: 'RECORDING',
            stage: 'contacted',
            source: 'Vicidial Recording',
            created: new Date().toISOString(),
            notes: `Recording from ${rec.date}`,
            name: `Lead from ${rec.phone}`,
            company: 'Needs Review'
        }));

    } catch (error) {
        console.error('Error fetching recordings:', error.message);
        return [];
    }
}

module.exports = {
    syncVicidialSales,
    fetchVicidialLeads,
    parseVicidialResponse,
    parseLeadDetails
};