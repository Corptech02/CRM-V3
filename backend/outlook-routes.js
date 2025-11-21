const express = require('express');
const router = express.Router();
const OutlookService = require('./outlook-service');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const db = new sqlite3.Database('./vanguard.db');

// Initialize Outlook Service
const outlookService = new OutlookService();

// Store credentials
let outlookCredentials = null;

// Load stored credentials on startup
async function loadStoredCredentials() {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', ['outlook_tokens'], (err, row) => {
            if (!err && row) {
                try {
                    outlookCredentials = JSON.parse(row.value);
                    outlookService.initialize(outlookCredentials)
                        .then(() => {
                            console.log('Outlook service initialized with stored credentials');
                            resolve(true);
                        })
                        .catch(err => {
                            console.error('Failed to initialize Outlook:', err);
                            resolve(false);
                        });
                } catch (parseErr) {
                    console.error('Error parsing Outlook credentials:', parseErr);
                    resolve(false);
                }
            } else {
                console.log('No stored Outlook credentials found');
                resolve(false);
            }
        });
    });
}

// Initialize on startup
loadStoredCredentials();

/**
 * Get emails - Using Titan/Outlook configuration
 * GET /api/outlook/emails
 */
router.get('/emails', async (req, res) => {
    let responseSent = false;

    try {
        // Set a timeout for the entire operation
        const timeout = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                console.log('Email fetch timed out, returning empty inbox');
                res.json({
                    success: true,
                    emails: [],
                    account: 'contact@vigagency.com',
                    notice: 'Email server connection timed out. Using offline mode.'
                });
            }
        }, 10000); // 10 second timeout

        // For now, return Titan emails using IMAP
        const Imap = require('imap');
        const { simpleParser } = require('mailparser');

        const imap = new Imap({
            user: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
            password: process.env.OUTLOOK_PASSWORD || '25nickc124!',
            host: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net',
            port: parseInt(process.env.OUTLOOK_IMAP_PORT) || 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false,
                servername: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net'
            },
            connTimeout: 10000, // 10 second connection timeout
            authTimeout: 10000  // 10 second auth timeout
        });

        const emails = [];

        imap.once('ready', () => {
            clearTimeout(timeout);
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('Error opening inbox:', err);
                    if (!responseSent) {
                        responseSent = true;
                        return res.status(500).json({ success: false, error: err.message });
                    }
                    return;
                }

                // Check if inbox has emails
                console.log(`Inbox opened: ${box.name}, Total messages: ${box.messages.total}`);

                if (!box.messages.total || box.messages.total === 0) {
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        return res.json({
                            success: true,
                            emails: [],
                            account: 'contact@vigagency.com',
                            notice: 'Inbox is empty'
                        });
                    }
                    return;
                }

                // Fetch last 20 emails - use simple fetch
                const numToFetch = Math.min(20, box.messages.total);
                const startSeq = Math.max(1, box.messages.total - numToFetch + 1);
                const fetchRange = startSeq + ':*';
                console.log(`Fetching emails from range: ${fetchRange}`);

                const f = imap.seq.fetch(fetchRange, {
                    bodies: 'TEXT',
                    envelope: true,
                    struct: true
                });

                f.on('message', (msg, seqno) => {
                    let emailData = {
                        id: seqno.toString(),
                        from: '',
                        to: '',
                        subject: '',
                        date: new Date(),
                        snippet: '',
                        body: ''
                    };

                    msg.once('attributes', (attrs) => {
                        const envelope = attrs.envelope;
                        if (envelope) {
                            emailData.from = envelope.from ? envelope.from[0].mailbox + '@' + envelope.from[0].host : '';
                            emailData.to = envelope.to ? envelope.to[0].mailbox + '@' + envelope.to[0].host : '';
                            emailData.subject = envelope.subject || '(No Subject)';
                            emailData.date = envelope.date || new Date();
                        }
                    });

                    msg.on('body', (stream, info) => {
                        simpleParser(stream, (err, parsed) => {
                            if (!err && parsed) {
                                // Get text content (prefer html, fallback to text)
                                let bodyContent = parsed.html || parsed.text || '';

                                // Clean up content
                                emailData.body = bodyContent;
                                emailData.snippet = parsed.text ? parsed.text.substring(0, 150) + '...' : '';

                                // Add attachment info
                                emailData.hasAttachments = parsed.attachments && parsed.attachments.length > 0;
                            }
                        });
                    });

                    msg.once('end', () => {
                        emails.push(emailData);
                    });
                });

                f.once('error', (err) => {
                    console.error('Fetch error:', err);
                });

                f.once('end', () => {
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        res.json({
                            success: true,
                            emails: emails.reverse(), // Newest first
                            account: 'contact@vigagency.com',
                            totalCount: emails.length
                        });
                    }
                });
            });
        });

        imap.once('error', (err) => {
            clearTimeout(timeout);
            console.error('IMAP connection error:', err);
            if (!responseSent) {
                responseSent = true;
                // Return more specific error messages based on error type
                let notice = 'Unable to connect to email server. Using offline mode.';
                let errorType = 'connection';

                if (err.message && (err.message.includes('Authentication') || err.message.includes('invalid jwt'))) {
                    notice = 'Email authentication failed. Please check email credentials or contact support.';
                    errorType = 'authentication';
                } else if (err.message && err.message.includes('Timed out')) {
                    notice = 'Email server connection timed out. Please try again later.';
                    errorType = 'timeout';
                }

                res.json({
                    success: false, // Mark as false when there's an actual error
                    emails: [],
                    account: 'contact@vigagency.com',
                    notice: notice,
                    error: err.message,
                    errorType: errorType
                });
            }
        });

        imap.connect();

    } catch (error) {
        console.error('Error in /emails endpoint:', error);
        if (!responseSent) {
            responseSent = true;
            res.json({
                success: true,
                emails: [],
                account: 'contact@vigagency.com',
                notice: 'Email service temporarily unavailable. Using offline mode.'
            });
        }
    }
});

