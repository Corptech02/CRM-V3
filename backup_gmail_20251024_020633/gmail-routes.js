const express = require('express');
const router = express.Router();
const GmailService = require('./gmail-service');
const GmailIMAPService = require('./gmail-imap-service');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vanguard.db');
const { requireGmailAuth, getAuthStatus } = require('./auth-check-middleware');

// Initialize Gmail Services
const gmailService = new GmailService();
const gmailIMAPService = new GmailIMAPService();

// Store credentials securely in database for persistence
let gmailCredentials = null;

// Load stored credentials on startup
async function loadStoredCredentials() {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', ['gmail_tokens'], (err, row) => {
            if (!err && row) {
                try {
                    gmailCredentials = JSON.parse(row.value);
                    gmailService.initialize(gmailCredentials)
                        .then(() => {
                            console.log('Gmail service initialized with stored credentials');
                            resolve(true);
                        })
                        .catch(err => {
                            console.error('Failed to initialize with stored credentials:', err);
                            resolve(false);
                        });
                } catch (parseErr) {
                    console.error('Error parsing stored credentials:', parseErr);
                    resolve(false);
                }
            } else {
                console.log('No stored Gmail credentials found');
                resolve(false);
            }
        });
    });
}

// Initialize on startup
loadStoredCredentials();

/**
 * Initialize Gmail with credentials
 * POST /api/gmail/init
 */
router.post('/init', async (req, res) => {
    try {
        const { client_id, client_secret, redirect_uri, refresh_token, access_token } = req.body;

        gmailCredentials = {
            client_id,
            client_secret,
            redirect_uri,
            refresh_token,
            access_token,
            expiry_date: new Date().getTime() + (3600 * 1000) // 1 hour from now
        };

        await gmailService.initialize(gmailCredentials);

        // Store credentials in database for persistence
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['gmail_tokens', JSON.stringify(gmailCredentials)], (err) => {
                if (err) {
                    console.error('Error storing Gmail credentials:', err);
                }
            });

        res.json({ success: true, message: 'Gmail API initialized successfully' });
    } catch (error) {
        console.error('Error initializing Gmail:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Check Gmail authentication status
 * GET /api/gmail/status
 */
router.get('/status', (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', ['gmail_tokens'], (err, row) => {
        if (err) {
            return res.status(500).json({
                authenticated: false,
                error: 'Database error',
                details: err.message,
                solution: 'Check database connection and permissions'
            });
        }

        if (!row) {
            return res.status(401).json({
                authenticated: false,
                error: 'Gmail not configured',
                details: 'No Gmail credentials found in database',
                solution: 'Gmail authentication needs to be set up. Contact administrator to configure Gmail API access.'
            });
        }

        try {
            const credentials = JSON.parse(row.value);
            const hasRefreshToken = !!credentials.refresh_token;
            const isExpired = credentials.expiry_date && credentials.expiry_date < Date.now();

            if (!hasRefreshToken) {
                return res.status(401).json({
                    authenticated: false,
                    error: 'Incomplete Gmail authorization',
                    details: 'Gmail refresh token is missing',
                    solution: 'Re-authorize Gmail access with proper permissions'
                });
            }

            if (isExpired) {
                // Try to refresh the token
                return res.status(401).json({
                    authenticated: false,
                    error: 'Gmail token expired',
                    details: `Token expired on ${new Date(credentials.expiry_date).toLocaleString()}`,
                    solution: 'Attempting automatic token refresh. If this persists, re-authorize Gmail access.'
                });
            }

            res.json({
                authenticated: true,
                message: 'Gmail authenticated and working',
                email: credentials.email || 'corptech06@gmail.com'
            });
        } catch (parseErr) {
            res.status(500).json({
                authenticated: false,
                error: 'Invalid credential format',
                details: parseErr.message,
                solution: 'Gmail credentials are corrupted. Re-authorize Gmail access.'
            });
        }
    });
});

/**
 * Get OAuth URL for authorization
 * GET /api/gmail/auth-url
 */
router.get('/auth-url', (req, res) => {
    // Use the redirect URI from environment or query parameter
    const redirect_uri = process.env.GMAIL_REDIRECT_URI || req.query.redirect_uri || 'http://162-220-14-239.nip.io/api/gmail/callback';

    const credentials = {
        client_id: process.env.GMAIL_CLIENT_ID || req.query.client_id,
        client_secret: process.env.GMAIL_CLIENT_SECRET || req.query.client_secret,
        redirect_uri: redirect_uri
    };

    const authUrl = gmailService.getAuthUrl(credentials);
    res.json({ authUrl });
});

/**
 * Exchange authorization code for tokens
 * POST /api/gmail/exchange-code
 */
router.post('/exchange-code', async (req, res) => {
    try {
        const { code, client_id, client_secret, redirect_uri } = req.body;

        const credentials = {
            client_id,
            client_secret,
            redirect_uri
        };

        const tokens = await gmailService.getTokensFromCode(code, credentials);

        // Initialize service with tokens
        gmailCredentials = { ...credentials, ...tokens };
        await gmailService.initialize(gmailCredentials);

        // Store credentials in database for persistence
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['gmail_tokens', JSON.stringify(gmailCredentials)], (err) => {
                if (err) {
                    console.error('Error storing Gmail credentials:', err);
                }
            });

        res.json({ success: true, tokens });
    } catch (error) {
        console.error('Error exchanging code:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * OAuth callback to exchange code for tokens
 * GET /api/gmail/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;

        const credentials = {
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            redirect_uri: process.env.GMAIL_REDIRECT_URI || 'http://162-220-14-239.nip.io/api/gmail/callback'
        };

        const tokens = await gmailService.getTokensFromCode(code, credentials);

        // Store tokens securely in database for persistence
        gmailCredentials = { ...credentials, ...tokens };

        // Save tokens to database so they persist across server restarts
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['gmail_tokens', JSON.stringify(gmailCredentials)]);

        await gmailService.initialize(gmailCredentials);

        // Redirect to COI management page with success message
        res.redirect('http://162-220-14-239.nip.io/#coi-management?gmail=connected');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect('http://162-220-14-239.nip.io/#coi-management?gmail=error');
    }
});

