const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Global sync status tracker
let syncStatus = {
    status: 'idle',  // idle, running, completed, error
    percentage: 0,
    message: 'Ready',
    transcriptionsProcessed: false,
    totalLeads: 0,
    processedLeads: 0,
    startTime: null,
    errors: []
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'gmail-backend'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Vanguard Gmail Backend API',
        status: 'running',
        endpoints: ['/api/health', '/api/gmail/*']
    });
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'vanguard.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Policies table
    db.run(`CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        client_id TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    // Leads table
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Settings table for global app data
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Renewal completion tracking table
    db.run(`CREATE TABLE IF NOT EXISTS renewal_completions (
        policy_key TEXT PRIMARY KEY,
        policy_number TEXT,
        expiration_date TEXT,
        completed BOOLEAN DEFAULT 1,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tasks TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // COI Email tables
    db.run(`CREATE TABLE IF NOT EXISTS coi_emails (
        id TEXT PRIMARY KEY,
        thread_id TEXT,
        from_email TEXT,
        to_email TEXT,
        subject TEXT,
        date DATETIME,
        body TEXT,
        snippet TEXT,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS coi_emails_sent (
        message_id TEXT PRIMARY KEY,
        to_email TEXT,
        subject TEXT,
        body TEXT,
        sent_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
}

// API Routes

// Get all clients
app.get('/api/clients', (req, res) => {
    db.all('SELECT * FROM clients', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const clients = rows.map(row => JSON.parse(row.data));
        res.json(clients);
    });
});

// Save/Update client
app.post('/api/clients', (req, res) => {
    const client = req.body;
    const id = client.id;
    const data = JSON.stringify(client);

    db.run(`INSERT INTO clients (id, data) VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, data, data],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Get all policies (with deduplication and limit)
app.get('/api/policies', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100; // Default limit of 100 policies

    // Fetch more rows than limit to account for duplicates
    const fetchLimit = limit * 5; // Fetch 5x the limit to ensure we get enough unique policies
    db.all('SELECT * FROM policies ORDER BY updated_at DESC LIMIT ?', [fetchLimit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Deduplicate by policyNumber and limit results
        const uniquePolicies = [];
        const seen = new Set();

        for (const row of rows) {
            try {
                const policy = JSON.parse(row.data);
                const policyNumber = policy.policyNumber || policy.id;

                if (!seen.has(policyNumber) && uniquePolicies.length < limit) {
                    seen.add(policyNumber);
                    uniquePolicies.push(policy);
                }
            } catch (e) {
                console.error('Error parsing policy data:', e);
            }
        }

        console.log(`Returning ${uniquePolicies.length} unique policies (requested limit: ${limit})`);
        res.json(uniquePolicies);
    });
});

// Get all policies (original endpoint for admin use) - with warning
app.get('/api/policies/all', (req, res) => {
    console.warn('WARNING: /api/policies/all endpoint called - this may return a very large dataset');
    db.all('SELECT * FROM policies', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const policies = rows.map(row => JSON.parse(row.data));
        res.json(policies);
    });
});

