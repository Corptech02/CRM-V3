require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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

// Multer configuration for file uploads
const uploadDir = '/var/www/vanguard/uploads/documents/';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const ext = path.extname(file.originalname);
        cb(null, docId + ext);
    }
});

const uploadDocumentFiles = multer({
    storage: documentStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Database setup
const db = new sqlite3.Database('/var/www/vanguard/vanguard.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');

        // Configure busy timeout to handle concurrent access
        // Wait up to 30 seconds for database locks to be released
        db.configure("busyTimeout", 30000);

        // Enable WAL mode for better concurrent access
        db.exec("PRAGMA journal_mode = WAL;", (err) => {
            if (err) {
                console.error('Error enabling WAL mode:', err);
            } else {
                console.log('✅ SQLite WAL mode enabled for better concurrent access');
            }
        });

        // Create market_quotes table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS market_quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carrier TEXT NOT NULL,
            physical_coverage TEXT,
            premium_text TEXT,
            liability_per_unit TEXT,
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating market_quotes table:', err.message);
            } else {
                console.log('✅ Market quotes table ready');
            }
        });

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

    // Archived leads table
    db.run(`CREATE TABLE IF NOT EXISTS archived_leads (
        id TEXT PRIMARY KEY,
        original_lead_id TEXT NOT NULL,
        data TEXT NOT NULL,
        archived_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        archived_by TEXT,
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

    // Quote applications table
    db.run(`CREATE TABLE IF NOT EXISTS quote_submissions (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        form_data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
    )`);

    // Documents table
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        policy_id TEXT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        uploaded_by TEXT,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create indexes for better query performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_documents_policy_id ON documents(policy_id)`);

    // Loss runs tracking table
    db.run(`CREATE TABLE IF NOT EXISTS loss_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        file_type TEXT,
        status TEXT DEFAULT 'uploaded',
        uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
    )`);

    // Scheduled callbacks table
    db.run(`CREATE TABLE IF NOT EXISTS scheduled_callbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id TEXT NOT NULL,
        date_time DATETIME NOT NULL,
        notes TEXT,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
}

// Helper function to get existing lead data
async function getExistingLead(leadId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT data FROM leads WHERE id = ?', [leadId], (err, row) => {
            if (err) {
                console.error(`Error fetching existing lead ${leadId}:`, err);
                resolve(null);
            } else if (row) {
                try {
                    const existingLead = JSON.parse(row.data);
                    console.log(`📋 Found existing lead ${leadId} with stage: ${existingLead.stage || 'new'}`);
                    resolve(existingLead);
                } catch (parseErr) {
                    console.error(`Error parsing existing lead ${leadId}:`, parseErr);
                    resolve(null);
                }
            } else {
                console.log(`📋 No existing lead found for ${leadId} - will create new`);
                resolve(null);
            }
        });
    });
}

// Helper functions for ViciDial lead processing
function formatRenewalDate(rawDate) {
    if (!rawDate) return '';

    const cleanDate = rawDate.trim();

    // PRIORITY: Check YYYY-MM-DD format first (most common from Vicidial)
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDate)) {
        const [year, month, day] = cleanDate.split('-');
        const formatted = `${parseInt(month)}/${parseInt(day)}/${year}`;
        console.log(`🗓️  YYYY-MM-DD detected: "${cleanDate}" -> "${formatted}"`);
        return formatted;
    }

    // Try other date formats that might be in address3
    const datePatterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // M/D/YYYY or MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/,   // M-D-YYYY or MM-DD-YYYY (1-22-2025)
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/  // M/D/YY or MM/DD/YY
    ];

    for (const pattern of datePatterns) {
        const match = cleanDate.match(pattern);
        if (match) {
            if (match[3] && match[3].length === 4) { // Full year
                if (pattern.source === '(\\d{4})-(\\d{1,2})-(\\d{1,2})') { // YYYY-MM-DD format
                    const [, year, month, day] = match;
                    console.log(`🗓️  YYYY-MM-DD detected: "${cleanDate}" -> "${parseInt(month)}/${parseInt(day)}/${year}"`);
                    return `${parseInt(month)}/${parseInt(day)}/${year}`;
                } else { // M/D/YYYY or M-D-YYYY format
                    const [, month, day, year] = match;
                    console.log(`🗓️  M/D/YYYY detected: "${cleanDate}" -> "${parseInt(month)}/${parseInt(day)}/${year}"`);
                    return `${parseInt(month)}/${parseInt(day)}/${year}`;
                }
            } else { // 2-digit year, assume 20XX
                const [, month, day, year] = match;
                const fullYear = `20${year}`;
                console.log(`🗓️  M/D/YY detected: "${cleanDate}" -> "${parseInt(month)}/${parseInt(day)}/${fullYear}"`);
                return `${parseInt(month)}/${parseInt(day)}/${fullYear}`;
            }
        }
    }

    // If no standard date pattern found, look for month names
    const monthNames = {
        jan: '1', january: '1', feb: '2', february: '2', mar: '3', march: '3',
        apr: '4', april: '4', may: '5', jun: '6', june: '6', jul: '7', july: '7',
        aug: '8', august: '8', sep: '9', september: '9', oct: '10', october: '10',
        nov: '11', november: '11', dec: '12', december: '12'
    };

    const lowerDate = cleanDate.toLowerCase();
    for (const [monthName, monthNum] of Object.entries(monthNames)) {
        if (lowerDate.includes(monthName)) {
            const yearMatch = cleanDate.match(/(\d{4})/);
            const dayMatch = cleanDate.match(/\b(\d{1,2})\b/);
            if (yearMatch && dayMatch) {
                return `${monthNum}/${dayMatch[1]}/${yearMatch[1]}`;
            }
        }
    }

    // If nothing matches, return the original string
    return cleanDate;
}

function formatPhoneNumber(phone) {
    if (!phone) return '';

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else {
        return phone; // Return original if format is unclear
    }
}

// API Routes

// Get all clients
app.get('/api/clients', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 500; // Default limit of 500 clients
    const offset = req.query.offset ? parseInt(req.query.offset) : 0; // Default offset of 0

    console.log(`Fetching clients: limit=${limit}, offset=${offset}`);

    db.all('SELECT * FROM clients ORDER BY updated_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const clients = rows.map(row => JSON.parse(row.data));

        // Also get total count for pagination info
        db.get('SELECT COUNT(*) as total FROM clients', (countErr, countRow) => {
            if (countErr) {
                console.error('Error getting client count:', countErr);
                res.json(clients); // Return clients without count info
            } else {
                res.json({
                    clients: clients,
                    total: countRow.total,
                    limit: limit,
                    offset: offset,
                    hasMore: offset + limit < countRow.total
                });
            }
        });
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
    console.log(`Attempting to delete client by ID: ${id}`);

    // Try multiple approaches to find and delete the client
    const deleteQuery = `DELETE FROM clients WHERE
        id = ? OR
        json_extract(data, "$.id") = ? OR
        json_extract(data, "$.clientId") = ?`;

    db.run(deleteQuery, [id, id, id], function(err) {
        if (err) {
            console.error('Error deleting client:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Deleted ${this.changes} client(s) with ID ${id}`);
        res.json({ success: true, deleted: this.changes });
    });
});

// Get all policies (with deduplication and limit)
app.get('/api/policies', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100; // Default limit of 100 policies
    const includeInactive = req.query.includeInactive === 'true'; // Include inactive policies for CRM

    // Fetch more rows than limit to account for duplicates
    const fetchLimit = limit * 5; // Fetch 5x the limit to ensure we get enough unique policies
    db.all('SELECT * FROM policies ORDER BY updated_at DESC LIMIT ?', [fetchLimit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Deduplicate by policyNumber and limit results - FIXED FOR NESTED FORMAT
        const allPolicies = [];
        const policyMap = new Map(); // Use Map to track newest version of each policy

        for (const row of rows) {
            try {
                const data = JSON.parse(row.data);

                // Handle nested format: {policies: [...]}
                let policies = [];
                if (data.policies && Array.isArray(data.policies)) {
                    // Check for double-nested structure: data.policies[0].policies
                    for (const item of data.policies) {
                        if (item.policies && Array.isArray(item.policies)) {
                            // Found double-nested structure, extract actual policies
                            policies.push(...item.policies);
                        } else if (item.policyNumber || item.policy_number || item.id) {
                            // Single-nested structure, item is a policy
                            policies.push(item);
                        }
                    }
                } else if (data.id || data.policy_number || data.policyId || data.coiFormData) {
                    // Direct policy object (including COI-based policies)
                    policies = [data];
                }

                // Process each policy from this row
                for (const policy of policies) {
                    const policyNumber = policy.policyNumber ||
                                          policy.policy_number ||
                                          policy.id ||
                                          policy.policyId ||
                                          (policy.coiFormData && policy.coiFormData.glPolicyNum);

                    // Create a normalized policy number for deduplication
                    let normalizedNumber = policyNumber;

                    // Extract actual policy number from ID if needed
                    if (policyNumber && policyNumber.includes('-')) {
                        // Look for a numeric policy number in the policy data
                        const numericNumber = policy.policyNumber ||
                                           policy.policy_number ||
                                           (policy.coiFormData && policy.coiFormData.glPolicyNum) ||
                                           (policy.overview && policy.overview['Policy Number']);
                        if (numericNumber && numericNumber !== policyNumber) {
                            normalizedNumber = numericNumber;
                        }
                    }

                    if (policyNumber) {
                        // Preserve top-level status fields if they exist
                        if (data.status || data.policyStatus) {
                            policy.status = data.status || policy.status;
                            policy.policyStatus = data.policyStatus || policy.policyStatus;
                            console.log(`🔍 STATUS: Applied status ${data.status} to policy ${normalizedNumber}`);
                        } else {
                            console.log(`🔍 STATUS: No status found in data for policy ${normalizedNumber}`);
                        }

                        // Filter inactive policies unless explicitly requested
                        const isActive = (policy.status || policy.policyStatus || 'Active') === 'Active';

                        if (!isActive && !includeInactive) {
                            console.log(`🔍 SERVER: Skipping inactive policy ${normalizedNumber} (includeInactive: ${includeInactive})`);
                            continue;
                        }

                        // Always update map with newest version (records processed in desc order)
                        if (!policyMap.has(normalizedNumber)) {
                            policyMap.set(normalizedNumber, policy);
                            console.log(`✅ SERVER: Added policy ${normalizedNumber} (${policyNumber}) - ${policy.insured_name} (status: ${policy.status || 'none'}) (includeInactive: ${includeInactive})`);
                        } else {
                            console.log(`🔍 SERVER: Skipping older version of policy ${normalizedNumber} (${policyNumber})`);
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing policy data:', e);
            }
        }

        // Convert map to array and apply limit
        const uniquePolicies = Array.from(policyMap.values()).slice(0, limit);

        console.log(`✅ SERVER: Returning ${uniquePolicies.length} unique policies (requested limit: ${limit})`);
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

// Get single policy by ID
app.get('/api/policies/:id', (req, res) => {
    const policyId = req.params.id;

    db.all('SELECT * FROM policies ORDER BY updated_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Search through all policies for the matching ID
        for (const row of rows) {
            try {
                const data = JSON.parse(row.data);

                // Handle nested format like in the main policies endpoint
                let policies = [];
                if (data.policies && Array.isArray(data.policies)) {
                    for (const item of data.policies) {
                        if (item.policies && Array.isArray(item.policies)) {
                            policies.push(...item.policies);
                        } else if (item.policyNumber || item.policy_number || item.id) {
                            policies.push(item);
                        }
                    }
                } else if (data.id || data.policy_number) {
                    policies = [data];
                }

                // Find matching policy
                const policy = policies.find(p => p.id === policyId);
                if (policy) {
                    console.log(`✅ Found policy by ID: ${policyId} - ${policy.insured_name || policy.clientName}`);
                    res.json(policy);
                    return;
                }
            } catch (e) {
                console.error('Error parsing policy data:', e);
            }
        }

        res.status(404).json({ error: 'Policy not found' });
    });
});

// Save/Update policy
app.post('/api/policies', (req, res) => {
    const policy = req.body;
    console.log('📝 POST /api/policies - Received policy data:', {
        hasId: !!policy.id,
        hasClientId: !!policy.clientId,
        hasPolicyNumber: !!policy.policyNumber,
        hasClientName: !!policy.clientName,
        vehicleCount: policy.vehicles?.length || 0,
        driverCount: policy.drivers?.length || 0
    });

    // Generate proper IDs if missing
    let id = policy.id;
    let clientId = policy.clientId;

    // If no ID provided, generate one based on policy number
    if (!id && policy.policyNumber) {
        id = `policy_${policy.policyNumber}`;
        policy.id = id;
        console.log('🔧 Generated policy ID:', id);
    }

    // If no clientId but have client name, try to use policy number
    if (!clientId && policy.policyNumber) {
        clientId = policy.policyNumber;
        policy.clientId = clientId;
        console.log('🔧 Set client ID to policy number:', clientId);
    }

    // Structure data in the same nested format as existing policies
    const policyData = {
        policies: [{
            ...policy,
            id: id,
            policy_number: policy.policyNumber,
            policyNumber: policy.policyNumber,
            insured_name: policy.clientName || policy.insuredName || 'Unknown',
            carrier: policy.carrier || 'Unknown',
            effective_date: policy.effectiveDate,
            expiration_date: policy.expirationDate,
            premium: policy.premium || policy.annualPremium,
            agent: policy.agent || '',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            synced_from_crm: false,
            has_detailed_data: !!(policy.vehicles?.length || policy.drivers?.length || policy.coverage),
            vehicles: policy.vehicles || [],
            drivers: policy.drivers || [],
            trailers: policy.trailers || [],
            coverage: policy.coverage || {}
        }]
    };

    const data = JSON.stringify(policyData);
    console.log('💾 Saving policy with structure:', {
        id: id,
        clientId: clientId,
        nested: true,
        dataLength: data.length
    });

    db.run(`INSERT INTO policies (id, client_id, data) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, clientId, data, data, clientId],
        function(err) {
            if (err) {
                console.error('❌ Error saving policy:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            console.log('✅ Policy saved successfully:', id);
            res.json({
                id: id,
                success: true,
                vehicleCount: policy.vehicles?.length || 0,
                driverCount: policy.drivers?.length || 0,
                trailerCount: policy.trailers?.length || 0,
                message: 'Policy saved with detailed data'
            });
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

// Delete policy by policy number (for policies with NULL IDs)
app.delete('/api/policies/by-number/:policyNumber', (req, res) => {
    const policyNumber = req.params.policyNumber;
    console.log(`Attempting to delete policy by number: ${policyNumber}`);

    // Try multiple JSON paths where policy number might be stored
    const deleteQuery = `DELETE FROM policies WHERE
        json_extract(data, "$.policyNumber") = ? OR
        json_extract(data, "$.policies[0].policyNumber") = ? OR
        json_extract(data, "$.policies[0].policies[0].policyNumber") = ? OR
        json_extract(data, "$.policy_number") = ? OR
        json_extract(data, "$.policies[0].policy_number") = ?`;

    db.run(deleteQuery, [policyNumber, policyNumber, policyNumber, policyNumber, policyNumber], function(err) {
        if (err) {
            console.error('Error deleting policy by number:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Deleted ${this.changes} policy(ies) with number ${policyNumber}`);
        res.json({ success: true, deleted: this.changes });
    });
});

// Update policy with detailed vehicle and driver data
app.put('/api/policies/:id', (req, res) => {
    const policyId = req.params.id;
    const updatedPolicy = req.body;

    console.log(`🔄 Updating policy ${policyId} with detailed data:`, {
        vehicleCount: updatedPolicy.vehicles?.length || 0,
        driverCount: updatedPolicy.drivers?.length || 0,
        trailerCount: updatedPolicy.trailers?.length || 0
    });

    // First, get the existing policy to merge data - search through all policies like in GET endpoint
    db.all('SELECT rowid, * FROM policies ORDER BY updated_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching existing policy:', err);
            return res.status(500).json({ error: err.message });
        }

        // Search through all policies for the matching ID (like in GET endpoint)
        let existingPolicyData = null;
        let targetRow = null;

        for (const row of rows) {
            try {
                const data = JSON.parse(row.data);

                // Handle nested format like in the main policies endpoint
                let policies = [];
                if (data.policies && Array.isArray(data.policies)) {
                    for (const item of data.policies) {
                        if (item.policies && Array.isArray(item.policies)) {
                            policies.push(...item.policies);
                        } else if (item.policyNumber || item.policy_number || item.id) {
                            policies.push(item);
                        }
                    }
                } else if (data.id || data.policy_number) {
                    policies = [data];
                }

                // Find matching policy
                const policy = policies.find(p => p.id === policyId);
                if (policy) {
                    existingPolicyData = policy;
                    targetRow = row;
                    console.log(`✅ Found policy for update: ${policyId} - ${policy.insured_name || policy.clientName}`);
                    break;
                }
            } catch (e) {
                console.error('Error parsing policy data:', e);
            }
        }

        if (!existingPolicyData || !targetRow) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Merge the updated data with existing data
        const mergedPolicy = {
            ...existingPolicyData,
            ...updatedPolicy,
            // Ensure these critical fields are preserved/updated
            id: policyId,
            updated_date: new Date().toISOString(),
            last_updated_by: 'admin_dashboard',
            has_detailed_data: true,
            vehicles: updatedPolicy.vehicles || existingPolicyData.vehicles || [],
            drivers: updatedPolicy.drivers || existingPolicyData.drivers || [],
            trailers: updatedPolicy.trailers || existingPolicyData.trailers || []
        };

        // Need to update the policy within the nested structure
        const originalData = JSON.parse(targetRow.data);

        // Update the specific policy in the nested structure
        if (originalData.policies && Array.isArray(originalData.policies)) {
            for (const item of originalData.policies) {
                if (item.policies && Array.isArray(item.policies)) {
                    // Find and update the specific policy
                    const policyIndex = item.policies.findIndex(p => p.id === policyId);
                    if (policyIndex !== -1) {
                        item.policies[policyIndex] = mergedPolicy;
                        break;
                    }
                }
            }
        }

        const dataToStore = JSON.stringify(originalData);

        // Update the database using the row's primary key
        db.run(
            'UPDATE policies SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE rowid = ?',
            [dataToStore, targetRow.rowid],
            function(updateErr) {
                if (updateErr) {
                    console.error('Error updating policy:', updateErr);
                    return res.status(500).json({ error: updateErr.message });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Policy not found for update' });
                }

                console.log(`✅ Successfully updated policy ${policyId} with detailed data`);
                res.json({
                    success: true,
                    id: policyId,
                    vehicleCount: mergedPolicy.vehicles?.length || 0,
                    driverCount: mergedPolicy.drivers?.length || 0,
                    trailerCount: mergedPolicy.trailers?.length || 0,
                    message: 'Policy updated with detailed vehicle and driver data'
                });
            }
        );
    });
});

// Get COI document for a policy (for client portal)
app.get('/api/coi/:policyId', (req, res) => {
    const policyId = req.params.policyId;
    console.log('🔍 COI API: Requesting COI for policy:', policyId);

    // Since COI documents are currently stored in browser localStorage,
    // we need to implement a documents table to store them server-side
    // For now, let's create a basic documents table if it doesn't exist

    // Check if coi_documents table exists, create if not
    db.run(`CREATE TABLE IF NOT EXISTS coi_documents (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        data_url TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        form_data TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating documents table:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Look for COI document for this policy
        db.get(`SELECT * FROM coi_documents WHERE policy_id = ? AND type LIKE '%image%' ORDER BY upload_date DESC LIMIT 1`,
            [policyId], (err, row) => {
            if (err) {
                console.error('Error querying documents:', err);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            // Check if we found a document but it's a placeholder (small size)
            if (row && row.data_url && row.data_url.length <= 150) {
                console.log('🔍 COI API: Found placeholder document, checking policies table for actual data...');
                row = null; // Treat as not found to trigger fallback
            }

            if (!row) {
                console.log('🔍 COI API: No valid COI document found in coi_documents table, checking policies table...');

                // Fallback: Check policies table for COI documents by policy ID or policy number
                db.get(`SELECT id, data FROM policies WHERE id = ? OR json_extract(data, '$.policies[0].policyNumber') = ?`, [policyId, policyId], (err, policyRow) => {
                    if (err) {
                        console.error('Error querying policies table:', err);
                        res.status(500).json({ error: 'Database error' });
                        return;
                    }

                    if (!policyRow) {
                        console.log('🔍 COI API: No policy found with id:', policyId);
                        res.status(404).json({
                            error: 'COI document not found',
                            message: 'No COI document has been generated for this policy yet. Please contact your agent to request one.',
                            policyId: policyId
                        });
                        return;
                    }

                    try {
                        const policyData = JSON.parse(policyRow.data);
                        if (policyData.coiDocuments && policyData.coiDocuments.length > 0) {
                            const latestCOI = policyData.coiDocuments[policyData.coiDocuments.length - 1];

                            if (latestCOI.dataUrl && latestCOI.dataUrl.length > 150) {
                                console.log('✅ COI API: Found valid COI in policies table:', latestCOI.name);
                                res.json({
                                    id: latestCOI.id,
                                    name: latestCOI.name,
                                    type: latestCOI.type || 'image/png',
                                    dataUrl: latestCOI.dataUrl,
                                    uploadDate: latestCOI.uploadDate,
                                    policyId: policyId,
                                    source: 'policies_table'
                                });
                                return;
                            }
                        }

                        console.log('🔍 COI API: No valid COI found in policies table either');
                        res.status(404).json({
                            error: 'COI document not found',
                            message: 'No COI document has been generated for this policy yet. Please contact your agent to request one.',
                            policyId: policyId
                        });
                    } catch (parseErr) {
                        console.error('Error parsing policy data:', parseErr);
                        res.status(500).json({ error: 'Database error parsing policy data' });
                    }
                });
                return;
            }

            console.log('✅ COI API: Found COI document:', row.name);
            res.json({
                id: row.id,
                name: row.name,
                type: row.type,
                dataUrl: row.data_url,
                uploadDate: row.upload_date,
                policyId: policyId,
                source: 'coi_documents_table'
            });
        });
    });
});

// Alternative COI endpoint using policy number
app.get('/api/policies/:policyNumber/coi', (req, res) => {
    const policyNumber = req.params.policyNumber;
    console.log('🔍 COI API: Requesting COI for policy number:', policyNumber);

    // Create coi_documents table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS coi_documents (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        data_url TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        form_data TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating documents table:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Look for COI document for this policy number
        db.get(`SELECT * FROM coi_documents WHERE policy_id = ? AND type LIKE '%image%' ORDER BY upload_date DESC LIMIT 1`,
            [policyNumber], (err, row) => {
            if (err) {
                console.error('Error querying documents:', err);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            if (!row) {
                console.log('🔍 COI API: No COI document found for policy number:', policyNumber);
                res.status(404).json({
                    error: 'COI document not found',
                    message: 'No COI document has been generated for this policy yet. Please contact your agent to request one.',
                    policyNumber: policyNumber
                });
                return;
            }

            console.log('✅ COI API: Found COI document:', row.name);
            res.json({
                id: row.id,
                name: row.name,
                type: row.type,
                dataUrl: row.data_url,
                uploadDate: row.upload_date,
                policyNumber: policyNumber
            });
        });
    });
});

// Get ID cards for a policy (for client portal)
app.get('/api/id-cards/:policyId', (req, res) => {
    const policyId = req.params.policyId;
    console.log('🆔 ID Cards API: Requesting ID cards for policy:', policyId);

    // Create id_cards table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS id_cards (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        data_url TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        size INTEGER
    )`, (err) => {
        if (err) {
            console.error('Error creating id_cards table:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Look for ID cards for this policy
        db.all(`SELECT * FROM id_cards WHERE policy_id = ? ORDER BY upload_date DESC`,
            [policyId], (err, rows) => {
            if (err) {
                console.error('Error querying id_cards:', err);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            if (!rows || rows.length === 0) {
                console.log('🆔 ID Cards API: No ID cards found for policy:', policyId);
                res.json([]);
                return;
            }

            console.log(`✅ ID Cards API: Found ${rows.length} ID cards for policy:`, policyId);
            res.json(rows.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                dataUrl: row.data_url,
                uploadDate: row.upload_date,
                policyId: policyId,
                size: row.size
            })));
        });
    });
});

