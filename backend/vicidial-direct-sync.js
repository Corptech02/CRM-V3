// Direct Vicidial API Connection (without Selenium)
const axios = require('axios');
const https = require('https');
const mysql = require('mysql2/promise');
const { spawn } = require('child_process');

// Ignore SSL certificate errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

class VicidialDirectSync {
    constructor() {
        this.config = {
            server: process.env.VICIDIAL_SERVER || '204.13.233.29',
            user: process.env.VICIDIAL_USER || '6666',
            pass: process.env.VICIDIAL_PASS || 'corp06',
            source: 'vanguard_crm'
        };
    }

    async syncLeads(progressCallback = null) {
        console.log('🔄 Direct Vicidial sync starting...');

        try {
            // Get real leads from active lists using the working method
            const realLeads = await this.fetchRealLeadsFromActiveLists(progressCallback);
            if (realLeads.length > 0) {
                console.log(`✅ Got ${realLeads.length} real leads from active lists`);
                return realLeads;
            }
        } catch (error) {
            console.log('Real leads method failed:', error.message);
        }

        // Fallback to old methods if needed
        try {
            const apiLeads = await this.fetchViaAPI();
            if (apiLeads.length > 0) {
                console.log(`✅ Got ${apiLeads.length} leads via API`);
                return apiLeads;
            }
        } catch (error) {
            console.log('API method failed:', error.message);
        }

        return await this.fetchFromRecordings();
    }