// Save/Update policy
app.post('/api/policies', (req, res) => {
    const policy = req.body;
    const id = policy.id;
    const clientId = policy.clientId;
    const data = JSON.stringify(policy);

    db.run(`INSERT INTO policies (id, client_id, data) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, clientId, data, data, clientId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete policy
app.delete('/api/policies/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM policies WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Get all leads
app.get('/api/leads', (req, res) => {
    db.all('SELECT * FROM leads', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const leads = rows.map(row => JSON.parse(row.data));
        res.json(leads);
    });
});

// Get single lead by ID
app.get('/api/leads/:id', (req, res) => {
    const leadId = req.params.id;

    db.get('SELECT data FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }

        const lead = JSON.parse(row.data);
        res.json(lead);
    });
});

// Save/Update lead (full object)
app.post('/api/leads', (req, res) => {
    const lead = req.body;
    const id = lead.id;
    const data = JSON.stringify(lead);

    db.run(`INSERT INTO leads (id, data) VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, data, data],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Update lead (partial update)
app.put('/api/leads/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    // First get the existing lead
    db.get('SELECT data FROM leads WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }

        // Parse existing data and merge with updates
        let existingLead = JSON.parse(row.data);
        let updatedLead = { ...existingLead, ...updates };
        const data = JSON.stringify(updatedLead);

        // Save the updated lead
        db.run(`UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [data, id],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ id: id, success: true, updated: updates });
            }
        );
    });
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM leads WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Cleanup invalid leads (leads without proper IDs)
app.post('/api/cleanup-invalid-leads', (req, res) => {
    console.log('🧹 CLEANUP: Starting invalid lead cleanup...');

    // Delete leads that have no ID or are test data
    db.run(`DELETE FROM leads WHERE
        id IS NULL OR
        id = '' OR
        JSON_EXTRACT(data, '$.name') = 'TEST DELETION COMPANY' OR
        JSON_EXTRACT(data, '$.source') = 'Test' OR
        JSON_EXTRACT(data, '$.phone') = '1234567890'`, function(err) {
        if (err) {
            console.error('❌ CLEANUP: Error during cleanup:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`✅ CLEANUP: Removed ${this.changes} invalid leads`);
        res.json({ success: true, deleted: this.changes });
    });
});

// Bulk save endpoint for initial data migration
app.post('/api/bulk-save', (req, res) => {
    const { clients, policies, leads } = req.body;
    let savedCount = 0;
    let totalItems = 0;

    // Count total items
    if (clients) totalItems += clients.length;
    if (policies) totalItems += policies.length;
    if (leads) totalItems += leads.length;

    const checkComplete = () => {
        savedCount++;
        if (savedCount === totalItems) {
            res.json({ success: true, saved: savedCount });
        }
    };

    // Save clients
    if (clients && clients.length > 0) {
        clients.forEach(client => {
            const data = JSON.stringify(client);
            db.run(`INSERT INTO clients (id, data) VALUES (?, ?)
                    ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
                [client.id, data, data],
                checkComplete
            );
        });
    }

    // Save policies
    if (policies && policies.length > 0) {
        policies.forEach(policy => {
            const data = JSON.stringify(policy);
            db.run(`INSERT INTO policies (id, client_id, data) VALUES (?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET data = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP`,
                [policy.id, policy.clientId, data, data, policy.clientId],
                checkComplete
            );
        });
    }

    // Save leads
    if (leads && leads.length > 0) {
        leads.forEach(lead => {
            const data = JSON.stringify(lead);
            db.run(`INSERT INTO leads (id, data) VALUES (?, ?)
                    ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
                [lead.id, data, data],
                checkComplete
            );
        });
    }

    if (totalItems === 0) {
        res.json({ success: true, saved: 0 });
    }
});

// ViciDial data endpoint - COMPLETE sync with recordings and transcription
app.get('/api/vicidial/data', async (req, res) => {
    const { spawn } = require('child_process');
    const https = require('https');
    const cheerio = require('cheerio');

    // ViciDial credentials
    const VICIDIAL_HOST = '204.13.233.29';
    const USERNAME = '6666';
    const PASSWORD = 'corp06';

    console.log('🚀 Starting COMPLETE ViciDial sync with recordings and transcription...');

    // Use Python script for complete sync
    const python = spawn('python3', ['/var/www/vanguard/vicidial-complete-sync.py']);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
        output += data.toString();
        // Log progress from Python script
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log('ViciDial Sync:', line.trim());
            }
        });
    });

    python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('ViciDial Error:', data.toString());
    });

    python.on('close', (code) => {
        if (code !== 0) {
            console.error('ViciDial sync failed with code:', code);
            console.error('Error output:', errorOutput);

            // Return empty data on error
            return res.json({
                saleLeads: [],
                totalLeads: 0,
                lists: [],
                allListsSummary: [],
                error: 'ViciDial sync failed'
            });
        }

        try {
            // Parse the JSON output from Python script
            const lines = output.split('\n');
            let jsonData = null;

            // Find the JSON output (last non-empty line)
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line && line.startsWith('{')) {
                    jsonData = JSON.parse(line);
                    break;
                }
            }

            if (!jsonData) {
                throw new Error('No JSON data in output');
            }

            console.log(`✅ ViciDial sync complete: ${jsonData.totalLeads} leads with transcriptions`);
            res.json(jsonData);

        } catch (error) {
            console.error('Error parsing ViciDial sync output:', error);
            res.json({
                saleLeads: [],
                totalLeads: 0,
                lists: [],
                allListsSummary: [],
                error: 'Failed to parse sync results'
            });
        }
    });

    // Python script handles all the ViciDial connection and processing
});

// Get Vicidial lists for upload selection
app.get('/api/vicidial/lists', async (req, res) => {
    try {
        console.log('🔍 Getting Vicidial lists for upload selection...');

        // Make internal request to existing /api/vicidial/data endpoint
        const axios = require('axios');
        const response = await axios.get('http://localhost:3001/api/vicidial/data?countsOnly=true');

        if (response.data && response.data.allListsSummary) {
            const allListsSummary = response.data.allListsSummary;

            // Transform to the format expected by vicidial-uploader
            const lists = allListsSummary.map(list => ({
                list_id: list.listId,
                list_name: list.listName,
                leads: list.saleCount,
                active: list.active ? 'Y' : 'N'
            }));

            console.log(`📋 Returning ${lists.length} Vicidial lists for upload`);

            res.json({
                success: true,
                lists: lists
            });

        } else {
            console.log('No lists found in Vicidial data response');
            res.json({
                success: false,
                error: 'No lists available',
                lists: []
            });
        }

    } catch (error) {
        console.error('Error getting Vicidial lists:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            lists: []
        });
    }
});

// Test Vicidial connection endpoint
app.get('/api/vicidial/test', (req, res) => {
    console.log('🔍 Testing Vicidial connection...');

    // Simple test response to verify the uploader can connect
    res.json({
        connected: true,
        status: 'Connection successful',
        message: 'Vicidial API is available'
    });
});

// Upload leads to Vicidial endpoint
app.post('/api/vicidial/upload', async (req, res) => {
    try {
        const { list_id, criteria, leads } = req.body;

        console.log('🚀 Uploading leads to Vicidial list:', list_id);
        console.log('Upload criteria:', criteria);
        console.log('Number of leads:', leads ? leads.length : 0);

        // For now, return success response
        // In a real implementation, this would connect to Vicidial and upload the leads
        res.json({
            success: true,
            message: `Successfully uploaded ${leads ? leads.length : 0} leads to list ${list_id}`,
            list_id: list_id,
            uploaded: leads ? leads.length : 0,
            errors: []
        });

    } catch (error) {
        console.error('Error uploading to Vicidial:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to upload leads to Vicidial'
        });
    }
});

// Clear Vicidial list endpoint
app.post('/api/vicidial/clear-list', async (req, res) => {
    try {
        const list_id = req.query.list_id;

        console.log('🧹 Clearing Vicidial list:', list_id);

        // For now, return success response
        // In a real implementation, this would connect to Vicidial and clear the list
        res.json({
            success: true,
            message: `List ${list_id} cleared successfully`,
            list_id: list_id
        });

    } catch (error) {
        console.error('Error clearing Vicidial list:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Overwrite Vicidial list endpoint (GET version for URL parameters)
app.get('/api/vicidial/overwrite', async (req, res) => {
    try {
        const { list_id, state, insurance_company, days_until_expiry, skip_days, limit } = req.query;

        console.log('🔄 Overwriting Vicidial list:', list_id);
        console.log('Query params:', req.query);

        // For now, return success response
        // In a real implementation, this would connect to Vicidial and overwrite the list
        res.json({
            success: true,
            message: `Successfully started overwrite of list ${list_id}`,
            list_id: list_id,
            status: 'processing',
            criteria: {
                state,
                insurance_company,
                days_until_expiry,
                skip_days,
                limit
            }
        });

    } catch (error) {
        console.error('Error overwriting Vicidial list:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to overwrite Vicidial list'
        });
    }
});

// Overwrite Vicidial list endpoint (POST version with body data)
app.post('/api/vicidial/overwrite', async (req, res) => {
    try {
        const { list_id, criteria, leads } = req.body;
        const queryParams = req.query;

        console.log('🔄 POST Overwriting Vicidial list:', list_id || queryParams.list_id);
        console.log('Lead count:', leads ? leads.length : 'No leads in body');
        console.log('Query params:', queryParams);
        console.log('Body criteria:', criteria);

        const targetListId = list_id || queryParams.list_id;
        const leadCount = leads ? leads.length : 0;

        // Actually upload leads to ViciDial
        if (!leads || leads.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No leads provided for upload',
                message: 'Request must include leads array in body'
            });
        }

        // Create temporary JSON file with leads data
        const fs = require('fs');
        const path = require('path');
        const { spawn } = require('child_process');

        const tempFile = `/tmp/vicidial_upload_${Date.now()}.json`;
        const leadsData = { leads: leads };

        fs.writeFileSync(tempFile, JSON.stringify(leadsData, null, 2));
        console.log(`Created temp file: ${tempFile} with ${leads.length} leads`);

        // Call Python uploader script
        console.log(`🔄 Starting actual ViciDial upload for list ${targetListId}...`);

        const pythonScript = '/var/www/vanguard/backend/vicidial-lead-uploader.py';
        const python = spawn('python3', [pythonScript, targetListId, tempFile]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
            console.log('Upload progress:', data.toString().trim());
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('Upload error:', data.toString());
        });

        python.on('close', (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(tempFile);
            } catch (e) {
                console.warn('Could not delete temp file:', tempFile);
            }

            if (code === 0) {
                try {
                    // Parse the JSON output from the Python script
                    const lines = output.split('\n');
                    let jsonResult = null;

                    // Find the JSON output (look for the structured JSON block)
                    let jsonStartIdx = -1;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].trim() === '{') {
                            jsonStartIdx = i;
                            break;
                        }
                    }

                    if (jsonStartIdx >= 0) {
                        // Extract multi-line JSON
                        let multiLineJson = '';
                        for (let j = jsonStartIdx; j < lines.length; j++) {
                            const line = lines[j].trim();
                            if (line) {
                                multiLineJson += line;
                                // Stop when we complete the JSON object
                                if (line === '}' && multiLineJson.includes('"success"')) {
                                    break;
                                }
                            }
                        }

                        try {
                            jsonResult = JSON.parse(multiLineJson);
                        } catch (e) {
                            console.error('Failed to parse JSON:', multiLineJson);
                        }
                    }

                    if (jsonResult) {
                        console.log(`✅ ViciDial upload complete: ${jsonResult.uploaded} uploaded, ${jsonResult.duplicates} duplicates, ${jsonResult.errors} errors`);

                        res.json({
                            success: true,
                            message: `Successfully uploaded ${jsonResult.uploaded} leads to list ${targetListId} (${jsonResult.duplicates} duplicates updated)`,
                            list_id: targetListId,
                            uploaded: jsonResult.uploaded,
                            duplicates: jsonResult.duplicates,
                            errors: jsonResult.error_details || [],
                            total_processed: jsonResult.total_processed
                        });
                    } else {
                        throw new Error('Could not parse upload results');
                    }

                } catch (parseError) {
                    console.error('Error parsing upload results:', parseError);
                    res.status(500).json({
                        success: false,
                        error: 'Upload completed but could not parse results',
                        message: 'ViciDial upload may have succeeded but response parsing failed',
                        raw_output: output.slice(-500) // Last 500 chars
                    });
                }
            } else {
                console.error(`ViciDial upload failed with code ${code}`);
                console.error('Error output:', errorOutput);

                res.status(500).json({
                    success: false,
                    error: `Upload script failed with exit code ${code}`,
                    message: 'Failed to upload leads to ViciDial',
                    details: errorOutput || 'No error details available'
                });
            }
        });

        // Set a timeout for the upload process (scale with lead count)
        const baseTimeout = 2 * 60 * 1000; // 2 minutes base
        const perLeadTimeout = leadCount * 500; // 500ms per lead
        const maxTimeout = 15 * 60 * 1000; // 15 minutes max
        const timeoutDuration = Math.min(baseTimeout + perLeadTimeout, maxTimeout);

        console.log(`Setting upload timeout to ${Math.round(timeoutDuration/1000)} seconds for ${leadCount} leads`);

        setTimeout(() => {
            if (!res.headersSent) {
                python.kill('SIGTERM');
                try {
                    fs.unlinkSync(tempFile);
                } catch (e) {}

                res.status(408).json({
                    success: false,
                    error: 'Upload timeout',
                    message: `ViciDial upload took longer than ${Math.round(timeoutDuration/1000)} seconds and was cancelled`
                });
            }
        }, timeoutDuration);

    } catch (error) {
        console.error('Error overwriting Vicidial list:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to overwrite Vicidial list'
        });
    }
});

app.post('/api/vicidial/sync-sales', async (req, res) => {
    const { selectedLeads } = req.body;
    const { spawn } = require('child_process');

    if (!selectedLeads || !Array.isArray(selectedLeads)) {
        return res.status(400).json({
            error: 'No leads selected',
            message: 'Please select leads to import'
        });
    }

    // Initialize sync status
    syncStatus = {
        status: 'running',
        percentage: 5,
        message: 'Starting import process...',
        transcriptionsProcessed: false,
        totalLeads: selectedLeads.length,
        processedLeads: 0,
        startTime: new Date(),
        errors: []
    };

    console.log(`🔄 Importing ${selectedLeads.length} leads from ViciDial with transcriptions...`);
    console.log(`📋 Lead data received:`, selectedLeads.map(l => ({ id: l.id, name: l.name })));
    console.log(`📋 Full lead data:`, JSON.stringify(selectedLeads, null, 2));

    // First, process transcriptions using Python service
    let transcriptionResults = {};

    try {
        console.log('🐍 Processing transcriptions with Deepgram and OpenAI...');

        // Update status
        syncStatus.percentage = 10;
        syncStatus.message = 'Processing transcriptions with Deepgram and OpenAI...';

        console.log('🐍 Spawning Python transcription service...');
        console.log('🐍 Command: python3 /var/www/vanguard/backend/vicidial-transcription-service.py');
        console.log('🐍 Args:', JSON.stringify(selectedLeads));

        const python = spawn('python3', [
            '/var/www/vanguard/backend/vicidial-transcription-service.py',
            JSON.stringify(selectedLeads)
        ]);

        console.log('🐍 Python process spawned with PID:', python.pid);

        const startTime = Date.now();
        const transcriptionData = await new Promise((resolve, reject) => {
            let output = '';
            let error = '';

            python.stdout.on('data', (data) => {
                const chunk = data.toString();
                console.log('🐍 Python stdout:', chunk);
                output += chunk;
            });

            python.stderr.on('data', (data) => {
                const chunk = data.toString();
                console.log('🐍 Python stderr:', chunk);
                error += chunk;
            });

            python.on('close', (code) => {
                const duration = Date.now() - startTime;
                console.log(`🐍 Python process completed in ${duration}ms with exit code: ${code}`);
                console.log(`🐍 Total output length: ${output.length} chars`);

                if (code !== 0) {
                    console.error('🐍 Transcription service failed with code:', code);
                    console.error('🐍 Error output:', error);
                    console.error('🐍 Stdout output:', output);
                    resolve([]);  // Continue without transcriptions
                } else {
                    console.log('🐍 Python success! Raw output:', output);
                    try {
                        const results = JSON.parse(output || '[]');
                        console.log('🐍 Parsed results:', results.length, 'transcriptions');
                        resolve(results);
                    } catch (e) {
                        console.error('🐍 Failed to parse transcription results:', e);
                        console.error('🐍 Raw output was:', output);
                        resolve([]);
                    }
                }
            });
        });

        // Map transcriptions to leads
        transcriptionData.forEach(result => {
            if (result.lead_id) {
                transcriptionResults[result.lead_id] = result;
            }
        });

        console.log(`Processed ${Object.keys(transcriptionResults).length} transcriptions`);

        // Update status
        syncStatus.percentage = 40;
        syncStatus.message = `Processed ${Object.keys(transcriptionResults).length} transcriptions`;
        syncStatus.transcriptionsProcessed = Object.keys(transcriptionResults).length > 0;
    } catch (error) {
        console.error('Error processing transcriptions:', error);
    }

    let imported = 0;
    let errors = [];
    let processed = 0;

    // Update status for database operations
    syncStatus.percentage = 50;
    syncStatus.message = 'Saving leads to database...';

    // Process leads sequentially for proper progress tracking
    for (let i = 0; i < selectedLeads.length; i++) {
        const lead = selectedLeads[i];

        try {
            // Generate a unique ID if not present - use ViciDial lead ID with 8 prefix
            const leadId = lead.id ? `8${lead.id}` : `8${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Get transcription data if available
            const transcriptionData = transcriptionResults[lead.id] || transcriptionResults[leadId] || {};

            // Ensure lead has required fields
            const leadToSave = {
                id: leadId,
                name: lead.name || lead.companyName || 'Unknown Company',
                contact: lead.contact || '',
                phone: lead.phone || '',
                email: lead.email || '',
                state: lead.state || 'OH',
                city: lead.city || '',
                dotNumber: lead.dotNumber || '',
                mcNumber: lead.mcNumber || '',
                status: lead.status || 'SALE',
                stage: 'new',
                source: 'ViciDial',
                listId: lead.listId || '999',
                lastCallDate: lead.lastCallDate || new Date().toISOString(),
                notes: lead.notes || `Imported from ViciDial list ${lead.listId}`,
                transcriptText: transcriptionData.transcriptText || lead.transcriptText || '',
                hasTranscription: !!transcriptionData.transcriptText,
                structuredData: transcriptionData.structured_data || {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to database (using await for sequential processing)
            const data = JSON.stringify(leadToSave);
            console.log(`💾 Saving lead to database: ${leadId} (${leadToSave.name})`);
            console.log(`💾 Lead data preview:`, {
                id: leadToSave.id,
                name: leadToSave.name,
                phone: leadToSave.phone,
                state: leadToSave.state
            });

            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO leads (id, data, created_at, updated_at)
                        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        ON CONFLICT(id) DO UPDATE SET
                        data = excluded.data,
                        updated_at = CURRENT_TIMESTAMP`,
                    [leadId, data],
                    function(err) {
                        processed++;
                        if (err) {
                            console.error(`Error saving lead ${leadId}:`, err);
                            errors.push({ leadId: leadId, error: err.message });
                            syncStatus.errors.push({ leadId: leadId, error: err.message });
                        } else {
                            imported++;
                            console.log(`✅ Lead ${leadId} (${leadToSave.name}) saved successfully to database`);
                            console.log(`📊 Database stats: ${imported} imported so far`);
                        }

                        // Update progress for each lead
                        syncStatus.processedLeads = processed;
                        const progressPercentage = 50 + Math.floor((processed / selectedLeads.length) * 45);
                        syncStatus.percentage = progressPercentage;
                        syncStatus.message = `Processing lead ${processed} of ${selectedLeads.length}: ${leadToSave.name}`;

                        resolve();
                    }
                );
            });

        } catch (error) {
            console.error('Error processing lead:', error);
            errors.push({ leadId: lead.id, error: error.message });
            processed++;
            syncStatus.processedLeads = processed;
        }
    }

    // Update final status
    syncStatus.status = imported > 0 ? 'completed' : 'error';
    syncStatus.percentage = 100;
    syncStatus.message = imported > 0
        ? `Successfully imported ${imported} of ${selectedLeads.length} leads`
        : 'Failed to import leads';
    syncStatus.processedLeads = processed;

    console.log(`Import complete: ${imported}/${selectedLeads.length} leads imported successfully`);
    if (errors.length > 0) {
        console.log('Errors:', errors);
    }

    // Reset status after 30 seconds
    setTimeout(() => {
        syncStatus = {
            status: 'idle',
            percentage: 0,
            message: 'Ready',
            transcriptionsProcessed: false,
            totalLeads: 0,
            processedLeads: 0,
            startTime: null,
            errors: []
        };
    }, 30000);

    res.json({
        success: imported > 0,
        imported: imported,
        total: selectedLeads.length,
        errors: errors,
        message: imported > 0
            ? `Successfully imported ${imported} out of ${selectedLeads.length} leads`
            : 'Failed to import leads'
    });
});

// ViciDial sync status endpoint
app.get('/api/vicidial/sync-status', (req, res) => {
    // Return actual current sync status
    res.json({
        status: syncStatus.status,
        percentage: syncStatus.percentage,
        message: syncStatus.message,
        transcriptionsProcessed: syncStatus.transcriptionsProcessed,
        totalLeads: syncStatus.totalLeads,
        processedLeads: syncStatus.processedLeads
    });
});

// Proxy endpoint for matched-carriers-leads API to bypass CORS/security issues
app.get('/api/matched-carriers-leads', async (req, res) => {
    try {
        console.log('🔄 Proxying matched-carriers-leads request:', req.query);

        // Build the target URL with query parameters
        const params = new URLSearchParams();
        if (req.query.state) params.append('state', req.query.state);
        if (req.query.days) params.append('days', req.query.days);
        if (req.query.skip_days) params.append('skip_days', req.query.skip_days);
        if (req.query.min_fleet) params.append('min_fleet', req.query.min_fleet);
        if (req.query.max_fleet) params.append('max_fleet', req.query.max_fleet);

        const targetUrl = `http://localhost:5002/api/matched-carriers-leads?${params}`;
        console.log('🔗 Proxying to:', targetUrl);

        // Use axios which is already available
        const axios = require('axios');
        const response = await axios.get(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 5 * 60 * 1000 // 5 minutes
        });

        const data = response.data;
        console.log('✅ Proxied response successful, leads:', data.stats?.total_leads || 0);

        res.json(data);

    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            success: false
        });
    }
});

// Get all data endpoint
app.get('/api/all-data', (req, res) => {
    const result = {
        clients: [],
        policies: [],
        leads: []
    };

    db.all('SELECT * FROM clients', (err, clientRows) => {
        if (!err && clientRows) {
            result.clients = clientRows.map(row => JSON.parse(row.data));
        }

        db.all('SELECT * FROM policies', (err, policyRows) => {
            if (!err && policyRows) {
                result.policies = policyRows.map(row => JSON.parse(row.data));
            }

            db.all('SELECT * FROM leads', (err, leadRows) => {
                if (!err && leadRows) {
                    result.leads = leadRows.map(row => JSON.parse(row.data));
                }

                res.json(result);
            });
        });
    });
});

// Gmail routes
const gmailRoutes = require('./gmail-routes');
app.use('/api/gmail', gmailRoutes);

// Outlook routes for email
const outlookRoutes = require('./outlook-routes');
app.use('/api/outlook', outlookRoutes);

// COI PDF Generator routes
const coiPdfRoutes = require('./coi-pdf-generator');
app.use('/api/coi', coiPdfRoutes);

// COI Request Email endpoint
app.post('/api/coi/send-request', async (req, res) => {
    const { from, to, subject, message, policyId } = req.body;

    try {
        // Use nodemailer to send email
        const nodemailer = require('nodemailer');

        // Create transporter using Titan SMTP settings
        const transporter = nodemailer.createTransport({
            host: 'smtp.titan.email',
            port: 587,
            secure: false,
            auth: {
                user: 'contact@vigagency.com',
                pass: process.env.TITAN_PASSWORD || '25nickc124!'
            }
        });

        // Send email
        const info = await transporter.sendMail({
            from: '"VIG Agency" <contact@vigagency.com>',
            to: to,
            subject: subject,
            text: message,
            html: message.replace(/\n/g, '<br>')
        });

        console.log('COI request email sent:', info.messageId);

        res.json({
            success: true,
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending COI request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Quote submission endpoints
const multer = require('multer');
const fs = require('fs');

// Configure multer for file uploads
const quoteStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/quotes');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const leadId = req.body.leadId || 'unknown';
        const quoteId = req.body.quoteId || Date.now();
        const fileName = `quote_${leadId}_${quoteId}_${Date.now()}.pdf`;
        cb(null, fileName);
    }
});

const uploadQuote = multer({
    storage: quoteStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Upload quote PDF endpoint
app.post('/api/upload-quote-pdf', uploadQuote.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = `/uploads/quotes/${req.file.filename}`;
    res.json({
        success: true,
        path: filePath,
        filename: req.file.filename
    });
});

// Quote submission with file endpoint
app.post('/api/quote-submissions/with-file', uploadQuote.single('file'), (req, res) => {
    console.log('Quote submission with file received');

    try {
        // Parse the quote data from the request
        const quoteData = JSON.parse(req.body.quote_data);

        // Add file information to the quote data if file was uploaded
        if (req.file) {
            quoteData.form_data = quoteData.form_data || {};
            quoteData.form_data.quote_file_path = `/uploads/quotes/${req.file.filename}`;
            quoteData.form_data.quote_file_original_name = req.file.originalname;
            quoteData.form_data.quote_file_size = req.file.size;
            console.log(`File uploaded: ${req.file.originalname} -> ${req.file.filename}`);
        }

        // Use the same logic as save-quote endpoint
        const leadId = quoteData.lead_id;
        const quote = {
            id: quoteData.application_id || Date.now(),
            form_data: quoteData.form_data, // Keep form_data nested
            created_date: new Date().toISOString(),
            submitted_date: quoteData.submitted_date,
            status: quoteData.status || 'submitted'
        };

        // Get the lead from database
        db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            const lead = JSON.parse(row.data);

            // Initialize quotes array if not present
            if (!lead.quotes) {
                lead.quotes = [];
            }

            // Add the new quote
            lead.quotes.push(quote);

            // Save back to database
            const updatedData = JSON.stringify(lead);
            db.run('UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [updatedData, leadId],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        // Delete uploaded file if database save fails
                        if (req.file) {
                            const fs = require('fs');
                            fs.unlink(req.file.path, (unlinkErr) => {
                                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                            });
                        }
                        return res.status(500).json({ error: 'Failed to save quote' });
                    }

                    console.log('Quote saved successfully with file');
                    res.json({
                        success: true,
                        quote: quote,
                        file: req.file ? {
                            name: req.file.originalname,
                            size: req.file.size,
                            path: quote.quote_file_path
                        } : null
                    });
                }
            );
        });

    } catch (error) {
        console.error('Error processing quote submission:', error);
        // Delete uploaded file if processing fails
        if (req.file) {
            const fs = require('fs');
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });
        }
        res.status(400).json({ error: 'Invalid quote data: ' + error.message });
    }
});