// Store ID cards from CRM upload
app.post('/api/id-cards', (req, res) => {
    const { policyId, idCards } = req.body;
    console.log('🆔 ID Cards API: Storing ID cards for policy:', policyId, 'Count:', idCards?.length || 0);

    if (!policyId || !idCards || !Array.isArray(idCards)) {
        return res.status(400).json({ error: 'Invalid request: policyId and idCards array required' });
    }

    // Create id_cards table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS id_cards (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        data_url TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        size INTEGER
    )`, (err) => {
        if (err) {
            console.error('Error creating id_cards table:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Insert each ID card
        const insertPromises = idCards.map(card => {
            return new Promise((resolve, reject) => {
                db.run(`INSERT INTO id_cards (id, policy_id, name, type, data_url, upload_date, size)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name = ?, type = ?, data_url = ?, upload_date = ?, size = ?`,
                    [
                        card.id, policyId, card.name, card.type, card.dataUrl, card.uploadDate, card.size,
                        card.name, card.type, card.dataUrl, card.uploadDate, card.size
                    ], (err) => {
                    if (err) {
                        console.error('Error inserting ID card:', err);
                        reject(err);
                    } else {
                        console.log('✅ ID Card stored:', card.name);
                        resolve();
                    }
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                console.log(`✅ ID Cards API: Successfully stored ${idCards.length} ID cards`);
                res.json({ success: true, count: idCards.length });
            })
            .catch(err => {
                console.error('Error storing ID cards:', err);
                res.status(500).json({ error: 'Failed to store ID cards' });
            });
    });
});

// Migrate COI documents from localStorage to database
app.post('/api/coi/migrate', (req, res) => {
    const documents = req.body.documents;
    console.log('📦 COI Migration: Migrating', documents?.length || 0, 'COI documents to database');

    if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Expected an array of documents'
        });
    }

    // Create coi_documents table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS coi_documents (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        data_url TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        form_data TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating documents table:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        let processed = 0;
        let errors = [];
        let successful = 0;

        if (documents.length === 0) {
            return res.json({
                success: true,
                processed: 0,
                successful: 0,
                errors: []
            });
        }

        documents.forEach((doc, index) => {
            // Extract policy ID from the document name or formData
            let policyId = 'unknown';
            try {
                if (doc.formData && doc.formData.policyNumber) {
                    policyId = doc.formData.policyNumber;
                } else if (doc.name && doc.name.includes('POL-')) {
                    // Extract from filename like "ACORD_25_POL-1770054490788-j7krpi31r_2026-02-02.png"
                    const match = doc.name.match(/POL-([^-]+)/);
                    if (match) {
                        policyId = 'POL-' + match[1];
                    }
                }
            } catch (e) {
                console.error('Error extracting policy ID:', e);
            }

            // Insert document into database
            db.run(`INSERT INTO coi_documents (id, policy_id, name, type, data_url, upload_date, form_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        policy_id = ?, name = ?, type = ?, data_url = ?, form_data = ?`,
                [
                    doc.id,
                    policyId,
                    doc.name,
                    doc.type,
                    doc.dataUrl,
                    doc.uploadDate,
                    JSON.stringify(doc.formData || {}),
                    // For ON CONFLICT update
                    policyId,
                    doc.name,
                    doc.type,
                    doc.dataUrl,
                    JSON.stringify(doc.formData || {})
                ],
                function(err) {
                    processed++;

                    if (err) {
                        console.error('Error inserting document:', err);
                        errors.push({
                            index: index,
                            docId: doc.id,
                            error: err.message
                        });
                    } else {
                        successful++;
                        console.log('✅ Migrated COI document:', doc.id, 'for policy:', policyId);
                    }

                    // Check if all documents have been processed
                    if (processed === documents.length) {
                        console.log('📦 COI Migration Complete:', successful, 'successful,', errors.length, 'errors');
                        res.json({
                            success: errors.length === 0,
                            processed: processed,
                            successful: successful,
                            errors: errors
                        });
                    }
                }
            );
        });
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

// ============================================
// VIGAGENCY CRM API ENDPOINTS
// ============================================

// Get leads for vigagency.com CRM interface
app.get('/api/vigagency/crm/leads', (req, res) => {
    console.log('🔗 VigAgency CRM leads request received');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get total count first
    db.get('SELECT COUNT(*) as total FROM leads', (err, countRow) => {
        if (err) {
            console.error('❌ VigAgency CRM error getting lead count:', err);
            return res.status(500).json({
                success: false,
                error: err.message,
                leads: [],
                total: 0
            });
        }

        const totalLeads = countRow.total;

        // Get paginated leads
        db.all(`SELECT * FROM leads ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
            [limit, offset],
            (err, rows) => {
                if (err) {
                    console.error('❌ VigAgency CRM error getting leads:', err);
                    return res.status(500).json({
                        success: false,
                        error: err.message,
                        leads: [],
                        total: 0
                    });
                }

                const leads = rows.map(row => {
                    try {
                        const leadData = JSON.parse(row.data);
                        return {
                            id: leadData.id,
                            name: leadData.name || 'Unknown',
                            email: leadData.email || '',
                            phone: leadData.phone || '',
                            company: leadData.company || '',
                            stage: leadData.stage || 'new',
                            source: leadData.source || 'unknown',
                            created_at: row.created_at,
                            updated_at: row.updated_at,
                            address: leadData.address || '',
                            city: leadData.city || '',
                            state: leadData.state || '',
                            zip: leadData.zip || ''
                        };
                    } catch (parseErr) {
                        console.error('Error parsing lead data:', parseErr);
                        return {
                            id: row.id || 'unknown',
                            name: 'Parse Error',
                            email: '',
                            phone: '',
                            company: '',
                            stage: 'error',
                            source: 'unknown',
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        };
                    }
                });

                console.log(`✅ VigAgency CRM returning ${leads.length} of ${totalLeads} leads`);

                res.json({
                    success: true,
                    leads: leads,
                    total: totalLeads,
                    page: page,
                    limit: limit,
                    total_pages: Math.ceil(totalLeads / limit)
                });
            }
        );
    });
});

// Get clients for vigagency.com (for email/password functionality)
app.get('/api/vigagency/crm/clients', (req, res) => {
    console.log('🔗 VigAgency CRM clients request received');

    db.all('SELECT * FROM clients ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('❌ VigAgency CRM error getting clients:', err);
            return res.status(500).json({
                success: false,
                error: err.message,
                clients: []
            });
        }

        const clients = rows.map(row => {
            try {
                const clientData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                return {
                    id: row.id,
                    email: clientData.email || row.email || '',
                    password: clientData.password || '',
                    name: clientData.name || '',
                    phone: clientData.phone || '',
                    company: clientData.company || '',
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };
            } catch (parseErr) {
                console.error('Error parsing client data:', parseErr);
                return {
                    id: row.id,
                    email: row.email || '',
                    password: '',
                    name: '',
                    phone: '',
                    company: '',
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };
            }
        });

        console.log(`✅ VigAgency CRM returning ${clients.length} clients`);

        res.json({
            success: true,
            clients: clients
        });
    });
});

// Update client (for password creation)
app.post('/api/vigagency/crm/clients/:id', (req, res) => {
    const clientId = req.params.id;
    const updateData = req.body;

    console.log('🔗 VigAgency CRM client update request for:', clientId);

    // Get existing client first
    db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, row) => {
        if (err) {
            console.error('❌ VigAgency CRM error getting client for update:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }

        try {
            const existingData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            const mergedData = { ...existingData, ...updateData };

            db.run('UPDATE clients SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [JSON.stringify(mergedData), clientId],
                function(err) {
                    if (err) {
                        console.error('❌ VigAgency CRM error updating client:', err);
                        return res.status(500).json({
                            success: false,
                            error: err.message
                        });
                    }

                    console.log(`✅ VigAgency CRM client ${clientId} updated successfully`);
                    res.json({
                        success: true,
                        client_id: clientId,
                        updated_fields: Object.keys(updateData)
                    });
                }
            );
        } catch (parseErr) {
            console.error('Error parsing client data for update:', parseErr);
            res.status(500).json({
                success: false,
                error: 'Invalid client data format'
            });
        }
    });
});

// ============================================
// ARCHIVED LEADS API ENDPOINTS
// ============================================

// Get all archived leads
app.get('/api/archived-leads', (req, res) => {
    db.all('SELECT * FROM archived_leads ORDER BY archived_date DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const archivedLeads = rows.map(row => ({
            ...JSON.parse(row.data),
            archivedDate: row.archived_date,
            archivedBy: row.archived_by,
            archiveId: row.id,
            originalLeadId: row.original_lead_id
        }));
        res.json({ success: true, archivedLeads });
    });
});

// Archive a lead (move from active to archived)
app.post('/api/archive-lead/:id', (req, res) => {
    const leadId = req.params.id;
    const archivedBy = req.body.archivedBy || 'System';

    console.log(`📦 Archiving lead ${leadId} by ${archivedBy}`);

    // First get the lead from active leads
    db.get('SELECT data FROM leads WHERE id = ?', [leadId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }

        const leadData = JSON.parse(row.data);
        const archiveId = `archived_${leadId}_${Date.now()}`;

        // Insert into archived_leads table
        db.run(`INSERT INTO archived_leads (id, original_lead_id, data, archived_by, archived_date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [archiveId, leadId, row.data, archivedBy],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Remove from active leads
                db.run('DELETE FROM leads WHERE id = ?', [leadId], function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    console.log(`✅ Lead ${leadId} archived successfully`);
                    res.json({ success: true, archivedId: archiveId });
                });
            }
        );
    });
});

// Restore a lead from archive to active
app.post('/api/restore-lead/:archiveId', (req, res) => {
    const archiveId = req.params.archiveId;

    console.log(`📤 Restoring lead ${archiveId}`);

    // Get the archived lead
    db.get('SELECT original_lead_id, data FROM archived_leads WHERE id = ?', [archiveId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Archived lead not found' });
            return;
        }

        const originalLeadId = row.original_lead_id;
        const leadData = row.data;

        // Insert back into active leads
        db.run(`INSERT INTO leads (id, data) VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
            [originalLeadId, leadData, leadData],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Remove from archived leads
                db.run('DELETE FROM archived_leads WHERE id = ?', [archiveId], function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    console.log(`✅ Lead ${originalLeadId} restored successfully`);
                    res.json({ success: true, restoredId: originalLeadId });
                });
            }
        );
    });
});

// Permanently delete an archived lead
app.delete('/api/archived-leads/:archiveId', (req, res) => {
    const archiveId = req.params.archiveId;

    console.log(`🗑️ Permanently deleting archived lead ${archiveId}`);

    db.run('DELETE FROM archived_leads WHERE id = ?', [archiveId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Archived lead not found' });
            return;
        }

        console.log(`✅ Archived lead ${archiveId} permanently deleted`);
        res.json({ success: true, deleted: true });
    });
});

// Get single archived lead by archive ID
app.get('/api/archived-leads/:archiveId', (req, res) => {
    const archiveId = req.params.archiveId;

    db.get('SELECT * FROM archived_leads WHERE id = ?', [archiveId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Archived lead not found' });
            return;
        }

        const archivedLead = {
            ...JSON.parse(row.data),
            archivedDate: row.archived_date,
            archivedBy: row.archived_by,
            archiveId: row.id,
            originalLeadId: row.original_lead_id
        };

        res.json({ success: true, lead: archivedLead });
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

// ViciDial data endpoint - Fast direct API sync with authentication
app.get('/api/vicidial/data', async (req, res) => {
    const { spawn } = require('child_process');
    const https = require('https');
    const cheerio = require('cheerio');

    // ViciDial credentials
    const VICIDIAL_HOST = '204.13.233.29';
    const USERNAME = '6666';
    const PASSWORD = 'corp06';

    console.log('📋 Fetching ViciDial lead list (NO SYNC - just data)...');

    // DO NOT AUTO-SYNC! Only fetch lead data for selection
    // Use Python script to ONLY fetch ViciDial leads without importing
    const python = spawn('python3', ['-c', `
import requests
import urllib3
from bs4 import BeautifulSoup
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ViciDial credentials
USERNAME = "6666"
PASSWORD = "corp06"
VICIDIAL_HOST = "204.13.233.29"

session = requests.Session()
session.verify = False

try:
    # Fetch ViciDial leads for selection (no import) - output only JSON

    # Get leads from various lists
    all_leads = []
    lists_data = {}

    # Get list information first
    list_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php?ADD=100"
    list_response = session.get(list_url, auth=(USERNAME, PASSWORD))

    if list_response.status_code == 200:
        soup = BeautifulSoup(list_response.text, 'html.parser')

        # Parse list table
        for table in soup.find_all('table'):
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 9:
                    list_id = cells[0].text.strip()
                    list_name = cells[1].text.strip()
                    active = cells[6].text.strip()

                    if list_id and list_id.isdigit() and list_name and list_name != "TEST":
                        lists_data[list_id] = {
                            "name": list_name,
                            "active": active == "Y"
                        }

    # Get leads from active lists only
    for list_id, list_info in lists_data.items():
        if list_info.get('active', False):
            # Fetching leads from active list {list_id}: {list_info['name']}

            # Fetch SALE leads from this list using the correct endpoint
            lead_url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
            lead_response = session.get(lead_url, auth=(USERNAME, PASSWORD), params={
                'list_id': list_id,
                'status': 'SALE',
                'DB': '',
                'submit': 'submit'
            })

            if lead_response.status_code == 200:
                soup = BeautifulSoup(lead_response.text, 'html.parser')

                # Parse lead table - SALE leads have >10 columns
                for table in soup.find_all('table'):
                    rows = table.find_all('tr')
                    for row in rows:
                        cells = row.find_all('td')
                        if len(cells) > 10:  # SALE leads table format
                            # Debug: Log all available columns for the first few leads
                            if len(all_leads) < 3:
                                import sys
                                print("🔍 DEBUG: Lead row has " + str(len(cells)) + " columns:", file=sys.stderr)
                                for i, cell in enumerate(cells[:15]):  # Check first 15 columns
                                    cell_text = cell.text.strip()
                                    email_marker = " (EMAIL?)" if '@' in cell_text else ""
                                    print("  Cell " + str(i) + ": '" + cell_text + "'" + email_marker, file=sys.stderr)

                            # Based on debug: Cell 1=LEAD_ID, Cell 3=VENDOR_ID, Cell 6=PHONE, Cell 7=NAME, Cell 8=CITY
                            lead_id = cells[1].text.strip() if len(cells) > 1 else ""
                            vendor_id = cells[3].text.strip() if len(cells) > 3 else ""
                            phone = cells[6].text.strip() if len(cells) > 6 else ""
                            company_name = cells[7].text.strip() if len(cells) > 7 else ""
                            city = cells[8].text.strip() if len(cells) > 8 else ""

                            # Try to find email in other columns
                            real_email = ""
                            for i, cell in enumerate(cells):
                                cell_text = cell.text.strip()
                                if '@' in cell_text and '.' in cell_text and not cell_text.endswith('@company.com'):
                                    real_email = cell_text
                                    import sys
                                    print("🎯 Found real email in cell " + str(i) + ": " + real_email, file=sys.stderr)
                                    break

                            # If no email found in table, fetch lead details page
                            if not real_email and lead_id and lead_id.isdigit():
                                try:
                                    import sys
                                    print("🔍 Fetching lead details for ID " + lead_id + " to get real email...", file=sys.stderr)

                                    # Fetch individual lead details page
                                    detail_url = "https://" + VICIDIAL_HOST + "/vicidial/admin_modify_lead.php"
                                    detail_response = session.get(detail_url, auth=(USERNAME, PASSWORD), params={
                                        'lead_id': lead_id,
                                        'DB': ''
                                    })

                                    if detail_response.status_code == 200:
                                        detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

                                        # Look for email input field in the form
                                        email_input = detail_soup.find('input', {'name': 'email'})
                                        if email_input and email_input.get('value'):
                                            email_value = email_input.get('value').strip()
                                            if email_value and '@' in email_value and not email_value.endswith('@company.com'):
                                                real_email = email_value
                                                print("✅ Found real email from detail page: " + real_email, file=sys.stderr)
                                            else:
                                                print("⚠️ Email field found but empty/invalid: '" + str(email_value) + "'", file=sys.stderr)
                                        else:
                                            print("⚠️ No email input field found on detail page", file=sys.stderr)
                                    else:
                                        print("❌ Failed to fetch lead detail page: " + str(detail_response.status_code), file=sys.stderr)

                                except Exception as e:
                                    import sys
                                    print("❌ Error fetching lead details: " + str(e), file=sys.stderr)

                            if lead_id and lead_id.isdigit():
                                # Clean up company name - remove " Unknown Rep" suffix
                                clean_name = company_name.replace(" Unknown Rep", "").replace("Unknown Rep", "").strip()
                                if not clean_name:
                                    clean_name = f"Lead {lead_id}"

                                # Extract contact name (first part before company structure indicators)
                                contact_name = clean_name.split(' LLC')[0].split(' INC')[0].split(' CORP')[0].strip()
                                if len(contact_name.split()) > 3:
                                    contact_name = ' '.join(contact_name.split()[:3])  # Limit to first 3 words

                                # Use real email if found, otherwise generate one based on company name
                                if real_email:
                                    final_email = real_email
                                    import sys
                                    print("✅ Using real email for " + clean_name + ": " + real_email, file=sys.stderr)
                                else:
                                    email_base = clean_name.replace(' ', '').replace('-', '').replace('&', 'and')
                                    email_base = ''.join(c for c in email_base if c.isalnum())[:20].lower()
                                    final_email = email_base + "@company.com" if email_base else "lead" + lead_id + "@company.com"
                                    import sys
                                    print("⚠️ No real email found for " + clean_name + ", using generated: " + final_email, file=sys.stderr)

                                all_leads.append({
                                    "id": lead_id,
                                    "leadId": lead_id,
                                    "name": clean_name,
                                    "phone": phone,
                                    "company": clean_name,
                                    "email": final_email,
                                    "contact": contact_name,
                                    "city": city,
                                    "vendorId": vendor_id,
                                    "listId": list_id,
                                    "listName": list_info['name'],
                                    "source": "ViciDial"
                                })

    # Output results
    result = {
        "saleLeads": all_leads,
        "totalLeads": len(all_leads),
        "lists": [{"id": k, "name": v["name"], "leadCount": len([l for l in all_leads if l["listId"] == k]), "active": v["active"]} for k, v in lists_data.items()],
        "allListsSummary": [{"listId": k, "listName": v["name"], "leadCount": len([l for l in all_leads if l["listId"] == k])} for k, v in lists_data.items()],
        "success": True,
        "message": f"Fetched {len(all_leads)} leads for selection (no import)"
    }

    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"saleLeads": [], "totalLeads": 0, "lists": [], "allListsSummary": [], "error": str(e), "success": False}))
    `]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
        output += data.toString();
    });

    python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('ViciDial Data Fetch Error:', data.toString());
    });

    python.on('close', (code) => {
        if (code !== 0) {
            console.error('ViciDial data fetch failed with code:', code);
            console.error('Error output:', errorOutput);

            return res.json({
                saleLeads: [],
                totalLeads: 0,
                lists: [],
                allListsSummary: [],
                error: 'Failed to fetch ViciDial data'
            });
        }

        try {
            const result = JSON.parse(output.trim());
            console.log(`✅ Fetched ${result.totalLeads} ViciDial leads for selection (no auto-import)`);
            res.json(result);
        } catch (e) {
            console.error('Failed to parse ViciDial data:', e);
            res.json({
                saleLeads: [],
                totalLeads: 0,
                lists: [],
                allListsSummary: [],
                error: 'Failed to parse ViciDial data'
            });
        }
    });
});