/**
 * Check Outlook authentication status
 * GET /api/outlook/status
 */
router.get('/status', (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', ['outlook_tokens'], (err, row) => {
        if (err) {
            return res.status(500).json({
                authenticated: false,
                error: 'Database error',
                details: err.message
            });
        }

        if (!row) {
            return res.status(401).json({
                authenticated: false,
                error: 'Outlook not configured',
                details: 'No Outlook credentials found',
                solution: 'Set up Outlook authentication to connect your email'
            });
        }

        try {
            const credentials = JSON.parse(row.value);
            const hasRefreshToken = !!credentials.refresh_token;
            const isExpired = credentials.expiry_date && credentials.expiry_date < Date.now();

            res.json({
                authenticated: hasRefreshToken && !isExpired,
                email: credentials.email || 'Not set',
                expired: isExpired
            });
        } catch (parseErr) {
            res.status(500).json({
                authenticated: false,
                error: 'Invalid credential format',
                details: parseErr.message
            });
        }
    });
});

/**
 * Get OAuth URL for authorization
 * GET /api/outlook/auth-url
 */
router.get('/auth-url', (req, res) => {
    // You'll need to register an app in Azure AD to get these
    const credentials = {
        client_id: process.env.OUTLOOK_CLIENT_ID || req.query.client_id || 'YOUR_OUTLOOK_CLIENT_ID',
        client_secret: process.env.OUTLOOK_CLIENT_SECRET || req.query.client_secret || 'YOUR_OUTLOOK_SECRET',
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `http://162-220-14-239.nip.io/api/outlook/callback`
    };

    const authUrl = outlookService.getAuthUrl(credentials);
    res.json({ authUrl });
});

/**
 * Exchange authorization code for tokens
 * POST /api/outlook/exchange-code
 */
router.post('/exchange-code', async (req, res) => {
    try {
        const { code, client_id, client_secret } = req.body;

        const credentials = {
            client_id: client_id || process.env.OUTLOOK_CLIENT_ID,
            client_secret: client_secret || process.env.OUTLOOK_CLIENT_SECRET,
            redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `http://162-220-14-239.nip.io/api/outlook/callback`
        };

        const tokens = await outlookService.getTokensFromCode(code, credentials);

        // Store full credentials
        outlookCredentials = { ...credentials, ...tokens };

        // Save to database
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['outlook_tokens', JSON.stringify(outlookCredentials)], (err) => {
                if (err) {
                    console.error('Error storing Outlook credentials:', err);
                }
            });

        await outlookService.initialize(outlookCredentials);

        res.json({ success: true, tokens });
    } catch (error) {
        console.error('Error exchanging code:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * OAuth callback
 * GET /api/outlook/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;

        const credentials = {
            client_id: process.env.OUTLOOK_CLIENT_ID,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET,
            redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `http://162-220-14-239.nip.io/api/outlook/callback`
        };

        const tokens = await outlookService.getTokensFromCode(code, credentials);

        // Store tokens
        outlookCredentials = { ...credentials, ...tokens };

        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['outlook_tokens', JSON.stringify(outlookCredentials)]);

        await outlookService.initialize(outlookCredentials);

        // Redirect to COI management with success
        res.redirect('http://162-220-14-239.nip.io/#coi-management?outlook=connected');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect('http://162-220-14-239.nip.io/#coi-management?outlook=error');
    }
});