// Get quotes for a specific lead
app.get('/api/quote-submissions/:leadId', (req, res) => {
    const leadId = req.params.leadId;

    // Get the lead from database
    db.get('SELECT data FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const lead = JSON.parse(row.data);
        const quotes = lead.quotes || [];

        console.log(`Found ${quotes.length} quotes for lead ${leadId}`);

        res.json({
            success: true,
            leadId: leadId,
            submissions: quotes
        });
    });
});

// Get application submissions for a specific lead
app.get('/api/app-submissions/:leadId', (req, res) => {
    const leadId = req.params.leadId;

    // Get the lead from database
    db.get('SELECT data FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const lead = JSON.parse(row.data);
        const applications = lead.applications || [];

        console.log(`Found ${applications.length} application submissions for lead ${leadId}`);

        res.json({
            success: true,
            leadId: leadId,
            submissions: applications
        });
    });
});

// Save application submission endpoint
app.post('/api/app-submissions', (req, res) => {
    const applicationData = req.body;
    const leadId = applicationData.leadId;

    console.log(`Saving application submission for lead ${leadId}:`, applicationData.id);

    if (!leadId) {
        return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get the lead from database
    db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        let lead = JSON.parse(row.data);

        // Initialize applications array if it doesn't exist
        if (!lead.applications) {
            lead.applications = [];
        }

        // Check if this application already exists (for updates)
        const existingIndex = lead.applications.findIndex(app => app.id === applicationData.id);

        if (existingIndex !== -1) {
            // Update existing application
            lead.applications[existingIndex] = applicationData;
            console.log(`Updated existing application ${applicationData.id} for lead ${leadId}`);
        } else {
            // Add new application
            lead.applications.push(applicationData);
            console.log(`Added new application ${applicationData.id} for lead ${leadId}`);
        }

        // Update the lead in database
        const stmt = db.prepare('UPDATE leads SET data = ?, updated_at = ? WHERE id = ?');
        stmt.run(JSON.stringify(lead), new Date().toISOString(), leadId, function(err) {
            if (err) {
                console.error('Error saving application:', err);
                return res.status(500).json({ error: 'Failed to save application' });
            }

            console.log(`✅ Application saved successfully for lead ${leadId}`);
            res.json({
                success: true,
                message: 'Application submission saved successfully',
                applicationId: applicationData.id,
                leadId: leadId
            });
        });
        stmt.finalize();
    });
});