/**
 * List COI-related emails
 * GET /api/gmail/messages
 */
router.get('/messages', async (req, res) => {
    try {
        const { query, maxResults = 20 } = req.query;
        let messages = null;
        let source = 'oauth';

        // Try OAuth first, then fallback to IMAP
        try {
            // Check if Gmail OAuth is initialized
            if (!gmailCredentials) {
                const initialized = await loadStoredCredentials();
                if (!initialized) {
                    throw new Error('OAuth not available');
                }
            }

            messages = await gmailService.listMessages(query, parseInt(maxResults));
            console.log('✅ Used Gmail OAuth API');
        } catch (oauthError) {
            console.log('📧 OAuth failed, trying IMAP fallback:', oauthError.message);

            try {
                // Fallback to IMAP
                await gmailIMAPService.initialize();
                messages = await gmailIMAPService.getMessages(parseInt(maxResults));
                source = 'imap';
                console.log('✅ Used Gmail IMAP (App Password)');
            } catch (imapError) {
                console.error('❌ Both OAuth and IMAP failed');
                return res.status(401).json({
                    error: 'Gmail authentication required',
                    details: `OAuth failed: ${oauthError.message}. IMAP failed: ${imapError.message}`,
                    solution: 'Please set up Gmail App Password using: node gmail-app-password-setup.js',
                    authRequired: true,
                    oauth_error: oauthError.message,
                    imap_error: imapError.message
                });
            }
        }

        // Store messages in database for offline access
        messages.forEach(msg => {
            db.run(`
                INSERT OR REPLACE INTO coi_emails
                (id, thread_id, from_email, to_email, subject, date, body, snippet, attachments)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                msg.id,
                msg.threadId,
                msg.from,
                msg.to,
                msg.subject,
                msg.date.toISOString(),
                msg.body,
                msg.snippet,
                JSON.stringify(msg.attachments)
            ]);
        });

        res.json({
            messages: messages,
            source: source,
            count: messages.length,
            note: source === 'imap' ? 'Using Gmail IMAP (App Password) - OAuth unavailable' : 'Using Gmail OAuth API'
        });
    } catch (error) {
        console.error('Error fetching messages:', error);

        // Check for token expiration error
        if (error.response && error.response.data &&
            (error.response.data.error === 'invalid_grant' ||
             error.response.data.error_description?.includes('expired') ||
             error.response.data.error_description?.includes('revoked'))) {
            return res.status(401).json({
                error: 'Gmail token expired or revoked',
                details: error.response.data.error_description || 'The Gmail refresh token is no longer valid',
                solution: 'The Gmail authentication has expired. An administrator needs to re-authenticate the Gmail API access for corptech06@gmail.com. Contact your system administrator.',
                authRequired: true
            });
        }

        // Check for other auth errors
        if (error.response && error.response.status === 401) {
            return res.status(401).json({
                error: 'Gmail authentication failed',
                details: 'Access token is invalid or expired',
                solution: 'The Gmail access token has expired. Please re-authenticate Gmail API for corptech06@gmail.com',
                authRequired: true
            });
        }

        if (error.response && error.response.status === 400) {
            return res.status(400).json({
                error: 'Gmail API error',
                details: error.response.data?.error_description || error.message || 'Bad request to Gmail API',
                solution: 'The Gmail API request failed. This usually means the authentication needs to be renewed. Contact administrator.',
                authRequired: true
            });
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(503).json({
                error: 'Cannot connect to Gmail API',
                details: 'Network connection to Google servers failed',
                solution: 'Check internet connection and firewall settings'
            });
        }

        // Check if Gmail service is not initialized
        if (!gmailService.gmail) {
            return res.status(503).json({
                error: 'Gmail service not initialized',
                details: 'The Gmail API client is not properly configured',
                solution: 'Gmail API needs to be set up. Contact administrator to authenticate Gmail access for corptech06@gmail.com',
                authRequired: true
            });
        }

        // Default error response with details
        res.status(500).json({
            error: 'Failed to fetch Gmail messages',
            details: error.message || 'Unknown error occurred',
            solution: 'Check server logs for more details. If the issue persists, contact administrator to re-authenticate Gmail access.'
        });
    }
});

/**
 * Get a specific message
 * GET /api/gmail/messages/:id
 */
router.get('/messages/:id', async (req, res) => {
    try {
        let message = null;
        let source = 'oauth';

        // Try OAuth first, then fallback to IMAP
        try {
            // Check if Gmail OAuth is initialized
            if (!gmailCredentials) {
                const initialized = await loadStoredCredentials();
                if (!initialized) {
                    throw new Error('OAuth not available');
                }
            }

            message = await gmailService.getMessage(req.params.id);
            console.log('✅ Retrieved message via OAuth API');
        } catch (oauthError) {
            console.log('📧 OAuth failed for message, trying IMAP fallback:', oauthError.message);

            try {
                // For IMAP, we can't get individual messages by Gmail ID easily
                // So we'll return a helpful error with fallback suggestion
                throw new Error('IMAP does not support individual message retrieval by Gmail ID. Please view messages from the inbox list.');
            } catch (imapError) {
                console.error('❌ Both OAuth and IMAP failed for individual message');
                return res.status(401).json({
                    error: 'Gmail authentication required',
                    details: `OAuth failed: ${oauthError.message}. Individual message viewing requires OAuth API.`,
                    solution: 'Gmail OAuth is required for individual message viewing. IMAP only supports inbox listing.',
                    authRequired: true,
                    oauth_error: oauthError.message,
                    suggestion: 'Please set up Gmail OAuth or view emails from the inbox list'
                });
            }
        }

        res.json({
            message: message,
            source: source,
            note: source === 'imap' ? 'Retrieved via IMAP (App Password)' : 'Retrieved via OAuth API'
        });
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send an email
 * POST /api/gmail/send
 */
router.post('/send', async (req, res) => {
    try {
        const { to, subject, body, cc, bcc, attachments } = req.body;

        const result = await gmailService.sendEmail({
            to,
            subject,
            body,
            cc,
            bcc,
            attachments
        });

        // Store sent email in database
        db.run(`
            INSERT INTO coi_emails_sent
            (message_id, to_email, subject, body, sent_date)
            VALUES (?, ?, ?, ?, ?)
        `,
        [
            result.id,
            to,
            subject,
            body,
            new Date().toISOString()
        ]);

        res.json({ success: true, messageId: result.id });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Search for COI emails
 * GET /api/gmail/search-coi
 */
router.get('/search-coi', async (req, res) => {
    try {
        const { clientName, days = 30 } = req.query;
        const messages = await gmailService.searchCOIEmails(clientName, parseInt(days));
        res.json(messages);
    } catch (error) {
        console.error('Error searching COI emails:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Download attachment
 * GET /api/gmail/attachments/:messageId/:attachmentId
 */
router.get('/attachments/:messageId/:attachmentId', async (req, res) => {
    try {
        const { messageId, attachmentId } = req.params;
        const { filename } = req.query;
        const attachment = await gmailService.getAttachment(messageId, attachmentId);

        // Set appropriate content type based on file extension or default to octet-stream
        let contentType = 'application/octet-stream';
        if (filename) {
            const ext = filename.toLowerCase().split('.').pop();
            const mimeTypes = {
                'pdf': 'application/pdf',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            };
            contentType = mimeTypes[ext] || contentType;
        }

        // Set headers for proper viewing and downloading
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': filename ? `inline; filename="${filename}"` : 'attachment',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': '*'
        });

        res.send(attachment);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Mark message as read
 * POST /api/gmail/messages/:id/read
 */
router.post('/messages/:id/read', async (req, res) => {
    try {
        await gmailService.markAsRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Add label to message
 * POST /api/gmail/messages/:id/label
 */
router.post('/messages/:id/label', async (req, res) => {
    try {
        const { label } = req.body;
        await gmailService.addLabel(req.params.id, label);
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding label:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;