/**
 * List emails from Outlook
 * GET /api/outlook/messages
 */
router.get('/messages', async (req, res) => {
    try {
        if (!outlookCredentials) {
            const initialized = await loadStoredCredentials();
            if (!initialized) {
                return res.status(401).json({
                    error: 'Outlook not authenticated',
                    details: 'Please set up Outlook authentication first',
                    solution: 'Connect your Outlook account to fetch emails'
                });
            }
        }

        const { query, maxResults = 20 } = req.query;
        const messages = await outlookService.listMessages(query, parseInt(maxResults));

        res.json(messages);
    } catch (error) {
        console.error('Error fetching Outlook messages:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: 'Outlook authentication failed',
                details: 'Access token expired or invalid',
                solution: 'Re-authenticate your Outlook account'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch Outlook messages',
            details: error.message
        });
    }
});

/**
 * Get a specific message
 * GET /api/outlook/messages/:id
 */
router.get('/messages/:id', async (req, res) => {
    try {
        const message = await outlookService.getMessage(req.params.id);
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send email
 * POST /api/outlook/send
 */
router.post('/send', async (req, res) => {
    try {
        const { to, subject, body, cc, bcc, attachments } = req.body;

        const result = await outlookService.sendEmail({
            to,
            subject,
            body,
            cc,
            bcc,
            attachments
        });

        res.json(result);
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Search COI emails
 * GET /api/outlook/search-coi
 */
router.get('/search-coi', async (req, res) => {
    try {
        const { searchTerm, days = 30 } = req.query;
        const messages = await outlookService.searchCOIEmails(searchTerm, parseInt(days));
        res.json(messages);
    } catch (error) {
        console.error('Error searching emails:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Mark message as read
 * POST /api/outlook/messages/:id/read
 */
router.post('/messages/:id/read', async (req, res) => {
    try {
        await outlookService.markAsRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Test IMAP connection
 * GET /api/outlook/test-connection
 */
router.get('/test-connection', async (req, res) => {
    const Imap = require('imap');

    const imap = new Imap({
        user: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
        password: process.env.OUTLOOK_PASSWORD || '25nickc124!',
        host: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false,
            servername: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net'
        },
        connTimeout: 10000,
        authTimeout: 10000
    });

    let connectionResult = {
        connected: false,
        error: null,
        inbox: null
    };

    imap.once('ready', () => {
        console.log('IMAP connection successful');
        imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                connectionResult.error = err.message;
            } else {
                connectionResult.connected = true;
                connectionResult.inbox = {
                    total: box.messages.total,
                    new: box.messages.new,
                    name: box.name
                };
            }
            imap.end();
        });
    });

    imap.once('error', (err) => {
        console.error('IMAP test connection error:', err);
        connectionResult.error = err.message;
        res.json(connectionResult);
    });

    imap.once('end', () => {
        res.json(connectionResult);
    });

    imap.connect();
});

/**
 * Send email via SMTP (Titan/GoDaddy)
 * POST /api/outlook/send-smtp
 */
router.post('/send-smtp', async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, attachments } = req.body;

        // Create SMTP transporter using Titan/GoDaddy credentials
        const transporter = nodemailer.createTransport({
            host: process.env.OUTLOOK_SMTP_HOST || 'smtpout.secureserver.net',
            port: parseInt(process.env.OUTLOOK_SMTP_PORT) || 465,
            secure: true, // Use SSL
            auth: {
                user: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
                pass: process.env.OUTLOOK_PASSWORD || '25nickc124!'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Prepare email options
        const mailOptions = {
            from: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
            to: to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject: subject,
            html: body,
            attachments: attachments ? attachments.map(att => ({
                filename: att.filename || att.name,
                content: att.content,
                encoding: att.encoding || 'base64',
                contentType: att.contentType || 'application/pdf'
            })) : undefined
        };

        console.log('Sending email via SMTP to:', to);
        console.log('Subject:', subject);
        console.log('Attachments:', attachments ? attachments.length : 0);

        const result = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', result.messageId);

        res.json({
            success: true,
            messageId: result.messageId,
            message: 'Email sent successfully via SMTP'
        });

    } catch (error) {
        console.error('SMTP send error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Failed to send email via SMTP'
        });
    }
});

module.exports = router;