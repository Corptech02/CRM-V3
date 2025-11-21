#!/usr/bin/env node

/**
 * Poll for device code authorization and fetch real emails
 */

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const CLIENT_ID = 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e';
const TENANT_ID = 'da8032b6-57f6-40fd-aa76-ed180c5db64b';

console.log('🔄 Checking device code authorization...\n');

const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

// Get device code info
db.get("SELECT value FROM settings WHERE key = 'device_code_info'", async (err, row) => {
    if (err || !row) {
        console.log('❌ No device code found. Run get-real-emails-now.js first.');
        db.close();
        process.exit(1);
    }

    const deviceInfo = JSON.parse(row.value);
    const { device_code, interval = 5 } = deviceInfo;

    console.log('Polling for authorization (this may take up to 2 minutes)...\n');

    let attempts = 0;
    const maxAttempts = 24; // 2 minutes with 5 second intervals

    const pollForToken = () => {
        attempts++;

        const tokenParams = querystring.stringify({
            client_id: CLIENT_ID,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: device_code
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
                        console.log('✅ Authorization successful!\n');

                        // Save tokens
                        await saveToDatabase('outlook_tokens', result);

                        // Fetch emails
                        await fetchRealEmails(result.access_token);

                    } else if (result.error === 'authorization_pending') {
                        process.stdout.write(`⏳ Waiting for authorization... (attempt ${attempts}/${maxAttempts})\r`);

                        if (attempts < maxAttempts) {
                            setTimeout(pollForToken, interval * 1000);
                        } else {
                            console.log('\n❌ Timeout waiting for authorization');
                            console.log('Please try again and make sure to complete the device login.');
                            db.close();
                            process.exit(1);
                        }
                    } else if (result.error === 'authorization_declined') {
                        console.log('❌ Authorization was declined');
                        db.close();
                        process.exit(1);
                    } else if (result.error === 'expired_token') {
                        console.log('❌ Device code expired. Run get-real-emails-now.js again.');
                        db.close();
                        process.exit(1);
                    } else {
                        console.log('❌ Error:', result.error_description || result.error);
                        db.close();
                        process.exit(1);
                    }
                } catch (e) {
                    console.error('Parse error:', e.message);
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
    };

    // Start polling
    pollForToken();
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
    console.log('\n📧 Fetching REAL emails from contact@vigagency.com...\n');

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
                            console.log('🎯🎯🎯 FOUND test2006 EMAIL! 🎯🎯🎯');
                            console.log('━'.repeat(50));
                            console.log('Subject:', test2006.subject);
                            console.log('From:', test2006.from);
                            console.log('Date:', new Date(test2006.date).toLocaleString());
                            console.log('Preview:', test2006.preview?.substring(0, 100));
                            console.log('━'.repeat(50));
                        } else {
                            console.log('📧 Recent email subjects:');
                            formattedEmails.slice(0, 10).forEach((email, i) => {
                                const marker = email.subject?.toLowerCase().includes('test') ? '🔍' : '  ';
                                console.log(`${marker} ${i+1}. ${email.subject}`);
                            });
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
                        console.log('❌ No emails returned:', result.error || 'Unknown error');
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