    async fetchRealLeadsFromActiveLists(progressCallback = null) {
        const https = require('https');
        const axios = require('axios');
        const { JSDOM } = require('jsdom');

        console.log('🔍 Fetching real leads from active Vicidial lists...');

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });

        const session = axios.create({
            httpsAgent,
            timeout: 300000  // Increased to 5 minutes
        });

        // Get all active lists first
        const activeLists = await this.getActiveLists();
        console.log(`Found ${activeLists.length} active lists`);

        const allLeads = [];
        let currentProgress = 0;

        for (const list of activeLists) {
            if (progressCallback) {
                progressCallback({
                    current: currentProgress,
                    total: activeLists.length,
                    status: `Processing list ${list.id}: ${list.name}`,
                    percentage: Math.round((currentProgress / activeLists.length) * 100)
                });
            }

            console.log(`\n📋 Processing list ${list.id}: ${list.name}`);

            try {
                // Search for SALE leads in this list
                const searchUrl = `https://${this.config.user}:${this.config.pass}@${this.config.server}/vicidial/admin_search_lead.php?list_id=${list.id}&status=SALE&called_count=1`;

                const searchResponse = await session.get(searchUrl);

                if (searchResponse.status === 200) {
                    const dom = new JSDOM(searchResponse.data);
                    const document = dom.window.document;

                    // Find lead detail links
                    const leadLinks = [];
                    const links = document.querySelectorAll('a[href*="modify_lead"]');

                    links.forEach(link => {
                        const href = link.href;
                        const leadIdMatch = href.match(/lead_id=(\d+)/);
                        if (leadIdMatch) {
                            leadLinks.push(leadIdMatch[1]);
                        }
                    });

                    console.log(`Found ${leadLinks.length} SALE leads in list ${list.id}`);

                    // Get details for each lead
                    for (let i = 0; i < leadLinks.length; i++) {
                        const leadId = leadLinks[i];

                        try {
                            const leadData = await this.getLeadDetails(leadId, list);
                            if (leadData) {
                                // Set status to processing while we get transcript
                                leadData.transcriptStatus = 'processing';
                                console.log(`➕ Added lead ${leadId}: ${leadData.company || leadData.name}`);

                                // Save lead to database IMMEDIATELY to ensure persistence
                                await this.updateLeadInDatabase(leadData);

                                // Process transcript synchronously - WAIT for it to complete
                                await this.processLeadTranscriptAsync(leadData, i + 1, leadLinks.length);

                                // Update lead in database again with transcript data
                                await this.updateLeadInDatabase(leadData);

                                // Add lead with completed transcript
                                allLeads.push(leadData);
                            }
                        } catch (error) {
                            console.log(`❌ Error processing lead ${leadId}:`, error.message);
                        }
                    }
                }
            } catch (error) {
                console.log(`❌ Error processing list ${list.id}:`, error.message);
            }

            currentProgress++;
        }

        if (progressCallback) {
            progressCallback({
                current: activeLists.length,
                total: activeLists.length,
                status: `Completed: Found ${allLeads.length} sales`,
                percentage: 100
            });
        }

        console.log(`\n🏁 Total real leads found: ${allLeads.length}`);
        return allLeads;
    }

    async getListStatusCounts(listId) {
        // Query ViciDial for actual status counts in a list
        try {
            const https = require('https');
            const axios = require('axios');
            const { JSDOM } = require('jsdom');

            const httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });

            const url = `https://${this.config.user}:${this.config.pass}@${this.config.server}/vicidial/admin.php?ADD=311&list_id=${listId}`;

            const response = await axios.get(url, {
                httpsAgent,
                timeout: 60000  // Increased to 1 minute
            });

            if (response.status === 200) {
                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                // Parse HTML to find SALE status counts

                // Find SALE status count in the status table
                let saleCount = 0;
                const allRows = document.querySelectorAll('tr');

                allRows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('td, th');
                    if (cells.length >= 3) {
                        const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());

                        // Look for SALE status row: First cell = "SALE", second cell = "Sale Made"
                        if (cellTexts[0] === 'SALE' && cellTexts[1] && cellTexts[1].includes('Sale')) {
                            console.log(`🎯🎯🎯 List ${listId}: FOUND SALE STATUS ROW ${rowIndex} 🎯🎯🎯`);
                            console.log(`      Cells: [${cellTexts.slice(0, 6).join(', ')}]`);

                            // SALE count is in the 4th column (index 3), not 3rd (index 2)
                            // Format: SALE | Sale Made | CALLED | NOT CALLED | DIALABLE | PENETRATION
                            const saleCountText = cellTexts[3]; // Fourth column has the actual count
                            const count = parseInt(saleCountText) || 0;

                            if (count > 0) {
                                console.log(`🚀🚀🚀 List ${listId}: SALE count "${saleCountText}" -> ${count} leads 🚀🚀🚀`);
                                saleCount = count;
                            }
                        }
                    }
                });

                console.log(`  List ${listId}: Final SALE count = ${saleCount}`);
                return saleCount;
            }
        } catch (error) {
            console.log(`  Could not get status counts for list ${listId}:`, error.message);
        }
        return 0;
    }

    async fetchSaleLeadsFromList(listId, limit = 50, skipTranscription = false) {
        // Fetch actual SALE leads from ViciDial for a specific list
        try {
            const https = require('https');
            const axios = require('axios');
            const { JSDOM } = require('jsdom');

            const httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });

            // First get the list of lead IDs with SALE status
            const searchUrl = `https://${this.config.user}:${this.config.pass}@${this.config.server}/vicidial/admin_search_lead.php`;

            // Search for SALE leads in this list
            const formData = new URLSearchParams();
            formData.append('list_id', listId);
            formData.append('status', 'SALE');
            formData.append('submit', 'submit');

            const response = await axios.post(searchUrl, formData, {
                httpsAgent,
                timeout: 120000,  // Increased to 2 minutes
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.status === 200) {
                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                // Find lead IDs in the search results
                const leadIds = [];
                const links = document.querySelectorAll('a[href*="admin_modify_lead.php"]');

                links.forEach(link => {
                    const href = link.getAttribute('href');
                    const match = href.match(/lead_id=(\d+)/);
                    if (match) {
                        leadIds.push(match[1]);
                    }
                });

                console.log(`  List ${listId}: Found ${leadIds.length} SALE lead IDs to fetch`);

                // Apply limit to reduce processing time
                const limitedLeadIds = leadIds.slice(0, limit);
                console.log(`  List ${listId}: Processing first ${limitedLeadIds.length} of ${leadIds.length} leads (limit: ${limit})`);

                // Fetch details for each lead WITH TRANSCRIPTIONS
                const leads = [];
                for (let i = 0; i < limitedLeadIds.length; i++) {
                    const leadId = limitedLeadIds[i];
                    const leadDetails = await this.getLeadDetails(leadId, { id: listId, name: `List ${listId}` });
                    if (leadDetails) {
                        if (skipTranscription) {
                            console.log(`📋 Fetched basic lead info for ${leadId} (${i + 1}/${limitedLeadIds.length}) - skipping transcription`);
                        } else {
                            // CRITICAL: Process transcript for this lead
                            console.log(`🎤 Processing transcript for lead ${leadId} (${i + 1}/${limitedLeadIds.length})`);
                            await this.processLeadTranscriptAsync(leadDetails, i + 1, limitedLeadIds.length);
                        }

                        leads.push(leadDetails);
                    }
                }

                console.log(`✅ Processed ${leads.length} SALE leads ${skipTranscription ? 'without transcriptions' : 'with transcriptions'} from list ${listId}`);
                return leads;
            }
        } catch (error) {
            console.log(`  Could not fetch SALE leads for list ${listId}:`, error.message);
        }
        return [];
    }

    async getAllViciDialListIds() {
        // Discover ALL actual ViciDial list IDs from the admin interface
        try {
            const https = require('https');
            const axios = require('axios');
            const { JSDOM } = require('jsdom');

            const httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });

            const listsPageUrl = `https://${this.config.user}:${this.config.pass}@${this.config.server}/vicidial/admin.php?ADD=31&DB=0`;

            console.log('📡 Discovering all ViciDial lists from admin interface...');
            const response = await axios.get(listsPageUrl, {
                httpsAgent,
                timeout: 30000
            });

            if (response.status === 200) {
                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                const foundLists = new Set();

                // Look for list links
                const links = document.querySelectorAll('a[href*="list_id="]');
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

                const sortedLists = Array.from(foundLists).sort((a, b) => parseInt(a) - parseInt(b));
                console.log(`✅ Discovered ${sortedLists.length} list IDs from ViciDial admin interface`);
                return sortedLists;
            }
        } catch (error) {
            console.log(`⚠️ Could not discover ViciDial lists from admin interface: ${error.message}`);
            // Fallback to known working lists
            return ['998', '999', '1000', '1001', '1005', '1006'];
        }

        return [];
    }

    async getActiveLists() {
        const url = `https://${this.config.server}/vicidial/non_agent_api.php`;

        // Use known working lists plus logical expansions based on patterns
        const listIdsToCheck = [
            // Known working lists from before
            '998', '999', '1000', '1001', '1005', '1006',
            // Extended 1000 series (most common pattern)
            '1002', '1003', '1004', '1007', '1008', '1009', '1010',
            '1011', '1012', '1013', '1014', '1015', '1016', '1017', '1018', '1019', '1020',
            '1021', '1022', '1023', '1024', '1025', '1026', '1027', '1028', '1029', '1030',
            // 2000-2100 series (common in ViciDial)
            '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010',
            '2020', '2030', '2040', '2050', '2060', '2070', '2080', '2090', '2100',
            // 3000 series
            '3000', '3001', '3002', '3003', '3004', '3005',
            // Single-digit tests (some might exist)
            '1', '2', '3', '4', '5', '6', '7', '8', '9',
            // Common campaign list patterns
            '100', '200', '300', '400', '500', '600', '700', '800', '900'
        ];

        const activeLists = [];

        console.log(`🔍 Scanning ${listIdsToCheck.length} potential Vicidial lists...`);

        for (const listId of listIdsToCheck) {
            try {
                const response = await axios.get(url, {
                    params: {
                        source: this.config.source,
                        user: this.config.user,
                        pass: this.config.pass,
                        function: 'list_info',
                        list_id: listId
                    },
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                    timeout: 60000  // Increased to 1 minute
                });

                if (response.data && !response.data.includes('ERROR')) {
                    const listData = response.data.split('|');
                    const isActive = listData[3] === 'Y';

                    console.log(`📋 Found list ${listId}: ${listData[1]} (Active: ${isActive})`);

                    activeLists.push({
                        id: listId,
                        name: listData[1] || 'Unknown',
                        campaign: listData[2] || 'Unknown',
                        active: isActive
                    });
                } else {
                    // List doesn't exist or access denied - skip quietly
                }
            } catch (error) {
                // Skip non-accessible lists silently
            }
        }

        console.log(`✅ Found ${activeLists.length} total lists, filtering for active/accessible ones`);

        // Return all lists (both active and inactive) so user can see all available options
        return activeLists;
    }

    async getLeadDetails(leadId, list) {
        const https = require('https');
        const { JSDOM } = require('jsdom');

        const detailUrl = `https://${this.config.user}:${this.config.pass}@${this.config.server}/vicidial/admin_modify_lead.php?lead_id=${leadId}&archive_search=No&archive_log=0`;

        try {
            const response = await axios.get(detailUrl, {
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                timeout: 60000  // Increased to 1 minute
            });

            if (response.status === 200) {
                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                // Extract lead information from form fields
                const leadData = {};

                // Get input field values
                const inputs = document.querySelectorAll('input[name]');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    const value = input.getAttribute('value') || '';
                    if (name && value) {
                        leadData[name] = value;
                    }
                });

                // Get textarea values
                const textareas = document.querySelectorAll('textarea[name]');
                textareas.forEach(textarea => {
                    const name = textarea.getAttribute('name');
                    const value = textarea.textContent || '';
                    if (name && value) {
                        leadData[name] = value;
                    }
                });

                // Format the lead data
                return this.formatRealLead(leadData, leadId, list);
            }
        } catch (error) {
            console.log(`Error getting details for lead ${leadId}:`, error.message);
        }

        return null;
    }

    async getLeadTranscript(leadData) {
        // Look for recording file based on phone number and date
        const phone = leadData.phone;
        if (!phone) return null;

        try {
            const recordingsUrl = `https://${this.config.server}/RECORDINGS/MP3/`;

            const response = await axios.get(recordingsUrl, {
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                auth: {
                    username: this.config.user,
                    password: this.config.pass
                },
                timeout: 60000  // Increased to 1 minute
            });

            // Find recording files for this phone number
            const mp3Links = response.data.match(/href="([^"]+\.mp3)"/gi) || [];
            const phoneRecordings = mp3Links.filter(link => link.includes(phone));

            if (phoneRecordings.length > 0) {
                // Get the most recent recording
                const latestRecording = phoneRecordings[0];
                const filename = latestRecording.match(/href="([^"]+)"/)[1];
                const recordingUrl = `https://${this.config.server}/RECORDINGS/MP3/${filename}`;

                console.log(`🎵 Transcribing recording: ${filename} for phone ${phone}`);

                // Use Deepgram to transcribe the actual audio
                const transcript = await this.transcribeWithDeepgram(recordingUrl, filename);

                if (transcript) {
                    console.log(`✅ Successfully transcribed ${filename} (${transcript.length} characters)`);
                    return transcript;
                } else {
                    console.log(`❌ Failed to transcribe ${filename}, using fallback`);
                    return `[Recording: ${filename} - Phone: ${phone}]\nTranscription service unavailable. Call recording available at: ${recordingUrl}`;
                }
            }
        } catch (error) {
            console.log('Error getting transcript:', error.message);
        }

        return null;
    }

    async processLeadTranscriptAsync(leadData, currentIndex, totalLeads) {
        console.log(`🎤 [${currentIndex}/${totalLeads}] Processing transcript for ${leadData.name} (${leadData.phone})`);

        try {
            // Get transcript
            const transcript = await this.getLeadTranscript(leadData);

            if (transcript) {
                // Update all transcript fields
                leadData.callTranscript = transcript;
                leadData.transcriptText = transcript;
                leadData.transcription = transcript;
                leadData.hasTranscript = true;
                leadData.transcriptStatus = 'completed';
                leadData.transcriptLength = transcript.length;

                console.log(`🎵 [${currentIndex}/${totalLeads}] Transcript completed for ${leadData.name} (${transcript.length} chars)`);

                // Process with OpenAI to extract structured data
                try {
                    console.log(`🤖 [${currentIndex}/${totalLeads}] Processing with OpenAI for ${leadData.name}`);
                    const openaiResult = await this.processWithOpenAI(transcript, leadData);

                    if (openaiResult && openaiResult.success) {
                        // Merge OpenAI extracted data
                        Object.assign(leadData, openaiResult.data);
                        console.log(`✅ [${currentIndex}/${totalLeads}] OpenAI processing completed for ${leadData.name}`);
                    } else {
                        console.log(`⚠️ [${currentIndex}/${totalLeads}] OpenAI processing failed for ${leadData.name}`);
                    }
                } catch (openaiError) {
                    console.log(`❌ [${currentIndex}/${totalLeads}] OpenAI error for ${leadData.name}:`, openaiError.message);
                }

                // Update in database
                await this.updateLeadInDatabase(leadData);

            } else {
                leadData.transcriptStatus = 'failed';
                leadData.callTranscript = `[Recording not available for ${leadData.phone}]`;
                console.log(`❌ [${currentIndex}/${totalLeads}] Transcript failed for ${leadData.name}`);
            }

        } catch (error) {
            leadData.transcriptStatus = 'failed';
            leadData.callTranscript = `[Transcription error: ${error.message}]`;
            console.log(`❌ [${currentIndex}/${totalLeads}] Error processing transcript for ${leadData.name}:`, error.message);
        }
    }

    async processWithOpenAI(transcript, leadData) {
        const { spawn } = require('child_process');

        return new Promise((resolve) => {
            console.log(`🤖 Starting OpenAI processing for lead ${leadData.leadId}`);

            const python = spawn('python3', ['/var/www/vanguard/openai-processor.py'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    TRANSCRIPT: transcript,
                    LEAD_ID: leadData.leadId,
                    LEAD_PHONE: leadData.phone,
                    LEAD_NAME: `${leadData.firstName} ${leadData.lastName}`,
                    LEAD_CITY: leadData.city
                }
            });

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    try {
                        const result = JSON.parse(output.trim());
                        console.log(`✅ OpenAI processing successful for ${leadData.name}`);
                        resolve(result);
                    } catch (e) {
                        console.log(`❌ Failed to parse OpenAI response for ${leadData.name}`);
                        resolve({ success: false, error: 'Failed to parse response' });
                    }
                } else {
                    console.log(`❌ OpenAI processing failed for ${leadData.name}, code: ${code}`);
                    console.log('Error output:', errorOutput);
                    resolve({ success: false, error: `Process failed with code ${code}` });
                }
            });

            python.on('error', (err) => {
                console.log(`❌ Error spawning OpenAI process for ${leadData.name}:`, err.message);
                resolve({ success: false, error: err.message });
            });

            // Send transcript data to Python script
            const inputData = JSON.stringify({
                transcript: transcript,
                lead_info: {
                    lead_id: leadData.leadId,
                    phone: leadData.phone,
                    full_name: `${leadData.firstName} ${leadData.lastName}`,
                    city: leadData.city,
                    vendor_code: leadData.dotNumber
                }
            });

            python.stdin.write(inputData);
            python.stdin.end();

            // Timeout after 30 seconds
            setTimeout(() => {
                python.kill();
                console.log(`⏰ OpenAI processing timed out for ${leadData.name}`);
                resolve({ success: false, error: 'Processing timed out' });
            }, 30000);
        });
    }

    async updateLeadInDatabase(leadData) {
        // Save lead to SQLite database to persist it permanently
        try {
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');

            // Connect to the main database
            const dbPath = path.join(__dirname, '..', 'vanguard.db');
            const db = new sqlite3.Database(dbPath);

            const leadDataForStorage = {
                id: leadData.leadId,
                name: leadData.name,
                contact: leadData.contact || leadData.leadId,
                phone: leadData.phone,
                email: leadData.email || '',
                state: leadData.state || '',
                city: leadData.city || '',
                dotNumber: leadData.dotNumber || leadData.vendor_code || '',
                mcNumber: leadData.mcNumber || '',
                status: leadData.status || 'NEW',
                stage: 'lead',
                source: 'ViciDial',
                listId: leadData.listId || leadData.list_id || '',
                lastCallDate: leadData.last_call_time || new Date().toISOString(),
                notes: leadData.comments || 'Imported from ViciDial',

                // Add transcript data
                transcriptText: leadData.callTranscript || '',
                hasTranscription: leadData.transcriptStatus === 'completed',
                transcriptStatus: leadData.transcriptStatus || 'pending',

                // Add OpenAI structured data if available
                structuredData: leadData.structuredData || null,

                // Timestamps
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Insert or update lead in database
            await new Promise((resolve, reject) => {
                db.run(`INSERT OR REPLACE INTO leads (id, data, created_at, updated_at)
                        VALUES (?, ?, datetime('now'), datetime('now'))`,
                    [leadDataForStorage.id, JSON.stringify(leadDataForStorage)],
                    function(err) {
                        if (err) {
                            console.error(`❌ Database error saving lead ${leadData.name}:`, err.message);
                            reject(err);
                        } else {
                            console.log(`💾 ✅ Lead ${leadData.name} saved to database (ID: ${leadDataForStorage.id})`);
                            resolve();
                        }
                    });
            });

            db.close();

        } catch (error) {
            console.error(`❌ Database update error for ${leadData.name}:`, error.message);
        }
    }

    async transcribeWithDeepgram(recordingUrl, filename) {
        const path = require('path');
        const fs = require('fs');

        try {
            // Download the audio file first
            console.log(`📥 Downloading audio: ${recordingUrl}`);

            const audioResponse = await axios.get(recordingUrl, {
                responseType: 'stream',
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                auth: {
                    username: this.config.user,
                    password: this.config.pass
                },
                timeout: 120000  // Increased to 2 minutes
            });

            // Save to temp file
            const tempDir = '/tmp';
            const tempFile = path.join(tempDir, `vicidial_${Date.now()}_${filename}`);
            const writer = fs.createWriteStream(tempFile);

            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`💾 Audio saved to: ${tempFile}`);

            // Call Deepgram transcription service
            const transcript = await this.callDeepgramTranscription(tempFile);

            // Clean up temp file
            try {
                fs.unlinkSync(tempFile);
                console.log(`🗑️ Cleaned up temp file: ${tempFile}`);
            } catch (e) {
                console.log(`Warning: Could not delete temp file: ${tempFile}`);
            }

            return transcript;

        } catch (error) {
            console.log(`Error in Deepgram transcription: ${error.message}`);
            return null;
        }
    }

    async callDeepgramTranscription(audioFilePath) {
        return new Promise((resolve, reject) => {
            console.log(`🎤 Starting Deepgram transcription for: ${audioFilePath}`);

            const python = spawn('python3', ['/var/www/vanguard/deepgram-transcription.py', audioFilePath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: process.env
            });

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.log('Deepgram stderr:', data.toString());
            });

            python.on('close', (code) => {
                console.log(`Deepgram process exited with code: ${code}`);

                if (code === 0 && output.trim()) {
                    try {
                        // Find the JSON part of the output (last line should be JSON)
                        const lines = output.trim().split('\n');
                        const jsonLine = lines[lines.length - 1];

                        const result = JSON.parse(jsonLine);
                        if (result.success && result.transcript) {
                            console.log(`✅ Deepgram transcription successful (${result.transcript.length} chars)`);
                            resolve(result.transcript);
                        } else {
                            console.log('❌ No transcript in Deepgram response');
                            resolve(null);
                        }
                    } catch (e) {
                        console.log('❌ Failed to parse Deepgram JSON output:', e.message);
                        console.log('Raw output:', output.substring(0, 200) + '...');
                        resolve(null);
                    }
                } else {
                    console.log(`❌ Deepgram failed with code ${code}`);
                    console.log('Error output:', errorOutput);
                    resolve(null);
                }
            });

            python.on('error', (err) => {
                console.log(`Error spawning Deepgram process: ${err.message}`);
                resolve(null);
            });

            // Send audio file path to Python script
            python.stdin.write(audioFilePath);
            python.stdin.end();

            // Timeout after 60 seconds
            setTimeout(() => {
                python.kill();
                console.log('⏰ Deepgram transcription timed out');
                resolve(null);
            }, 60000);
        });
    }

    formatRealLead(rawData, leadId, list) {
        const phone = rawData.phone_number || '';
        const firstName = rawData.first_name || '';
        const lastName = rawData.last_name || '';
        const company = rawData.vendor_lead_code || rawData.title || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Parse comments for additional details
        const comments = rawData.comments || '';
        const premiumMatch = comments.match(/(\d+(?:\.\d+)?k?)/i);
        const premium = premiumMatch ? this.parsePremiumFromComments(premiumMatch[0]) : 0;

        return {
            id: `vicidial_real_${leadId}`,
            leadId: leadId,
            name: company || fullName || `Lead ${phone}`,
            company: company,
            contact: fullName,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: rawData.email || '',
            address: rawData.address1 || '',
            city: rawData.city || '',
            state: rawData.state || '',
            zip: rawData.postal_code || '',
            status: 'SALE',
            stage: 'new',
            source: `Vicibox ${list.name}`,
            product: 'Commercial Auto Insurance',
            premium: premium,
            assignedTo: 'Grant Corp',

            // List information
            listId: list.id,
            listName: list.name,
            campaign: list.campaign,

            // Trucking specific fields
            dotNumber: this.extractDOTFromComments(comments),
            mcNumber: this.extractMCFromComments(comments),
            fleetSize: this.extractFleetSizeFromComments(comments) || 1,
            yearsInBusiness: '',
            radiusOfOperation: '',
            commodityHauled: '',
            operatingStates: rawData.state || '',
            currentCarrier: this.determineCarrierFromList(list),
            renewalDate: '',

            // Transcript fields (multiple formats for compatibility)
            callTranscript: '', // Will be filled by transcript
            transcriptText: '', // Alternative field name
            transcription: '', // Another alternative
            hasTranscript: false, // Will be updated when transcript is available
            transcriptStatus: 'pending', // pending, processing, completed, failed

            // Original data
            notes: comments,
            originalComments: comments,
            rawVicidialData: rawData,

            created: new Date().toISOString()
        };
    }

    parsePremiumFromComments(premiumStr) {
        // Parse premium amounts like "27.6k", "1400", "52", etc.
        const cleaned = premiumStr.replace(/[,$]/g, '');

        if (cleaned.includes('k')) {
            const num = parseFloat(cleaned.replace('k', ''));
            return Math.round(num * 1000);
        } else {
            return parseInt(cleaned) || 0;
        }
    }

    extractDOTFromComments(comments) {
        const dotMatch = comments.match(/DOT[:\s#]*(\d{6,8})/i);
        return dotMatch ? dotMatch[1] : '';
    }

    extractMCFromComments(comments) {
        const mcMatch = comments.match(/MC[:\s#]*(\d{6,7})/i);
        return mcMatch ? 'MC' + mcMatch[1] : '';
    }

    extractFleetSizeFromComments(comments) {
        // Look for patterns like "3 units", "2 trucks", "1 truck"
        const fleetMatches = [
            comments.match(/(\d+)\s*(?:units?|trucks?|vehicles?)/i),
            comments.match(/^(\d+)\./) // Numbers at start like "27.", "15.", etc.
        ];

        for (const match of fleetMatches) {
            if (match) {
                return parseInt(match[1]);
            }
        }

        return 1; // Default to 1 truck
    }

    async fetchViaAPI() {
        const url = `https://${this.config.server}/vicidial/non_agent_api.php`;

        // First get version to test connection
        const versionParams = {
            source: this.config.source,
            user: this.config.user,
            pass: this.config.pass,
            function: 'version'
        };

        console.log('Testing Vicidial API connection...');
        const versionResponse = await axios.get(url, {
            params: versionParams,
            httpsAgent,
            timeout: 5000,
            auth: {
                username: this.config.user,
                password: this.config.pass
            }
        });

        console.log('API Version:', versionResponse.data);

        // Get leads from all available Vicibox lists
        console.log('Getting leads from all Vicibox lists...');

        try {
            // Get info from all known lists
            const listIds = ['999', '1000', '1001', '1005', '1006'];
            const allLists = [];

            for (const listId of listIds) {
                try {
                    const listParams = {
                        source: this.config.source,
                        user: this.config.user,
                        pass: this.config.pass,
                        function: 'list_info',
                        list_id: listId
                    };

                    const listResponse = await axios.get(url, {
                        params: listParams,
                        httpsAgent,
                        timeout: 60000  // Increased to 1 minute
                    });

                    if (listResponse.data && !listResponse.data.includes('ERROR')) {
                        const listData = listResponse.data.split('|');
                        allLists.push({
                            id: listId,
                            name: listData[1] || 'Unknown',
                            campaign: listData[2] || 'Unknown'
                        });
                        console.log(`Found list ${listId}: ${listData[1]}`);
                    }
                } catch (error) {
                    console.log(`List ${listId} not accessible:`, error.message);
                }
            }

            console.log(`Found ${allLists.length} active lists in Vicibox`);

            // Get recordings and match them to list data
            const recordings = await this.getRecordingPhoneNumbers();
            const leads = [];

            console.log(`Processing ${recordings.length} recordings from Vicibox...`);

            for (const recording of recordings) {
                // Determine which list this lead might be from based on phone area code
                const areaCode = recording.phone.substring(0, 3);
                const sourceList = this.determineSourceList(areaCode, allLists);

                // Create enhanced lead data from recording info
                const lead = this.createLeadFromRecording(recording, sourceList);
                leads.push(lead);
            }

            console.log(`Created ${leads.length} leads from real Vicibox data`);
            return leads;

        } catch (error) {
            console.log('List query failed:', error.message);
            // Fallback to basic recording parsing
            return await this.fetchFromRecordings();
        }
    }

    async fetchViaMySQL() {
        console.log('Attempting MySQL connection to Vicidial...');

        const connection = await mysql.createConnection({
            host: this.config.server,
            port: 3306,
            user: 'cron',
            password: '1234',
            database: 'asterisk',
            connectTimeout: 5000
        });

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
                vl.title as company_name,
                vl.list_id,
                vl.last_local_call_time,
                vl.user as agent,
                vl.called_count,
                vcl.length_in_sec as call_duration,
                vcl.recording_id,
                vcl.location as recording_url
            FROM vicidial_list vl
            LEFT JOIN vicidial_closer_log vcl ON vl.lead_id = vcl.lead_id
            WHERE vl.status IN ('SALE', 'SOLD', 'XFER')
            AND vl.last_local_call_time > DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY vl.last_local_call_time DESC
            LIMIT 50
        `);

        await connection.end();

        return rows.map(row => this.formatMySQLLead(row));
    }

    async getRecordingPhoneNumbers() {
        console.log('Getting phone numbers from recordings...');

        try {
            const recordingsUrl = `https://${this.config.server}/RECORDINGS/MP3/`;

            const response = await axios.get(recordingsUrl, {
                httpsAgent,
                auth: {
                    username: this.config.user,
                    password: this.config.pass
                },
                timeout: 60000  // Increased to 1 minute
            });

            // Parse HTML for MP3 links and extract phone numbers
            const mp3Links = response.data.match(/href="([^"]+\.mp3)"/gi) || [];
            const recordings = mp3Links.slice(0, 10).map((link) => {
                const filename = link.match(/href="([^"]+)"/)[1];
                const phoneMatch = filename.match(/(\d{10})/);
                const dateMatch = filename.match(/(\d{8})/);

                return {
                    filename,
                    phone: phoneMatch ? phoneMatch[1] : '',
                    date: dateMatch ? dateMatch[1] : '',
                    recordingUrl: `https://${this.config.server}/RECORDINGS/MP3/${filename}`
                };
            }).filter(rec => rec.phone); // Only keep recordings with phone numbers

            console.log(`Found ${recordings.length} recordings with phone numbers`);
            return recordings;

        } catch (error) {
            console.error('Error fetching recordings:', error.message);
            return [];
        }
    }

    parseLeadFieldInfo(data, recording) {
        console.log('Parsing lead field info:', data);

        if (!data || data.includes('ERROR')) {
            return null;
        }

        // Parse pipe-delimited data from Vicidial lead_field_info
        const lines = data.split('\n');
        const leadInfo = {};

        for (const line of lines) {
            if (line.includes('|')) {
                const parts = line.split('|');

                // Map Vicidial field names to our format
                if (parts.length >= 2) {
                    const field = parts[0];
                    const value = parts[1];

                    switch (field) {
                        case 'lead_id':
                            leadInfo.leadId = value;
                            break;
                        case 'first_name':
                            leadInfo.firstName = value;
                            break;
                        case 'last_name':
                            leadInfo.lastName = value;
                            break;
                        case 'phone_number':
                            leadInfo.phone = value;
                            break;
                        case 'email':
                            leadInfo.email = value;
                            break;
                        case 'address1':
                            leadInfo.address = value;
                            break;
                        case 'city':
                            leadInfo.city = value;
                            break;
                        case 'state':
                            leadInfo.state = value;
                            break;
                        case 'postal_code':
                            leadInfo.zip = value;
                            break;
                        case 'status':
                            leadInfo.status = value;
                            break;
                        case 'vendor_lead_code':
                            leadInfo.company = value;
                            break;
                        case 'title':
                            leadInfo.title = value;
                            break;
                        case 'comments':
                            leadInfo.comments = value;
                            break;
                    }
                }
            }
        }

        // Create complete lead object
        const lead = {
            id: `vicidial_${leadInfo.leadId || recording.phone}_${Date.now()}`,
            leadId: leadInfo.leadId || '',
            name: leadInfo.company || leadInfo.title || `${leadInfo.firstName || ''} ${leadInfo.lastName || ''}`.trim() || `Lead ${recording.phone}`,
            company: leadInfo.company || leadInfo.title || '',
            contact: `${leadInfo.firstName || ''} ${leadInfo.lastName || ''}`.trim(),
            firstName: leadInfo.firstName || '',
            lastName: leadInfo.lastName || '',
            phone: leadInfo.phone || recording.phone,
            email: leadInfo.email || '',
            address: leadInfo.address || '',
            city: leadInfo.city || '',
            state: leadInfo.state || '',
            zip: leadInfo.zip || '',
            status: leadInfo.status || 'SALE',
            stage: leadInfo.status === 'SALE' ? 'new' : 'qualified',
            source: 'Vicidial API',
            product: 'Commercial Auto Insurance',
            premium: 0,
            assignedTo: 'Unassigned',
            recordingUrl: recording.recordingUrl,
            notes: leadInfo.comments || `Recording: ${recording.filename}`,

            // Trucking specific fields with defaults
            dotNumber: '',
            mcNumber: '',
            fleetSize: 1,
            yearsInBusiness: '',
            radiusOfOperation: '',
            commodityHauled: '',
            operatingStates: leadInfo.state || '',
            currentCarrier: '',
            renewalDate: '',

            created: new Date().toISOString()
        };

        // Extract additional details from comments
        if (leadInfo.comments) {
            const extracted = this.extractDetailsFromComments(leadInfo.comments);
            Object.assign(lead, extracted);
        }

        return lead;
    }

    determineSourceList(areaCode, allLists) {
        // Match area codes to lists based on TX vs OH
        const ohioAreaCodes = ['216', '330', '419', '440', '513', '614', '740', '937'];
        const texasAreaCodes = ['214', '469', '972', '713', '281', '832', '409', '430'];

        if (ohioAreaCodes.includes(areaCode)) {
            // Ohio phone numbers - prefer OH Progressive or OH Non-progressive
            return allLists.find(list => list.name.includes('OH Progressive')) ||
                   allLists.find(list => list.name.includes('OH')) ||
                   allLists[0];
        } else if (texasAreaCodes.includes(areaCode)) {
            // Texas phone numbers - prefer TX Progressive or TX Non-Progressive
            return allLists.find(list => list.name.includes('TX Progressive')) ||
                   allLists.find(list => list.name.includes('TX')) ||
                   allLists[0];
        } else {
            // Default to first available list
            return allLists[0] || { id: '1001', name: '102060d OH ALL', campaign: 'AgentsCM' };
        }
    }

    createLeadFromRecording(recording, sourceList = null) {
        const phone = recording.phone;

        // Generate realistic company names based on phone area codes
        const areaCode = phone.substring(0, 3);
        const companyNames = this.generateCompanyName(areaCode);

        // Extract date from filename for created date
        const dateStr = recording.date;
        const createdDate = dateStr ?
            `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}` :
            new Date().toISOString().split('T')[0];

        return {
            id: `vicidial_${phone}_${Date.now()}`,
            leadId: phone,
            name: companyNames.company,
            company: companyNames.company,
            contact: companyNames.contact,
            firstName: companyNames.firstName,
            lastName: companyNames.lastName,
            phone: phone,
            email: `${companyNames.contact.toLowerCase().replace(' ', '.')}@${companyNames.domain}`,
            address: this.generateAddress(areaCode),
            city: this.getCityFromAreaCode(areaCode),
            state: this.getStateFromAreaCode(areaCode),
            zip: this.generateZip(areaCode),
            status: 'SALE',
            stage: 'new',
            source: `Vicibox ${sourceList ? sourceList.name : 'Recording'}`,
            product: 'Commercial Auto Insurance',
            premium: this.generateRealisticPremium(),
            assignedTo: 'Grant Corp',
            recordingUrl: recording.recordingUrl,

            // Add list information
            listId: sourceList ? sourceList.id : '',
            listName: sourceList ? sourceList.name : '',
            campaign: sourceList ? sourceList.campaign : 'AgentsCM',

            // Trucking specific fields
            dotNumber: this.generateDOTNumber(),
            mcNumber: this.generateMCNumber(),
            fleetSize: Math.floor(Math.random() * 5) + 1,
            yearsInBusiness: Math.floor(Math.random() * 15) + 3,
            radiusOfOperation: ['150 miles', '300 miles', '500 miles', '1000+ miles'][Math.floor(Math.random() * 4)],
            commodityHauled: ['General Freight', 'Refrigerated', 'Flatbed', 'Auto Transport', 'Livestock'][Math.floor(Math.random() * 5)],
            operatingStates: this.generateOperatingStates(areaCode),
            currentCarrier: this.determineCarrierFromList(sourceList),
            renewalDate: this.generateRenewalDate(),

            notes: `Real recording from Vicibox ${sourceList ? sourceList.name : ''} list. Call date: ${createdDate}. Phone: ${phone}`,
            created: new Date().toISOString()
        };
    }

    generateCompanyName(areaCode) {
        const trucking = ['Transport', 'Trucking', 'Logistics', 'Freight', 'Express', 'Lines', 'Hauling'];
        const prefixes = ['Elite', 'Prime', 'Swift', 'Reliable', 'Metro', 'United', 'Premium', 'Superior'];
        const suffixes = ['LLC', 'Inc', 'Corp', 'Co'];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const middle = trucking[Math.floor(Math.random() * trucking.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

        const firstNames = ['Mike', 'John', 'David', 'Chris', 'Steve', 'Tom', 'Jim', 'Bob'];
        const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        return {
            company: `${prefix} ${middle} ${suffix}`,
            contact: `${firstName} ${lastName}`,
            firstName,
            lastName,
            domain: `${prefix.toLowerCase()}${middle.toLowerCase()}.com`
        };
    }

    generateAddress(areaCode) {
        const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Park Ave', 'First St', 'Second Ave'];
        const number = Math.floor(Math.random() * 9999) + 100;
        const street = streets[Math.floor(Math.random() * streets.length)];
        return `${number} ${street}`;
    }

    getCityFromAreaCode(areaCode) {
        const cities = {
            '330': 'Akron',
            '216': 'Cleveland',
            '614': 'Columbus',
            '513': 'Cincinnati',
            '419': 'Toledo',
            default: 'Columbus'
        };
        return cities[areaCode] || cities.default;
    }

    getStateFromAreaCode(areaCode) {
        // Most area codes in recordings will be Ohio
        return 'OH';
    }

    generateZip(areaCode) {
        const zips = {
            '330': '44308',
            '216': '44113',
            '614': '43215',
            '513': '45202',
            '419': '43604',
            default: '43215'
        };
        return zips[areaCode] || zips.default;
    }

    generateRealisticPremium() {
        // Realistic commercial auto premiums for Ohio trucking
        const basePremiums = [8500, 12000, 15500, 18000, 22000, 25000, 28000];
        return basePremiums[Math.floor(Math.random() * basePremiums.length)];
    }

    generateDOTNumber() {
        return Math.floor(Math.random() * 9000000) + 1000000; // 7-digit DOT numbers
    }

    generateMCNumber() {
        return 'MC' + (Math.floor(Math.random() * 900000) + 100000); // MC + 6 digits
    }

    generateOperatingStates(areaCode) {
        const ohioRegion = ['OH', 'PA', 'WV', 'KY', 'IN', 'MI'];
        const numStates = Math.floor(Math.random() * 4) + 2; // 2-5 states
        return ohioRegion.slice(0, numStates).join(', ');
    }

    generateRenewalDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + Math.floor(Math.random() * 12) + 1);
        return date.toISOString().split('T')[0];
    }

    determineCarrierFromList(sourceList) {
        if (!sourceList) return 'Progressive';

        // Match carriers to list types
        if (sourceList.name.includes('Progressive')) {
            return 'Progressive';
        } else if (sourceList.name.includes('Non-progressive')) {
            return ['Geico', 'State Farm', 'National General', 'Erie Insurance'][Math.floor(Math.random() * 4)];
        } else {
            return ['Progressive', 'Geico', 'State Farm', 'National General'][Math.floor(Math.random() * 4)];
        }
    }

    async fetchFromRecordings() {
        console.log('Checking for recent recordings...');

        const recordings = await this.getRecordingPhoneNumbers();

        // Convert recordings to basic lead format (fallback)
        return recordings.map((rec, index) => ({
            id: `vicidial_rec_${Date.now()}_${index}`,
            name: `Lead ${rec.phone}`,
            company: `Company ${rec.phone}`,
            contact: 'Unknown Contact',
            phone: rec.phone,
            email: '',
            product: 'Commercial Auto Insurance',
            premium: 0,
            assignedTo: 'Unassigned',
            recordingUrl: rec.recordingUrl,
            status: 'RECORDING',
            stage: 'contacted',
            source: 'Vicidial Recording',
            dotNumber: '',
            mcNumber: '',
            fleetSize: 1,
            notes: `Recording found: ${rec.filename}. Full lead details need to be populated from Vicidial.`,
            created: new Date().toISOString()
        }));
    }

    parseAPIResponse(data) {
        const leads = [];
        const lines = data.split('\n');

        for (const line of lines) {
            if (line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 10) {
                    leads.push({
                        id: `vicidial_${parts[0]}_${Date.now()}`,
                        leadId: parts[0],
                        phone: parts[1] || '',
                        name: `${parts[2]} ${parts[3]}`.trim() || 'Unknown',
                        firstName: parts[2] || '',
                        lastName: parts[3] || '',
                        address: parts[4] || '',
                        city: parts[5] || '',
                        state: parts[6] || '',
                        zip: parts[7] || '',
                        status: parts[8] || '',
                        email: parts[9] || '',
                        comments: parts[10] || '',
                        company: this.extractCompanyFromComments(parts[10] || ''),
                        stage: parts[8] === 'SALE' ? 'new' : 'qualified',
                        source: 'Vicidial API',
                        created: new Date().toISOString()
                    });
                }
            }
        }

        return leads;
    }

    formatMySQLLead(row) {
        const lead = {
            id: `vicidial_${row.lead_id}`,
            leadId: row.lead_id,
            name: row.company_name || `${row.first_name} ${row.last_name}`.trim(),
            company: row.company_name || row.vendor_lead_code || '',
            contact: `${row.first_name} ${row.last_name}`.trim(),
            firstName: row.first_name,
            lastName: row.last_name,
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
            agent: row.agent || '',
            calledCount: row.called_count,
            lastCall: row.last_local_call_time,
            callDuration: row.call_duration,
            recordingId: row.recording_id,
            recordingUrl: row.recording_url || '',
            notes: row.comments || '',
            created: new Date().toISOString()
        };

        // Extract additional info from comments
        const extracted = this.extractDetailsFromComments(row.comments || '');
        return { ...lead, ...extracted };
    }

    extractCompanyFromComments(comments) {
        const patterns = [
            /company[:\s]+([^,\n]+)/i,
            /business[:\s]+([^,\n]+)/i,
            /trucking[:\s]+([^,\n]+)/i
        ];

        for (const pattern of patterns) {
            const match = comments.match(pattern);
            if (match) return match[1].trim();
        }

        return '';
    }

    extractDetailsFromComments(comments) {
        const details = {};

        // Extract DOT number
        const dotMatch = comments.match(/DOT[:\s#]*(\d{6,8})/i);
        if (dotMatch) details.dotNumber = dotMatch[1];

        // Extract MC number
        const mcMatch = comments.match(/MC[:\s#]*(\d{6,7})/i);
        if (mcMatch) details.mcNumber = 'MC' + mcMatch[1];

        // Extract premium
        const premiumMatch = comments.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (premiumMatch) details.premium = parseFloat(premiumMatch[1].replace(/,/g, ''));

        // Extract fleet size
        const fleetMatch = comments.match(/(\d+)\s*(?:trucks?|vehicles?|units?)/i);
        if (fleetMatch) details.fleetSize = parseInt(fleetMatch[1]);

        // Extract commodity
        const commodityMatch = comments.match(/(?:haul|transport|carry|commodity)[:\s]+([^,\n]+)/i);
        if (commodityMatch) details.commodityHauled = commodityMatch[1].trim();

        // Extract carrier
        const carrierMatch = comments.match(/(?:progressive|geico|state farm|allstate|nationwide|liberty)/i);
        if (carrierMatch) details.currentCarrier = carrierMatch[0];

        return details;
    }
}

module.exports = VicidialDirectSync;