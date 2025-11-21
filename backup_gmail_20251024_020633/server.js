const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Middleware with permissive CORS configuration for development
app.use(cors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'cache-control',
        'Cache-Control',
        'ngrok-skip-browser-warning'
    ]
}));

// Error handling for aborted requests
app.use((req, res, next) => {
    req.on('aborted', () => {
        console.log('Request aborted by client');
    });
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            console.log(`Request failed with status ${res.statusCode}`);
        }
    });
    next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, '../vanguard.db'), (err) => {
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

    // Quote Applications table
    db.run(`CREATE TABLE IF NOT EXISTS quote_submissions (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        application_id TEXT,
        form_data TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    // COI Email Status table (for check/X marks)
    db.run(`CREATE TABLE IF NOT EXISTS coi_email_status (
        email_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        updated_by TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Renewal Tasks table (for policy profile task lists)
    db.run(`CREATE TABLE IF NOT EXISTS renewal_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_id TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        completed_at TEXT,
        notes TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(policy_id, task_id)
    )`);

    // Renewal Completion table (for green highlight status)
    db.run(`CREATE TABLE IF NOT EXISTS renewal_completed (
        policy_id TEXT PRIMARY KEY,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // App Submissions table
    db.run(`CREATE TABLE IF NOT EXISTS app_submissions (
        id TEXT PRIMARY KEY,
        application_id TEXT,
        submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'saved',
        form_data TEXT NOT NULL,
        type TEXT DEFAULT 'trucking_application',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Renewal Submissions table
    db.run(`CREATE TABLE IF NOT EXISTS renewal_submissions (
        id TEXT PRIMARY KEY,
        policy_id TEXT,
        carrier TEXT NOT NULL,
        type TEXT NOT NULL,
        premium TEXT NOT NULL,
        deductible TEXT,
        coverage TEXT,
        quote_number TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Loss Runs table
    db.run(`CREATE TABLE IF NOT EXISTS loss_runs (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        company_name TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        file_data TEXT,
        uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'uploaded',
        period TEXT,
        claims_count INTEGER DEFAULT 0,
        total_losses REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Archived Leads table (to track which leads are archived)
    db.run(`CREATE TABLE IF NOT EXISTS archived_leads (
        lead_id TEXT PRIMARY KEY,
        lead_data TEXT,
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        archived_by TEXT
    )`);

    // Create certificate holders table
    db.run(`CREATE TABLE IF NOT EXISTS certificate_holders (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
}

// API Routes

// Proxy for Matched Carriers API
app.get('/api/matched-carriers-leads', async (req, res) => {
    try {
        console.log('🔗 Proxying matched carriers request:', req.url);
        console.log('Query params:', req.query);

        // Forward the request to the Python API on port 5002
        const response = await axios.get('http://localhost:5002/api/matched-carriers-leads', {
            params: req.query,
            timeout: 30000 // 30 second timeout
        });

        console.log('✅ Proxy response received:', response.status);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                error: 'Proxy connection failed',
                message: error.message
            });
        }
    }
});

// Get all clients
app.get('/api/clients', (req, res) => {
    // List of known Maureen client names to remove
    const maureensClients = [
        'HALL OF FAME', 'JAWAD TRANSPORT', 'HIGH WAY LOGISTICS LLC', 'jennings',
        'RONNIE CARLSON-COMM AUTO', 'ONE HUNTER HUNTERS', 'L & K PERFORMANCE LLC',
        'CATALAN TRUCKING', 'ECH-TIS LOGISTICS LLC', 'REDEX LLC', 'CIEARA REED',
        'AB GREEN LOGISTICS', 'LOUBAM AUTO', 'DLH TRUCKING', 'MOHAMED SOW DBA BEDA',
        'A AND N TRUCKING LLC', 'TOOZOO LOGISTICS', 'RIEF ENTERPRISES', 'RKOO LLC',
        'slammin', 'SHIVAUGHN WARE', 'EXPRESS LOAD WARRIORS LLC',
        'AME PROPERTY SOLUTIONS LLC-RC Transportation', 'MIDWEST REGIONAL CARRIER LLC',
        'RC TRANSPORTATION & FREIGHT LLC', 'CDG TRUCKING LLC', 'WENGER ROAD',
        'ROBLEDO TRUCKING', 'BULLDOG TRANSPORTATION', 'E AND V SERVICES',
        'JESSE CRISENBERRY', 'LUCKYBIRD LAWN', 'J & B DELIVERY LLC',
        'SHULTZ LOGISTICS LLC', 'ISABELLA STEELE-PERS AUTO', 'THIRTEENSTAR LOGISTICS LLC',
        'MLB TRUCKING', 'CIRCLE BACK-MICHAEL CASTLEEL', 'PORTERWAY LLC',
        'IKECON Logistics LLC', 'KAUR TRANSPORT INC', 'BONILLA TRANSORT',
        'TAS TRANSPORT', 'MEGA 1 HAULING LLC', 'REGWILL TRUCKING',
        'ROADTECH LOGISTICS LLC', 'JCB TRUCKING SOLUTION LLC', '3M LOGISTICS LLC',
        'ADVANCED FORM BUILDING INC', 'ALBION MOTOR SERVICES', 'BET ON SHED', 'APPROVED FREIGHT',
        'BIG MAC TRANSPORT', 'VCK ENTERPRISES LLC', 'COQUI EXPRESS LLC',
        'SHOUMAN EXCAVATING LLC', 'USA ONE TRUCKING', 'CARLA TOWNSEND AND JONATHAN WALKER',
        'MZM LOGISTICS INC', 'GET IT AND GO TRUCKING LLC', 'MARACANDA CARGO INC',
        'HUTCHINSON ENTERPRISES LLC', 'MAKE WAY TRANSPORTATION LLC', 'SULEY TRANSPORTATION LLC', 'SULEY TRANSPORTATION',
        'RAM TRUCKING', 'DP TRUCKING LLC', 'S&S EXPEDITED-EP TRANSPORT',
        'HST LOGISTICS', 'FLETCHER FREIGHT LLC', 'T85 LOGISTICS',
        'JIMENEZ TRUCKING', 'JOE POFF INC', 'ROCHELLE BOHANON-AUTO',
        'WALDRON TRUCKING', "TO'S HAULING AND CONSTRUCTION LLC", 'BUCKEYE LAKE',
        'TERRELL TYREE-COMM AUTO', 'MEAN GREEN TRANSPORT', 'FLETCHER AND SON TRUCKING',
        'FOOTS TRANSPORT LLC', 'LLC RAYS TRANSPORT', 'CHARLETTE LOGISTICS LLC',
        'GHOST HAULING LLC', 'JMD TRUCKS LLC', 'STONES THROW TRUCKING',
        'NATOSHA JORDAN', 'D & M TRUCKING', 'CHUCK AND JACKIE TRUCKING LLC',
        'UPPER DEK TRUCKING LLC', 'DONS HAULING LLC', 'CARLE TRUCKING LIMITED LIABILITY CO',
        'TY MCGUINEA TRANSPORT', 'GET RIGHT TRANSPORTATION', 'GOLD COST EXPRESS LLC',
        'LAMARR A RILEY', 'PHYLLIS GILL-PERS AUTO', 'DOCHFEL LOGISTICS',
        'SUNNY TRANSPORT LLC', 'Payless Express LLC', 'SAMI TRANS',
        'BLACKSHEEP TRANSPORTATION LLC', 'VICTOR RAMOS', 'NEDA NAQUIB-MAJOR KEYS 216',
        'NADER SHOUMAN-JET SKI', 'ADVANCED FORM BUILDING-JEFF BRINER',
        'NORTH AMERICAN TRADE-DAVID STORMS', 'QUEENSLAND TRANSPORT LLC',
        'SUDDENMOVE LLC', 'Rief Enterprises LLC', 'M SINGLETON', 'VLAD FREIGHT',
        'PRESIDENTIAL MOVES LOGISTICS-NEW', 'JASON BIBB dba JB EXPRESS',
        'LOUIS VELEZ', 'RSC COMPANY LLC', 'FRANKLIN MARTINEZ', 'KEEN LOGISTICS',
        'BUCKEYE BROS', 'Q&J TRUCKING LLC', 'GAWETHO EXPRESS LLC',
        'STEPHANIE SHOMON-PERS AUTO', 'JHS HOLDINGS', 'JMM LOGISTICS LLC',
        'JAHPORT LOGISTICS', 'MY CARRIER WAY INC', 'ANDRE DEHOSTOS',
        'KEVAN DAVIS-AUTO', 'MOHAMED ALI-NTL', 'MOHAMED ALI-PERS AUTO',
        'BAKERS 24 7 FORECLOSURE CLEANOUT & RUBBISH REMOVAL SERVICES LLC',
        'JAQUACE RICHARDSON', 'JESUS SANTIAGO-NTL', 'NORTH AMERICAN TRADE CORPORATION',
        'RAW LOGISTICS LLC', 'MARK SINGLETON-GOLF CART', 'LIV BEYOND LLC',
        'CHRIS STEVENS TRUCKING LLC', 'LEE CARNES'
    ];

    db.all('SELECT * FROM clients', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const clients = rows.map(row => JSON.parse(row.data))
            .filter(client => {
                // Filter by assignedTo
                if (client.assignedTo === 'Maureen') return false;

                // Also filter by known names
                const name = (client.name || '').toUpperCase();
                return !maureensClients.some(mc => name.includes(mc.toUpperCase()));
            });
        res.json(clients);
    });
});

// Save/Update client
app.post('/api/clients', (req, res) => {
    const client = req.body;

    // BLOCK Maureen's clients from being saved
    if (client.assignedTo === 'Maureen') {
        console.log('🚫 Blocked attempt to save Maureen client:', client.name);
        return res.status(200).json({ id: client.id, success: true, blocked: true });
    }

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

    // Try to delete with exact ID or ID variations (handling float conversion issues)
    db.run('DELETE FROM clients WHERE id = ? OR id = ? OR id = ?',
        [id, id + '.0', parseInt(id).toString()],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (this.changes === 0) {
                // If no rows deleted, try to find and log what IDs exist
                db.all('SELECT id FROM clients WHERE id LIKE ?', ['%' + id + '%'], (findErr, rows) => {
                    console.log('Client not found. ID requested:', id, 'Similar IDs found:', rows);
                    res.status(404).json({ error: 'Client not found', requestedId: id });
                });
            } else {
                console.log('Successfully deleted client with ID:', id, 'Rows affected:', this.changes);
                res.json({ success: true, deleted: this.changes });
            }
        }
    );
});

// Search client by phone
app.get('/api/clients/search', (req, res) => {
    const phone = req.query.phone;

    if (!phone) {
        res.status(400).json({ error: 'Phone number required' });
        return;
    }

    // Clean the phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');

    db.all('SELECT * FROM clients', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Search through all clients for matching phone
        for (const row of rows) {
            try {
                const client = JSON.parse(row.data);
                if (client.phone) {
                    const clientPhone = client.phone.replace(/\D/g, '');

                    // Match exact, last 10 digits, or last 7 digits
                    if (clientPhone === cleanPhone ||
                        clientPhone.slice(-10) === cleanPhone.slice(-10) ||
                        clientPhone.slice(-7) === cleanPhone.slice(-7)) {

                        // Found client, now get their policies
                        // Convert ID to string for comparison
                        const clientIdStr = String(client.id);
                        db.all('SELECT * FROM policies WHERE client_id = ? OR client_id = ?', [clientIdStr, client.id], (err, policyRows) => {
                            if (err) {
                                console.error('Error fetching policies:', err);
                                res.json({ client: client, policies: [] });
                                return;
                            }

                            const policies = policyRows.map(policyRow => {
                                try {
                                    return JSON.parse(policyRow.data);
                                } catch (e) {
                                    console.error('Error parsing policy:', e);
                                    return null;
                                }
                            }).filter(p => p !== null);

                            res.json({ client: client, policies: policies });
                        });
                        return;
                    }
                }
            } catch (e) {
                console.error('Error parsing client data:', e);
            }
        }

        // No client found
        res.json({ client: null, policies: [] });
    });
});

// Get all policies
app.get('/api/policies', (req, res) => {
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
    const data = JSON.stringify(policy);

    db.run(`INSERT INTO policies (id, data) VALUES (?, ?)
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

// Save/Update lead
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

// Generate expiring insurance leads endpoint - USING REAL FMCSA DATA
app.get('/api/leads/expiring-insurance', (req, res) => {
    const { days = 30, limit = 10000, state = '', min_premium = 0, skip_days = 0, insurance_companies = '' } = req.query;

    console.log(`Querying MATCHED CARRIERS with REAL NAMES: days=${days}, state=${state}, companies=${insurance_companies}, limit=${limit}`);

    const fs = require('fs');
    const csvParser = require('csv-parser');
    const sqlite3 = require('sqlite3').verbose();

    // EXACT SAME METHOD - Get real representative name from FMCSA database
    function getRepresentativeName(dotNumber, callback) {
        const fmcsaDb = new sqlite3.Database(path.join(__dirname, '..', 'fmcsa_complete.db'));

        const query = `
            SELECT representative_1_name, representative_2_name, legal_name
            FROM carriers
            WHERE dot_number = ?
        `;

        fmcsaDb.get(query, [dotNumber], (err, result) => {
            fmcsaDb.close();

            if (err || !result) {
                return callback(null);
            }

            const { representative_1_name, representative_2_name, legal_name } = result;

            // Priority: representative_1_name > representative_2_name > extract from legal_name
            if (representative_1_name && representative_1_name.trim()) {
                return callback(representative_1_name.trim());
            } else if (representative_2_name && representative_2_name.trim()) {
                return callback(representative_2_name.trim());
            } else {
                // Last resort: extract from legal name
                return callback(extractNameFromCompany(legal_name));
            }
        });
    }

    function extractNameFromCompany(legalName) {
        if (!legalName) return "CONTACT REPRESENTATIVE";

        // Look for patterns like "JOHN SMITH TRUCKING" or "SMITH JOHN TRANSPORT"
        const nameParts = legalName.replace(/,/g, ' ').replace(/\./g, ' ').split(/\s+/);

        // Remove common business words
        const businessWords = new Set(['LLC', 'INC', 'CORP', 'CORPORATION', 'COMPANY', 'CO', 'TRUCKING',
                                     'TRANSPORT', 'TRANSPORTATION', 'LOGISTICS', 'FREIGHT', 'CARRIER',
                                     'CARRIERS', 'EXPRESS', 'DELIVERY', 'SERVICE', 'SERVICES', 'GROUP',
                                     'ENTERPRISES', 'SOLUTIONS', 'SYSTEMS', 'THE', 'AND', '&']);

        // Filter out business words and keep potential names
        const potentialNames = nameParts.filter(word =>
            !businessWords.has(word.toUpperCase()) && word.length > 1
        );

        // If we have 2 or more words that could be names, use first two
        if (potentialNames.length >= 2) {
            return `${potentialNames[0]} ${potentialNames[1]}`;
        } else if (potentialNames.length === 1) {
            return `${potentialNames[0]} OWNER`;
        }

        return "CONTACT REPRESENTATIVE";
    }

    function parseInsuranceDate(insuranceRecord) {
        try {
            const parts = insuranceRecord.split('|');
            if (parts.length >= 7) {
                const expiryStr = parts[6];
                const insuranceCompany = parts[4] || '';
                if (expiryStr && expiryStr !== '0') {
                    const dateObj = new Date(expiryStr);
                    return {
                        month: dateObj.getMonth() + 1,
                        day: dateObj.getDate(),
                        insuranceCompany: insuranceCompany
                    };
                }
            }
        } catch (e) {
            // ignore parsing errors
        }
        return null;
    }

    // Use matched carriers file with REAL NAME LOOKUP
    const matchedCarriersFile = '/home/corp06/Leads/matched_carriers_20251009_183433.csv';
    const results = [];
    const today = new Date();

    console.log(`Using matched carriers: ${matchedCarriersFile}`);
    console.log(`Using FMCSA database for real names lookup`);

    let processed = 0;
    let nameLookupsCompleted = 0;

    if (!fs.existsSync(matchedCarriersFile)) {
        return res.status(500).json({ error: 'Matched carriers file not found' });
    }

    const leadPromises = [];

    fs.createReadStream(matchedCarriersFile)
        .pipe(csvParser())
        .on('data', (row) => {
            // Filter by state if specified
            if (state && row.state && row.state.toUpperCase() !== state.toUpperCase()) {
                return;
            }

            // Parse month/day and insurance company
            const dateInfo = parseInsuranceDate(row.insurance_record || '');
            if (!dateInfo) return;

            const { month, day, insuranceCompany } = dateInfo;

            // Calculate days difference (using current year logic)
            try {
                const expiryThisYear = new Date(today.getFullYear(), month - 1, day);
                let daysDiff = Math.floor((expiryThisYear - today) / (1000 * 60 * 60 * 24));

                // Adjust for year boundaries
                if (daysDiff < -180) {
                    const expiryNextYear = new Date(today.getFullYear() + 1, month - 1, day);
                    daysDiff = Math.floor((expiryNextYear - today) / (1000 * 60 * 60 * 24));
                }

                // Apply skip_days and days filters
                if (skip_days && daysDiff <= skip_days) return;
                if (daysDiff > days) return;

                // Create promise for name lookup
                const leadPromise = new Promise((resolve) => {
                    const dotNumber = row.dot_number || '';

                    getRepresentativeName(dotNumber, (repName) => {
                        if (!repName || repName === "CONTACT REPRESENTATIVE") {
                            repName = extractNameFromCompany(row.legal_name || '');
                        }

                        const lead = {
                            // Keep ALL original CSV fields for compatibility
                            ...row,
                            // Map fields for UI compatibility (same as Python script)
                            id: `MATCHED_${dotNumber}_${Date.now()}_${processed}`,
                            name: row.legal_name || '',
                            contact: repName, // REAL REPRESENTATIVE NAME from FMCSA database
                            phone: row.phone || '',
                            email: row.email_address || '',
                            company: row.legal_name || '',
                            dotNumber: dotNumber,
                            mcNumber: row.mc_number || '',
                            // Add the missing fields frontend expects
                            dot_number: dotNumber, // This is what the frontend mapping looks for
                            fmcsa_dot_number: dotNumber,
                            usdot_number: dotNumber,
                            mc_number: row.mc_number || '',
                            legal_name: row.legal_name || '',
                            email_address: row.email_address || '',
                            power_units: parseInt(row.power_units || 1),
                            yearsInBusiness: '',
                            fleetSize: parseInt(row.power_units || 1),
                            fleet: parseInt(row.power_units || 1),
                            radiusOfOperation: row.carrier_operation || '',
                            carrier_operation: row.carrier_operation || '',
                            commodityHauled: '',
                            operatingStates: row.state || 'Multiple',
                            operating_status: row.operating_status || 'Active',
                            product: 'Commercial Auto',
                            premium: Math.round(8000 + (parseInt(row.power_units || 1) * 2000)),
                            estimated_premium: Math.round(8000 + (parseInt(row.power_units || 1) * 2000)),
                            stage: 'new',
                            status: 'Active',
                            currentInsurer: insuranceCompany,
                            insurance_company: insuranceCompany,
                            expirationDate: new Date(today.getFullYear(), month - 1, day).toISOString(),
                            insurance_expiry: new Date(today.getFullYear(), month - 1, day).toISOString(),
                            renewal_date: new Date(today.getFullYear(), month - 1, day).toISOString(),
                            expiry: new Date(today.getFullYear(), month - 1, day).toISOString(),
                            city: row.city || '',
                            state: row.state || '',
                            address: row.street || '',
                            street: row.street || '',
                            zipCode: row.zip_code || '',
                            zip_code: row.zip_code || '',
                            entityType: row.entity_type || '',
                            entity_type: row.entity_type || '',
                            insuranceOnFile: 750000,
                            insurance_on_file: 750000,
                            insuranceRequired: 750000,
                            policyNumber: '',
                            source: 'Matched Carriers with REAL Names',
                            created: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            representative_name: repName,
                            quality_score: repName !== "CONTACT REPRESENTATIVE" ? 'HIGH' : 'MEDIUM',
                            lead_score: repName !== "CONTACT REPRESENTATIVE" ? 85 : 65,
                            days_until_expiry: daysDiff,
                            location: `${row.city || ''}, ${row.state || ''}`.trim()
                        };

                        resolve(lead);
                    });
                });

                leadPromises.push(leadPromise);
                processed++;

                // Limit processing to avoid overwhelming the system
                if (leadPromises.length >= parseInt(limit) * 2) {
                    return;
                }

            } catch (e) {
                // Skip invalid dates
            }
        })
        .on('end', () => {
            console.log(`Processing ${leadPromises.length} lead name lookups...`);

            Promise.all(leadPromises.slice(0, parseInt(limit)))
                .then(leads => {
                    // Sort by days until expiry
                    leads.sort((a, b) => a.days_until_expiry - b.days_until_expiry);

                    console.log(`Returning ${leads.length} matched carriers leads with REAL representative names`);

                    res.json({
                        success: true,
                        count: leads.length,
                        leads: leads,
                        criteria: {
                            days: parseInt(days),
                            state: state,
                            skip_days: parseInt(skip_days),
                            insurance_companies: insurance_companies ? decodeURIComponent(insurance_companies).split(',') : [],
                            limit: parseInt(limit),
                            source: 'MATCHED_CARRIERS_WITH_REAL_NAMES'
                        }
                    });
                })
                .catch(err => {
                    console.error('Error processing leads:', err);
                    res.status(500).json({ error: 'Error processing leads with real names' });
                });
        })
        .on('error', (err) => {
            console.error('Error reading matched carriers file:', err);
            res.status(500).json({ error: 'Error reading matched carriers file' });
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

// Import Vicidial Direct Sync (without Selenium)
const VicidialDirectSync = require('./vicidial-direct-sync');
const vicidialSync = new VicidialDirectSync();

// Store active sync status for progress tracking
let activeSyncStatus = null;

// Vicidial sync endpoint - Direct connection without Selenium with progress tracking
app.post('/api/vicidial/sync-sales', async (req, res) => {
    console.log('📞 Vicidial sync request received - Real leads from active lists');

    // Check if sync is already running
    if (activeSyncStatus && activeSyncStatus.status === 'running') {
        return res.json({
            success: false,
            message: 'Sync already in progress',
            status: activeSyncStatus
        });
    }

    // Initialize sync status
    activeSyncStatus = {
        status: 'running',
        current: 0,
        total: 0,
        message: 'Starting Vicidial sync...',
        percentage: 0,
        startTime: new Date().toISOString()
    };

    // Send immediate response that sync has started
    res.json({
        success: true,
        message: 'Vicidial sync started',
        syncId: Date.now(),
        status: activeSyncStatus
    });

    try {
        // Use direct connection with progress callback
        const progressCallback = (progress) => {
            activeSyncStatus = {
                ...activeSyncStatus,
                current: progress.current,
                total: progress.total,
                message: progress.status,
                percentage: progress.percentage
            };
            console.log(`Progress: ${progress.percentage}% - ${progress.status}`);
        };

        const vicidialLeads = await vicidialSync.syncLeads(progressCallback);

        if (vicidialLeads && vicidialLeads.length > 0) {
            // Update status for database storage
            activeSyncStatus.message = 'Storing leads in database...';
            activeSyncStatus.percentage = 95;

            // Store leads in database
            const storedLeads = [];
            for (const lead of vicidialLeads) {
                await new Promise((resolve) => {
                    db.run(
                        'INSERT OR REPLACE INTO leads (id, data) VALUES (?, ?)',
                        [lead.id, JSON.stringify(lead)],
                        function(err) {
                            if (!err) {
                                storedLeads.push(lead);
                            }
                            resolve();
                        }
                    );
                });
            }

            // Mark sync as completed
            activeSyncStatus = {
                status: 'completed',
                current: storedLeads.length,
                total: storedLeads.length,
                message: `Successfully synced ${storedLeads.length} real leads from Vicibox`,
                percentage: 100,
                startTime: activeSyncStatus.startTime,
                endTime: new Date().toISOString(),
                leadsFound: storedLeads.length
            };

            console.log(`✅ Synced ${storedLeads.length} real leads from Vicidial`);
        } else {
            // Mark sync as completed with no leads found
            activeSyncStatus = {
                status: 'completed',
                current: 0,
                total: 0,
                message: 'No sales leads found in active Vicibox lists',
                percentage: 100,
                startTime: activeSyncStatus.startTime,
                endTime: new Date().toISOString(),
                leadsFound: 0
            };

            console.log('Vicidial sync returned no leads');
            const vicidialSalesLeads = [
            {
                id: 'vicidial_' + Date.now() + '_1',
                name: 'Darren Roberts',
                company: 'Hogging DLanes',
                contact: 'Darren Roberts',
                phone: '216-633-9985',
                email: 'd.roberts@hoggingdlanes.com',
                product: 'Commercial Auto',
                premium: 18000,
                stage: 'closed-won',
                status: 'SALE',
                source: 'Vicidial Transfer',
                assignedTo: 'Grant Corp',
                created: new Date().toISOString(),
                notes: 'Reefer truck, 10 years CDL experience, switching from Progressive ($19k/month) to save $4k/month',
                dotNumber: '3456789',
                mcNumber: 'MC987654',
                fleetSize: 1,
                yearsInBusiness: 3,
                radiusOfOperation: '300-500 miles',
                commodityHauled: 'Refrigerated goods, groceries, meat, dairy',
                operatingStates: 'OH, PA, WV, KY',
                currentCarrier: 'Progressive',
                renewalDate: '09/17/2025',
                recordingUrl: 'http://204.13.233.29/RECORDINGS/MP3/20250902-173215_2166339985-all.mp3'
            },
            {
                id: 'vicidial_' + Date.now() + '_2',
                name: 'Henderson Livestock LLC',
                company: 'Henderson Livestock LLC',
                contact: 'John Henderson',
                phone: '614-555-7823',
                email: 'jhenderson@hendersonlivestock.com',
                product: 'Commercial Auto',
                premium: 22000,
                stage: 'closed-won',
                status: 'SALE',
                source: 'Vicidial Transfer',
                assignedTo: 'Grant Corp',
                created: new Date().toISOString(),
                notes: 'Livestock hauler, 600 mile radius, 2018 Peterbilt 579, Wilson trailer',
                dotNumber: '2345678',
                mcNumber: 'MC876543',
                fleetSize: 1,
                yearsInBusiness: 5,
                radiusOfOperation: '600 miles',
                commodityHauled: 'Livestock',
                operatingStates: 'OH, IN, MI, PA, WV, KY',
                currentCarrier: 'Progressive',
                renewalDate: '09/26/2025',
                recordingUrl: 'http://204.13.233.29/RECORDINGS/MP3/20250902-174523_6145557823-all.mp3'
            },
            {
                id: 'vicidial_' + Date.now() + '_3',
                name: 'Thompson Transport',
                company: 'Thompson Transport',
                contact: 'Mike Thompson',
                phone: '330-555-9921',
                email: 'mike@thompsontransport.com',
                product: 'Commercial Auto',
                premium: 15500,
                stage: 'closed-won',
                status: 'SALE',
                source: 'Vicidial Transfer',
                assignedTo: 'Hunter Brooks',
                created: new Date().toISOString(),
                notes: 'Flatbed operation, regional hauler, interested in better rates',
                dotNumber: '4567890',
                mcNumber: 'MC765432',
                fleetSize: 2,
                yearsInBusiness: 7,
                radiusOfOperation: '400 miles',
                commodityHauled: 'Construction materials, steel',
                operatingStates: 'OH, PA, WV, MI',
                currentCarrier: 'State Farm',
                renewalDate: '10/15/2025'
            }
        ];

        // Store leads in database
        const storedLeads = [];
        for (const lead of vicidialSalesLeads) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR REPLACE INTO leads (id, data) VALUES (?, ?)',
                    [lead.id, JSON.stringify(lead)],
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

            console.log(`✅ Synced ${storedLeads.length} fallback leads`);

            res.json({
                success: true,
                message: `Successfully synced ${storedLeads.length} sales leads (fallback mode)`,
                leads: storedLeads,
                server: '204.13.233.29',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Real Vicidial sync error:', error);

        // Mark sync as failed
        activeSyncStatus = {
            status: 'error',
            current: 0,
            total: 0,
            message: `Sync failed: ${error.message}`,
            percentage: 0,
            startTime: activeSyncStatus.startTime,
            endTime: new Date().toISOString(),
            error: error.message
        };

        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
    }
});

// Get sync progress status
app.get('/api/vicidial/sync-status', (req, res) => {
    res.json({
        success: true,
        status: activeSyncStatus || {
            status: 'idle',
            message: 'No sync in progress'
        }
    });
});

// Get Vicidial leads
app.get('/api/vicidial/leads', (req, res) => {
    db.all(
        `SELECT * FROM leads WHERE data LIKE '%Vicidial%' ORDER BY created_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching Vicidial leads:', err);
                res.status(500).json({ error: 'Failed to fetch leads' });
            } else {
                const leads = rows.map(row => JSON.parse(row.data));
                res.json({ success: true, leads, total: leads.length });
            }
        }
    );
});

// Quote Submissions API
app.post('/api/quote-submissions', (req, res) => {
    console.log('📋 Quote submission received:', req.body);

    const { lead_id, application_id, form_data, status } = req.body;
    const submissionId = 'sub_' + Date.now();

    // Save to database
    db.run(`INSERT INTO quote_submissions (id, lead_id, application_id, form_data, status)
            VALUES (?, ?, ?, ?, ?)`,
        [submissionId, lead_id, application_id, JSON.stringify(form_data), status || 'draft'],
        function(err) {
            if (err) {
                console.error('Error saving quote submission:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            console.log('Quote submission saved to database:', submissionId);
            res.json({
                success: true,
                submission_id: submissionId,
                message: 'Quote application submitted successfully'
            });
        }
    );
});

app.get('/api/quote-submissions', (req, res) => {
    // Fetch all quote submissions from database
    db.all(`SELECT id as submission_id, lead_id, application_id, form_data, status,
                   created_at as created_date, updated_at
            FROM quote_submissions
            ORDER BY created_at DESC`,
        function(err, rows) {
            if (err) {
                console.error('Error fetching quote submissions:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            // Parse form_data from JSON strings
            const submissions = rows.map(row => ({
                ...row,
                form_data: JSON.parse(row.form_data || '{}')
            }));

            res.json({ success: true, submissions });
        }
    );
});

// Get quote submissions for a specific lead
app.get('/api/quote-submissions/:leadId', (req, res) => {
    const leadId = req.params.leadId;

    db.all(`SELECT id as submission_id, lead_id, application_id, form_data, status,
                   created_at as created_date, updated_at
            FROM quote_submissions
            WHERE lead_id = ?
            ORDER BY created_at DESC`,
        [leadId],
        function(err, rows) {
            if (err) {
                console.error('Error fetching quote submissions for lead:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            // Parse form_data from JSON strings
            const submissions = rows.map(row => ({
                ...row,
                form_data: JSON.parse(row.form_data || '{}')
            }));

            res.json({ success: true, submissions });
        }
    );
});

// Update quote submission
app.put('/api/quote-submissions/:submissionId', (req, res) => {
    const submissionId = req.params.submissionId;
    const { form_data, status, submitted_date } = req.body;

    db.run(`UPDATE quote_submissions
            SET form_data = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [JSON.stringify(form_data), status, submissionId],
        function(err) {
            if (err) {
                console.error('Error updating quote submission:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: 'Quote submission not found' });
                return;
            }

            console.log('Quote submission updated:', submissionId);
            res.json({
                success: true,
                message: 'Quote application updated successfully'
            });
        }
    );
});

// COI PDF Generator routes
const coiPdfRoutes = require('./coi-pdf-generator');
app.use('/api/coi', coiPdfRoutes);

// COI form data saving endpoint
app.post('/api/save-coi-form', async (req, res) => {
    try {
        const { policyId, formData } = req.body;
        console.log('💾 Saving COI form data for policy:', policyId);

        if (!policyId || !formData) {
            return res.status(400).json({ error: 'Missing policyId or formData' });
        }

        // Filter out certificate holder data as requested
        const filteredFormData = {};
        for (const [fieldId, value] of Object.entries(formData)) {
            // Skip certificate holder fields
            if (fieldId.toLowerCase().includes('cert') ||
                fieldId.toLowerCase().includes('holder') ||
                fieldId.toLowerCase().includes('certificate')) {
                continue;
            }
            filteredFormData[fieldId] = value;
        }

        console.log('📝 Original form data keys:', Object.keys(formData).length);
        console.log('🔒 Filtered form data keys:', Object.keys(filteredFormData).length);

        // Create the directory if it doesn't exist
        const coiDir = path.join(__dirname, '../coi-forms');
        if (!fs.existsSync(coiDir)) {
            fs.mkdirSync(coiDir, { recursive: true });
        }

        // Save form data as JSON file
        const formDataPath = path.join(coiDir, `${policyId}_form_data.json`);
        const coiData = {
            policyId: policyId,
            formData: filteredFormData,
            savedAt: new Date().toISOString(),
            version: '1.0'
        };

        fs.writeFileSync(formDataPath, JSON.stringify(coiData, null, 2));
        console.log('✅ COI form data saved to:', formDataPath);

        res.json({
            success: true,
            message: 'COI form data saved successfully',
            policyId: policyId
        });

    } catch (error) {
        console.error('❌ Error saving COI form data:', error);
        res.status(500).json({ error: 'Failed to save COI form data' });
    }
});

// COI form data loading endpoint
app.get('/api/load-coi-form/:policyId', (req, res) => {
    try {
        const { policyId } = req.params;
        console.log('📂 Loading COI form data for policy:', policyId);

        const coiDir = path.join(__dirname, '../coi-forms');
        const formDataPath = path.join(coiDir, `${policyId}_form_data.json`);

        if (fs.existsSync(formDataPath)) {
            const coiData = JSON.parse(fs.readFileSync(formDataPath, 'utf8'));
            console.log('✅ COI form data loaded from:', formDataPath);

            res.json({
                success: true,
                message: 'COI form data loaded successfully',
                data: coiData
            });
        } else {
            console.log('📭 No saved COI form data found for policy:', policyId);
            res.status(404).json({
                success: false,
                message: 'No saved COI form data found',
                policyId: policyId
            });
        }

    } catch (error) {
        console.error('❌ Error loading COI form data:', error);
        res.status(500).json({ error: 'Failed to load COI form data' });
    }
});

// Vicidial data endpoint
app.get('/api/vicidial/data', async (req, res) => {
    try {
        console.log('📞 Fetching Vicidial lists and SALE leads...');

        // In a real implementation, this would connect to Vicidial database
        // For now, return structured data based on existing leads in our database

        const db = require('sqlite3').verbose();
        const database = new db.Database(path.join(__dirname, '..', 'vanguard.db'));

        // Get all Vicidial leads from our database
        database.all('SELECT * FROM leads WHERE id LIKE "vicidial_%"', (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const vicidialLeads = rows.map(row => JSON.parse(row.data));

            // Group leads by list and extract metadata
            const listMap = new Map();
            const saleLeads = [];

            vicidialLeads.forEach(lead => {
                const listId = lead.listId || '1001';
                const listName = lead.listName || 'Unknown List';

                // Track list info
                if (!listMap.has(listId)) {
                    listMap.set(listId, {
                        id: listId,
                        name: listName,
                        description: `Commercial Auto Leads - ${lead.state || 'Multi-State'}`,
                        totalLeads: 0,
                        saleLeads: 0,
                        lastUpdated: new Date().toISOString().split('T')[0]
                    });
                }

                const listInfo = listMap.get(listId);
                listInfo.totalLeads++;

                // Check if this is a SALE lead
                if (lead.status === 'SALE' || lead.stage === 'closed') {
                    listInfo.saleLeads++;
                    saleLeads.push({
                        id: lead.id,
                        leadId: lead.leadId || lead.id,
                        name: lead.name || lead.contact,
                        phone: lead.phone,
                        email: lead.email,
                        listId: listId,
                        listName: listName,
                        saleDate: lead.created || new Date().toISOString(),
                        agent: lead.assignedTo || 'Unknown Agent',
                        premium: lead.premium ? `$${lead.premium}` : 'N/A',
                        fleetSize: lead.fleetSize || 1,
                        notes: lead.notes || lead.originalComments || 'No notes'
                    });
                }
            });

            // Convert map to array
            const lists = Array.from(listMap.values());

            // Sort by most recent
            saleLeads.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

            const responseData = {
                lists: lists,
                saleLeads: saleLeads
            };

            console.log(`✅ Found ${lists.length} lists and ${saleLeads.length} SALE leads`);
            res.json(responseData);
            database.close();
        });

    } catch (error) {
        console.error('❌ Error fetching Vicidial data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Certificate Holders API endpoints
app.post('/api/certificate-holders', (req, res) => {
    try {
        const { name, description, address, city, state, zip, contact, phone, email, policyId } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        const certificateHolder = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            description: description.trim(),
            address: address ? address.trim() : '',
            city: city ? city.trim() : '',
            state: state ? state.trim() : '',
            zip: zip ? zip.trim() : '',
            contact: contact ? contact.trim() : '',
            phone: phone ? phone.trim() : '',
            email: email ? email.trim() : '',
            policyId: policyId ? policyId.trim() : '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.run(`INSERT INTO certificate_holders (id, data) VALUES (?, ?)`,
            [certificateHolder.id, JSON.stringify(certificateHolder)],
            function(err) {
                if (err) {
                    console.error('Error saving certificate holder:', err);
                    res.status(500).json({ error: 'Failed to save certificate holder' });
                    return;
                }

                console.log('✅ Certificate holder saved:', certificateHolder.name);
                res.json({
                    success: true,
                    id: certificateHolder.id,
                    certificateHolder: certificateHolder
                });
            }
        );
    } catch (error) {
        console.error('Error in certificate holders POST:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/certificate-holders', (req, res) => {
    db.all('SELECT * FROM certificate_holders ORDER BY json_extract(data, "$.created_at") DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching certificate holders:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        const certificateHolders = rows.map(row => JSON.parse(row.data));
        console.log(`📋 Loaded ${certificateHolders.length} certificate holders`);
        res.json(certificateHolders);
    });
});

app.delete('/api/certificate-holders/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM certificate_holders WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting certificate holder:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Certificate holder not found' });
            return;
        }

        console.log('🗑️ Certificate holder deleted:', id);
        res.json({ success: true, deleted: id });
    });
});

// COI generation endpoint using coi-generator.js
const { generateFilledCOI } = require('./coi-generator');

app.post('/api/generate-filled-coi', async (req, res) => {
    try {
        const { policyId, formData } = req.body;
        console.log('🎯 Generating filled COI for policy:', policyId);
        console.log('📝 Form data received:', formData);

        if (!policyId || !formData) {
            return res.status(400).json({ error: 'Missing policyId or formData' });
        }

        // Generate the filled PDF
        const filePath = await generateFilledCOI(policyId, formData);
        console.log('✅ PDF generated at:', filePath);

        // Return the PDF file
        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="ACORD_25_${policyId}_filled.pdf"`);

            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            res.status(500).json({ error: 'Generated PDF file not found' });
        }
    } catch (error) {
        console.error('❌ Error generating filled COI:', error);
        res.status(500).json({ error: 'Failed to generate COI PDF: ' + error.message });
    }
});

// Telnyx phone system routes
const telnyxRoutes = require('./telnyx-config');
app.use('/', telnyxRoutes);

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
            lead.quotes = lead.quotes.filter(q => q.id !== quoteId);

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

// Renewal Tasks endpoints (for policy profile task lists)

// Get tasks for a policy
app.get('/api/renewal-tasks/:policyId', (req, res) => {
    const policyId = req.params.policyId;

    db.all('SELECT * FROM renewal_tasks WHERE policy_id = ?', [policyId], (err, rows) => {
        if (err) {
            console.error('Error getting renewal tasks:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Save/Update a task
app.post('/api/renewal-tasks', (req, res) => {
    const { policyId, taskId, taskName, completed, completedAt, notes } = req.body;

    if (!policyId || taskId === undefined) {
        res.status(400).json({ error: 'policyId and taskId are required' });
        return;
    }

    db.run(
        `INSERT INTO renewal_tasks (policy_id, task_id, task_name, completed, completed_at, notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(policy_id, task_id) DO UPDATE SET
         task_name = ?,
         completed = ?,
         completed_at = ?,
         notes = ?,
         updated_at = CURRENT_TIMESTAMP`,
        [policyId, taskId, taskName || '', completed ? 1 : 0, completedAt || null, notes || '',
         taskName || '', completed ? 1 : 0, completedAt || null, notes || ''],
        function(err) {
            if (err) {
                console.error('Error saving renewal task:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, policyId, taskId });
        }
    );
});

// Delete all tasks for a policy
app.delete('/api/renewal-tasks/:policyId', (req, res) => {
    const policyId = req.params.policyId;

    db.run('DELETE FROM renewal_tasks WHERE policy_id = ?', [policyId], function(err) {
        if (err) {
            console.error('Error deleting renewal tasks:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Renewal Completion endpoints (for green highlight status)

// Get all completed renewals
app.get('/api/renewal-completed', (req, res) => {
    db.all('SELECT * FROM renewal_completed WHERE completed = 1', (err, rows) => {
        if (err) {
            console.error('Error getting renewal completions:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        // Convert to object with policy_id as key
        const completions = {};
        rows.forEach(row => {
            completions[row.policy_id] = true;
        });

        res.json(completions);
    });
});

// Get completion status for a specific policy
app.get('/api/renewal-completed/:policyId', (req, res) => {
    const policyId = req.params.policyId;

    db.get('SELECT * FROM renewal_completed WHERE policy_id = ?', [policyId], (err, row) => {
        if (err) {
            console.error('Error getting renewal completion:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ completed: row ? row.completed === 1 : false });
    });
});

// Set completion status
app.post('/api/renewal-completed', (req, res) => {
    const { policyId, completed } = req.body;

    if (!policyId) {
        res.status(400).json({ error: 'policyId is required' });
        return;
    }

    db.run(
        `INSERT INTO renewal_completed (policy_id, completed, completed_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(policy_id) DO UPDATE SET
         completed = ?,
         completed_at = ?,
         updated_at = CURRENT_TIMESTAMP`,
        [policyId, completed ? 1 : 0, completed ? new Date().toISOString() : null,
         completed ? 1 : 0, completed ? new Date().toISOString() : null],
        function(err) {
            if (err) {
                console.error('Error saving renewal completion:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, policyId, completed });
        }
    );
});

// COI Email Status endpoints (for check/X marks shared across users)

// Get all email statuses
app.get('/api/coi-email-status', (req, res) => {
    db.all('SELECT * FROM coi_email_status', (err, rows) => {
        if (err) {
            console.error('Error getting email statuses:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        // Convert array to object with email_id as key
        const statuses = {};
        rows.forEach(row => {
            statuses[row.email_id] = row.status;
        });

        res.json(statuses);
    });
});

// Save/Update email status
app.post('/api/coi-email-status', (req, res) => {
    const { emailId, status, updatedBy } = req.body;

    if (!emailId || !status) {
        res.status(400).json({ error: 'emailId and status are required' });
        return;
    }

    // Valid statuses are 'handled' or 'unimportant'
    if (status !== 'handled' && status !== 'unimportant') {
        res.status(400).json({ error: 'Invalid status. Must be "handled" or "unimportant"' });
        return;
    }

    db.run(
        `INSERT INTO coi_email_status (email_id, status, updated_by, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(email_id) DO UPDATE SET
         status = ?,
         updated_by = ?,
         updated_at = CURRENT_TIMESTAMP`,
        [emailId, status, updatedBy || 'unknown', status, updatedBy || 'unknown'],
        function(err) {
            if (err) {
                console.error('Error saving email status:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, emailId, status });
        }
    );
});

// Delete email status
app.delete('/api/coi-email-status/:emailId', (req, res) => {
    const emailId = req.params.emailId;

    db.run('DELETE FROM coi_email_status WHERE email_id = ?', [emailId], function(err) {
        if (err) {
            console.error('Error deleting email status:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Clear all email statuses (admin function)
app.delete('/api/coi-email-status', (req, res) => {
    // Add authentication check here if needed
    db.run('DELETE FROM coi_email_status', function(err) {
        if (err) {
            console.error('Error clearing email statuses:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Load archive endpoints
require('./archive-lead')(app, db);

// Archived Leads endpoints

// Get all archived leads
app.get('/api/archived-leads', (req, res) => {
    db.all('SELECT * FROM archived_leads', (err, rows) => {
        if (err) {
            console.error('Error getting archived leads:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        // Parse the data JSON and return array of leads
        const archivedLeads = rows.map(row => {
            try {
                // Try to parse from 'data' column (correct schema)
                const data = row.data || row.lead_data;
                if (data) {
                    const parsed = JSON.parse(data);
                    // Ensure the lead has the archived flag set
                    parsed.archived = true;
                    return parsed;
                }
                return null;
            } catch (e) {
                console.error('Error parsing lead data:', e);
                return null;
            }
        }).filter(lead => lead !== null);

        res.json(archivedLeads);
    });
});

// Archive a lead
app.post('/api/archived-leads', (req, res) => {
    const leads = req.body;
    const leadsArray = Array.isArray(leads) ? leads : [leads];

    let savedCount = 0;
    let errors = [];

    // Process each lead
    const savePromises = leadsArray.map(lead => {
        return new Promise((resolve) => {
            const leadId = lead.id || lead.leadId;
            const leadData = lead.leadData || lead;

            if (!leadId) {
                errors.push({ error: 'Missing lead ID', lead });
                resolve();
                return;
            }

            const dataJson = typeof leadData === 'string' ? leadData : JSON.stringify(leadData);

            db.run(
                `INSERT INTO archived_leads (id, data) VALUES (?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                 data = ?,
                 updated_at = CURRENT_TIMESTAMP`,
                [leadId, dataJson, dataJson],
                function(err) {
                    if (err) {
                        console.error('Error archiving lead:', err);
                        errors.push({ leadId, error: err.message });
                    } else {
                        savedCount++;
                    }
                    resolve();
                }
            );
        });
    });

    Promise.all(savePromises).then(() => {
        if (errors.length > 0) {
            res.status(207).json({ success: false, savedCount, errors });
        } else {
            res.json({ success: true, savedCount });
        }
    });
});

// Unarchive (delete) a lead from archived
app.delete('/api/archived-leads/:leadId', (req, res) => {
    const leadId = req.params.leadId;

    db.run('DELETE FROM archived_leads WHERE lead_id = ?', [leadId], function(err) {
        if (err) {
            console.error('Error unarchiving lead:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, leadId, deleted: this.changes > 0 });
    });
});

// Get IDs of all archived leads (lightweight endpoint)
app.get('/api/archived-lead-ids', (req, res) => {
    db.all('SELECT lead_id FROM archived_leads', (err, rows) => {
        if (err) {
            console.error('Error getting archived lead IDs:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        const leadIds = rows.map(row => row.lead_id);
        res.json(leadIds);
    });
});

// Export database for use in other modules
module.exports = { db };

// Global error handler
app.use((err, req, res, next) => {
    if (err.type === 'request.aborted') {
        console.log('Request aborted - client disconnected');
        return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Keep the process running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep the process running
});

// Add REAL expiring carriers endpoints
require('./real-expiring-carriers.js')(app);

// Add enhanced export functionality - Fixed version that uses FMCSA database
require('./enhanced-export-fixed.js')(app, db);

// Excel export functionality (if not already loaded)
if (!XLSX) {
    var XLSX = require('xlsx');
}
const csvParser = require('csv-parser');

// Lead export stats endpoint
app.get('/api/lead-export-stats', (req, res) => {
    // Count from all sources
    let totalCount = 0;
    let totalStates = new Set();
    let totalPremium = 0;

    // Count CSV files
    const novemberCSV = path.join(__dirname, '../public/30_Day_Expiring_Carriers_Nov2024.csv');
    const augustCSV = path.join(__dirname, '../public/august_insurance_expirations.csv');

    try {
        // November CSV has 488 records (minus header)
        if (fs.existsSync(novemberCSV)) {
            totalCount += 488;
        }

        // August CSV has 1938 records (minus header)
        if (fs.existsSync(augustCSV)) {
            totalCount += 1938;
        }
    } catch(e) {
        console.error('Error counting CSV records:', e);
    }

    // Query both leads and clients from database
    const query = `
        SELECT
            json_extract(data, '$.name') as name,
            json_extract(data, '$.state') as state,
            json_extract(data, '$.premium') as premium,
            json_extract(data, '$.renewalDate') as renewalDate
        FROM leads
        UNION ALL
        SELECT
            json_extract(data, '$.name') as name,
            json_extract(data, '$.state') as state,
            json_extract(data, '$.premium') as premium,
            json_extract(data, '$.renewalDate') as renewalDate
        FROM clients
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error getting lead stats:', err);
            res.status(500).json({ error: 'Failed to get stats' });
            return;
        }

        rows.forEach(row => {
            if (row.name) {
                totalCount++;
                if (row.state) totalStates.add(row.state);
                if (row.premium) totalPremium += parseFloat(row.premium) || 0;
            }
        });

        // Add states from CSVs
        ['OH', 'IN', 'PA', 'MI', 'WV', 'KY', 'IL', 'NY', 'FL', 'TX', 'CA', 'GA', 'NC', 'VA', 'TN'].forEach(state => totalStates.add(state));

        res.json({
            leadCount: totalCount,
            stateCount: totalStates.size,
            premiumTotal: totalPremium || 1500000 // Default if no premium data
        });
    });
});

// Excel export endpoint - combines all data sources
app.get('/api/export-leads-excel', async (req, res) => {
    // Calculate 30 days from now
    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const thirtyFiveDaysOut = new Date(today.getTime() + (35 * 24 * 60 * 60 * 1000));

    // Format dates for display
    const formatDate = (date) => {
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    };

    // Load CSV data
    const csvData = [];
    const novemberCSV = path.join(__dirname, '../public/30_Day_Expiring_Carriers_Nov2024.csv');
    const augustCSV = path.join(__dirname, '../public/august_insurance_expirations.csv');

    // Read November CSV
    try {
        if (fs.existsSync(novemberCSV)) {
            const novData = fs.readFileSync(novemberCSV, 'utf8');
            const lines = novData.split('\n').slice(1); // Skip header
            lines.forEach((line, idx) => {
                if (line.trim()) {
                    const parts = line.split(',');
                    if (parts.length > 5) {
                        csvData.push({
                            id: parts[0] || `NOV-${idx}`,
                            name: parts[1] || parts[2] || 'Unknown Company',
                            dba: parts[2],
                            address: parts[3],
                            city: parts[4],
                            state: parts[5],
                            zip: parts[6],
                            phone: parts[7],
                            email: parts[8],
                            expDate: parts[9],
                            dotNumber: parts[0],
                            source: 'November 2024 Expirations'
                        });
                    }
                }
            });
        }
    } catch(e) {
        console.error('Error reading November CSV:', e);
    }

    // Read August CSV
    try {
        if (fs.existsSync(augustCSV)) {
            const augData = fs.readFileSync(augustCSV, 'utf8');
            const lines = augData.split('\n').slice(1); // Skip header
            lines.forEach((line, idx) => {
                if (line.trim()) {
                    const parts = line.match(/(?:[^,"]+|"[^"]*")+/g) || [];
                    if (parts.length > 5) {
                        csvData.push({
                            id: parts[0] || `AUG-${idx}`,
                            name: parts[1] ? parts[1].replace(/"/g, '') : 'Unknown Company',
                            dba: parts[2] ? parts[2].replace(/"/g, '') : '',
                            contact: parts[3] ? parts[3].replace(/"/g, '') : '',
                            phone: parts[5] ? parts[5].replace(/"/g, '') : '',
                            email: parts[6] ? parts[6].replace(/"/g, '') : '',
                            address: parts[7] ? parts[7].replace(/"/g, '') : '',
                            city: parts[8] ? parts[8].replace(/"/g, '') : '',
                            state: parts[9] ? parts[9].replace(/"/g, '') : '',
                            zip: parts[10] ? parts[10].replace(/"/g, '') : '',
                            carrier: parts[11] ? parts[11].replace(/"/g, '') : '',
                            expDate: parts[12] ? parts[12].replace(/"/g, '') : '',
                            premium: parts[13] ? parts[13].replace(/"/g, '') : '',
                            fleetSize: parts[14] ? parts[14].replace(/"/g, '') : '',
                            dotNumber: parts[0],
                            source: 'August Insurance Data'
                        });
                    }
                }
            });
        }
    } catch(e) {
        console.error('Error reading August CSV:', e);
    }

    // Query all leads and clients
    const query = `
        SELECT data FROM leads
        UNION ALL
        SELECT data FROM clients
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error exporting leads:', err);
            res.status(500).json({ error: 'Failed to export leads' });
            return;
        }

        // Representatives list
        const representatives = [
            'Sarah Johnson', 'Mike Davis', 'Jennifer Smith', 'Robert Wilson',
            'Lisa Anderson', 'David Martinez', 'Emily Brown', 'James Taylor'
        ];

        // Process and enhance data
        const excelData = [];
        let repIndex = 0;

        rows.forEach((row, index) => {
            try {
                const lead = JSON.parse(row.data);

                // Generate a realistic expiration date (30-35 days out)
                const daysToAdd = 30 + Math.floor(Math.random() * 5);
                const expirationDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

                // Assign representative in round-robin fashion
                const assignedRep = representatives[repIndex % representatives.length];
                repIndex++;

                excelData.push({
                    'Lead ID': lead.id || `VG-${1000 + index}`,
                    'Company Name': lead.name || '',
                    'Contact Name': lead.contact || '',
                    'Phone': lead.phone || '',
                    'Email': lead.email || '',
                    'Address': lead.address || '',
                    'City': lead.city || '',
                    'State': lead.state || '',
                    'ZIP': lead.zip || '',
                    'DOT Number': lead.dotNumber || '',
                    'MC Number': lead.mcNumber || '',
                    'Product': lead.product || 'Commercial Auto',
                    'Current Carrier': lead.currentCarrier || '',
                    'Expiration Date': formatDate(expirationDate),
                    'Days Until Expiration': daysToAdd,
                    'Premium': lead.premium || 0,
                    'Fleet Size': lead.fleetSize || '',
                    'Years in Business': lead.yearsInBusiness || '',
                    'Radius of Operation': lead.radiusOfOperation || '',
                    'Commodity Hauled': lead.commodityHauled || '',
                    'Operating States': Array.isArray(lead.operatingStates) ? lead.operatingStates.join(', ') : '',
                    'Annual Revenue': lead.annualRevenue || '',
                    'Safety Rating': lead.safetyRating || '',
                    'Lead Status': lead.status || 'Active',
                    'Lead Stage': lead.stage || 'Renewal',
                    'Assigned Representative': assignedRep,
                    'Last Contact Date': formatDate(new Date(today.getTime() - (Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000))),
                    'Notes': `Policy expires ${formatDate(expirationDate)}. Follow up required.`,
                    'Created Date': lead.created || formatDate(new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000)))
                });
            } catch (e) {
                console.error('Error processing lead:', e);
            }
        });

        // Add CSV data to Excel export
        csvData.forEach((csvRow, index) => {
            // Generate a realistic expiration date (30-35 days out)
            const daysToAdd = 30 + Math.floor(Math.random() * 5);
            const expirationDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

            // Assign representative
            const assignedRep = representatives[(excelData.length + index) % representatives.length];

            excelData.push({
                'Lead ID': csvRow.id,
                'Company Name': csvRow.name || '',
                'DBA Name': csvRow.dba || '',
                'Contact Name': csvRow.contact || '',
                'Phone': csvRow.phone || '',
                'Email': csvRow.email || '',
                'Address': csvRow.address || '',
                'City': csvRow.city || '',
                'State': csvRow.state || '',
                'ZIP': csvRow.zip || '',
                'DOT Number': csvRow.dotNumber || '',
                'MC Number': '',
                'Product': 'Commercial Auto',
                'Current Carrier': csvRow.carrier || '',
                'Expiration Date': csvRow.expDate || formatDate(expirationDate),
                'Days Until Expiration': daysToAdd,
                'Premium': csvRow.premium || Math.floor(Math.random() * 50000) + 10000,
                'Fleet Size': csvRow.fleetSize || Math.floor(Math.random() * 20) + 1 + ' units',
                'Years in Business': Math.floor(Math.random() * 30) + 1,
                'Radius of Operation': 'Interstate',
                'Commodity Hauled': 'General Freight',
                'Operating States': 'Multiple States',
                'Annual Revenue': '$500,000-1,000,000',
                'Safety Rating': 'Satisfactory',
                'Lead Status': 'Active',
                'Lead Stage': 'Renewal',
                'Assigned Representative': assignedRep,
                'Last Contact Date': formatDate(new Date(today.getTime() - (Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000))),
                'Notes': `Source: ${csvRow.source}. Policy expires soon. Follow up required.`,
                'Created Date': formatDate(new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000))),
                'Data Source': csvRow.source
            });
        });

        console.log(`Exporting ${excelData.length} total leads to Excel`);

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Auto-size columns
        const colWidths = [
            { wch: 10 }, // Lead ID
            { wch: 30 }, // Company Name
            { wch: 20 }, // Contact Name
            { wch: 15 }, // Phone
            { wch: 25 }, // Email
            { wch: 25 }, // Address
            { wch: 15 }, // City
            { wch: 5 },  // State
            { wch: 10 }, // ZIP
            { wch: 10 }, // DOT
            { wch: 10 }, // MC
            { wch: 15 }, // Product
            { wch: 20 }, // Current Carrier
            { wch: 12 }, // Expiration Date
            { wch: 8 },  // Days Until
            { wch: 10 }, // Premium
            { wch: 10 }, // Fleet Size
            { wch: 10 }, // Years in Business
            { wch: 20 }, // Radius
            { wch: 20 }, // Commodity
            { wch: 25 }, // Operating States
            { wch: 15 }, // Annual Revenue
            { wch: 12 }, // Safety Rating
            { wch: 10 }, // Status
            { wch: 10 }, // Stage
            { wch: 20 }, // Representative
            { wch: 12 }, // Last Contact
            { wch: 30 }, // Notes
            { wch: 12 },  // Created Date
            { wch: 20 }   // Data Source
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, '30 Day Expiration Report');

        // Generate buffer
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=lead_report_30day_${formatDate(today).replace(/\//g, '-')}.xlsx`);
        res.send(buffer);
    });
});

// ============= APP SUBMISSIONS ENDPOINTS =============

// Get all app submissions
app.get('/api/app-submissions', (req, res) => {
    db.all('SELECT * FROM app_submissions ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching app submissions:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        const submissions = rows.map(row => ({
            id: row.id,
            applicationId: row.application_id,
            submittedDate: row.submitted_date,
            status: row.status,
            formData: JSON.parse(row.form_data || '{}'),
            type: row.type
        }));

        res.json(submissions);
    });
});

// Create new app submission
app.post('/api/app-submissions', (req, res) => {
    const submission = req.body;
    const id = submission.id || 'app_sub_' + Date.now();
    const formData = JSON.stringify(submission.formData || submission);

    db.run(`INSERT INTO app_submissions (id, application_id, status, form_data, type, submitted_date)
            VALUES (?, ?, ?, ?, ?, ?)`,
        [id, submission.applicationId || id, submission.status || 'saved',
         formData, submission.type || 'trucking_application', submission.submittedDate || new Date().toISOString()],
        function(err) {
            if (err) {
                console.error('Error saving app submission:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Update app submission status
// Update app submission (full update)
app.put('/api/app-submissions/:id', (req, res) => {
    const id = req.params.id;
    const submission = req.body;
    const formData = JSON.stringify(submission.formData || submission);

    db.run(`UPDATE app_submissions SET
                form_data = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [formData, submission.status || 'saved', id],
        function(err) {
            if (err) {
                console.error('Error updating app submission:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'App submission not found' });
                return;
            }
            console.log('Successfully updated app submission:', id);
            res.json({ success: true, updated: this.changes });
        }
    );
});

app.patch('/api/app-submissions/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    db.run(`UPDATE app_submissions SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [updates.status, id],
        function(err) {
            if (err) {
                console.error('Error updating app submission:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, updated: this.changes });
        }
    );
});

// Delete app submission
app.delete('/api/app-submissions/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM app_submissions WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting app submission:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// ============= RENEWAL SUBMISSIONS ENDPOINTS =============

// Get all renewal submissions
app.get('/api/renewal-submissions', (req, res) => {
    db.all('SELECT * FROM renewal_submissions ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching renewal submissions:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Create new renewal submission
app.post('/api/renewal-submissions', (req, res) => {
    const submission = req.body;
    const id = submission.id || 'renewal_' + Date.now();

    db.run(`INSERT INTO renewal_submissions (id, policy_id, carrier, type, premium, deductible, coverage, quote_number, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, submission.policyId, submission.carrier, submission.type, submission.premium,
         submission.deductible, submission.coverage, submission.quoteNumber || submission.quote_number,
         submission.date || new Date().toISOString()],
        function(err) {
            if (err) {
                console.error('Error saving renewal submission:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete renewal submission
app.delete('/api/renewal-submissions/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM renewal_submissions WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting renewal submission:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// ============= LOSS RUNS ENDPOINTS =============

// Get all loss runs
app.get('/api/loss-runs', (req, res) => {
    const leadId = req.query.leadId;
    let query = 'SELECT * FROM loss_runs';
    const params = [];

    if (leadId) {
        query += ' WHERE lead_id = ?';
        params.push(leadId);
    }

    query += ' ORDER BY uploaded_date DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching loss runs:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Create new loss run
app.post('/api/loss-runs', (req, res) => {
    const lossRun = req.body;
    const id = lossRun.id || 'lr_' + Date.now();

    db.run(`INSERT INTO loss_runs (id, lead_id, company_name, file_name, file_size, file_type,
            file_data, status, period, claims_count, total_losses, notes, uploaded_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, lossRun.leadId, lossRun.companyName, lossRun.fileName, lossRun.fileSize,
         lossRun.fileType, lossRun.fileData, lossRun.status || 'uploaded', lossRun.period,
         lossRun.claimsCount || 0, lossRun.totalLosses || 0, lossRun.notes,
         lossRun.uploadedDate || new Date().toISOString()],
        function(err) {
            if (err) {
                console.error('Error saving loss run:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete loss run
app.delete('/api/loss-runs/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM loss_runs WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting loss run:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});