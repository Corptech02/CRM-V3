#!/usr/bin/env node

/**
 * Exchange fresh authorization code for access token using PKCE
 */

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const CLIENT_ID = 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e';
const TENANT_ID = 'da8032b6-57f6-40fd-aa76-ed180c5db64b';
const REDIRECT_URI = 'https://162-220-14-239.nip.io/api/outlook/callback';

const authCode = process.argv[2];

if (!authCode) {
    console.log('❌ Authorization code required!');
    console.log('');
    console.log('Usage: node exchange-fresh-code.js YOUR_AUTH_CODE');
    console.log('');
    console.log('To get a code:');
    console.log('1. Run: node get-real-emails-now.js');
    console.log('2. Visit the URL shown');
    console.log('3. After authorizing, copy the code from the redirect URL');
    process.exit(1);
}

console.log('🔄 Exchanging authorization code for access token...\n');

const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

// Get PKCE verifier
db.get("SELECT value FROM settings WHERE key = 'pkce_verifier'", async (err, row) => {
    if (err || !row) {
        console.log('⚠️  No PKCE verifier found. Trying without it...');
    }

    const codeVerifier = row ? row.value : '';

    // Exchange code for token
    const tokenParams = querystring.stringify({
        client_id: CLIENT_ID,
        code: authCode,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
    });

    const options = {
        hostname: 'login.microsoftonline.com',
        port: 443,
        path: `/${TENANT_ID}/oauth2/v2.0/token`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': tokenParams.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
            try {
                const result = JSON.parse(data);

                if (result.access_token) {
                    console.log('✅ Access token obtained!\n');

                    // Save tokens
                    await saveToDatabase('outlook_tokens', result);

                    // Fetch emails
                    await fetchRealEmails(result.access_token);

                } else {
                    console.log('❌ Token exchange failed:', result.error_description || result.error);

                    if (result.error === 'invalid_grant') {
                        console.log('\n⚠️  The authorization code may be expired or already used.');
                        console.log('   Run get-real-emails-now.js to get a fresh code.');
                    } else if (result.error_description?.includes('PKCE')) {
                        console.log('\n⚠️  PKCE verification failed.');
                        console.log('   Make sure you\'re using the code from the most recent authorization.');
                    }

                    db.close();
                    process.exit(1);
                }
            } catch (e) {
                console.error('Parse error:', e.message);
                console.log('Response:', data);
                db.close();
                process.exit(1);
            }
        });
    });

    req.on('error', (err) => {
        console.error('Request error:', err);
        db.close();
        process.exit(1);
    });

    req.write(tokenParams);
    req.end();
});

async function saveToDatabase(key, value) {
    return new Promise((resolve) => {
        db.run(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            [key, JSON.stringify(value)],
            (err) => {
                if (err) console.error('Database error:', err);
                else console.log(`✅ ${key} saved`);
                resolve();
            }
        );
    });
}

async function fetchRealEmails(accessToken) {
    console.log('📧 Fetching REAL emails from contact@vigagency.com...\n');

    return new Promise((resolve) => {
        const options = {
            hostname: 'graph.microsoft.com',
            port: 443,
            path: '/v1.0/me/messages?$top=100&$orderby=receivedDateTime desc',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const result = JSON.parse(data);

                    if (result.value) {
                        const emails = result.value;
                        console.log(`✅ Fetched ${emails.length} REAL emails!\n`);

                        // Format for frontend
                        const formattedEmails = emails.map(email => ({
                            id: email.id,
                            subject: email.subject || '(no subject)',
                            from: email.from?.emailAddress?.address,
                            fromName: email.from?.emailAddress?.name,
                            date: email.receivedDateTime,
                            preview: email.bodyPreview,
                            isRead: email.isRead,
                            hasTest2006: (email.subject || '').toLowerCase().includes('test2006')
                        }));

                        // Save to database
                        await saveToDatabase('outlook_real_emails', formattedEmails);

                        // Look for test2006
                        const test2006 = formattedEmails.find(email =>
                            email.subject && email.subject.toLowerCase().includes('test2006')
                        );

                        if (test2006) {
                            console.log('🎯🎯🎯 FOUND REAL test2006 EMAIL! 🎯🎯🎯');
                            console.log('━'.repeat(50));
                            console.log('Subject:', test2006.subject);
                            console.log('From:', test2006.from);
                            console.log('Date:', new Date(test2006.date).toLocaleString());
                            console.log('Preview:', test2006.preview?.substring(0, 100));
                            console.log('━'.repeat(50));
                        } else {
                            console.log('📧 Recent REAL email subjects from contact@vigagency.com:');
                            formattedEmails.slice(0, 10).forEach((email, i) => {
                                const marker = email.subject?.toLowerCase().includes('test') ? '🔍' : '  ';
                                console.log(`${marker} ${i+1}. ${email.subject}`);
                            });

                            console.log('\n⚠️  No email with "test2006" in subject found.');
                            console.log('   Send an email to contact@vigagency.com with "test2006" in the subject.');
                        }

                        // Restart backend
                        const { exec } = require('child_process');
                        exec('pm2 restart vanguard-backend', (err) => {
                            if (!err) {
                                console.log('\n✅ Backend restarted');
                                console.log('\n🎉 SUCCESS! REAL emails from contact@vigagency.com are now live!');
                                console.log('   Refresh your browser to see them in the COI Management tab.');
                            }
                            db.close();
                            process.exit(0);
                        });

                    } else {
                        console.log('❌ Failed to fetch emails:', result.error || 'Unknown error');
                        if (result.error) {
                            console.log('Details:', result.error_description);
                        }
                        db.close();
                        process.exit(1);
                    }
                } catch (e) {
                    console.error('Parse error:', e.message);
                    console.log('Response:', data.substring(0, 500));
                    db.close();
                    process.exit(1);
                }
            });
        });

        req.on('error', (err) => {
            console.error('Request error:', err);
            db.close();
            process.exit(1);
        });

        req.end();
    });
}