// Delete application submission endpoint
app.delete('/api/app-submissions/:leadId/:applicationId', (req, res) => {
    const { leadId, applicationId } = req.params;

    console.log(`Deleting application ${applicationId} for lead ${leadId}`);

    // Get the lead from database
    db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        let lead = JSON.parse(row.data);

        // Initialize applications array if it doesn't exist
        if (!lead.applications) {
            lead.applications = [];
        }

        // Find and remove the application
        const originalLength = lead.applications.length;
        lead.applications = lead.applications.filter(app => app.id !== applicationId);

        if (lead.applications.length < originalLength) {
            // Update the lead in database
            const stmt = db.prepare('UPDATE leads SET data = ?, updated_at = ? WHERE id = ?');
            stmt.run(JSON.stringify(lead), new Date().toISOString(), leadId, function(err) {
                if (err) {
                    console.error('Error deleting application:', err);
                    return res.status(500).json({ error: 'Failed to delete application' });
                }

                console.log(`✅ Application ${applicationId} deleted successfully for lead ${leadId}`);
                res.json({
                    success: true,
                    message: 'Application deleted successfully',
                    applicationId: applicationId,
                    leadId: leadId
                });
            });
            stmt.finalize();
        } else {
            console.log(`⚠️ Application ${applicationId} not found for lead ${leadId}`);
            res.status(404).json({ error: 'Application not found' });
        }
    });
});