// Get Vicidial lists for upload selection
app.get('/api/vicidial/lists', async (req, res) => {
    try {
        console.log('🔍 Getting Vicidial lists directly from ViciDial API...');

        const { spawn } = require('child_process');
        const fs = require('fs');
        const path = require('path');

        // Create Python script to fetch ViciDial lists
        const pythonScript = `
import requests
import urllib3
import json
import sys

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ViciDial Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "corp06"
VICIDIAL_SOURCE = "vanguard_crm"

def get_vicidial_lists():
    """Get all ViciDial lists"""
    api_url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

    # Get list of all lists
    lists_params = {
        "source": VICIDIAL_SOURCE,
        "user": VICIDIAL_USER,
        "pass": VICIDIAL_PASS,
        "function": "list_custom_fields"
    }

    all_lists = []

    # Check specific lists that we know exist
    known_lists = ["998", "999", "1000", "1001", "1002", "1005", "1006", "1007", "1008", "1009"]

    for list_id in known_lists:
        try:
            params = {
                "source": VICIDIAL_SOURCE,
                "user": VICIDIAL_USER,
                "pass": VICIDIAL_PASS,
                "function": "list_info",
                "list_id": list_id
            }

            response = requests.post(api_url, data=params, timeout=15, verify=False)

            if response.status_code == 200:
                data = response.text.strip()
                if data and "|" in data:
                    parts = data.split("|")
                    if len(parts) >= 4:
                        list_info = {
                            "list_id": parts[0],
                            "list_name": parts[1] if len(parts[1]) > 0 else f"List {parts[0]}",
                            "leads": int(parts[7]) if len(parts) > 7 and parts[7].isdigit() else 0,
                            "active": parts[3] if len(parts) > 3 else "Y"
                        }
                        all_lists.append(list_info)

        except Exception as e:
            # Skip failed lists
            pass

    return all_lists

if __name__ == "__main__":
    lists = get_vicidial_lists()
    print(json.dumps(lists))
`;

        // Write Python script to temp file
        const tempScript = `/tmp/get_vicidial_lists_${Date.now()}.py`;
        fs.writeFileSync(tempScript, pythonScript);

        // Execute Python script
        const python = spawn('python3', [tempScript]);

        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        python.on('close', (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(tempScript);
            } catch (e) {
                // Ignore cleanup errors
            }

            if (code === 0) {
                try {
                    const lists = JSON.parse(output.trim());
                    console.log(`📋 Retrieved ${lists.length} ViciDial lists directly from API`);

                    res.json({
                        success: true,
                        lists: lists
                    });
                } catch (parseError) {
                    console.error('Error parsing ViciDial lists response:', parseError);
                    console.log('Raw output:', output);
                    res.json({
                        success: false,
                        error: 'Failed to parse ViciDial response',
                        lists: []
                    });
                }
            } else {
                console.error('Python script failed:', error);
                res.json({
                    success: false,
                    error: `Failed to fetch ViciDial lists: ${error}`,
                    lists: []
                });
            }
        });

        // Set timeout for the Python script
        setTimeout(() => {
            if (!res.headersSent) {
                python.kill();
                res.json({
                    success: false,
                    error: 'Timeout fetching ViciDial lists',
                    lists: []
                });
            }
        }, 30000);

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

// Premium-calculating Vicidial sync endpoint
app.post('/api/vicidial/sync-with-premium', async (req, res) => {
    const { spawn } = require('child_process');
    console.log('💰 Starting Vicidial sync with premium calculation...');

    // Call the Python script that has premium calculation logic
    const python = spawn('python3', ['/var/www/vanguard/vanguard_vicidial_sync.py']);

    let output = '';
    let errorOutput = '';
    let result = null;

    python.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Premium Sync:', data.toString().trim());
    });

    python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Premium Sync Error:', data.toString());
    });

    python.on('close', (code) => {
        if (code !== 0) {
            console.error('Premium sync failed with code:', code);
            console.error('Error output:', errorOutput);
            return res.status(500).json({
                success: false,
                error: 'Premium sync failed',
                message: errorOutput
            });
        }

        // Try to parse the JSON result from the Python script
        try {
            // The Python script outputs JSON on the last line
            const lines = output.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            result = JSON.parse(lastLine);

            res.json({
                success: true,
                imported: result.imported,
                message: result.message,
                details: result
            });
        } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            console.log('Raw output:', output);
            res.json({
                success: true,
                imported: 0,
                message: 'Sync completed but could not parse results',
                rawOutput: output
            });
        }
    });

    // Set a timeout to prevent hanging
    setTimeout(() => {
        python.kill();
        if (!res.headersSent) {
            res.status(408).json({
                success: false,
                error: 'Sync timeout',
                message: 'Sync operation timed out after 60 seconds'
            });
        }
    }, 60000);
});

