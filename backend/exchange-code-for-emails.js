#!/usr/bin/env node

/**
 * Exchange authorization code for access token and fetch real emails
 */

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Your authorization code from the URL
const AUTH_CODE = '1.AVkAtjKA2vZX_UCqdu0YDF22S9ncqdmhCCZMuWrwNJnxLx7nAZdZAA.AgABBAIAAABlMNzVhAPUTrARzfQjWPtKAwDs_wUA9P8B1IfTHkbRFo95nzPRLnh1Axv9hc4WVjuApgaNaPNf7Y-e47PlDqWY8dEERZCYc1_9ojCRUNHwd3xpW3Bl6SVkFP3LQUPVqobF8bYPGoCvuJ5I2OEcZJpx1OtsKorcglm6sarcHwcm_jrK2JafAJVIQHsh2nU5Y9GNvivUjCVNYlnd1NocArlTcnfrkyk6rP1TudntfHw-EjDqJvqGuZC5NkNetOfHLEAYKZYoi3PEovODvPMqqRUKfiXnyUDaXeCfltmxQrMoPCR0aSeixcbC8MPaknuTB95oYqtWt-6GTKJQtLcCx1CMQwJHdOOp7u-Vj1jjGR2ISS-Wy8OWn8gyHb-5yvNz9IPEpO6ncLJvflQD4ZiSqmSgvK44AJdye4_BJ55ZHVRbk2v-kBW3pZ5aimEus2mQK6jLVdom56xXgBmBy0Q_px4Em7bvKpnkv4pMPzuUpLmMJSyJovOsfE1seyNg2YY3l1NtBYtLAHGXtfMq2a1dlRxufp-ywHawz8J_qUtbKKchRW1NZ9AtCgTiMicT7b0oLYmOOcwdRjoT3703sMi53fRCYnnJaA9XPj2TmNJZwDqzEquv85DZK2DEaDk2k-t1UQ-pchV_YEYSXLROswyq412A_yNu5gJk7SDp3DwhCSzdr7gY3hjoghTFvTfapSQjzyFIK7GPAfQEbfREZoF0bFSjet9EkvwDdEqYt49RlT2si19waGtn9tC87ePcbEoEupsAF5VK1E-EQ867AQAZl1H04mKmDJmtyXRWeZhsfFCg7TjAGkB4ct9NvBgc0t9nLvjg3x7WK7xd_pLN0B73y1CzTmTIODM0lCsUWTirVSoQoG-ebHSIIoN1Emg7cwm8AV_CT5_2bSoclgWKQtapY9_7J_d9r6U0IOZ0rCLy-iJRdhdlGQhNwxlKepX8sC3877NgvP0cNXUYe89NAUhfiO2BE35MYkUvb61oyIFi4feKaRqo9enNHcKMCydThz-VuZAM5mUjXRCDvEsucxuw4AO1xv1-wiKOoZH8rql3IFKNbTZ8t6S8ou40ovs1N-Oro7IvjkBww4adEmnFYtxgA_41QPiU_x2C9Rd2UzkOuO9-IhrWLfvcoV37bwc';

console.log('🔄 Exchanging authorization code for access token...\n');

// Get client secret from Azure portal (you need to provide this)
const CLIENT_SECRET = process.argv[2] || process.env.OUTLOOK_CLIENT_SECRET || '';

if (!CLIENT_SECRET) {
    console.log('⚠️  Client secret required!');
    console.log('\nTo get it:');
    console.log('1. Go to Azure Portal');
    console.log('2. Find your app: Vanguard COI Integration');
    console.log('3. Go to Certificates & secrets');
    console.log('4. Create new client secret if needed');
    console.log('5. Run: node exchange-code-for-emails.js YOUR_CLIENT_SECRET');

    // For now, try without client secret (public client flow)
    console.log('\n🔄 Attempting public client flow...\n');
}

async function exchangeCodeForToken() {
    const tokenParams = querystring.stringify({
        client_id: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
        client_secret: CLIENT_SECRET,
        code: AUTH_CODE,
        redirect_uri: 'https://162-220-14-239.nip.io/api/outlook/callback',
        grant_type: 'authorization_code'
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'login.microsoftonline.com',
            port: 443,
            path: '/da8032b6-57f6-40fd-aa76-ed180c5db64b/oauth2/v2.0/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': tokenParams.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        console.log('✅ Access token obtained!');
                        resolve(result);
                    } else {
                        console.log('❌ Token exchange failed:', result.error_description || result.error);
                        reject(new Error(result.error_description || 'Token exchange failed'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(tokenParams);
        req.end();
    });
}

async function fetchEmails(accessToken) {
    console.log('📧 Fetching emails from contact@vigagency.com...\n');

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
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.value) {
                        const emails = result.value;
                        console.log(`✅ Fetched ${emails.length} emails\n`);

                        // Look for test2006
                        const test2006 = emails.find(email =>
                            email.subject && email.subject.toLowerCase().includes('test2006')
                        );

                        if (test2006) {
                            console.log('🎯🎯🎯 FOUND test2006 EMAIL! 🎯🎯🎯');
                            console.log('━'.repeat(50));
                            console.log('Subject:', test2006.subject);
                            console.log('From:', test2006.from?.emailAddress?.address);
                            console.log('Date:', test2006.receivedDateTime);
                            console.log('Preview:', test2006.bodyPreview?.substring(0, 100));
                            console.log('━'.repeat(50));
                        } else {
                            console.log('⚠️  test2006 not found in recent emails');
                            console.log('\nEmail subjects:');
                            emails.slice(0, 10).forEach((email, i) => {
                                console.log(`${i+1}. ${email.subject}`);
                            });
                        }

                        resolve(emails);
                    } else {
                        console.log('Response:', data);
                        reject(new Error('No emails in response'));
                    }
                } catch (e) {
                    console.error('Parse error:', e);
                    console.log('Response:', data);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function saveEmails(emails) {
    const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

    const emailData = emails.map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.from?.emailAddress?.address,
        fromName: email.from?.emailAddress?.name,
        date: email.receivedDateTime,
        preview: email.bodyPreview,
        isRead: email.isRead,
        hasTest2006: email.subject?.toLowerCase().includes('test2006')
    }));

    return new Promise((resolve, reject) => {
        db.run(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_real_emails', ?)",
            [JSON.stringify(emailData)],
            (err) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    console.log('\n✅ Emails saved to database');
                    resolve();
                }
                db.close();
            }
        );
    });
}

// Main execution
async function main() {
    try {
        console.log('Starting email fetch process...\n');

        // Exchange code for token
        const tokens = await exchangeCodeForToken();

        // Save tokens
        const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));
        await new Promise((resolve, reject) => {
            db.run(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_tokens', ?)",
                [JSON.stringify(tokens)],
                (err) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Tokens saved\n');
                        resolve();
                    }
                    db.close();
                }
            );
        });

        // Fetch emails
        const emails = await fetchEmails(tokens.access_token);

        // Save emails
        await saveEmails(emails);

        console.log('\n' + '='.repeat(50));
        console.log('✅ SUCCESS! Real emails are now available!');
        console.log('='.repeat(50));
        console.log('\n📋 Next steps:');
        console.log('1. Restart backend: pm2 restart vanguard-backend');
        console.log('2. Refresh your browser');
        console.log('3. Go to COI Management tab');
        console.log('4. You should see real emails including test2006!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nIf you need the client secret:');
        console.log('1. Go to Azure Portal');
        console.log('2. Find your app registration');
        console.log('3. Get or create a client secret');
        console.log('4. Run: node exchange-code-for-emails.js YOUR_SECRET');
    }
}

main();