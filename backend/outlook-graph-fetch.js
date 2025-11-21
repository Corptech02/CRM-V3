#!/usr/bin/env node

/**
 * Fetch REAL emails from Outlook using Graph API
 * This will actually connect and get the test2006 email
 */

const https = require('https');
const express = require('express');
const router = express.Router();

// Simple test endpoint to fetch real emails
router.get('/api/outlook/test-real', async (req, res) => {
    try {
        // First, we need an access token
        // For testing, let's use the client credentials flow
        const tokenData = await getAccessToken();

        if (!tokenData.access_token) {
            // Return instructions to get token
            res.json({
                needsAuth: true,
                message: 'Need to authenticate first',
                authUrl: getAuthUrl()
            });
            return;
        }

        // Fetch real emails using Graph API
        const emails = await fetchRealEmails(tokenData.access_token);

        res.json({
            success: true,
            emails: emails,
            account: 'contact@vigagency.com'
        });

    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: error.message });
    }
});

async function getAccessToken() {
    // Try to get token from database first
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

    return new Promise((resolve) => {
        db.get("SELECT value FROM settings WHERE key = 'outlook_tokens'", (err, row) => {
            db.close();
            if (row) {
                const tokens = JSON.parse(row.value);
                resolve(tokens);
            } else {
                resolve({});
            }
        });
    });
}

async function fetchRealEmails(accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'graph.microsoft.com',
            port: 443,
            path: '/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.value) {
                        // Format emails for display
                        const emails = result.value.map(email => ({
                            id: email.id,
                            subject: email.subject,
                            from: email.from?.emailAddress?.address || 'unknown',
                            fromName: email.from?.emailAddress?.name || '',
                            date: email.receivedDateTime,
                            preview: email.bodyPreview,
                            isRead: email.isRead,
                            hasAttachments: email.hasAttachments
                        }));
                        resolve(emails);
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function getAuthUrl() {
    const params = new URLSearchParams({
        client_id: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
        response_type: 'code',
        redirect_uri: 'https://162-220-14-239.nip.io/api/outlook/callback',
        response_mode: 'query',
        scope: 'https://graph.microsoft.com/Mail.Read',
        state: 'fetch_emails'
    });

    return 'https://login.microsoftonline.com/da8032b6-57f6-40fd-aa76-ed180c5db64b/oauth2/v2.0/authorize?' + params.toString();
}

module.exports = router;

// If running directly, test the connection
if (require.main === module) {
    console.log('\n🔍 Testing Outlook connection for test2006 email...\n');

    // Try IMAP as backup method
    const Imap = require('imap');
    const { simpleParser } = require('mailparser');

    console.log('Enter app password for contact@vigagency.com:');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('App Password: ', (password) => {
        const imap = new Imap({
            user: 'contact@vigagency.com',
            password: password,
            host: 'outlook.office365.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', () => {
            console.log('✅ Connected to Outlook!');

            imap.openBox('INBOX', true, (err, box) => {
                if (err) throw err;

                console.log('📧 Fetching emails...');

                // Fetch last 20 emails
                const f = imap.seq.fetch(`${Math.max(1, box.messages.total - 20)}:*`, {
                    bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
                    struct: true
                });

                f.on('message', (msg) => {
                    msg.on('body', (stream) => {
                        let buffer = '';
                        stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
                        stream.on('end', () => {
                            const header = Imap.parseHeader(buffer);
                            if (header.subject && header.subject[0].includes('test2006')) {
                                console.log('🎯 FOUND test2006 email!');
                                console.log('  Subject:', header.subject[0]);
                                console.log('  From:', header.from ? header.from[0] : 'unknown');
                                console.log('  Date:', header.date ? header.date[0] : 'unknown');
                            }
                        });
                    });
                });

                f.once('end', () => {
                    console.log('✅ Email fetch complete');
                    imap.end();
                    rl.close();
                });
            });
        });

        imap.once('error', (err) => {
            console.error('❌ Connection error:', err);
            rl.close();
        });

        imap.connect();
    });
}