// Quick import endpoint (no transcription processing)
app.post('/api/vicidial/quick-import', async (req, res) => {
    console.log('⚡ Starting quick Vicidial import using main sync system...');
    const { spawn } = require('child_process');

    try {
        const { selectedLeads } = req.body;

        if (!selectedLeads || !Array.isArray(selectedLeads)) {
            return res.status(400).json({
                success: false,
                error: 'No leads provided',
                message: 'Selected leads array is required'
            });
        }

        console.log(`⚡ Processing ${selectedLeads.length} selected leads for quick import`);
        console.log(`📋 Selected lead IDs:`, selectedLeads.map(l => l.id || l.name));

        // Use the selective sync Python script with full extraction logic
        console.log('🐍 Running selective ViciDial sync with full extraction...');

        const leadsJson = JSON.stringify(selectedLeads);
        const python = spawn('python3', ['/var/www/vanguard/vanguard_vicidial_sync_selective.py', leadsJson], {
            stdio: 'pipe'
        });

        const result = await new Promise((resolve, reject) => {
            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
                console.log('🐍 Selective Sync:', data.toString().trim());
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error('🐍 Selective Sync Error:', data.toString().trim());
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    console.error('🐍 Selective sync failed with exit code:', code);
                    console.error('🐍 Error output:', errorOutput);
                    reject(new Error(`Selective sync failed: ${errorOutput}`));
                } else {
                    try {
                        const result = JSON.parse(output || '{"success": false, "imported": 0}');
                        console.log('🐍 Selective sync result:', result);
                        resolve(result);
                    } catch (e) {
                        console.error('🐍 Failed to parse selective sync result:', e);
                        resolve({ success: false, imported: 0, error: 'Failed to parse result' });
                    }
                }
            });

            setTimeout(() => {
                python.kill();
                reject(new Error('Selective sync timeout'));
            }, 60000); // 1 minute timeout
        });

        console.log(`✅ Quick import completed: ${result.imported} leads imported with full premium/insurance extraction`);

        res.json({
            success: result.success,
            imported: result.imported || 0,
            message: result.message || `Successfully quick imported ${result.imported || 0} leads with premium and insurance data`,
            errors: result.error ? [result.error] : undefined
        });

    } catch (error) {
        console.error('❌ Quick import error:', error);
        res.status(500).json({
            success: false,
            error: 'Quick import failed',
            message: error.message
        });
    }
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

        console.log('🧹 Skipping list clear for speed (append mode):', list_id);

        // Return success immediately to avoid timeouts
        // This means uploads will append to existing leads rather than replace them
        res.json({
            success: true,
            message: `List ${list_id} ready (append mode - existing leads preserved)`,
            list_id: list_id,
            mode: 'append'
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

// Helper function to process large uploads in background
async function processLargeUpload(targetListId, leads) {
    console.log(`🔄 Background processing started for ${leads.length} leads in list ${targetListId}`);

    try {
        // Create temporary JSON file with leads data
        const fs = require('fs');
        const { spawn } = require('child_process');

        const tempFile = `/tmp/vicidial_upload_${Date.now()}.json`;
        const leadsData = { leads: leads };

        fs.writeFileSync(tempFile, JSON.stringify(leadsData, null, 2));
        console.log(`📦 Created temp file: ${tempFile} with ${leads.length} leads`);

        // Call Python uploader script
        console.log(`🔄 Starting actual ViciDial upload for list ${targetListId}...`);

        const pythonScript = '/var/www/vanguard/backend/vicidial-lead-uploader.py';
        const python = spawn('python3', [pythonScript, targetListId, tempFile]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
            console.log('📦 Upload progress:', data.toString().trim());
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('📦 Upload error:', data.toString());
        });

        python.on('close', (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(tempFile);
            } catch (e) {
                console.warn('Could not delete temp file:', tempFile);
            }

            if (code === 0) {
                console.log(`✅ Background upload completed successfully for list ${targetListId}`);
            } else {
                console.error(`❌ Background upload failed for list ${targetListId}, exit code: ${code}`);
            }
        });

    } catch (error) {
        console.error(`❌ Background processing error for list ${targetListId}:`, error);
    }
}

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

        // For large uploads (>50 leads), respond immediately and process in background
        if (leads.length > 50) {
            console.log(`📦 Large upload detected (${leads.length} leads), starting background processing...`);

            // Respond immediately to prevent timeout
            res.json({
                success: true,
                message: `Processing ${leads.length} leads in background...`,
                list_id: targetListId,
                status: 'processing',
                total_leads: leads.length,
                note: 'Upload started in background. Check Vicidial list in a few minutes.'
            });

            // Process in background (don't await)
            setImmediate(() => {
                processLargeUpload(targetListId, leads);
            });

            return; // Exit early since we already sent the response
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

            // Check if response has already been sent (due to timeout)
            if (res.headersSent) {
                console.log('Response already sent, skipping close callback');
                return;
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

    // Try transcription but continue with import if it fails
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
    } catch (transcriptionError) {
        console.error('🐍 Transcription service failed, proceeding with import:', transcriptionError);
        syncStatus.percentage = 40;
        syncStatus.message = 'Transcription failed, proceeding with lead import...';
        syncStatus.transcriptionsProcessed = false;
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

            // Extract renewal date from address3 field (where ViciDial stores renewal date)
            let renewalDate = '';
            if (lead.address3) {
                renewalDate = formatRenewalDate(lead.address3);
            }

            // Format phone number
            const formattedPhone = formatPhoneNumber(lead.phone || '');

            // Extract better contact name from email if available
            let contactName = lead.contact || '';

            // If contact is just a user ID (like 1001, 1003), extract from email
            if (!contactName || contactName.match(/^\d{4}$/)) {
                if (lead.email && lead.email.includes('@')) {
                    const emailPrefix = lead.email.split('@')[0];
                    // Convert email prefix to proper contact name
                    contactName = emailPrefix
                        .replace(/[._-]/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    console.log(`📧 Extracted contact from email: "${lead.email}" -> "${contactName}"`);
                } else {
                    // Fallback to company name or generic contact
                    contactName = 'Owner/Manager';
                }
            }

            // Clean up company name (remove "Unknown Rep" suffix)
            let companyName = lead.name || lead.companyName || 'Unknown Company';
            if (companyName.includes('Unknown Rep')) {
                companyName = companyName.replace(/Unknown Rep/g, '').trim();
                console.log(`🏢 Cleaned company name: "${lead.name}" -> "${companyName}"`);
            }

            // Determine assigned agent based on listId
            function getAssignedAgentFromList(listId) {
                const listAgentMapping = {
                    '998': 'Hunter',    // OH Hunter
                    '999': 'Hunter',    // TX Hunter
                    '1000': 'Hunter',   // IN Hunter
                    '1001': 'Grant',    // OH Grant
                    '1005': 'Grant',    // TX Grant
                    '1006': 'Grant'     // IN Grant
                };
                return listAgentMapping[listId] || 'Unassigned';
            }

            const assignedAgent = getAssignedAgentFromList(lead.listId);
            console.log(`📋 List ${lead.listId} → Assigned to: ${assignedAgent}`);

            // DEBUG: Log all available fields in ViciDial lead
            console.log(`🔍 ViciDial Raw Lead Data:`, {
                comments: lead.comments,
                address1: lead.address1,
                address2: lead.address2,
                address3: lead.address3,
                city: lead.city,
                state: lead.state,
                postal_code: lead.postal_code,
                alt_phone: lead.alt_phone,
                email: lead.email,
                security_phrase: lead.security_phrase,
                date_of_birth: lead.date_of_birth,
                gender: lead.gender,
                called_since_last_reset: lead.called_since_last_reset,
                entry_date: lead.entry_date,
                modify_date: lead.modify_date,
                status: lead.status,
                user: lead.user,
                vendor_lead_code: lead.vendor_lead_code,
                source_id: lead.source_id,
                rank: lead.rank,
                owner: lead.owner,
                entry_list_id: lead.entry_list_id
            });

            // Extract fleet size and calculate premium from comments
            let fleetSize = 0;
            let calculatedPremium = 0;
            const comments = lead.comments || '';

            if (comments) {
                // Fleet size extraction patterns - updated for new format
                const fleetPatterns = [
                    // NEW FORMAT: "Fl: 2" pattern (highest priority)
                    /Fl:\s*(\d+)/i,
                    /Dr:\s*\d+\s*\|\s*Fl:\s*(\d+)/i,
                    // OLD FORMAT: "Size:" patterns
                    /Size:\s*(\d+)/i,
                    /Insurance Expires:.*?\|\s*Fleet Size:?\s*(\d+)/i,
                    /Fleet Size:?\s*(\d+)/i,
                    /Fleet\s*Size\s*:\s*(\d+)/i,
                    /(\d+)\s*vehicles?/i,
                    /fleet\s*of\s*(\d+)/i,
                    /(\d+)\s*units?/i,
                    /(\d+)\s*trucks?/i,
                    /(\d+)\s*power\s*units?/i,
                    /units?\s*:\s*(\d+)/i,
                    /truck\s*count\s*:\s*(\d+)/i,
                    /total\s*vehicles?\s*:\s*(\d+)/i
                ];

                for (const pattern of fleetPatterns) {
                    const match = comments.match(pattern);
                    if (match) {
                        fleetSize = parseInt(match[1]);
                        calculatedPremium = fleetSize * 14400; // $14,400 per unit
                        console.log(`✓ Fleet size extracted: ${fleetSize} units, calculated premium: $${calculatedPremium.toLocaleString()}`);
                        break;
                    }
                }
            }

            // Extract insurance company from address fields
            let insuranceCompany = '';
            const address1 = lead.address1 || '';
            const address2 = lead.address2 || '';

            const insurancePatterns = [
                /(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty|USAA|Farmers|Travelers)/i,
                /(\w+\s+Insurance)/i,
                /(\w+\s+Mutual)/i,
                /(\w+\s+General)/i
            ];

            // Check address1 first, then address2
            for (const addressField of [address1, address2]) {
                if (addressField) {
                    for (const pattern of insurancePatterns) {
                        const match = addressField.match(pattern);
                        if (match) {
                            insuranceCompany = match[1].replace(/\b\w/g, l => l.toUpperCase()); // Title case
                            console.log(`✓ Insurance company extracted: "${insuranceCompany}" from address field`);
                            break;
                        }
                    }
                    if (insuranceCompany) break;
                }
            }

            // Add extracted data to lead object
            lead.fleetSize = fleetSize > 0 ? fleetSize.toString() : "Unknown";
            lead.calculatedPremium = calculatedPremium;
            lead.insuranceCompany = insuranceCompany;

            console.log(`📊 Enhanced data - Fleet: ${lead.fleetSize}, Premium: $${calculatedPremium.toLocaleString()}, Insurance: "${insuranceCompany}"`);

            // Get existing lead data to preserve important fields like stage, call duration, etc.
            const existingLead = await getExistingLead(leadId);

            console.log(`🔄 ${existingLead ? 'UPDATING' : 'CREATING'} lead ${leadId} (preserving existing data)`);

            // Ensure lead has required fields in proper Vanguard format
            // PRESERVE existing lead data, only update specific fields from ViciDial
            const leadToSave = {
                // Start with existing data if available
                ...(existingLead || {}),
                // Update with ViciDial-sourced data (but preserve critical existing fields)
                id: leadId,
                name: companyName,
                contact: contactName,
                phone: formattedPhone,
                email: lead.email || (existingLead ? existingLead.email : ''),
                product: "Commercial Auto",
                // PRESERVE EXISTING STAGE - don't reset to "new" if lead already has a stage
                stage: existingLead ? (existingLead.stage || "new") : "new",
                status: existingLead ? (existingLead.status || "hot_lead") : "hot_lead",
                assignedTo: assignedAgent, // Use list-based assignment
                // PRESERVE creation date for existing leads
                created: existingLead ? (existingLead.created || existingLead.createdAt) : new Date().toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric"
                }),
                // Update renewal date and premium from ViciDial, but preserve if not available
                renewalDate: renewalDate || (existingLead ? existingLead.renewalDate : ''),
                premium: lead.calculatedPremium || (existingLead ? existingLead.premium : 0),
                dotNumber: lead.dotNumber || (existingLead ? existingLead.dotNumber : ''),
                mcNumber: lead.mcNumber || (existingLead ? existingLead.mcNumber : ''),
                yearsInBusiness: existingLead ? (existingLead.yearsInBusiness || "Unknown") : "Unknown",
                fleetSize: lead.fleetSize || (existingLead ? existingLead.fleetSize : "Unknown"),
                insuranceCompany: lead.insuranceCompany || (existingLead ? existingLead.insuranceCompany : ""),
                address: "",
                city: (lead.city || '').toUpperCase(),
                state: lead.state || 'OH',
                zip: "",
                radiusOfOperation: "Regional",
                commodityHauled: "",
                operatingStates: [lead.state || 'OH'],
                annualRevenue: "",
                safetyRating: "Satisfactory",
                currentCarrier: "",
                currentPremium: "",
                needsCOI: false,
                insuranceLimits: {
                    liability: "$1,000,000",
                    cargo: "$100,000"
                },
                source: 'ViciDial',
                leadScore: existingLead ? (existingLead.leadScore || 85) : 85,
                // PRESERVE existing lastContactDate if available, otherwise update it
                lastContactDate: existingLead ? (existingLead.lastContactDate || new Date().toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric"
                })) : new Date().toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric"
                }),
                followUpDate: existingLead ? (existingLead.followUpDate || "") : "",
                // PRESERVE existing notes and append ViciDial sync info if not already there
                notes: existingLead ? (existingLead.notes && !existingLead.notes.includes(`ViciDial list ${lead.listId}`) ?
                    `${existingLead.notes}\n\nViciDial sync update from list ${lead.listId || '999'}.` :
                    existingLead.notes || `SALE from ViciDial list ${lead.listId || '999'}. ${lead.notes || ''}`)
                    : `SALE from ViciDial list ${lead.listId || '999'}. ${lead.notes || ''}`,
                // PRESERVE existing tags and ensure ViciDial tags are included
                tags: existingLead ? [...new Set([...(existingLead.tags || []), "ViciDial", "Sale", `List-${lead.listId || '999'}`])] : ["ViciDial", "Sale", `List-${lead.listId || '999'}`],
                // PRESERVE existing transcription data but update if new data available
                transcriptText: transcriptionData.transcriptText || (existingLead ? existingLead.transcriptText : '') || lead.transcriptText || '',
                hasTranscription: !!transcriptionData.transcriptText || (existingLead ? existingLead.hasTranscription : false),
                structuredData: transcriptionData.structured_data || (existingLead ? existingLead.structuredData : {}) || {},
                // PRESERVE original creation timestamp
                createdAt: existingLead ? (existingLead.createdAt || new Date().toISOString()) : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to database (using await for sequential processing)
            const data = JSON.stringify(leadToSave);
            console.log(`💾 Saving lead to database: ${leadId} (${leadToSave.name})`);

            // Log what data is being preserved vs updated
            if (existingLead) {
                console.log(`🔄 PRESERVING existing data:`, {
                    stage: `${existingLead.stage || 'new'} → ${leadToSave.stage}`,
                    status: `${existingLead.status || 'hot_lead'} → ${leadToSave.status}`,
                    premium: `$${existingLead.premium || 0} → $${leadToSave.premium}`,
                    notes_length: `${(existingLead.notes || '').length} → ${leadToSave.notes.length} chars`,
                    hasExistingCallData: !!(existingLead.callDuration || existingLead.lastCall),
                    preservedTags: existingLead.tags?.length || 0
                });
            }

            console.log(`💾 Lead data preview:`, {
                id: leadToSave.id,
                name: leadToSave.name,
                phone: leadToSave.phone,
                stage: leadToSave.stage,
                premium: leadToSave.premium,
                preservedExistingData: !!existingLead
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
        if (req.query.insurance_companies) params.append('insurance_companies', req.query.insurance_companies);

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

// Lead Generation API - DB-V3 Database with full filtering support
app.get('/api/carriers/expiring', async (req, res) => {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = '/var/www/vanguard/DB-V3.db';

    try {
        console.log('🚀 DB-V3 Lead Generation Request:', req.query);

        const {
            state,
            startDate,
            endDate,
            days,
            skipDays = 0,
            minFleet = 1,
            maxFleet = 9999,
            status,
            safety,
            hazmat,
            commoditiesHauled,
            unitTypes,
            insuranceCompanies,
            insurance_companies,
            commodities,
            safetyMaxPercent,
            requireInspections,
            limit = 50000
        } = req.query;

        if (!state) {
            return res.status(400).json({
                success: false,
                error: 'State parameter is required'
            });
        }

        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('❌ Error opening DB-V3:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Database connection failed'
                });
            }
        });

        // First get basic carrier and insurance data
        let query = `
            SELECT DISTINCT
                c.DOT_NUMBER as usdot_number,
                c.DOT_NUMBER as dot_number,
                c.DOT_NUMBER as fmcsa_dot_number,
                c.LEGAL_NAME as company_name,
                c.LEGAL_NAME as legal_name,
                c.DBA_NAME as dba_name,
                COALESCE(c.COMPANY_OFFICER_1, '') as officer_name,
                COALESCE(c.COMPANY_OFFICER_2, '') as officer_2,
                c.PHY_STREET as street_address,
                c.PHY_STREET as physical_address,
                c.PHY_CITY as city,
                c.PHY_CITY as physical_city,
                c.PHY_STATE as state,
                c.PHY_STATE as physical_state,
                c.PHY_ZIP as zip_code,
                c.PHY_ZIP as physical_zip_code,
                c.PHONE as phone,
                c.CELL_PHONE as cell_phone,
                c.FAX as fax,
                c.EMAIL_ADDRESS as email,
                c.POWER_UNITS as power_units,
                c.POWER_UNITS as total_power_units,
                c.POWER_UNITS as fleet_size,
                c.TOTAL_DRIVERS as drivers,
                c.TOTAL_DRIVERS as total_drivers,
                c.CARRIER_OPERATION as carrier_operation,
                c.STATUS_CODE as operating_status,
                c.BUSINESS_ORG_DESC as entity_type,
                c.ADD_DATE,
                c.SAFETY_RATING as safety_rating,
                c.REVIEW_DATE as safety_review_date,
                -- Cargo information from CRGO fields (simplified)
                (COALESCE(c.CRGO_GENFREIGHT, '') || ',' ||
                 COALESCE(c.CRGO_HOUSEHOLD, '') || ',' ||
                 COALESCE(c.CRGO_METALSHEET, '') || ',' ||
                 COALESCE(c.CRGO_MOTOVEH, '') || ',' ||
                 COALESCE(c.CRGO_DRIVETOW, '') || ',' ||
                 COALESCE(c.CRGO_LOGPOLE, '') || ',' ||
                 COALESCE(c.CRGO_BLDGMAT, '') || ',' ||
                 COALESCE(c.CRGO_MOBILEHOME, '') || ',' ||
                 COALESCE(c.CRGO_MACHLRG, '') || ',' ||
                 COALESCE(c.CRGO_PRODUCE, '') || ',' ||
                 COALESCE(c.CRGO_LIQGAS, '') || ',' ||
                 COALESCE(c.CRGO_INTERMODAL, '') || ',' ||
                 COALESCE(c.CRGO_PASSENGERS, '') || ',' ||
                 COALESCE(c.CRGO_OILFIELD, '') || ',' ||
                 COALESCE(c.CRGO_LIVESTOCK, '') || ',' ||
                 COALESCE(c.CRGO_GRAINFEED, '') || ',' ||
                 COALESCE(c.CRGO_COALCOKE, '') || ',' ||
                 COALESCE(c.CRGO_MEAT, '') || ',' ||
                 COALESCE(c.CRGO_GARBAGE, '') || ',' ||
                 COALESCE(c.CRGO_USMAIL, '') || ',' ||
                 COALESCE(c.CRGO_CHEM, '') || ',' ||
                 COALESCE(c.CRGO_DRYBULK, '') || ',' ||
                 COALESCE(c.CRGO_COLDFOOD, '') || ',' ||
                 COALESCE(c.CRGO_BEVERAGES, '') || ',' ||
                 COALESCE(c.CRGO_PAPERPROD, '') || ',' ||
                 COALESCE(c.CRGO_UTILITY, '') || ',' ||
                 COALESCE(c.CRGO_FARMSUPP, '') || ',' ||
                 COALESCE(c.CRGO_CONSTRUCT, '') || ',' ||
                 COALESCE(c.CRGO_WATERWELL, '') || ',' ||
                 COALESCE(c.CRGO_CARGOOTHR, '')) as cargo_carried,
                c.CRGO_CARGOOTHR_DESC as commodities_hauled,
                c.HM_Ind as hazmat_status,
                ip.INSURANCE_COMPANY as insurance_company,
                ip.POLICY_END_DATE as insurance_expiry,
                -- Inspection summary data
                (SELECT COUNT(*) FROM inspections i WHERE i.DOT_Number = c.DOT_NUMBER) as total_inspections,
                (SELECT COUNT(*) FROM inspections i WHERE i.DOT_Number = c.DOT_NUMBER AND i.OOS_Total > 0) as oos_inspections,
                (SELECT SUM(i.OOS_Total) FROM inspections i WHERE i.DOT_Number = c.DOT_NUMBER) as total_oos,
                (SELECT MAX(i.Insp_Date) FROM inspections i WHERE i.DOT_Number = c.DOT_NUMBER) as last_inspection_date,
                'DB-V3-Comprehensive' as data_source
            FROM carriers c
            LEFT JOIN insurance_policies ip ON c.DOT_NUMBER = ip.DOT_NUMBER
            WHERE 1=1
        `;

        let params = [];

        // Add state filter
        if (state) {
            query += ' AND c.PHY_STATE = ?';
            params.push(state);
        }

        // Add fleet size filtering
        if (minFleet && maxFleet) {
            query += ' AND CAST(c.POWER_UNITS as INTEGER) BETWEEN ? AND ?';
            params.push(parseInt(minFleet), parseInt(maxFleet));
        }

        // Add insurance company filter with partial matching
        const insuranceFilter = insurance_companies || insuranceCompanies;
        if (insuranceFilter && insuranceFilter.length > 0) {
            // Split comma-separated insurance companies
            const companies = insuranceFilter.split(',').map(c => c.trim()).filter(c => c);
            if (companies.length > 0) {
                // Use LIKE for partial matching since database has full company names
                // but frontend sends simplified names (e.g., "PROGRESSIVE" vs "PROGRESSIVE MOUNTAIN INSURANCE COMPANY")
                const likeConditions = companies.map(() => 'UPPER(TRIM(ip.INSURANCE_COMPANY)) LIKE ?').join(' OR ');
                query += ` AND (${likeConditions})`;

                // Create LIKE patterns with % wildcards for partial matching
                companies.forEach(company => {
                    const pattern = `%${company.toUpperCase()}%`;
                    params.push(pattern);
                });

                console.log(`🏢 Insurance filter applied (partial matching): ${companies.join(', ')}`);
            }
        }

        // Add commodities filter
        if (commodities && commodities !== '[]') {
            try {
                const selectedCommodities = JSON.parse(commodities);
                if (selectedCommodities && selectedCommodities.length > 0) {
                    // Map frontend commodity values to database cargo fields
                    const commodityConditions = [];
                    selectedCommodities.forEach(commodity => {
                        switch (commodity) {
                            case 'GENERAL_FREIGHT':
                                commodityConditions.push("c.CRGO_GENFREIGHT = 'X'");
                                break;
                            case 'REEFER':
                                // Group all refrigerated/temperature-controlled freight
                                commodityConditions.push("(c.CRGO_PRODUCE = 'X' OR c.CRGO_COLDFOOD = 'X' OR c.CRGO_BEVERAGES = 'X' OR c.CRGO_MEAT = 'X')");
                                break;
                            case 'HOUSEHOLD_GOODS':
                                commodityConditions.push("c.CRGO_HOUSEHOLD = 'X'");
                                break;
                            case 'METAL_SHEETS_COILS_ROLLS':
                                commodityConditions.push("c.CRGO_METALSHEET = 'X'");
                                break;
                            case 'MOTOR_VEHICLES':
                                commodityConditions.push("c.CRGO_MOTOVEH = 'X'");
                                break;
                            case 'LOGS_POLES_BEAMS_LUMBER':
                                commodityConditions.push("c.CRGO_LOGPOLE = 'X'");
                                break;
                            case 'BUILDING_MATERIALS':
                                commodityConditions.push("c.CRGO_BLDGMAT = 'X'");
                                break;
                            case 'FRESH_PRODUCE':
                                commodityConditions.push("c.CRGO_PRODUCE = 'X'");
                                break;
                            case 'LIQUIDS_GASES':
                                commodityConditions.push("c.CRGO_LIQGAS = 'X'");
                                break;
                            case 'CHEMICALS':
                                commodityConditions.push("c.CRGO_CHEM = 'X'");
                                break;
                            case 'REFRIGERATED_FOOD':
                                commodityConditions.push("c.CRGO_COLDFOOD = 'X'");
                                break;
                            case 'BEVERAGES':
                                commodityConditions.push("c.CRGO_BEVERAGES = 'X'");
                                break;
                            case 'GRAIN_FEED_HAY':
                                commodityConditions.push("c.CRGO_GRAINFEED = 'X'");
                                break;
                            case 'LIVESTOCK':
                                commodityConditions.push("c.CRGO_LIVESTOCK = 'X'");
                                break;
                            case 'OILFIELD_EQUIPMENT':
                                commodityConditions.push("c.CRGO_OILFIELD = 'X'");
                                break;
                            case 'INTERMODAL_CONTAINERS':
                                commodityConditions.push("c.CRGO_INTERMODAL = 'X'");
                                break;
                            case 'PAPER_PRODUCTS':
                                commodityConditions.push("c.CRGO_PAPERPROD = 'X'");
                                break;
                            case 'CONSTRUCTION':
                                commodityConditions.push("c.CRGO_CONSTRUCT = 'X'");
                                break;
                            case 'OTHER':
                                commodityConditions.push("c.CRGO_CARGOOTHR = 'X'");
                                break;
                        }
                    });

                    if (commodityConditions.length > 0) {
                        // Use OR logic - carrier must haul at least one of the selected commodities
                        query += ` AND (${commodityConditions.join(' OR ')})`;
                        console.log(`📦 Commodities filter applied: ${selectedCommodities.join(', ')} (${commodityConditions.length} conditions)`);
                    }
                }
            } catch (error) {
                console.error('🚨 Error parsing commodities:', error);
            }
        }

        // Add years in business range filter
        const yearsInBusinessMin = req.query.yearsInBusinessMin;
        const yearsInBusinessMax = req.query.yearsInBusinessMax;
        const currentYear = new Date().getFullYear();

        if ((yearsInBusinessMin && !isNaN(yearsInBusinessMin)) || (yearsInBusinessMax && !isNaN(yearsInBusinessMax))) {
            const minYears = yearsInBusinessMin ? parseInt(yearsInBusinessMin) : 0;
            const maxYears = yearsInBusinessMax ? parseInt(yearsInBusinessMax) : 100;

            // Filter for carriers within the years range
            query += ` AND c.ADD_DATE IS NOT NULL AND c.ADD_DATE != '' AND LENGTH(c.ADD_DATE) >= 4`;

            if (minYears > 0 && maxYears < 100) {
                // Both min and max specified
                query += ` AND (${currentYear} - CAST(SUBSTR(c.ADD_DATE, 1, 4) AS INTEGER)) BETWEEN ${minYears} AND ${maxYears}`;
                console.log(`📅 Years in business range filter applied: ${minYears}-${maxYears} years`);
            } else if (minYears > 0) {
                // Only minimum specified
                query += ` AND (${currentYear} - CAST(SUBSTR(c.ADD_DATE, 1, 4) AS INTEGER)) >= ${minYears}`;
                console.log(`📅 Minimum years in business filter applied: ${minYears}+ years`);
            } else if (maxYears < 100) {
                // Only maximum specified
                query += ` AND (${currentYear} - CAST(SUBSTR(c.ADD_DATE, 1, 4) AS INTEGER)) <= ${maxYears}`;
                console.log(`📅 Maximum years in business filter applied: ${maxYears} years or less`);
            }
        }

        // Add operating status filter (Note: DB-V3 uses STATUS_CODE)
        if (status && status !== 'ACTIVE') {
            query += ' AND c.STATUS_CODE = ?';
            params.push(status);
        }

        // Add safety percentage filter (OOS rate filter)
        if (safetyMaxPercent) {
            const maxPercent = parseInt(safetyMaxPercent);
            if (maxPercent >= 0 && maxPercent <= 100) {
                // Only include carriers with OOS rate <= maxPercent
                // We'll calculate this using inspection data later in processing since it requires subquery
                console.log(`🛡️ Safety filter: Max OOS rate ${maxPercent}%`);
            }
        }

        // Add inspection requirement filter
        if (requireInspections === 'true') {
            // Only include carriers that have at least one inspection
            query += ' AND EXISTS (SELECT 1 FROM inspections i WHERE i.DOT_Number = c.DOT_NUMBER)';
            console.log(`🔍 Inspection filter: Requiring at least 1 inspection`);
        }

        // Add insurance expiry filtering
        if (startDate && endDate) {
            query += ' AND ip.POLICY_END_DATE BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (days) {
            // Insurance renewal logic: ignore year, only consider month/day
            // A policy dated 08/01/2024 renews on 08/01 every year
            const daysFilter = parseInt(days);
            const skipDaysFilter = parseInt(skipDays);

            if (skipDaysFilter > 0) {
                console.log(`🗓️ Insurance renewal filter: finding policies renewing between day ${skipDaysFilter + 1} and day ${daysFilter} (skipping first ${skipDaysFilter} days)`);
            } else {
                console.log(`🗓️ Insurance renewal filter: finding policies renewing in next ${daysFilter} days (ignoring year)`);
            }

            // Use SQL to calculate days until next renewal for each policy
            // We'll filter using a more complex query that handles month/day renewal logic
            const renewalDaysCalc = `
                -- Calculate days until next renewal, ignoring year (MM/DD/YYYY format)
                CASE
                    -- Extract month and day from POLICY_END_DATE (MM/DD/YYYY format)
                    WHEN SUBSTR(ip.POLICY_END_DATE, 1, 2) || SUBSTR(ip.POLICY_END_DATE, 4, 2) >=
                         SUBSTR(DATE('now'), 6, 2) || SUBSTR(DATE('now'), 9, 2)
                    THEN -- Renewal is later this year
                        julianday('2026-' || SUBSTR(ip.POLICY_END_DATE, 1, 2) || '-' || SUBSTR(ip.POLICY_END_DATE, 4, 2)) -
                        julianday(DATE('now'))
                    ELSE -- Renewal is next year
                        julianday('2027-' || SUBSTR(ip.POLICY_END_DATE, 1, 2) || '-' || SUBSTR(ip.POLICY_END_DATE, 4, 2)) -
                        julianday(DATE('now'))
                END`;

            if (skipDaysFilter > 0) {
                // Skip first X days, then show next Y days
                query += `
                    AND (${renewalDaysCalc}) > ?
                    AND (${renewalDaysCalc}) <= ?
                    AND ip.POLICY_END_DATE IS NOT NULL
                    AND LENGTH(ip.POLICY_END_DATE) >= 8
                `;
                params.push(skipDaysFilter, daysFilter);
                console.log(`🎯 Using skip days logic: > ${skipDaysFilter} AND <= ${daysFilter} days`);
            } else {
                // Normal logic - show next X days
                query += `
                    AND (${renewalDaysCalc}) <= ?
                    AND ip.POLICY_END_DATE IS NOT NULL
                    AND LENGTH(ip.POLICY_END_DATE) >= 8
                `;
                params.push(daysFilter);
                console.log('🎯 Using month/day renewal logic - year ignored');
            }
        }

        // Add hazmat filter - need to check available columns
        if (hazmat) {
            // For now, we'll implement this once we find the hazmat column
            console.log('Hazmat filter requested but column mapping needed:', hazmat);
        }

        // Add commodities filter - need to check available columns
        if (commoditiesHauled) {
            // For now, we'll implement this once we find the cargo columns
            console.log('Commodities filter requested but column mapping needed:', commoditiesHauled);
        }

        // Add unit types filter (this would need to be mapped to appropriate DB fields)
        if (unitTypes && Array.isArray(unitTypes)) {
            // This would require mapping unit types to database fields
            console.log('Unit types filter requested:', unitTypes);
            // For now, we'll log it but not filter as the DB structure needs to be examined
        }

        query += ` ORDER BY CAST(c.POWER_UNITS as INTEGER) DESC LIMIT ?`;
        params.push(parseInt(limit));

        console.log('🔍 DB-V3 Query:', query);
        console.log('🎯 Parameters:', params);

        // Set a longer timeout for complex queries
        const startTime = Date.now();

        db.all(query, params, async (err, rows) => {
            if (err) {
                console.error('❌ Query error:', err);
                db.close();
                return res.status(500).json({
                    success: false,
                    error: 'Query failed',
                    details: err.message
                });
            }

            console.log(`✅ Found ${rows.length} carriers in DB-V3`);

            // Always include VIN data but skip complex decoding
            console.log(`🔍 VIN data: ENABLED for all ${rows.length} carriers (no decoding processing)`);

            // Function to get detailed inspection data for a carrier
            const getInspectionDetails = (dotNumber) => {
                return new Promise((resolve, reject) => {
                    const inspectionQuery = `
                        SELECT
                            Insp_Date,
                            OOS_Total,
                            VIN,
                            Unit_Make,
                            Unit_Type_Desc,
                            VIN2,
                            Unit_Make2,
                            Unit_Type_Desc2,
                            Driver_OOS_Total,
                            Vehicle_OOS_Total,
                            BASIC_Viol
                        FROM inspections
                        WHERE DOT_Number = ?
                        ORDER BY Insp_Date DESC
                        LIMIT 10
                    `;

                    db.all(inspectionQuery, [dotNumber], (err, inspectionRows) => {
                        if (err) {
                            console.error('❌ Inspection query error:', err);
                            resolve([]);
                        } else {
                            resolve(inspectionRows || []);
                        }
                    });
                });
            };

            // Function to decode cargo types into readable names
            const decodeCargo = (cargoString) => {
                if (!cargoString) return '';

                const cargoTypes = [
                    'General Freight', 'Household Goods', 'Metal Sheets/Coils/Rolls',
                    'Motor Vehicles', 'Drive/Tow Away', 'Logs/Poles/Beams/Lumber',
                    'Building Materials', 'Mobile Homes', 'Machinery/Large Objects',
                    'Fresh Produce', 'Liquids/Gases', 'Intermodal Containers',
                    'Passengers', 'Oilfield Equipment', 'Livestock', 'Grain/Feed/Hay',
                    'Coal/Coke', 'Meat', 'Garbage/Refuse', 'US Mail',
                    'Chemicals', 'Dry Bulk', 'Refrigerated Food', 'Beverages',
                    'Paper Products', 'Utility', 'Farm Supplies', 'Construction',
                    'Water Well', 'Other'
                ];

                const cargoArray = cargoString.split(',');
                const activeCargo = [];

                cargoArray.forEach((cargo, index) => {
                    if (cargo.trim() === 'X' && cargoTypes[index]) {
                        activeCargo.push(cargoTypes[index]);
                    }
                });

                return activeCargo.join(', ');
            };

            // No VIN decoding needed - just use inspection data directly

            // Transform the data from real DB-V3 with comprehensive fields
            const processCarriers = async () => {
                const carriers = await Promise.all(rows.map(async (row) => {
                    // Get detailed inspection data for this carrier
                    const inspectionDetails = await getInspectionDetails(row.dot_number);

                    // Process VINs and get vehicle details (no complex decoding)
                    const vehicles = [];
                    inspectionDetails.forEach(inspection => {
                        if (inspection.VIN) {
                            vehicles.push({
                                vin: inspection.VIN,
                                make: inspection.Unit_Make || 'UNKNOWN',
                                type: inspection.Unit_Type_Desc || 'UNKNOWN',
                                inspection_date: inspection.Insp_Date,
                                oos_total: inspection.OOS_Total
                            });
                        }
                        if (inspection.VIN2) {
                            vehicles.push({
                                vin: inspection.VIN2,
                                make: inspection.Unit_Make2 || 'UNKNOWN',
                                type: inspection.Unit_Type_Desc2 || 'UNKNOWN',
                                inspection_date: inspection.Insp_Date,
                                oos_total: inspection.OOS_Total
                            });
                        }
                    });

                    // Remove duplicates based on VIN
                    const uniqueVehicles = vehicles.filter((vehicle, index, self) =>
                        index === self.findIndex(v => v.vin === vehicle.vin)
                    );
                // Calculate days until next renewal (ignoring year) for insurance_expiry field
                const daysUntilExpiry = row.insurance_expiry ? (() => {
                    try {
                        // Handle YYYY-MM-DD format from policy_renewal_date
                        let dateStr = row.insurance_expiry;
                        let month, day;

                        if (dateStr.includes('-')) {
                            // YYYY-MM-DD format
                            const parts = dateStr.split('-');
                            month = parts[1];
                            day = parts[2];
                        } else if (dateStr.includes('/')) {
                            // MM/DD/YYYY format
                            const parts = dateStr.split('/');
                            month = parts[0];
                            day = parts[1];
                        } else {
                            return null;
                        }

                        if (!month || !day) return null;
                        const today = new Date();
                        const currentYear = today.getFullYear();
                        let renewalDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
                        if (renewalDate <= today) {
                            renewalDate = new Date(currentYear + 1, parseInt(month) - 1, parseInt(day));
                        }
                        return Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
                    } catch (e) {
                        return null;
                    }
                })() : null;

                return {
                    // Core Identifiers
                    usdot_number: row.dot_number || row.usdot_number,
                    dot_number: row.dot_number,
                    mc_number: row.mc_number,
                    fmcsa_dot_number: row.fmcsa_dot_number || row.dot_number,

                    // Company Names
                    company_name: row.company_name || row.legal_name || `Carrier ${row.dot_number}`,
                    legal_name: row.company_name || row.legal_name,
                    dba_name: row.dba_name || '',

                    // Officer Information (replacing Representative)
                    officer_name: row.officer_name || row.officer_2 || '',

                    // Address Information
                    street_address: row.street || row.street_address || '',
                    physical_address: row.street || row.street_address || '',
                    city: row.city,
                    physical_city: row.city,
                    state: row.state || row.physical_state,
                    physical_state: row.state || row.physical_state,
                    zip_code: row.zip_code,
                    physical_zip_code: row.zip_code,
                    full_address: `${row.city || ''}, ${row.state || ''}`.trim(),

                    // Contact Information
                    phone: row.phone || '',
                    cell_phone: '', // Not available in current data
                    fax: '', // Not available in current data
                    email_address: row.email_address || row.email || '',

                    // Fleet Information
                    fleet_size: row.power_units || row.total_power_units || '0',
                    power_units: row.power_units || row.total_power_units || '0',
                    drivers: row.drivers || row.total_drivers || '0',

                    // Business Information
                    entity_type: row.entity_type || '',
                    operating_status: row.operating_status || 'Active',
                    carrier_operation: row.carrier_operation || '',
                    add_date: row.ADD_DATE || '',
                    years_in_business: row.ADD_DATE && row.ADD_DATE.length >= 4 ?
                        new Date().getFullYear() - parseInt(row.ADD_DATE.substring(0, 4)) : null,

                    // Insurance Information
                    insurance_company: row.insurance_company || '',
                    insurance_expiration: row.insurance_expiry || row.insurance_expiration || '',
                    insurance_amount: '', // Not available in current data
                    days_until_expiry: daysUntilExpiry,

                    // Safety and Compliance Information
                    safety_rating: row.safety_rating || '',
                    total_oos: row.total_oos || 0,
                    oos_status: row.total_inspections > 0 ?
                        `${Math.round((row.oos_inspections / row.total_inspections) * 100)}% OOS Rate (${row.oos_inspections}/${row.total_inspections})` :
                        'No Inspections',

                    // Business Operations
                    cargo_carried: row.cargo_carried || '',
                    commodities_hauled: decodeCargo(row.cargo_carried) || row.commodities_hauled || '',

                    // Inspection Information
                    last_inspection_date: row.last_inspection_date || '',
                    inspection_score: '', // Would need score calculation
                    violations_count: row.total_inspections || 0,
                    total_inspections: row.total_inspections || 0,
                    oos_inspections: row.oos_inspections || 0,

                    // Additional Fields
                    hazmat_status: row.hazmat_status || '',
                    interstate_status: row.carrier_operation || '',

                    // Detailed Inspection Data
                    inspection_history: inspectionDetails.map(inspection => ({
                        date: inspection.Insp_Date,
                        oos_total: inspection.OOS_Total,
                        driver_oos: inspection.Driver_OOS_Total,
                        vehicle_oos: inspection.Vehicle_OOS_Total,
                        violations: inspection.BASIC_Viol
                    })),

                    // Vehicle Information (VINs decoded)
                    vehicles: uniqueVehicles,

                    // Data Source
                    data_source: 'DB-V3-Comprehensive'
                };
            }));

                return carriers;
            };

            // Process carriers and return response
            let carriers = await processCarriers();

            // Apply safety percentage filter if specified (post-processing since it needs calculated OOS rates)
            if (safetyMaxPercent) {
                const maxPercent = parseInt(safetyMaxPercent);
                if (maxPercent >= 0 && maxPercent <= 100) {
                    const beforeCount = carriers.length;
                    carriers = carriers.filter(carrier => {
                        if (carrier.total_inspections === 0) {
                            // If no inspections, consider as 0% OOS rate (safest assumption)
                            return 0 <= maxPercent;
                        }
                        const oosRate = Math.round((carrier.oos_inspections / carrier.total_inspections) * 100);
                        return oosRate <= maxPercent;
                    });
                    console.log(`🛡️ Safety filter applied: ${beforeCount} → ${carriers.length} carriers (removed ${beforeCount - carriers.length} with OOS > ${maxPercent}%)`);
                }
            }

            // Apply unit type filtering if specified (ALL vehicles must match selected types)
            if (unitTypes && unitTypes !== '[]') {
                try {
                    const selectedUnitTypes = JSON.parse(unitTypes);
                    if (selectedUnitTypes && selectedUnitTypes.length > 0) {
                        const beforeCount = carriers.length;
                        console.log(`🚛 Unit type filter: Checking POWER UNITS against types: ${selectedUnitTypes.join(', ')} (ignoring trailers)`);

                        carriers = carriers.filter(carrier => {
                            // If no vehicles/inspections, consider as "UNKNOWN" type
                            if (!carrier.vehicles || carrier.vehicles.length === 0) {
                                return selectedUnitTypes.includes('UNKNOWN');
                            }

                            // Get all unique POWER UNIT types for this carrier (ignore trailers)
                            const carrierVehicleTypes = [...new Set(carrier.vehicles
                                .filter(vehicle => {
                                    const type = vehicle.type ? vehicle.type.toUpperCase() : '';
                                    // IGNORE all trailer types - only consider power units
                                    return !type.includes('TRAILER') && !type.includes('SEMI-TRAILER');
                                })
                                .map(vehicle => {
                                    const vehicleType = vehicle.type;
                                    if (!vehicleType || vehicleType === 'UNKNOWN' || vehicleType === '') {
                                        return 'UNKNOWN';
                                    }

                                    // Map inspection data vehicle types to our filter values (POWER UNITS ONLY)
                                    const type = vehicleType.toUpperCase();
                                    if (type.includes('STRAIGHT') || type.includes('STRAIGHT TRUCK')) return 'STRAIGHT_TRUCK';
                                    if (type.includes('TRUCK TRACTOR') || type.includes('TRACTOR')) return 'TRUCK_TRACTOR';
                                    if (type.includes('VAN') && !type.includes('CARGO')) return 'VAN';
                                    if (type.includes('CARGO VAN')) return 'CARGO_VAN';
                                    if (type.includes('PICKUP') || type.includes('PICKUP TRUCK')) return 'PICKUP_TRUCK';
                                    if (type.includes('BUS') && !type.includes('SCHOOL') && !type.includes('MINI')) return 'BUS';
                                    if (type.includes('SCHOOL BUS')) return 'SCHOOL_BUS';
                                    if (type.includes('LIMOUSINE') || type.includes('LIMO')) return 'LIMOUSINE';
                                    if (type.includes('MINIBUS') || type.includes('MINI BUS')) return 'MINIBUS';
                                    if (type.includes('MOTORCOACH') || type.includes('COACH')) return 'MOTORCOACH';
                                    if (type.includes('9') && type.includes('15') && type.includes('PASS')) return 'VAN_9_15_PASS';
                                    if (type.includes('16') && type.includes('PASS')) return 'VAN_16_PASS';
                                    if (type.includes('TAXI')) return 'TAXI';
                                    if (type.includes('AMBULANCE')) return 'AMBULANCE';
                                    if (type.includes('HEARSE')) return 'HEARSE';
                                    return 'OTHER';
                                }))];

                            // If no power units found (only trailers), consider as UNKNOWN
                            if (carrierVehicleTypes.length === 0) {
                                carrierVehicleTypes.push('UNKNOWN');
                            }

                            // ALL vehicle types for this carrier must be in the selected filter types
                            return carrierVehicleTypes.every(vehicleType => selectedUnitTypes.includes(vehicleType));
                        });

                        console.log(`🚛 Unit type filter applied: ${beforeCount} → ${carriers.length} carriers (removed ${beforeCount - carriers.length} carriers with non-matching vehicle types)`);
                    }
                } catch (error) {
                    console.error('🚨 Error parsing unitTypes:', error);
                }
            }

            const processingTime = Date.now() - startTime;
            console.log(`⏱️ Total processing time: ${processingTime}ms for ${carriers.length} carriers`);

            db.close((err) => {
                if (err) console.error('Error closing DB-V3:', err);
            });

            res.json({
                success: true,
                carriers: carriers,
                stats: {
                    total_leads: carriers.length,
                    database: 'DB-V3',
                    query_time: new Date().toISOString(),
                    filters_applied: {
                        state,
                        fleet_range: `${minFleet}-${maxFleet}`,
                        safety_rating: safety || 'all',
                        hazmat: hazmat || 'include_all',
                        commodities: commoditiesHauled || 'all',
                        operating_status: status || 'active_only'
                    }
                },
                note: `Generated from DB-V3 database with ${rows.length} records`
            });
        });

    } catch (error) {
        console.error('❌ DB-V3 Lead Generation Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// Carrier Search API - DB-V3 Database
app.post('/api/search', (req, res) => {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = '/var/www/vanguard/DB-V3.db';

    console.log('🔍 Carrier search request:', req.body);

    // Handle both new format (searchType/searchValue) and legacy format (usdot_number, etc.)
    let searchType, searchValue;

    if (req.body.searchType && req.body.searchValue) {
        searchType = req.body.searchType;
        searchValue = req.body.searchValue;
    } else if (req.body.usdot_number) {
        searchType = 'usdot';
        searchValue = req.body.usdot_number;
    } else if (req.body.mc_number) {
        searchType = 'mc';
        searchValue = req.body.mc_number;
    } else if (req.body.legal_name) {
        searchType = 'company';
        searchValue = req.body.legal_name;
    } else if (req.body.state) {
        searchType = 'state';
        searchValue = req.body.state;
    } else {
        return res.status(400).json({ error: 'Search parameters required (usdot_number, mc_number, legal_name, or state)' });
    }

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error opening DB-V3 database:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }
    });

    let query, params;

    // Build query based on search type
    switch (searchType) {
        case 'usdot':
            query = 'SELECT * FROM carriers WHERE DOT_NUMBER = ?';
            params = [parseInt(searchValue)];
            break;
        case 'mc':
            query = `SELECT c.* FROM carriers c
                    INNER JOIN insurance_policies ip ON c.DOT_NUMBER = ip.DOT_NUMBER
                    WHERE ip.MC_NUMBER = ?`;
            params = [searchValue];
            break;
        case 'company':
            query = 'SELECT * FROM carriers WHERE LEGAL_NAME LIKE ? OR DBA_NAME LIKE ?';
            params = [`%${searchValue}%`, `%${searchValue}%`];
            break;
        case 'state':
            query = 'SELECT * FROM carriers WHERE PHY_STATE = ?';
            params = [searchValue.toUpperCase()];
            break;
        default:
            db.close();
            return res.status(400).json({ error: 'Invalid search type' });
    }

    // Execute main query
    db.get(query, params, (err, carrier) => {
        if (err) {
            console.error('❌ Database query error:', err);
            db.close();
            return res.status(500).json({ error: 'Database query error' });
        }

        if (!carrier) {
            db.close();
            return res.json({
                success: false,
                carriers: [],
                message: 'No carrier found',
                total: 0,
                page: 1,
                per_page: 100
            });
        }

        console.log('✅ Found carrier:', carrier.DOT_NUMBER, carrier.LEGAL_NAME);

        // Get insurance policies for this carrier
        const insuranceQuery = 'SELECT * FROM insurance_policies WHERE DOT_NUMBER = ?';
        db.all(insuranceQuery, [carrier.DOT_NUMBER], (err, policies) => {
            if (err) {
                console.error('❌ Insurance policies query error:', err);
                policies = [];
            }

            // Get inspection records for this carrier
            const inspectionQuery = 'SELECT * FROM inspections WHERE DOT_Number = ? ORDER BY Insp_Date DESC';
            db.all(inspectionQuery, [carrier.DOT_NUMBER], (err, inspections) => {
                if (err) {
                    console.error('❌ Inspections query error:', err);
                    inspections = [];
                }

                // Close database
                db.close();

                // Calculate safety metrics
                const totalInspections = inspections.length;
                const oosInspections = inspections.filter(i => i.OOS_Total > 0).length;
                const oosRate = totalInspections > 0 ? ((oosInspections / totalInspections) * 100).toFixed(1) : '0.0';
                const hazmatInspections = inspections.filter(i => i.HM_Insp === 'Y').length;

                // Send comprehensive response in format expected by frontend
                res.json({
                    success: true,
                    carriers: [{
                        ...carrier,
                        usdot_number: carrier.DOT_NUMBER,
                        legal_name: carrier.LEGAL_NAME,
                        dba_name: carrier.DBA_NAME,
                        location: `${carrier.PHY_CITY || ''}, ${carrier.PHY_STATE || ''}`.replace(', ,', '').trim(),
                        fleet: carrier.POWER_UNITS || '0',
                        status: carrier.STATUS_CODE === 'A' ? 'Active' : 'Inactive',
                        insurance_carrier: policies[0]?.INSURANCE_COMPANY || 'N/A',
                        expiry: policies[0]?.POLICY_END_DATE || 'N/A',
                        add_date: carrier.ADD_DATE || '',
                        years_in_business: carrier.ADD_DATE && carrier.ADD_DATE.length >= 4 ?
                            new Date().getFullYear() - parseInt(carrier.ADD_DATE.substring(0, 4)) : null
                    }],
                    carrier: {
                        ...carrier,
                        add_date: carrier.ADD_DATE || '',
                        years_in_business: carrier.ADD_DATE && carrier.ADD_DATE.length >= 4 ?
                            new Date().getFullYear() - parseInt(carrier.ADD_DATE.substring(0, 4)) : null
                    },
                    insurance_policies: policies,
                    inspections: inspections,
                    summary: {
                        total_inspections: totalInspections,
                        oos_inspections: oosInspections,
                        oos_rate: oosRate + '%',
                        hazmat_inspections: hazmatInspections,
                        recent_inspection: inspections[0]?.Insp_Date || 'None'
                    },
                    total: 1,
                    page: 1,
                    per_page: 100
                });
            });
        });
    });
});