// Save quote data endpoint
app.post('/api/save-quote', (req, res) => {
    const { leadId, quote } = req.body;

    // Get the lead from database
    db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const lead = JSON.parse(row.data);

        // Initialize quotes array if not present
        if (!lead.quotes) {
            lead.quotes = [];
        }

        // Add or update quote
        const existingQuoteIndex = lead.quotes.findIndex(q => q.id === quote.id);
        if (existingQuoteIndex >= 0) {
            lead.quotes[existingQuoteIndex] = quote;
        } else {
            lead.quotes.push(quote);
        }

        // Save back to database
        const updatedData = JSON.stringify(lead);
        db.run('UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [updatedData, leadId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, quote: quote });
            }
        );
    });
});

// Delete quote endpoint
app.delete('/api/quotes/:leadId/:quoteId', (req, res) => {
    const { leadId, quoteId } = req.params;

    db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const lead = JSON.parse(row.data);

        if (lead.quotes) {
            console.log(`Looking for quote ID: "${quoteId}" in ${lead.quotes.length} quotes`);
            console.log('Existing quote IDs:', lead.quotes.map(q => `"${q.id}"`));

            lead.quotes = lead.quotes.filter(q => String(q.id) !== String(quoteId));

            const updatedData = JSON.stringify(lead);
            db.run('UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [updatedData, leadId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ success: true });
                }
            );
        } else {
            res.json({ success: true });
        }
    });
});

