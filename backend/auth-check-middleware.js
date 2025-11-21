// Middleware to check Gmail authentication status
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vanguard.db');

// Check if Gmail is authenticated for protected routes
function requireGmailAuth(req, res, next) {
    // Check if credentials exist in database
    db.get('SELECT value FROM settings WHERE key = ?', ['gmail_tokens'], (err, row) => {
        if (err || !row) {
            return res.status(401).json({
                error: 'Gmail not authorized. Please complete Gmail authorization first.',
                authRequired: true,
                authUrl: '/api/gmail/auth-url'
            });
        }

        try {
            const credentials = JSON.parse(row.value);
            if (!credentials.refresh_token) {
                return res.status(401).json({
                    error: 'Gmail authorization incomplete. Please re-authorize Gmail access.',
                    authRequired: true,
                    authUrl: '/api/gmail/auth-url'
                });
            }

            // Store credentials in request for use by routes
            req.gmailCredentials = credentials;
            next();
        } catch (parseErr) {
            return res.status(401).json({
                error: 'Gmail authorization data corrupted. Please re-authorize Gmail access.',
                authRequired: true,
                authUrl: '/api/gmail/auth-url'
            });
        }
    });
}

// Check auth status endpoint
function getAuthStatus(req, res) {
    db.get('SELECT value FROM settings WHERE key = ?', ['gmail_tokens'], (err, row) => {
        if (err || !row) {
            return res.json({
                authenticated: false,
                message: 'Gmail not authorized',
                authUrl: '/api/gmail/auth-url'
            });
        }

        try {
            const credentials = JSON.parse(row.value);
            const hasRefreshToken = !!credentials.refresh_token;
            const isExpired = credentials.expiry_date && credentials.expiry_date < Date.now();

            res.json({
                authenticated: hasRefreshToken,
                expired: isExpired,
                message: hasRefreshToken ?
                    (isExpired ? 'Gmail tokens expired but can be refreshed' : 'Gmail authenticated') :
                    'Gmail not authorized',
                authUrl: hasRefreshToken ? null : '/api/gmail/auth-url'
            });
        } catch (parseErr) {
            res.json({
                authenticated: false,
                message: 'Gmail authorization data corrupted',
                authUrl: '/api/gmail/auth-url'
            });
        }
    });
}

module.exports = { requireGmailAuth, getAuthStatus };