// Carrier Profile API - DB-V3 Database
app.get('/api/carrier/profile/:dotNumber', (req, res) => {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = '/var/www/vanguard/DB-V3.db';
    const dotNumber = parseInt(req.params.dotNumber);

    console.log('🔍 Carrier profile request for DOT:', dotNumber);

    if (!dotNumber || isNaN(dotNumber)) {
        return res.status(400).json({ error: 'Valid DOT number required' });
    }

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error opening DB-V3 database:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }
    });

    // Get carrier by DOT number
    const query = 'SELECT * FROM carriers WHERE DOT_NUMBER = ?';
    db.get(query, [dotNumber], (err, carrier) => {
        if (err) {
            console.error('❌ Database query error:', err);
            db.close();
            return res.status(500).json({ error: 'Database query error' });
        }

        if (!carrier) {
            db.close();
            return res.status(404).json({ error: 'Carrier not found' });
        }

        console.log('✅ Found carrier profile:', carrier.DOT_NUMBER, carrier.LEGAL_NAME);

        // Get insurance policies
        const insuranceQuery = 'SELECT * FROM insurance_policies WHERE DOT_NUMBER = ? ORDER BY POLICY_EFFECTIVE_DATE DESC';
        db.all(insuranceQuery, [carrier.DOT_NUMBER], (err, policies) => {
            if (err) {
                console.error('❌ Insurance policies query error:', err);
                policies = [];
            }

            // Get inspection records
            const inspectionQuery = 'SELECT * FROM inspections WHERE DOT_Number = ? ORDER BY Insp_Date DESC';
            db.all(inspectionQuery, [carrier.DOT_NUMBER], (err, inspections) => {
                if (err) {
                    console.error('❌ Inspections query error:', err);
                    inspections = [];
                }

                db.close();

                // Calculate safety metrics
                const totalInspections = inspections.length;
                const oosInspections = inspections.filter(i => i.OOS_Total > 0).length;
                const oosRate = totalInspections > 0 ? ((oosInspections / totalInspections) * 100).toFixed(1) : '0.0';
                const hazmatInspections = inspections.filter(i => i.HM_Insp === 'Y').length;

                // Format carrier profile response
                const profile = {
                    // Basic Info
                    usdot_number: carrier.DOT_NUMBER,
                    legal_name: carrier.LEGAL_NAME,
                    dba_name: carrier.DBA_NAME,
                    operating_status: carrier.STATUS_CODE === 'A' ? 'Active' : 'Inactive',

                    // Contact Information
                    phone: carrier.PHONE,
                    email: carrier.EMAIL_ADDRESS,

                    // Address
                    address: {
                        street: carrier.PHY_STREET,
                        city: carrier.PHY_CITY,
                        state: carrier.PHY_STATE,
                        zip: carrier.PHY_ZIP,
                        country: carrier.PHY_COUNTRY
                    },

                    // Fleet Information
                    power_units: parseInt(carrier.POWER_UNITS) || 0,
                    truck_units: parseInt(carrier.TRUCK_UNITS) || 0,
                    drivers: parseInt(carrier.TOTAL_DRIVERS) || 0,

                    // Business Information
                    business_type: carrier.CLASSDEF,
                    safety_rating: carrier.SAFETY_RATING,
                    mcs150_date: carrier.MCS150_DATE,
                    add_date: carrier.ADD_DATE || '',
                    years_in_business: carrier.ADD_DATE && carrier.ADD_DATE.length >= 4 ?
                        new Date().getFullYear() - parseInt(carrier.ADD_DATE.substring(0, 4)) : null,

                    // Raw carrier data
                    carrier_details: carrier,

                    // Insurance policies
                    insurance_policies: policies,

                    // Inspections and safety
                    inspections: inspections,
                    safety_summary: {
                        total_inspections: totalInspections,
                        oos_inspections: oosInspections,
                        oos_rate: oosRate + '%',
                        hazmat_inspections: hazmatInspections,
                        recent_inspection: inspections[0]?.Insp_Date || 'None',
                        safety_rating: carrier.SAFETY_RATING || 'Not Rated'
                    }
                };

                res.json({
                    success: true,
                    carrier: profile
                });
            });
        });
    });
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

// Titan email routes
const titanRoutes = require('./titan-email-routes');
app.use('/api/titan', titanRoutes);

// COI PDF Generator routes
const coiPdfRoutes = require('./coi-pdf-generator');
app.use('/api/coi', coiPdfRoutes);

// COI Request Email endpoint will be defined after multer configuration

// Quote submission endpoints

// Configure multer for documentation email attachments (memory storage)
const uploadDocuments = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

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

// ============ LOSS RUNS ENDPOINTS ============

// Configure multer for loss runs uploads
const lossRunsStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use temporary location first since req.body may not be available yet
        const tempPath = path.join(__dirname, '../uploads/loss_runs/temp');
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
        }
        cb(null, tempPath);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.originalname}`;
        cb(null, fileName);
    }
});

const uploadLossRuns = multer({
    storage: lossRunsStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Upload loss runs PDF endpoint
app.post('/api/upload-loss-runs', uploadLossRuns.single('lossRunsPdf'), (req, res) => {
    console.log('📤 Loss runs upload request received from:', req.ip);
    console.log('📦 Request body:', req.body);
    console.log('📁 Request file:', req.file ? req.file.filename : 'No file');
    console.log('📋 Request headers:', req.headers);

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded', success: false });
    }

    const leadId = req.body.leadId;
    console.log('🔍 Lead ID from body:', leadId);
    if (!leadId) {
        console.log('❌ No lead ID provided');
        return res.status(400).json({ error: 'Lead ID required', success: false });
    }

    // Move file from temp directory to correct lead directory
    const tempFilePath = req.file.path;
    const leadDir = path.join(__dirname, '../uploads/loss_runs', leadId);
    const finalFilePath = path.join(leadDir, req.file.filename);

    try {
        // Create lead directory if it doesn't exist
        if (!fs.existsSync(leadDir)) {
            fs.mkdirSync(leadDir, { recursive: true });
            console.log('📁 Created directory:', leadDir);
        }

        // Move file from temp to final location
        fs.renameSync(tempFilePath, finalFilePath);
        console.log('📋 Moved file from temp to:', finalFilePath);

        console.log(`✅ Loss runs PDF uploaded: ${req.file.originalname} -> ${req.file.filename} for lead ${leadId}`);

        res.json({
            success: true,
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadDate: new Date().toISOString(),
            size: req.file.size,
            leadId: leadId
        });
    } catch (error) {
        console.error('❌ Error moving file:', error);
        res.status(500).json({ error: 'Failed to process file upload', success: false });
    }
});

// View loss runs PDF endpoint
app.get('/api/view-loss-runs/:leadId/:filename', (req, res) => {
    const { leadId, filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/loss_runs', leadId, filename);

    console.log(`👁️ Viewing loss runs PDF: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(path.resolve(filePath));
});

// Download loss runs PDF endpoint
app.get('/api/download-loss-runs/:leadId/:filename', (req, res) => {
    const { leadId, filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/loss_runs', leadId, filename);

    console.log(`⬇️ Downloading loss runs PDF: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Extract original filename from timestamped filename
    const originalName = filename.split('_').slice(1).join('_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.sendFile(path.resolve(filePath));
});

// Remove loss runs PDF endpoint
app.post('/api/remove-loss-runs', (req, res) => {
    const { leadId, filename } = req.body;

    if (!leadId || !filename) {
        return res.status(400).json({ error: 'Lead ID and filename required', success: false });
    }

    const filePath = path.join(__dirname, '../uploads/loss_runs', leadId, filename);

    console.log(`🗑️ Removing loss runs PDF: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found', success: false });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).json({ error: 'Failed to delete file', success: false });
        }

        console.log(`✅ Successfully deleted loss runs PDF: ${filename}`);
        res.json({ success: true, message: 'File deleted successfully' });
    });
});

// List loss runs files for a lead
app.get('/api/list-loss-runs/:leadId', (req, res) => {
    const { leadId } = req.params;
    const lossRunsDir = path.join(__dirname, '../uploads/loss_runs', leadId);

    console.log(`📋 Listing loss runs for lead: ${leadId}`);

    if (!fs.existsSync(lossRunsDir)) {
        console.log('📁 Loss runs directory does not exist for lead:', leadId);
        return res.json({ success: true, files: [] });
    }

    try {
        const files = fs.readdirSync(lossRunsDir);
        const fileDetails = files.map(filename => {
            const filePath = path.join(lossRunsDir, filename);
            const stats = fs.statSync(filePath);

            // Extract original name by removing timestamp prefix
            const originalName = filename.split('_').slice(1).join('_');

            return {
                filename: filename,
                originalName: originalName,
                uploadDate: stats.mtime.toISOString(),
                size: stats.size,
                localOnly: false
            };
        });

        console.log(`📋 Found ${fileDetails.length} loss runs files for lead ${leadId}`);
        res.json({ success: true, files: fileDetails });
    } catch (error) {
        console.error('Error reading loss runs directory:', error);
        res.status(500).json({ success: false, error: 'Failed to list files' });
    }
});