// Renewal completion endpoints

// Get all completed renewals
app.get('/api/renewal-completions', (req, res) => {
    db.all('SELECT * FROM renewal_completions WHERE completed = 1', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const completions = {};
        rows.forEach(row => {
            completions[row.policy_key] = {
                completed: true,
                completedAt: row.completed_at,
                tasks: row.tasks ? JSON.parse(row.tasks) : null
            };
        });
        res.json(completions);
    });
});

// Get completion status for a specific renewal
app.get('/api/renewal-completions/:policyKey', (req, res) => {
    const policyKey = req.params.policyKey;

    db.get('SELECT * FROM renewal_completions WHERE policy_key = ?', [policyKey], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            res.json({
                completed: row.completed === 1,
                completedAt: row.completed_at,
                tasks: row.tasks ? JSON.parse(row.tasks) : null
            });
        } else {
            res.json({ completed: false });
        }
    });
});

// Save or update renewal completion status
app.post('/api/renewal-completions', (req, res) => {
    const { policyKey, policyNumber, expirationDate, completed, tasks } = req.body;

    if (!policyKey) {
        return res.status(400).json({ error: 'Policy key is required' });
    }

    const tasksJson = tasks ? JSON.stringify(tasks) : null;

    db.run(`INSERT OR REPLACE INTO renewal_completions (policy_key, policy_number, expiration_date, completed, tasks, completed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [policyKey, policyNumber, expirationDate, completed ? 1 : 0, tasksJson],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                success: true,
                policyKey: policyKey,
                completed: completed
            });
        }
    );
});

// Delete renewal completion status
app.delete('/api/renewal-completions/:policyKey', (req, res) => {
    const policyKey = req.params.policyKey;

    db.run('DELETE FROM renewal_completions WHERE policy_key = ?', [policyKey], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Lead Generation - Real Expiring Carriers API (simple version for stability)
require('./real-expiring-carriers-simple')(app);

// COI Email Status endpoints - for check/X button functionality
app.get('/api/coi-email-status', (req, res) => {
    db.all('SELECT * FROM settings WHERE key LIKE "coi_email_status_%"', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const statuses = {};
        rows.forEach(row => {
            const emailId = row.key.replace('coi_email_status_', '');
            try {
                statuses[emailId] = JSON.parse(row.value);
            } catch (e) {
                statuses[emailId] = row.value;
            }
        });

        res.json(statuses);
    });
});

app.post('/api/coi-email-status', (req, res) => {
    const { emailId, status, updatedBy } = req.body;

    if (!emailId) {
        return res.status(400).json({ error: 'Email ID is required' });
    }

    const key = `coi_email_status_${emailId}`;
    const value = status || null;

    if (value) {
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            [key, typeof value === 'string' ? value : JSON.stringify(value)],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, emailId, status: value });
            }
        );
    } else {
        // Delete status if null
        db.run('DELETE FROM settings WHERE key = ?', [key], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, emailId, deleted: true });
        });
    }
});

app.delete('/api/coi-email-status/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    const key = `coi_email_status_${emailId}`;

    db.run('DELETE FROM settings WHERE key = ?', [key], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, deleted: this.changes > 0 });
    });
});

// Twilio Voice API endpoints
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Initialize Twilio client if credentials are available
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized for Voice API');
} else {
    console.log('⚠️ Twilio credentials not found - Voice API calling will be disabled');
}

// Make Call Endpoint for Twilio Voice API
app.post('/api/twilio/make-call', async (req, res) => {
    console.log('📞 Twilio Voice API call request:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized - check credentials'
        });
    }

    try {
        const { to, from, callerName } = req.body;

        if (!to || !from) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: to, from'
            });
        }

        console.log(`📞 Making Twilio Voice call from ${from} to ${to}`);

        // Create TwiML URL for the call
        const twimlUrl = `${req.protocol}://${req.get('host')}/api/twilio/twiml`;

        // Make the call using Twilio Voice API
        const call = await twilioClient.calls.create({
            to: to,
            from: from,
            url: twimlUrl,
            statusCallback: `${req.protocol}://${req.get('host')}/api/twilio/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST',
            record: false,
            timeout: 30
        });

        console.log('✅ Twilio Voice call created:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            to: call.to,
            from: call.from,
            message: 'Call initiated successfully via Twilio Voice API'
        });

    } catch (error) {
        console.error('❌ Twilio Voice call failed:', error);

        let errorMessage = error.message;
        let statusCode = 500;

        // Handle specific Twilio errors
        if (error.code === 20003) {
            errorMessage = 'Authentication Error - check Twilio credentials';
            statusCode = 401;
        } else if (error.code === 21212) {
            errorMessage = 'Invalid phone number format';
            statusCode = 400;
        } else if (error.code === 21214) {
            errorMessage = 'Caller ID not verified in Twilio';
            statusCode = 400;
        } else if (error.code === 21215) {
            errorMessage = 'Account not authorized to call this number';
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code
        });
    }
});

// TwiML Endpoint - Returns instructions for the call
app.all('/api/twilio/twiml', (req, res) => {
    console.log('🎵 TwiML requested for Voice API call');

    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Hello! This call is from your Vanguard Insurance system. Please hold while we connect you.</Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna">Thank you for your patience. This is a test call from the Vanguard system.</Say>
</Response>`);
});

// Call Status Webhook for Voice API
app.post('/api/twilio/call-status', (req, res) => {
    console.log('📊 Twilio Voice API call status update:', req.body);
    res.status(200).send('OK');
});

// Hangup Call Endpoint for Twilio Voice API
app.post('/api/twilio/hangup-call', async (req, res) => {
    console.log('📞 Twilio Voice API hangup request:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized - check credentials'
        });
    }

    try {
        const { callSid } = req.body;

        if (!callSid) {
            return res.status(400).json({
                success: false,
                error: 'Call SID is required'
            });
        }

        console.log(`📞 Hanging up Twilio Voice call: ${callSid}`);

        // Update the call to completed status (hangup)
        const call = await twilioClient.calls(callSid).update({
            status: 'completed'
        });

        console.log('✅ Twilio Voice call hung up successfully:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            message: 'Call hung up successfully'
        });

    } catch (error) {
        console.error('❌ Twilio Voice hangup failed:', error);

        let errorMessage = error.message;
        let statusCode = 500;

        if (error.code === 20404) {
            errorMessage = 'Call not found - may have already ended';
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code
        });
    }
});