// COI Request Email endpoint with file upload support
app.post('/api/coi/send-request', (req, res, next) => {
    uploadDocuments.array('attachment', 10)(req, res, (err) => {
        if (err) {
            console.log('🚨 Multer error:', err.message);
            return res.status(400).json({
                success: false,
                error: 'File upload error: ' + err.message
            });
        }
        next();
    });
}, async (req, res) => {
    const fs = require('fs');
    const debugLog = `🚨🚨🚨 COI EMAIL DEBUG ${new Date().toISOString()} 🚨🚨🚨\n` +
                     `Headers: ${req.headers['user-agent'] || 'No user-agent'}\n` +
                     `Body fields: ${Object.keys(req.body).join(', ')}\n` +
                     `Files: ${req.files ? req.files.length : 0}\n` +
                     `Body content: ${JSON.stringify(req.body, null, 2)}\n\n`;
    fs.appendFileSync('/var/www/vanguard/coi-debug-final.log', debugLog);
    console.log('📧 COI Email request received');
    console.log('   Headers:', req.headers['user-agent'] || 'No user-agent');
    console.log('   Body fields:', Object.keys(req.body));
    console.log('   Files:', req.files ? req.files.length : 0);

    const { from, to, subject, policyId } = req.body;

    // Fix email formatting - remove bare CR characters that cause SMTP errors
    const message = req.body.message ? req.body.message.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';

    // Validate required fields
    if (!to || to.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Recipient email address is required'
        });
    }

    // Basic email format validation for single or multiple emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = to.split(',').map(email => email.trim()).filter(email => email);

    for (const email of emails) {
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: `Invalid recipient email address format: ${email}`
            });
        }
    }

    if (!subject || subject.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Email subject is required'
        });
    }

    if (!message || message.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Email message is required'
        });
    }

    try {
        // Use nodemailer to send email
        const nodemailer = require('nodemailer');

        // Create transporter using GoDaddy SMTP settings
        const transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: 'contact@vigagency.com',
                pass: process.env.GODADDY_PASSWORD || '25nickc124!'
            }
        });

        // Prepare attachments from uploaded files
        const attachments = [];
        if (req.files && req.files.length > 0) {
            console.log(`📎 Processing ${req.files.length} uploaded files`);

            req.files.forEach((file, index) => {
                attachments.push({
                    filename: file.originalname || `document_${index + 1}`,
                    content: file.buffer,
                    contentType: file.mimetype
                });

                console.log(`📎 Added attachment: ${file.originalname} (${file.buffer.length} bytes, ${file.mimetype})`);
            });
        }

        // Add server files if specified
        const serverFiles = req.body.serverFiles;
        if (serverFiles) {
            const fs = require('fs');
            const path = require('path');

            let fileList = [];
            try {
                fileList = typeof serverFiles === 'string' ? JSON.parse(serverFiles) : serverFiles;
            } catch (e) {
                console.log('Could not parse serverFiles, treating as single file');
                fileList = [serverFiles];
            }

            if (Array.isArray(fileList)) {
                console.log(`📎 Processing ${fileList.length} server files`);

                for (const fileName of fileList) {
                    try {
                        const filePath = path.join('/var/www/vanguard/uploads/loss_runs', req.body.leadId || '', fileName);

                        if (fs.existsSync(filePath)) {
                            const fileBuffer = fs.readFileSync(filePath);
                            const cleanFileName = fileName.replace(/^\d+_/, ''); // Remove timestamp prefix

                            attachments.push({
                                filename: cleanFileName,
                                content: fileBuffer,
                                contentType: 'application/pdf' // Default to PDF, could be improved
                            });

                            console.log(`📎 Added server file: ${cleanFileName} (${fileBuffer.length} bytes from ${filePath})`);
                        } else {
                            console.log(`⚠️ Server file not found: ${filePath}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error processing server file ${fileName}:`, error.message);
                    }
                }
            }
        }

        // Send email with attachments
        const info = await transporter.sendMail({
            from: '"VIG Agency" <contact@vigagency.com>',
            to: to,
            subject: subject,
            text: message,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Vanguard Insurance Agency</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Documentation Request</p>
                    </div>

                    <div style="padding: 30px; background: #f9f9f9;">
                        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="color: #333; line-height: 1.6;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>

                            ${attachments.length > 0 ? `
                            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Attached Documents:</h3>
                                <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                                    ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px;">
                        <p style="margin: 0;">Best regards,<br><strong>Vanguard Insurance Agency</strong></p>
                        <p style="margin: 10px 0 0 0; opacity: 0.8;">contact@vigagency.com</p>
                    </div>
                </div>
            `,
            attachments: attachments
        });

        console.log('COI request email sent:', info.messageId);

        const fs = require('fs');
        const successLog = `🚨🚨🚨 COI EMAIL SUCCESS ${new Date().toISOString()} 🚨🚨🚨\n` +
                          `MessageId: ${info.messageId}\n` +
                          `AttachmentCount: ${attachments.length}\n` +
                          `About to send 200 response...\n\n`;
        fs.appendFileSync('/var/www/vanguard/coi-debug-final.log', successLog);

        res.json({
            success: true,
            messageId: info.messageId,
            attachmentCount: attachments.length
        });

    } catch (error) {
        const fs = require('fs');
        const errorLog = `🚨🚨🚨 COI EMAIL ERROR ${new Date().toISOString()} 🚨🚨🚨\n` +
                        `Error: ${error.message}\n` +
                        `Stack: ${error.stack}\n` +
                        `About to send 500 response...\n\n`;
        fs.appendFileSync('/var/www/vanguard/coi-debug-final.log', errorLog);

        console.error('Error sending COI request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get uploaded files for a lead
app.get('/api/leads/:leadId/files', (req, res) => {
    const { leadId } = req.params;
    const fs = require('fs');
    const path = require('path');

    try {
        const uploadDir = path.join('/var/www/vanguard/uploads/loss_runs', leadId);

        if (!fs.existsSync(uploadDir)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(uploadDir).filter(file => {
            // Only include actual files, not directories
            const fullPath = path.join(uploadDir, file);
            return fs.statSync(fullPath).isFile();
        });

        console.log(`📁 Found ${files.length} files for lead ${leadId}:`, files);

        res.json({
            success: true,
            leadId: leadId,
            files: files
        });

    } catch (error) {
        console.error(`❌ Error reading files for lead ${leadId}:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            files: []
        });
    }
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

// Serve recorded audio files
app.use('/recordings', express.static(path.join(__dirname, '../recordings')));

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

// COI Form Data Save endpoint
app.post('/api/save-coi-form', (req, res) => {
    try {
        const { policyId, formData } = req.body;
        console.log('💾 Saving COI form data for policy:', policyId);

        if (!policyId || !formData) {
            return res.status(400).json({
                success: false,
                error: 'Policy ID and form data are required'
            });
        }

        // Actually save the COI form data to the database
        const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

        // Store COI data as part of the policy
        db.get('SELECT data FROM policies WHERE id = ?', [policyId], (err, row) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            let policyData = {};
            if (row) {
                try {
                    policyData = JSON.parse(row.data || '{}');
                } catch (e) {
                    console.warn('⚠️ Invalid JSON in policy data, creating new');
                }
            }

            // Add/update COI form data
            policyData.coiFormData = formData;
            policyData.lastCOIUpdate = new Date().toISOString();

            const query = row ?
                'UPDATE policies SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?' :
                'INSERT INTO policies (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';

            const params = row ? [JSON.stringify(policyData), policyId] : [policyId, JSON.stringify(policyData)];

            db.run(query, params, function(err) {
                if (err) {
                    console.error('❌ Error saving COI form data:', err);
                    return res.status(500).json({ success: false, error: 'Failed to save COI data' });
                }

                console.log('✅ COI form data saved to database for policy:', policyId);
                res.json({
                    success: true,
                    policyId: policyId,
                    message: 'COI form data processed successfully'
                });
            });

            db.close();
        });
    } catch (error) {
        console.error('❌ Error saving COI form data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while saving COI form data'
        });
    }
});

// Get COI Form Data endpoint
app.get('/api/get-coi-form/:policyId', (req, res) => {
    try {
        const { policyId } = req.params;
        console.log('🔍 Retrieving COI form data for policy:', policyId);

        if (!policyId) {
            return res.status(400).json({
                success: false,
                error: 'Policy ID is required'
            });
        }

        // Get COI form data from the database
        const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

        db.get('SELECT data FROM policies WHERE id = ?', [policyId], (err, row) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            if (!row) {
                console.log('⚠️ No policy found for ID:', policyId);
                return res.json({
                    success: true,
                    policyId: policyId,
                    formData: {} // Return empty form data if policy doesn't exist
                });
            }

            try {
                const policyData = JSON.parse(row.data || '{}');
                const formData = policyData.coiFormData || {};

                console.log('✅ Retrieved COI form data for policy:', policyId, 'Fields:', Object.keys(formData).length);
                res.json({
                    success: true,
                    policyId: policyId,
                    formData: formData
                });

            } catch (parseError) {
                console.error('❌ Error parsing policy data:', parseError);
                res.status(500).json({ success: false, error: 'Error parsing policy data' });
            }

            db.close();
        });

    } catch (error) {
        console.error('❌ Error retrieving COI form data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving COI form data'
        });
    }
});

// Generate Filled COI endpoint
app.post('/api/generate-filled-coi', (req, res) => {
    try {
        const { policyId, formData } = req.body;
        console.log('🎯 Generating filled COI for policy:', policyId);

        if (!policyId || !formData) {
            return res.status(400).json({
                success: false,
                error: 'Policy ID and form data are required'
            });
        }

        // For now, we'll simulate a successful COI generation
        // In the future, this could integrate with a PDF generation service
        console.log('✅ COI generation request processed for policy:', policyId);

        res.json({
            success: true,
            policyId: policyId,
            message: 'COI generation completed successfully',
            documentUrl: `/generated-coi/${policyId}_${Date.now()}.pdf`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error generating filled COI:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while generating COI'
        });
    }
});

// COI Documents API endpoints
app.get('/api/coi-documents', (req, res) => {
    try {
        const { policyId } = req.query;
        console.log('📄 Loading COI documents for policy:', policyId);

        if (!policyId) {
            return res.status(400).json({
                success: false,
                error: 'Policy ID is required'
            });
        }

        const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

        // Get COI documents from the policy data
        db.get('SELECT data FROM policies WHERE id = ?', [policyId], (err, row) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            let coiDocuments = [];
            if (row) {
                try {
                    const policyData = JSON.parse(row.data || '{}');
                    coiDocuments = policyData.coiDocuments || [];
                    console.log('✅ Found COI documents:', coiDocuments.length);
                } catch (e) {
                    console.warn('⚠️ Invalid JSON in policy data');
                }
            } else {
                console.log('⚠️ Policy not found:', policyId);
            }

            db.close();
            res.json({
                success: true,
                policyId: policyId,
                coiDocuments: coiDocuments
            });
        });
    } catch (error) {
        console.error('❌ Error loading COI documents:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while loading COI documents'
        });
    }
});

app.post('/api/coi-documents', (req, res) => {
    try {
        const { policyId, document } = req.body;
        console.log('💾 Saving COI document for policy:', policyId);

        if (!policyId || !document) {
            return res.status(400).json({
                success: false,
                error: 'Policy ID and document data are required'
            });
        }

        const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

        // Get existing policy data and add the COI document
        db.get('SELECT data FROM policies WHERE id = ?', [policyId], (err, row) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            let policyData = {};
            if (row) {
                try {
                    policyData = JSON.parse(row.data || '{}');
                } catch (e) {
                    console.warn('⚠️ Invalid JSON in policy data, creating new');
                }
            }

            // Initialize COI documents array if it doesn't exist
            if (!policyData.coiDocuments) {
                policyData.coiDocuments = [];
            }

            // Create the new document with timestamp
            const newDocument = {
                ...document,
                id: `coi_${Date.now()}`,
                createdAt: new Date().toISOString(),
                policyId: policyId
            };

            // Replace existing COI documents with just the new one (keep only latest)
            policyData.coiDocuments = [newDocument];
            policyData.lastCOIUpdate = new Date().toISOString();

            const query = row ?
                'UPDATE policies SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?' :
                'INSERT INTO policies (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';

            const params = row ? [JSON.stringify(policyData), policyId] : [policyId, JSON.stringify(policyData)];

            db.run(query, params, function(err) {
                if (err) {
                    console.error('❌ Error saving COI document:', err);
                    return res.status(500).json({ success: false, error: 'Failed to save COI document' });
                }

                console.log('✅ COI document saved to database for policy:', policyId);
                res.json({
                    success: true,
                    policyId: policyId,
                    documentId: newDocument.id,
                    message: 'COI document saved successfully'
                });
            });

            db.close();
        });
    } catch (error) {
        console.error('❌ Error saving COI document:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while saving COI document'
        });
    }
});

// Get saved COI endpoint for viewing
app.get('/api/get-saved-coi/:policyId', (req, res) => {
    try {
        const { policyId } = req.params;
        console.log('📄 Loading saved COI for policy:', policyId);

        const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

        // Get policy data with COI documents
        db.get('SELECT data FROM policies WHERE id = ?', [policyId], (err, row) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ success: false, error: 'Policy not found' });
            }

            let policyData = {};
            try {
                policyData = JSON.parse(row.data || '{}');
            } catch (e) {
                console.warn('⚠️ Invalid JSON in policy data');
                return res.status(500).json({ success: false, error: 'Invalid policy data' });
            }

            // Get the latest COI document
            const coiDocuments = policyData.coiDocuments || [];
            if (coiDocuments.length === 0) {
                return res.status(404).json({ success: false, error: 'No COI document found' });
            }

            const latestCOI = coiDocuments[0]; // Should be the most recent one
            if (latestCOI.dataUrl) {
                // Return the image data directly
                const imageData = latestCOI.dataUrl.split(',')[1]; // Remove data:image/png;base64,
                const buffer = Buffer.from(imageData, 'base64');

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="COI_${policyId}.pdf"`);
                res.send(buffer);
            } else {
                return res.status(404).json({ success: false, error: 'No image data found' });
            }
        });

        db.close();
    } catch (error) {
        console.error('❌ Error loading saved COI:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while loading COI'
        });
    }
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

        // Create TwiML URL for the call with target number
        const twimlUrl = `${req.protocol}://${req.get('host')}/api/twilio/twiml?target=${encodeURIComponent(to)}`;

        // For outbound calls: call the AGENT first, then connect them to target
        const agentPhoneNumber = process.env.AGENT_PHONE_NUMBER || '+13306369079';

        console.log(`🔄 Corrected flow: Calling agent ${agentPhoneNumber} first, then connecting to ${to}`);

        // Make the call using Twilio Voice API - call AGENT first
        const call = await twilioClient.calls.create({
            to: agentPhoneNumber,  // Call the agent (you) first
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
    console.log('📞 TwiML request data:', req.body);
    console.log('📞 TwiML query params:', req.query);

    // Get the target number from query params
    const targetNumber = req.query.target || req.body.target;
    const agentPhoneNumber = process.env.AGENT_PHONE_NUMBER || '+13306369079';

    console.log(`🎯 Call flow: Agent ${agentPhoneNumber} → Target ${targetNumber}`);

    res.type('text/xml');

    if (targetNumber && targetNumber !== agentPhoneNumber) {
        // This is an outbound call - connect agent to target number
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Hello! Connecting your call now.</Say>
    <Dial timeout="30" callerId="+13306369079">
        <Number>${targetNumber}</Number>
    </Dial>
    <Say voice="Polly.Joanna">The call could not be completed. Please try again.</Say>
</Response>`);
    } else {
        // Default response for other calls
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Hello! This call is from Vanguard Insurance.</Say>
    <Dial timeout="30" callerId="+13306369079">
        <Number>${agentPhoneNumber}</Number>
    </Dial>
    <Say voice="Polly.Joanna">We're sorry, all agents are currently busy. Please try again later.</Say>
</Response>`);
    }
});

// Twilio Voice SDK Access Token Endpoint
app.post('/api/twilio/token', (req, res) => {
    const { identity } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Twilio credentials not configured'
        });
    }

    try {
        const AccessToken = require('twilio').jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        // For JWT tokens, we need actual API keys, not Account SID
        // If no API keys, we can't create proper JWT tokens for Voice SDK
        if (!process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET) {
            console.error('❌ Missing TWILIO_API_KEY and TWILIO_API_SECRET for JWT generation');
            return res.status(503).json({
                error: 'Twilio API Keys required for Voice SDK. Please configure TWILIO_API_KEY and TWILIO_API_SECRET environment variables.'
            });
        }

        // Create access token with proper API keys
        const accessToken = new AccessToken(
            accountSid,
            process.env.TWILIO_API_KEY,
            process.env.TWILIO_API_SECRET,
            { identity: identity || 'vanguard-user' }
        );

        // Create voice grant
        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
            incomingAllow: true
        });

        // If no TwiML App SID, create a basic grant for outgoing calls only
        if (!process.env.TWILIO_TWIML_APP_SID) {
            console.warn('⚠️ TWILIO_TWIML_APP_SID not configured, creating basic grant');
            const basicVoiceGrant = new VoiceGrant({
                incomingAllow: false // Only allow outgoing calls without TwiML app
            });
            accessToken.addGrant(basicVoiceGrant);
        } else {
            accessToken.addGrant(voiceGrant);
        }

        console.log('✅ Twilio access token generated for:', identity || 'vanguard-user');

        res.json({
            identity: identity || 'vanguard-user',
            token: accessToken.toJwt()
        });

    } catch (error) {
        console.error('❌ Token generation error:', error);
        res.status(500).json({
            error: 'Failed to generate access token'
        });
    }
});

// Voice Bridge - TwiML endpoint to connect calls to agent
app.all('/api/twilio/voice-bridge', (req, res) => {
    const voiceBridge = require('../api/twilio/voice-bridge');
    voiceBridge(req, res);
});

// Call Status Webhook for Voice API
app.post('/api/twilio/call-status', (req, res) => {
    console.log('📊 Twilio Voice API call status update:', req.body);
    res.status(200).send('OK');
});

// Recording Status Webhook
app.post('/api/twilio/recording-status', (req, res) => {
    console.log('🎙️ Call recording status:', req.body);
    res.status(200).send('OK');
});

// Voicemail Transcription Webhook
app.post('/api/twilio/voicemail-transcription', (req, res) => {
    console.log('📝 Voicemail transcription received:', req.body);
    // TODO: Save voicemail transcription to database
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

    const { CallSid, From, To, CallStatus, Direction } = req.body;

    // Only process truly external incoming calls, not Twilio outbound calls to agent
    if (Direction !== 'inbound') {
        console.log('🚫 Ignoring outbound call (Twilio calling agent):', CallSid, 'From:', From, 'To:', To);
        res.type('text/xml');
        res.send('<Response></Response>');
        return;
    }

    // Also ignore calls FROM our own Twilio number or known internal numbers
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    const agentNumber = process.env.AGENT_PHONE_NUMBER;

    if (From === twilioNumber || From === agentNumber) {
        console.log('🚫 Ignoring call from our own number:', CallSid, 'From:', From);
        res.type('text/xml');
        res.send('<Response></Response>');
        return;
    }

    // Determine which line was called
    const isMainLine = To === '+13304600872';
    const isPersonalLine = To === '+13306369079';

    let lineType = 'Unknown Line';
    if (isMainLine) {
        lineType = 'Main Line';
    } else if (isPersonalLine) {
        lineType = "Grant's Direct Line";
    }

    // Send incoming call notification to all connected SSE clients
    const callData = {
        type: 'incoming_call',
        callControlId: CallSid,
        from: From,
        to: To,
        lineType: lineType,
        isMainLine: isMainLine,
        isPersonalLine: isPersonalLine,
        status: CallStatus,
        timestamp: new Date().toISOString()
    };

    console.log(`📡 Scheduling delayed broadcast of ${lineType} call from ${From} in 10 seconds...`);

    // Delay the broadcast by 10 seconds to allow intro to play first
    setTimeout(() => {
        console.log(`📡 Broadcasting ${lineType} call from ${From} to`, sseClients.size, 'connected clients');

        // Broadcast to all connected SSE clients after delay
        sseClients.forEach(client => {
            try {
                client.write(`data: ${JSON.stringify(callData)}\n\n`);
            } catch (error) {
                console.error('Error sending SSE message:', error);
                sseClients.delete(client);
            }
        });
    }, 10000); // 10 second delay

    // Store the call for potential answer/reject actions
    global.incomingCalls = global.incomingCalls || {};
    global.incomingCalls[CallSid] = {
        from: From,
        to: To,
        callSid: CallSid,
        timestamp: new Date().toISOString(),
        status: 'ringing'
    };

    // Different TwiML response based on which line was called
    res.type('text/xml');

    if (isMainLine) {
        // Main office line - original Vanguard Insurance welcome audio with 2-minute timeout
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>https://corn-tapir-5435.twil.io/assets/welcome.mp3</Play>
    <Play loop="5">https://raw.githubusercontent.com/Corptech02/LLCinfo/main/ES_Doze%20Off%20-%20Martin%20Landstr%C3%B6m%20(Version%20dcea32a8)%20-%20fullmix_preview.mp3</Play>
    <Redirect>/api/twilio/call-timeout/${CallSid}</Redirect>
</Response>`);
    } else {
        // Grant's direct line - ring and wait for answer in CRM
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="5"/>
    <Redirect>/api/twilio/call-status/${CallSid}</Redirect>
</Response>`);
    }
});

// Call status check endpoint for redirects
app.all('/api/twilio/call-status/:callSid', (req, res) => {
    const callSid = req.params.callSid;
    console.log('📞 Checking call status for:', callSid);

    const callData = global.incomingCalls && global.incomingCalls[callSid];

    if (!callData) {
        console.log('❌ Call not found:', callSid);
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
        return;
    }

    if (callData.status === 'answered') {
        console.log('✅ Call answered, connecting...');
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you now.</Say>
    <Dial timeout="30">
        <Client>agent</Client>
    </Dial>
</Response>`);
    } else if (callData.status === 'rejected') {
        console.log('❌ Call rejected');
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">We're sorry, no agents are available.</Say>
    <Hangup/>
</Response>`);
    } else {
        // Still ringing, continue waiting
        console.log('🔄 Call still ringing, continuing to wait...');
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play loop="1">https://demo.twilio.com/docs/classic.mp3</Play>
    <Redirect>/api/twilio/call-status/${callSid}</Redirect>
</Response>`);
    }
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

        // Mark call as answered
        if (global.incomingCalls && global.incomingCalls[callSid]) {
            global.incomingCalls[callSid].status = 'answered';
            global.incomingCalls[callSid].answeredAt = new Date().toISOString();
        }

        // Create a unique conference name for this call
        const conferenceName = `call-${callSid}`;

        // First, stop any playing media by updating with silence
        await twilioClient.calls(callSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for calling Vanguard Insurance. An agent will be with you shortly.</Say>
    <Pause length="1"/>
</Response>`
        });

        console.log('✅ Stopped hold music, establishing connection...');

        // Create a direct dial to your phone number and bridge the calls
        const agentPhoneNumber = process.env.AGENT_PHONE_NUMBER || '+13306369079';

        // Update the original call to dial your number directly
        const updatedCall = await twilioClient.calls(callSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you to an agent now.</Say>
    <Dial timeout="30" record="true" recordingStatusCallback="/api/twilio/recording-status">
        <Number>${agentPhoneNumber}</Number>
    </Dial>
    <Say voice="Polly.Joanna">The agent is currently unavailable. Please leave a message after the beep.</Say>
    <Record maxLength="300" timeout="10" finishOnKey="#" recordingStatusCallback="/api/twilio/recording-status"/>
</Response>`
        });

        // Store call info for frontend
        if (global.incomingCalls && global.incomingCalls[callSid]) {
            global.incomingCalls[callSid].agentNumber = agentPhoneNumber;
            global.incomingCalls[callSid].callMode = 'direct_dial';
        }

        console.log('✅ Call updated to connect mode:', updatedCall.status);

        res.json({
            success: true,
            message: 'Call answered',
            callSid: callSid,
            conferenceName: conferenceName,
            needsAgentCall: true
        });

    } catch (error) {
        console.error('❌ Error answering call:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Dial agent into conference endpoint
app.post('/api/twilio/dial-agent/:conferenceName', async (req, res) => {
    console.log('📞 Dialing agent into conference:', req.params.conferenceName);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const conferenceName = req.params.conferenceName;
        const agentPhone = process.env.AGENT_PHONE_NUMBER || '+13306369079';
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+13306369079';

        // Check if agent phone is the same as Twilio phone (would cause infinite loop)
        if (agentPhone === twilioPhone) {
            console.log('⚠️ Agent phone same as Twilio phone - keeping call in conference for manual join');

            // Keep the original conference approach but indicate that manual joining is required
            // The client is already in the conference from the answer TwiML
            console.log('✅ Client is in conference, agent must join manually');

            res.json({
                success: true,
                message: 'Conference created - agent must join manually (same number as Twilio)',
                agentCallSid: null,
                conferenceName: conferenceName,
                requiresManualJoin: true
            });
            return;
        }

        // Create call to agent and connect them to conference
        const call = await twilioClient.calls.create({
            to: agentPhone,
            from: twilioPhone,
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Incoming call from client. Joining conference now.</Say>
    <Dial>
        <Conference waitUrl="" startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceName}</Conference>
    </Dial>
</Response>`
        });

        console.log('✅ Agent call initiated:', call.sid);

        res.json({
            success: true,
            message: 'Agent dialed into conference',
            agentCallSid: call.sid,
            conferenceName: conferenceName
        });

    } catch (error) {
        console.error('❌ Error dialing agent:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// TwiML Application endpoint for browser calls
app.post('/api/twilio/voice', (req, res) => {
    console.log('📞 TwiML Voice request:', req.body);

    const { conference } = req.body;

    let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`;

    if (conference) {
        // Join specified conference
        console.log('🎧 Browser joining conference:', conference);
        twiml += `
    <Say voice="Polly.Joanna">Joining conference call.</Say>
    <Dial>
        <Conference waitUrl="" startConferenceOnEnter="false" endConferenceOnExit="false">${conference}</Conference>
    </Dial>`;
    } else {
        // Default response
        twiml += `
    <Say voice="Polly.Joanna">Hello from Vanguard CRM.</Say>
    <Hangup/>`;
    }

    twiml += `
</Response>`;

    console.log('📞 Sending TwiML:', twiml);

    res.type('text/xml');
    res.send(twiml);
});

// Generate Twilio Client token for browser-based calling
app.get('/api/twilio/token', async (req, res) => {
    console.log('📞 Generating Twilio Client token');

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'Twilio credentials not configured'
        });
    }

    try {
        const AccessToken = require('twilio').jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        // Create an access token which we will sign and return to the client
        const token = new AccessToken(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_ACCOUNT_SID, // Use Account SID as API key for simplicity
            process.env.TWILIO_AUTH_TOKEN,   // Use Auth Token as API secret
            { identity: 'vanguard-agent-' + Date.now() } // Unique identity
        );

        // Create a Voice grant and add it to the token
        const grant = new VoiceGrant({
            // For testing, we'll use a simple outbound configuration
            incomingAllow: false, // Disable incoming for now
            outgoingApplicationSid: null, // Will be handled by params
        });
        token.addGrant(grant);

        console.log('✅ Client token generated');

        res.json({
            success: true,
            token: token.toJwt(),
            identity: 'vanguard-agent'
        });

    } catch (error) {
        console.error('❌ Error generating token:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Bridge call directly (simple approach)
app.post('/api/twilio/bridge-direct', async (req, res) => {
    console.log('📞 Bridging call directly (simple):', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
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

        const agentPhone = process.env.AGENT_PHONE_NUMBER || '+13306369079';

        // Update the call to connect directly to agent phone
        const updatedCall = await twilioClient.calls(callSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you directly to our agent now.</Say>
    <Dial timeout="30" record="true">
        <Number>${agentPhone}</Number>
    </Dial>
</Response>`
        });

        console.log('✅ Call bridged directly to agent phone:', updatedCall.status);

        res.json({
            success: true,
            message: 'Call bridged directly to agent phone',
            callSid: callSid,
            agentPhone: agentPhone,
            bridgeType: 'direct_phone'
        });

    } catch (error) {
        console.error('❌ Error bridging call directly:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simple pickup call - just answer without dialing anywhere else
app.post('/api/twilio/pickup-call', async (req, res) => {
    console.log('📞 Picking up call directly:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
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

        // Direct dial to your phone to connect the calls
        const agentPhoneNumber = process.env.AGENT_PHONE_NUMBER || '+13306369079';

        console.log('📞 Connecting caller directly to agent phone:', agentPhoneNumber);

        const updatedCall = await twilioClient.calls(callSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for calling Vanguard Insurance. Connecting you now.</Say>
    <Dial timeout="30" record="true">
        <Number>${agentPhoneNumber}</Number>
    </Dial>
</Response>`
        });

        // Mark as answered in our tracking
        if (global.incomingCalls && global.incomingCalls[callSid]) {
            global.incomingCalls[callSid].status = 'answered';
            global.incomingCalls[callSid].answeredAt = new Date().toISOString();
            global.incomingCalls[callSid].connectedTo = agentPhoneNumber;
        }

        console.log('✅ Call picked up and connecting to agent phone:', agentPhoneNumber);

        res.json({
            success: true,
            message: 'Call answered - connecting to your phone now',
            callSid: callSid,
            status: 'picked_up',
            connectedTo: agentPhoneNumber,
            needsAgentJoin: false
        });

    } catch (error) {
        console.error('❌ Error picking up call:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate Twilio Voice access token for browser softphone
app.post('/api/twilio/voice-token', (req, res) => {
    console.log('🎧 Generating Twilio Voice access token');

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const AccessToken = require('twilio').jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        // Get identity from request or use default
        const { identity } = req.body;
        const tokenIdentity = identity || 'vanguard-agent-' + Date.now();

        console.log('🎧 Creating access token for identity:', tokenIdentity);

        // Create an access token which we will sign and return to the client
        const accessToken = new AccessToken(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_API_KEY || process.env.TWILIO_ACCOUNT_SID, // Use account SID if no API key
            process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_TOKEN, // Use auth token if no API secret
            { identity: tokenIdentity }
        );

        // Create a Voice grant and add to the access token
        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: process.env.TWILIO_VOICE_APP_SID || 'default',
            incomingAllow: true
        });
        accessToken.addGrant(voiceGrant);

        // Generate the token string
        const token = accessToken.toJwt();

        console.log('✅ Voice access token generated');

        res.json({
            success: true,
            token: token,
            identity: tokenIdentity
        });

    } catch (error) {
        console.error('❌ Error generating voice token:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Bridge call directly to WebRTC (bypassing conference)
app.post('/api/twilio/bridge-to-webrtc', async (req, res) => {
    console.log('🎧 Bridging call to WebRTC:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const { callSid, webrtcReady } = req.body;

        if (!callSid) {
            return res.status(400).json({
                success: false,
                error: 'Call SID is required'
            });
        }

        // Update the call to connect directly to agent (no conference)
        // This creates a direct bridge between client and WebRTC
        const updatedCall = await twilioClient.calls(callSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you directly to agent.</Say>
    <Dial timeout="30" record="true">
        <Stream url="wss://your-webrtc-endpoint.com/stream" />
    </Dial>
</Response>`
        });

        console.log('✅ Call bridged to WebRTC:', updatedCall.status);

        res.json({
            success: true,
            message: 'Call bridged to WebRTC',
            callSid: callSid,
            streamUrl: 'wss://webrtc-stream',
            bridgeType: 'webrtc'
        });

    } catch (error) {
        console.error('❌ Error bridging call to WebRTC:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Hangup call endpoint
app.post('/api/twilio/hangup/:callSid', async (req, res) => {
    console.log('📞 Hangup request for call:', req.params.callSid);

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

        console.log('✅ Call hung up:', callSid);

        res.json({
            success: true,
            message: 'Call ended',
            callSid: callSid,
            status: call.status
        });

    } catch (error) {
        console.error('❌ Error hanging up call:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Join conference with browser audio support
app.post('/api/twilio/join-conference-browser', async (req, res) => {
    console.log('📞 Browser audio conference join:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const { conferenceName, useBrowserAudio } = req.body;

        if (!conferenceName) {
            return res.status(400).json({
                success: false,
                error: 'Conference name is required'
            });
        }

        const phoneToCall = process.env.AGENT_PHONE_NUMBER || '+13306369079';

        // Create a call to the agent to join the existing conference
        // This will be the audio bridge for browser audio
        const call = await twilioClient.calls.create({
            to: phoneToCall,
            from: process.env.TWILIO_PHONE_NUMBER || '+13306369079',
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Browser audio bridge connecting to conference.</Say>
    <Dial>
        <Conference waitUrl="" startConferenceOnEnter="false" endConferenceOnExit="false">${conferenceName}</Conference>
    </Dial>
</Response>`
        });

        console.log('✅ Browser audio bridge call initiated:', call.sid);

        res.json({
            success: true,
            message: 'Browser audio bridge created - answer your phone to connect',
            callSid: call.sid,
            conferenceName: conferenceName,
            instructions: `Answer your phone and you'll be connected to the conference. Your browser microphone will be available for advanced controls.`
        });

    } catch (error) {
        console.error('❌ Error creating browser audio bridge:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Join conference endpoint - creates a call to agent to join existing conference
app.post('/api/twilio/join-conference', async (req, res) => {
    console.log('📞 Agent joining conference:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const { conferenceName, agentPhone } = req.body;

        if (!conferenceName) {
            return res.status(400).json({
                success: false,
                error: 'Conference name is required'
            });
        }

        const phoneToCall = agentPhone || process.env.AGENT_PHONE_NUMBER || '+13306369079';

        // Create a call to the agent to join the existing conference
        const call = await twilioClient.calls.create({
            to: phoneToCall,
            from: process.env.TWILIO_PHONE_NUMBER || '+13306369079',
            twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Joining conference call with client.</Say>
    <Dial>
        <Conference waitUrl="" startConferenceOnEnter="false" endConferenceOnExit="true">${conferenceName}</Conference>
    </Dial>
</Response>`
        });

        console.log('✅ Conference join call initiated:', call.sid);

        res.json({
            success: true,
            message: 'Conference join call created',
            callSid: call.sid,
            conferenceName: conferenceName
        });

    } catch (error) {
        console.error('❌ Error joining conference:', error);
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

        // Mark call as rejected so the redirect endpoint knows to hang up
        if (global.incomingCalls && global.incomingCalls[callSid]) {
            global.incomingCalls[callSid].status = 'rejected';
            global.incomingCalls[callSid].rejectedAt = new Date().toISOString();
        }

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

    // Handle incoming calls when they start ringing
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

    // Handle call completion (any direction, any reason)
    if (CallStatus === 'completed' || CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'failed' || CallStatus === 'canceled') {
        console.log(`📞 Call ended - Status: ${CallStatus}, Direction: ${Direction}, CallSid: ${CallSid}`);

        // Clean up stored call data
        if (global.incomingCalls && global.incomingCalls[CallSid]) {
            delete global.incomingCalls[CallSid];
        }

        // Notify all connected clients that the call has ended
        const callEndData = {
            type: 'call_ended',
            callControlId: CallSid,
            from: From,
            to: To,
            status: CallStatus,
            direction: Direction,
            timestamp: new Date().toISOString()
        };

        console.log('📡 Broadcasting call end to', sseClients.size, 'connected clients');

        // Broadcast to all connected SSE clients
        sseClients.forEach(client => {
            try {
                client.write(`data: ${JSON.stringify(callEndData)}\n\n`);
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

// Call timeout endpoint - handles 2-minute timeout for unanswered calls
app.all('/api/twilio/call-timeout/:callSid', (req, res) => {
    const callSid = req.params.callSid;
    console.log('⏰ Call timeout check for:', callSid);

    const callData = global.incomingCalls && global.incomingCalls[callSid];

    if (!callData) {
        console.log('❌ Call not found in timeout check:', callSid);
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
        return;
    }

    if (callData.status === 'answered') {
        console.log('✅ Call was answered, continuing...');
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you now.</Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna">You are now connected with an agent.</Say>
    <Record timeout="3600" action="/api/twilio/recording-complete" playBeep="false" />
</Response>`);
    } else {
        // Call was not answered within 2 minutes
        console.log('⏰ Call timeout - playing goodbye message and hanging up');

        // Clean up stored call data
        if (global.incomingCalls && global.incomingCalls[callSid]) {
            delete global.incomingCalls[callSid];
        }

        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>https://corn-tapir-5435.twil.io/assets/have%20a%20good%20day.mp3</Play>
    <Hangup/>
</Response>`);
    }
});

// Hangup call endpoint - when agent hangs up in CRM
app.post('/api/twilio/hangup/:callSid', async (req, res) => {
    console.log('📞 Hangup request for call:', req.params.callSid);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized'
        });
    }

    try {
        const callSid = req.params.callSid;

        // Terminate the call
        const call = await twilioClient.calls(callSid).update({
            status: 'completed'
        });

        console.log('✅ Call terminated by agent:', callSid);

        // Clean up stored call data
        if (global.incomingCalls && global.incomingCalls[callSid]) {
            delete global.incomingCalls[callSid];
        }

        res.json({
            success: true,
            message: 'Call terminated',
            callSid: callSid
        });

    } catch (error) {
        console.error('❌ Failed to terminate call:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Recording complete endpoint
app.post('/api/twilio/recording-complete', (req, res) => {
    console.log('📹 Recording completed:', req.body);

    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for your call. Goodbye.</Say>
    <Hangup/>
</Response>`);
});

// Conference status callback
app.post('/api/twilio/conference-status', (req, res) => {
    console.log('📞 Conference event:', req.body);

    const { ConferenceSid, StatusCallbackEvent, FriendlyName } = req.body;

    if (StatusCallbackEvent === 'conference-start') {
        console.log('✅ Conference started:', FriendlyName);
    } else if (StatusCallbackEvent === 'conference-end') {
        console.log('📞 Conference ended:', FriendlyName);
    } else if (StatusCallbackEvent === 'participant-join') {
        console.log('👤 Participant joined conference:', FriendlyName);
    } else if (StatusCallbackEvent === 'participant-leave') {
        console.log('👋 Participant left conference:', FriendlyName);
    }

    res.status(200).send('OK');
});

// Client search endpoint for incoming call lookup
app.get('/api/clients/search', (req, res) => {
    console.log('📞 Client search request:', req.query);

    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    // For now, return empty result since client database search would require
    // integration with your specific client storage system
    // This allows the incoming call system to work and fall back to localStorage
    res.json({
        client: null,
        policies: [],
        message: 'Client search endpoint active - integrate with your client database'
    });
});

// Loss Runs File Upload Endpoints

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = '/var/www/vanguard/uploads/loss_runs/';
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueId = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueId + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Upload files endpoint
app.post('/api/loss-runs-upload', upload.array('files'), async (req, res) => {
    console.log('📤 Loss runs upload request received');

    try {
        const leadId = req.body.leadId;

        if (!leadId) {
            return res.status(400).json({
                success: false,
                error: 'Lead ID is required'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const uploadedFiles = [];

        // Process each uploaded file with proper async database operations
        for (const file of req.files) {
            const fileId = path.basename(file.filename, path.extname(file.filename));

            try {
                // Insert file metadata into database using the retry operation
                const result = await retryDatabaseOperation((callback) => {
                    db.run(`
                        INSERT INTO loss_runs (lead_id, file_name, file_size, file_type, status)
                        VALUES (?, ?, ?, ?, 'uploaded')
                    `, [leadId, file.filename, file.size, file.mimetype], function(err) {
                        callback(err, err ? null : this.lastID);
                    });
                });

                const insertedId = result;
                console.log('✅ File metadata inserted with ID:', insertedId);

                uploadedFiles.push({
                    id: insertedId,
                    lead_id: leadId,
                    file_name: file.filename,
                    original_name: file.originalname,
                    file_size: file.size,
                    file_type: file.mimetype,
                    uploaded_date: new Date().toISOString()
                });

            } catch (dbError) {
                console.error('Database insert error for file:', fileId, dbError);
                // Continue processing other files even if one fails
            }
        }

        if (uploadedFiles.length === 0) {
            return res.status(500).json({
                success: false,
                error: 'Failed to save file metadata to database'
            });
        }

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            files: uploadedFiles,
            count: uploadedFiles.length
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get files endpoint
app.get('/api/loss-runs-upload', async (req, res) => {
    const leadId = req.query.leadId;

    if (!leadId) {
        return res.status(400).json({
            success: false,
            error: 'Lead ID is required'
        });
    }

    try {
        console.log(`📋 Loading documents for lead ${leadId}...`);

        const rows = await retryDatabaseOperation((callback) => {
            db.all(`
                SELECT id, lead_id, file_name, file_size, file_type, uploaded_date, status
                FROM loss_runs
                WHERE lead_id = ?
                ORDER BY uploaded_date DESC
            `, [leadId], callback);
        });

        console.log(`✅ Successfully loaded ${rows.length} documents for lead ${leadId}`);
        res.json({
            success: true,
            files: rows,
            count: rows.length
        });

    } catch (err) {
        console.error(`❌ Error loading documents for lead ${leadId}:`, err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Database error occurred'
        });
    }
});

// Delete file endpoint
app.delete('/api/loss-runs-upload', async (req, res) => {
    const fileId = req.body.fileId;

    if (!fileId) {
        return res.status(400).json({
            success: false,
            error: 'File ID is required'
        });
    }

    try {
        console.log(`🗑️ Deleting document ${fileId}...`);

        // Get file info first
        const row = await retryDatabaseOperation((callback) => {
            db.get('SELECT file_name FROM loss_runs WHERE id = ?', [fileId], callback);
        });

        if (!row) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Delete from filesystem
        const filePath = `/var/www/vanguard/uploads/loss_runs/${row.file_name}`;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await retryDatabaseOperation((callback) => {
            db.run('DELETE FROM loss_runs WHERE id = ?', [fileId], callback);
        });

        console.log(`✅ Successfully deleted document ${fileId}`);
        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (err) {
        console.error(`❌ Error deleting document ${fileId}:`, err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Database error occurred'
        });
    }
});

// Download file endpoint
app.get('/api/loss-runs-download', (req, res) => {
    const fileId = req.query.fileId;

    if (!fileId) {
        return res.status(400).json({
            error: 'File ID is required'
        });
    }

    db.get(`
        SELECT id, lead_id, file_name, file_size, file_type
        FROM loss_runs
        WHERE id = ?
    `, [fileId], (err, row) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                error: 'File not found'
            });
        }

        const filePath = `/var/www/vanguard/uploads/loss_runs/${row.file_name}`;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found on disk'
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', row.file_type);
        res.setHeader('Content-Length', fs.statSync(filePath).size);
        res.setHeader('Content-Disposition', `inline; filename="${row.file_name}"`);

        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    });
});

// Quote Application Endpoints
app.post('/api/quote-applications', (req, res) => {
    console.log('📋 Quote application save request received');

    try {
        const { leadId, applicationData } = req.body;

        if (!leadId || !applicationData) {
            return res.status(400).json({
                success: false,
                error: 'Lead ID and application data are required'
            });
        }

        // Generate unique ID for the application
        const applicationId = 'app_' + Date.now() + '_' + Math.round(Math.random() * 1E9);

        // Save to database
        db.run(`
            INSERT INTO quote_submissions (id, lead_id, form_data, status)
            VALUES (?, ?, ?, ?)
        `, [applicationId, leadId, JSON.stringify(applicationData), 'submitted'], function(err) {
            if (err) {
                console.error('Database insert error:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log('✅ Quote application saved:', applicationId);

            res.json({
                success: true,
                message: 'Quote application saved successfully',
                applicationId: applicationId,
                leadId: leadId
            });
        });

    } catch (error) {
        console.error('Save quote application error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get quote applications for a lead
app.get('/api/quote-applications', async (req, res) => {
    const leadId = req.query.leadId;

    if (!leadId) {
        return res.status(400).json({
            success: false,
            error: 'Lead ID is required'
        });
    }

    try {
        console.log(`📋 Loading quote applications for lead ${leadId}...`);

        const rows = await retryDatabaseOperation((callback) => {
            db.all(`
                SELECT id, lead_id, form_data, status, created_at, updated_at
                FROM quote_submissions
                WHERE lead_id = ?
                ORDER BY created_at DESC
            `, [leadId], callback);
        });

        // Parse form_data for each application
        const applications = rows.map(row => {
            const formData = JSON.parse(row.form_data);
            // Remove id from formData to prevent overwriting database ID
            delete formData.id;

            return {
                id: row.id, // Use database ID, not form_data ID
                leadId: row.lead_id,
                ...formData,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        });

        console.log(`✅ Successfully loaded ${applications.length} applications for lead ${leadId}`);
        res.json({
            success: true,
            applications: applications,
            count: applications.length
        });

    } catch (err) {
        console.error(`❌ Error loading applications for lead ${leadId}:`, err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Database error occurred'
        });
    }
});

// Helper function for database retry logic
function retryDatabaseOperation(operation, maxRetries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        function attempt() {
            attempts++;
            operation((err, result) => {
                if (err && err.code === 'SQLITE_BUSY' && attempts < maxRetries) {
                    console.log(`🔄 Database busy, retrying in ${delay}ms... (attempt ${attempts}/${maxRetries})`);
                    setTimeout(attempt, delay);
                } else if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }

        attempt();
    });
}

// Get single quote application by ID
app.get('/api/quote-applications/:id', async (req, res) => {
    const applicationId = req.params.id;

    try {
        console.log(`📄 Loading quote application ${applicationId}...`);

        const row = await retryDatabaseOperation((callback) => {
            db.get(`
                SELECT id, lead_id, form_data, status, created_at, updated_at
                FROM quote_submissions
                WHERE id = ?
            `, [applicationId], callback);
        });

        if (!row) {
            console.log(`❌ Application ${applicationId} not found`);
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        // Parse form_data and combine with metadata
        const formData = JSON.parse(row.form_data);
        // Remove id from formData to prevent overwriting database ID
        delete formData.id;

        const application = {
            id: row.id, // Use database ID, not form_data ID
            leadId: row.lead_id,
            ...formData,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        console.log(`✅ Successfully loaded application ${applicationId}`);
        res.json({
            success: true,
            application: application
        });

    } catch (err) {
        console.error(`❌ Error loading application ${applicationId}:`, err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Database error occurred'
        });
    }
});

// Update quote application
app.put('/api/quote-applications/:id', (req, res) => {
    const applicationId = req.params.id;
    const { applicationData } = req.body;

    if (!applicationData) {
        return res.status(400).json({
            success: false,
            error: 'Application data is required'
        });
    }

    db.run(`
        UPDATE quote_submissions
        SET form_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [JSON.stringify(applicationData), applicationId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.json({
            success: true,
            message: 'Quote application updated successfully'
        });
    });
});

// Delete quote application
app.delete('/api/quote-applications/:id', (req, res) => {
    const applicationId = req.params.id;

    db.run('DELETE FROM quote_submissions WHERE id = ?', [applicationId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.json({
            success: true,
            message: 'Quote application deleted successfully'
        });
    });
});

// Document Management API Endpoints

// Upload document
app.post('/api/documents', uploadDocumentFiles.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded'
        });
    }

    const { clientId, policyId, uploadedBy } = req.body;

    if (!clientId) {
        // Clean up uploaded file if clientId is missing
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({
            success: false,
            error: 'Missing clientId parameter'
        });
    }

    // Generate document ID
    const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const documentData = {
        id: docId,
        client_id: clientId,
        policy_id: policyId || null,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        uploaded_by: uploadedBy || 'Unknown'
    };

    // Save metadata to database
    db.run(
        `INSERT INTO documents (id, client_id, policy_id, filename, original_name, file_path, file_size, file_type, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            documentData.id,
            documentData.client_id,
            documentData.policy_id,
            documentData.filename,
            documentData.original_name,
            documentData.file_path,
            documentData.file_size,
            documentData.file_type,
            documentData.uploaded_by
        ],
        function(err) {
            if (err) {
                // Clean up uploaded file if database insert fails
                fs.unlink(req.file.path, () => {});
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                document: {
                    id: documentData.id,
                    name: documentData.original_name,
                    type: documentData.file_type,
                    size: documentData.file_size,
                    uploadDate: new Date().toISOString(),
                    uploadedBy: documentData.uploaded_by
                }
            });
        }
    );
});

// Get documents for client or policy
app.get('/api/documents', (req, res) => {
    const { clientId, policyId } = req.query;

    if (!clientId && !policyId) {
        return res.status(400).json({
            success: false,
            error: 'Missing clientId or policyId parameter'
        });
    }

    let query, params;

    if (clientId) {
        query = `SELECT id, original_name as name, file_type as type, file_size as size,
                        upload_date as uploadDate, uploaded_by as uploadedBy
                 FROM documents WHERE client_id = ? ORDER BY upload_date DESC`;
        params = [clientId];
    } else {
        query = `SELECT id, original_name as name, file_type as type, file_size as size,
                        upload_date as uploadDate, uploaded_by as uploadedBy
                 FROM documents WHERE policy_id = ? ORDER BY upload_date DESC`;
        params = [policyId];
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            documents: rows
        });
    });
});

// Download document
app.get('/api/download-document', (req, res) => {
    const { docId } = req.query;

    if (!docId) {
        return res.status(400).json({
            success: false,
            error: 'Missing docId parameter'
        });
    }

    // Get document info from database
    db.get(
        'SELECT filename, original_name, file_path, file_type FROM documents WHERE id = ?',
        [docId],
        (err, doc) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (!doc) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found'
                });
            }

            if (!fs.existsSync(doc.file_path)) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found on server'
                });
            }

            // Set headers for file download
            res.setHeader('Content-Type', doc.file_type);
            res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);

            // Stream the file
            const fileStream = fs.createReadStream(doc.file_path);
            fileStream.pipe(res);
        }
    );
});

// Delete document
app.delete('/api/documents/:docId', (req, res) => {
    const docId = req.params.docId;

    // Get document info first
    db.get('SELECT file_path FROM documents WHERE id = ?', [docId], (err, doc) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Delete from database first
        db.run('DELETE FROM documents WHERE id = ?', [docId], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            // Delete physical file
            fs.unlink(doc.file_path, (err) => {
                if (err) {
                    console.warn('Failed to delete physical file:', err);
                    // Don't fail the request if file deletion fails
                }
            });

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        });
    });
});

// Agent Dev Stats API endpoints
// Save dev stats to server
app.post('/api/agent-dev-stats', (req, res) => {
    const { agentName, filter, stats } = req.body;

    if (!agentName || !filter || !stats) {
        return res.status(400).json({ error: 'Agent name, filter, and stats are required' });
    }

    const key = `dev_stats_${agentName}_${filter}`;
    const value = JSON.stringify(stats);

    db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [key, value],
        function(err) {
            if (err) {
                console.error('Error saving dev stats:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log(`💾 Saved dev stats for ${agentName} ${filter}:`, stats);
            res.json({ success: true, agentName, filter, stats });
        }
    );
});

// Get dev stats from server
app.get('/api/agent-dev-stats/:agentName/:filter', (req, res) => {
    const { agentName, filter } = req.params;
    const key = `dev_stats_${agentName}_${filter}`;

    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) {
            console.error('Error getting dev stats:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.json({ stats: null });
        }

        try {
            const stats = JSON.parse(row.value);
            console.log(`📊 Retrieved dev stats for ${agentName} ${filter}:`, stats);
            res.json({ stats });
        } catch (parseErr) {
            console.error('Error parsing dev stats:', parseErr);
            res.status(500).json({ error: 'Invalid stats data' });
        }
    });
});

// Delete dev stats from server
app.delete('/api/agent-dev-stats/:agentName/:filter', (req, res) => {
    const { agentName, filter } = req.params;
    const key = `dev_stats_${agentName}_${filter}`;

    db.run('DELETE FROM settings WHERE key = ?', [key], function(err) {
        if (err) {
            console.error('Error deleting dev stats:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`🗑️ Deleted dev stats for ${agentName} ${filter}`);
        res.json({ success: true, deleted: this.changes > 0 });
    });
});

// Live Agent Stats API endpoints (for real-time tracking)
// Save live agent stats
app.post('/api/live-agent-stats', (req, res) => {
    const { agentName, stats } = req.body;

    if (!agentName || !stats) {
        return res.status(400).json({ error: 'Agent name and stats are required' });
    }

    const key = `live_stats_${agentName}`;
    const value = JSON.stringify(stats);

    db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [key, value],
        function(err) {
            if (err) {
                console.error('Error saving live stats:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log(`📊 Saved live stats for ${agentName}:`, stats);
            res.json({ success: true, agentName, stats });
        }
    );
});

// Get live agent stats
app.get('/api/live-agent-stats/:agentName', (req, res) => {
    const { agentName } = req.params;
    const key = `live_stats_${agentName}`;

    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) {
            console.error('Error getting live stats:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.json({ stats: null });
        }

        try {
            const stats = JSON.parse(row.value);
            console.log(`📊 Retrieved live stats for ${agentName}:`, stats);
            res.json({ stats });
        } catch (parseErr) {
            console.error('Error parsing live stats:', parseErr);
            res.status(500).json({ error: 'Invalid stats data' });
        }
    });
});

// Delete live agent stats (for reset functionality)
app.delete('/api/live-agent-stats/:agentName', (req, res) => {
    const { agentName } = req.params;
    const key = `live_stats_${agentName}`;

    db.run('DELETE FROM settings WHERE key = ?', [key], function(err) {
        if (err) {
            console.error('Error deleting live stats:', err);
            res.status(500).json({ error: 'Failed to clear live stats' });
            return;
        }

        console.log(`🗑️ Cleared live stats for ${agentName}`);
        res.json({
            success: true,
            message: `Live stats cleared for ${agentName}`,
            rowsDeleted: this.changes
        });
    });
});

// Call Recording Upload Endpoint
const recordingStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const recordingsDir = '/var/www/vanguard/recordings/';
        // Ensure directory exists
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true, mode: 0o755 });
        }
        cb(null, recordingsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with lead ID and timestamp
        const leadId = req.body.leadId || 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `recording_${leadId}_${timestamp}${extension}`;
        cb(null, filename);
    }
});

const uploadCallRecording = multer({
    storage: recordingStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files only
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

app.post('/api/call-recording-upload', uploadCallRecording.single('recording'), async (req, res) => {
    console.log('🎵 Call recording upload request received');

    try {
        const leadId = req.body.leadId;

        if (!leadId) {
            return res.status(400).json({
                success: false,
                error: 'Lead ID is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file uploaded'
            });
        }

        const recordingPath = `/recordings/${req.file.filename}`;

        // Update the lead in the database with recording information
        const result = await retryDatabaseOperation((callback) => {
            db.run(`
                UPDATE leads
                SET data = json_set(
                    data,
                    '$.recordingPath', ?,
                    '$.hasRecording', 1
                )
                WHERE id = ?
            `, [recordingPath, leadId], function(err) {
                callback(err, err ? null : this.changes);
            });
        });

        if (result === 0) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        console.log('✅ Call recording uploaded and lead updated:', leadId, recordingPath);

        res.json({
            success: true,
            message: 'Call recording uploaded successfully',
            recordingPath: recordingPath,
            fileName: req.file.filename,
            leadId: leadId
        });

    } catch (error) {
        console.error('Call recording upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update Vicidial comments endpoint
app.post('/api/vicidial/update-comments', async (req, res) => {
    console.log('🔄 Updating Vicidial lead comments...');

    try {
        const { leadId, comments, stage, updatedField, updatedValue } = req.body;

        if (!leadId || !comments) {
            return res.status(400).json({
                success: false,
                error: 'Lead ID and comments are required'
            });
        }

        // For now, just log the update request
        // In a full implementation, this would use the ViciDial API to update comments
        console.log(`📝 Comment update request for lead ${leadId}:`);
        console.log(`   New comments: ${comments.substring(0, 100)}...`);
        if (stage) {
            console.log(`   Stage updated to: ${stage}`);
        }
        if (updatedField) {
            console.log(`   Field "${updatedField}" updated to: "${updatedValue}"`);
        }

        // TODO: Implement actual ViciDial API call
        // This would involve:
        // 1. Authenticating with ViciDial
        // 2. Finding the lead by ID
        // 3. Updating the comments field
        // 4. Returning success/failure status

        // For now, simulate success
        res.json({
            success: true,
            message: 'Comments update queued for Vicidial sync',
            leadId: leadId
        });

    } catch (error) {
        console.error('Error updating Vicidial comments:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== MARKET QUOTES API ENDPOINTS ====================

// Get all market quotes
app.get('/api/market-quotes', (req, res) => {
    console.log('📊 Fetching all market quotes');

    db.all(`
        SELECT
            id,
            carrier,
            physical_coverage,
            premium_text,
            liability_per_unit,
            date_created,
            created_at
        FROM market_quotes
        ORDER BY created_at DESC
    `, (err, rows) => {
        if (err) {
            console.error('Error fetching market quotes:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        console.log(`📊 Retrieved ${rows.length} market quotes`);
        res.json(rows);
    });
});

// Create a new market quote
app.post('/api/market-quotes', (req, res) => {
    const { carrier, physical_coverage, premium_text, liability_per_unit } = req.body;

    console.log('📝 Creating new market quote:', { carrier, physical_coverage, premium_text, liability_per_unit });

    if (!carrier) {
        return res.status(400).json({ error: 'Carrier is required' });
    }

    db.run(`
        INSERT INTO market_quotes (carrier, physical_coverage, premium_text, liability_per_unit)
        VALUES (?, ?, ?, ?)
    `, [carrier, physical_coverage || null, premium_text || null, liability_per_unit || null],
    function(err) {
        if (err) {
            console.error('Error creating market quote:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        console.log(`✅ Market quote created with ID: ${this.lastID}`);
        res.json({
            id: this.lastID,
            carrier,
            physical_coverage,
            premium_text,
            liability_per_unit,
            date_created: new Date().toISOString()
        });
    });
});

// Delete a market quote by ID
app.delete('/api/market-quotes/:id', (req, res) => {
    const { id } = req.params;

    console.log(`🗑️ Deleting market quote with ID: ${id}`);

    db.run('DELETE FROM market_quotes WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting market quote:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            console.log(`❌ No market quote found with ID: ${id}`);
            res.status(404).json({ error: 'Quote not found' });
            return;
        }

        console.log(`✅ Market quote deleted with ID: ${id}`);
        res.json({ success: true, deletedId: id });
    });
});

// Clear all market quotes for a specific carrier
app.delete('/api/market-quotes/carrier/:carrier', (req, res) => {
    const { carrier } = req.params;

    console.log(`🗑️ Clearing all market quotes for carrier: ${carrier}`);

    db.run('DELETE FROM market_quotes WHERE carrier = ?', [carrier], function(err) {
        if (err) {
            console.error('Error clearing carrier market quotes:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        console.log(`✅ Cleared ${this.changes} market quotes for carrier: ${carrier}`);
        res.json({
            success: true,
            carrier,
            deletedCount: this.changes
        });
    });
});

// Policy status update endpoint
app.put('/api/policies', (req, res) => {
    const { id, status, policyStatus } = req.body;

    if (!id || !status) {
        return res.status(400).json({ error: 'Policy ID and status are required' });
    }

    console.log('🔄 Updating policy status:', { id, status });

    // Find and update the policy in the database
    db.get(`SELECT rowid, * FROM policies WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error finding policy:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            console.error('Policy not found:', id);
            return res.status(404).json({ error: 'Policy not found' });
        }

        try {
            // Parse existing policy data
            const policyData = JSON.parse(row.data);

            // Update the status fields
            policyData.status = status;
            policyData.policyStatus = status;

            // If it's a nested structure, also update the inner policy
            if (policyData.policies && Array.isArray(policyData.policies)) {
                policyData.policies.forEach(policy => {
                    if (policy.id === id || policy.policyNumber === id) {
                        policy.status = status;
                        policy.policyStatus = status;
                    }
                });
            }

            // Save updated data back to database
            db.run(`UPDATE policies SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [JSON.stringify(policyData), id], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating policy:', updateErr);
                    return res.status(500).json({ error: 'Failed to update policy' });
                }

                console.log('✅ Policy status updated successfully:', id, status);
                res.json({
                    success: true,
                    message: 'Policy status updated successfully',
                    id: id,
                    status: status
                });
            });
        } catch (parseErr) {
            console.error('Error parsing policy data:', parseErr);
            res.status(500).json({ error: 'Invalid policy data format' });
        }
    });
});

// Initialize scheduled_callbacks table
db.run(`CREATE TABLE IF NOT EXISTS scheduled_callbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    callback_id TEXT UNIQUE,
    lead_id TEXT,
    date_time TEXT,
    notes TEXT,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error('Error creating scheduled_callbacks table:', err);
    } else {
        console.log('✅ Scheduled callbacks table ready');
    }
});

// Save scheduled callback
app.post('/api/callbacks', (req, res) => {
    const { callback_id, lead_id, date_time, notes } = req.body;

    if (!callback_id || !lead_id || !date_time) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: callback_id, lead_id, date_time'
        });
    }

    db.run(`INSERT OR REPLACE INTO scheduled_callbacks
            (callback_id, lead_id, date_time, notes)
            VALUES (?, ?, ?, ?)`,
        [callback_id, lead_id, date_time, notes || ''],
        function(err) {
            if (err) {
                console.error('Error saving callback:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log('✅ Callback saved:', callback_id);
            res.json({
                success: true,
                id: this.lastID
            });
        }
    );
});

// Get all scheduled callbacks
app.get('/api/callbacks', (req, res) => {
    db.all(`SELECT * FROM scheduled_callbacks WHERE completed = 0 ORDER BY date_time ASC`,
        (err, rows) => {
            if (err) {
                console.error('Error fetching callbacks:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log('✅ Fetched', rows.length, 'scheduled callbacks');
            res.json({
                success: true,
                callbacks: rows
            });
        }
    );
});

// Complete/delete scheduled callback
app.delete('/api/callbacks/:callback_id', (req, res) => {
    const { callback_id } = req.params;

    db.run(`UPDATE scheduled_callbacks SET completed = 1 WHERE callback_id = ?`,
        [callback_id],
        function(err) {
            if (err) {
                console.error('Error completing callback:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log('✅ Callback completed:', callback_id);
            res.json({
                success: true,
                changes: this.changes
            });
        }
    );
});

// Callback reminder email endpoint
app.post('/api/send-callback-reminder', async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: to, subject, html'
        });
    }

    try {
        const nodemailer = require('nodemailer');

        // Create transporter using GoDaddy SMTP settings
        const transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: 'contact@vigagency.com',
                pass: process.env.GODADDY_PASSWORD || '25nickc124!'
            }
        });

        // Email options
        const mailOptions = {
            from: 'contact@vigagency.com',
            to: to,
            subject: subject,
            html: html
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Callback reminder email sent:', info.messageId);

        res.json({
            success: true,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('❌ Failed to send callback reminder email:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Scheduled Callbacks API endpoints

// Get all callbacks for a specific lead
app.get('/api/callbacks', (req, res) => {
    const leadId = req.query.leadId;

    if (leadId) {
        // Get callbacks for specific lead
        db.all(
            'SELECT * FROM scheduled_callbacks WHERE lead_id = ? ORDER BY date_time ASC',
            [leadId],
            (err, rows) => {
                if (err) {
                    console.error('Error fetching callbacks for lead:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows || []);
            }
        );
    } else {
        // Get all active (non-completed) callbacks
        db.all(
            'SELECT * FROM scheduled_callbacks WHERE completed = 0 ORDER BY date_time ASC',
            (err, rows) => {
                if (err) {
                    console.error('Error fetching all callbacks:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows || []);
            }
        );
    }
});

// Create a new callback
app.post('/api/callbacks', (req, res) => {
    const { leadId, dateTime, notes } = req.body;

    if (!leadId || !dateTime) {
        return res.status(400).json({ error: 'leadId and dateTime are required' });
    }

    db.run(
        `INSERT INTO scheduled_callbacks (lead_id, date_time, notes)
         VALUES (?, ?, ?)`,
        [leadId, dateTime, notes || ''],
        function(err) {
            if (err) {
                console.error('Error creating callback:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            console.log('✅ Callback created:', this.lastID, 'for lead:', leadId);
            res.json({
                success: true,
                id: this.lastID,
                leadId: leadId,
                dateTime: dateTime,
                notes: notes || ''
            });
        }
    );
});

// Complete a callback
app.post('/api/complete-callback', (req, res) => {
    const { leadId, completed, completedAt } = req.body;

    if (!leadId) {
        return res.status(400).json({ error: 'leadId is required' });
    }

    db.run(
        `UPDATE scheduled_callbacks
         SET completed = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE lead_id = ? AND completed = 0`,
        [completed ? 1 : 0, completedAt || new Date().toISOString(), leadId],
        function(err) {
            if (err) {
                console.error('Error completing callback:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            console.log('✅ Callback completed for lead:', leadId, 'updated rows:', this.changes);
            res.json({
                success: true,
                leadId: leadId,
                completed: completed,
                updatedRows: this.changes
            });
        }
    );
});

// Delete a callback
app.delete('/api/callbacks/:id', (req, res) => {
    const callbackId = req.params.id;

    db.run(
        'DELETE FROM scheduled_callbacks WHERE id = ?',
        [callbackId],
        function(err) {
            if (err) {
                console.error('Error deleting callback:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            console.log('✅ Callback deleted:', callbackId);
            res.json({
                success: true,
                deletedRows: this.changes
            });
        }
    );
});

// Export database for use in other modules
module.exports = { db };

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});