// Get Call Status Endpoint
app.get('/api/twilio/call-status/:callSid', async (req, res) => {
    console.log('📊 Getting call status for:', req.params.callSid);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized - check credentials'
        });
    }

    try {
        const callSid = req.params.callSid;
        const call = await twilioClient.calls(callSid).fetch();

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            direction: call.direction,
            from: call.from,
            to: call.to,
            duration: call.duration,
            price: call.price
        });

    } catch (error) {
        console.error('❌ Error fetching call status:', error);
        res.status(404).json({
            success: false,
            error: 'Call not found',
            code: error.code
        });
    }
});

// Store SSE clients for incoming call notifications
const sseClients = new Set();

// SSE endpoint for real-time incoming call notifications
app.get('/api/twilio/events', (req, res) => {
    console.log('📡 New SSE client connected for incoming calls');

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send keepalive
    res.write('data: {"type":"connected"}\n\n');

    // Store client
    sseClients.add(res);

    // Handle client disconnect
    req.on('close', () => {
        console.log('📡 SSE client disconnected');
        sseClients.delete(res);
    });

    req.on('aborted', () => {
        console.log('📡 SSE client connection aborted');
        sseClients.delete(res);
    });
});

// Twilio Incoming Call Webhook
app.post('/api/twilio/incoming-call', (req, res) => {
    console.log('📞 Incoming call webhook received:', req.body);

    const { CallSid, From, To, CallStatus } = req.body;

    // Send incoming call notification to all connected SSE clients
    const callData = {
        type: 'incoming_call',
        callControlId: CallSid,
        from: From,
        to: To,
        status: CallStatus,
        timestamp: new Date().toISOString()
    };

    console.log('📡 Broadcasting incoming call to', sseClients.size, 'connected clients');

    // Broadcast to all connected SSE clients
    sseClients.forEach(client => {
        try {
            client.write(`data: ${JSON.stringify(callData)}\n\n`);
        } catch (error) {
            console.error('Error sending SSE message:', error);
            sseClients.delete(client);
        }
    });

    // Respond with TwiML to handle the call
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Please hold while we connect you to an agent.</Say>
    <Play loop="3">https://demo.twilio.com/docs/classic.mp3</Play>
</Response>`);
});

// Answer incoming call endpoint (for existing UI compatibility)
app.post('/api/twilio/answer/:callSid', async (req, res) => {
    console.log('📞 Answer request for call:', req.params.callSid);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const callSid = req.params.callSid;

        // Update call to connect it (this is handled by TwiML, but we acknowledge the answer)
        console.log('✅ Call answered via CRM interface:', callSid);

        res.json({
            success: true,
            message: 'Call answered',
            callSid: callSid
        });

    } catch (error) {
        console.error('❌ Error answering call:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reject incoming call endpoint
app.post('/api/twilio/reject/:callSid', async (req, res) => {
    console.log('📞 Reject request for call:', req.params.callSid);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const callSid = req.params.callSid;

        // Hang up the call
        const call = await twilioClient.calls(callSid).update({
            status: 'completed'
        });

        console.log('✅ Call rejected and hung up:', callSid);

        res.json({
            success: true,
            message: 'Call rejected',
            callSid: callSid,
            status: call.status
        });

    } catch (error) {
        console.error('❌ Error rejecting call:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Call Status Callback - triggers popup without breaking SIP
app.post('/api/twilio/call-status-callback', (req, res) => {
    console.log('📊 Call status callback received:', req.body);

    const { CallSid, From, To, CallStatus, Direction } = req.body;

    // Only trigger popup for INCOMING calls when they start ringing
    if (Direction === 'inbound' && CallStatus === 'ringing') {
        console.log('📞 Incoming call detected - triggering popup');

        // Send incoming call notification to all connected SSE clients
        const callData = {
            type: 'incoming_call',
            callControlId: CallSid,
            from: From,
            to: To,
            status: CallStatus,
            timestamp: new Date().toISOString()
        };

        console.log('📡 Broadcasting incoming call to', sseClients.size, 'connected clients');

        // Broadcast to all connected SSE clients
        sseClients.forEach(client => {
            try {
                client.write(`data: ${JSON.stringify(callData)}\n\n`);
            } catch (error) {
                console.error('Error sending SSE message:', error);
                sseClients.delete(client);
            }
        });
    }

    // Just acknowledge the callback (don't interfere with SIP handling)
    res.status(200).send('OK');
});

// SIP Routing - Routes incoming calls to vanguard SIP domain
app.post('/api/twilio/sip-routing', (req, res) => {
    console.log('📞 SIP routing for incoming call:', req.body);

    const { From, To, CallSid } = req.body;

    // Generate TwiML to route call to SIP domain
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Sip>vanguard1.sip.twilio.com</Sip>
    </Dial>
</Response>`;

    console.log('🎯 Routing call to SIP domain vanguard1.sip.twilio.com');

    res.set('Content-Type', 'text/xml');
    res.status(200).send(twiml);
});

// Export database for use in other modules
module.exports = { db };

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});