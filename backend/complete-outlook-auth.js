#!/usr/bin/env node

/**
 * Complete Outlook authentication with client secret
 */

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Your saved authorization code
const AUTH_CODE = '1.AVkAtjKA2vZX_UCqdu0YDF22S9ncqdmhCCZMuWrwNJnxLx7nAZdZAA.AgABBAIAAABlMNzVhAPUTrARzfQjWPtKAwDs_wUA9P8B1IfTHkbRFo95nzPRLnh1Axv9hc4WVjuApgaNaPNf7Y-e47PlDqWY8dEERZCYc1_9ojCRUNHwd3xpW3Bl6SVkFP3LQUPVqobF8bYPGoCvuJ5I2OEcZJpx1OtsKorcglm6sarcHwcm_jrK2JafAJVIQHsh2nU5Y9GNvivUjCVNYlnd1NocArlTcnfrkyk6rP1TudntfHw-EjDqJvqGuZC5NkNetOfHLEAYKZYoi3PEovODvPMqqRUKfiXnyUDaXeCfltmxQrMoPCR0aSeixcbC8MPaknuTB95oYqtWt-6GTKJQtLcCx1CMQwJHdOOp7u-Vj1jjGR2ISS-Wy8OWn8gyHb-5yvNz9IPEpO6ncLJvflQD4ZiSqmSgvK44AJdye4_BJ55ZHVRbk2v-kBW3pZ5aimEus2mQK6jLVdom56xXgBmBy0Q_px4Em7bvKpnkv4pMPzuUpLmMJSyJovOsfE1seyNg2YY3l1NtBYtLAHGXtfMq2a1dlRxufp-ywHawz8J_qUtbKKchRW1NZ9AtCgTiMicT7b0oLYmOOcwdRjoT3703sMi53fRCYnnJaA9XPj2TmNJZwDqzEquv85DZK2DEaDk2k-t1UQ-pchV_YEYSXLROswyq412A_yNu5gJk7SDp3DwhCSzdr7gY3hjoghTFvTfapSQjzyFIK7GPAfQEbfREZoF0bFSjet9EkvwDdEqYt49RlT2si19waGtn9tC87ePcbEoEupsAF5VK1E-EQ867AQAZl1H04mKmDJmtyXRWeZhsfFCg7TjAGkB4ct9NvBgc0t9nLvjg3x7WK7xd_pLN0B73y1CzTmTIODM0lCsUWTirVSoQoG-ebHSIIoN1Emg7cwm8AV_CT5_2bSoclgWKQtapY9_7J_d9r6U0IOZ0rCLy-iJRdhdlGQhNwxlKepX8sC3877NgvP0cNXUYe89NAUhfiO2BE35MYkUvb61oyIFi4feKaRqo9enNHcKMCydThz-VuZAM5mUjXRCDvEsucxuw4AO1xv1-wiKOoZH8rql3IFKNbTZ8t6S8ou40ovs1N-Oro7IvjkBww4adEmnFYtxgA_41QPiU_x2C9Rd2UzkOuO9-IhrWLfvcoV37bwc';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  COMPLETE OUTLOOK AUTHENTICATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('To fetch REAL emails from contact@vigagency.com,');
console.log('we need a client secret from Azure.');
console.log('');
console.log('📋 STEPS TO GET CLIENT SECRET:');
console.log('');
console.log('1. Go to: https://portal.azure.com');
console.log('');
console.log('2. Search for "App registrations"');
console.log('');
console.log('3. Find: Vanguard COI Integration');
console.log('   (Application ID: d9a9dcd9-08a1-4c26-b96a-f03499f12f1e)');
console.log('');
console.log('4. Click "Certificates & secrets" in left menu');
console.log('');
console.log('5. Click "+ New client secret"');
console.log('');
console.log('6. Give it a name like "Vanguard Backend"');
console.log('');
console.log('7. Choose expiration (24 months recommended)');
console.log('');
console.log('8. Click "Add"');
console.log('');
console.log('9. COPY THE VALUE (not the ID!)');
console.log('   ⚠️  You can only see it once!');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

rl.question('Enter your client secret: ', async (clientSecret) => {
    if (!clientSecret) {
        console.log('\n❌ No client secret provided');
        console.log('\n💡 For now, test2006 email has been added to demonstrate the system works.');
        console.log('   Once you have the client secret, run this script again to fetch real emails.');
        rl.close();
        process.exit(0);
    }

    console.log('\n🔄 Exchanging authorization code for access token...\n');

    try {
        // Exchange code for token
        const tokenParams = querystring.stringify({
            client_id: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
            client_secret: clientSecret,
            code: AUTH_CODE,
            redirect_uri: 'https://162-220-14-239.nip.io/api/outlook/callback',
            grant_type: 'authorization_code'
        });

        const tokenResponse = await new Promise((resolve, reject) => {
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
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(tokenParams);
            req.end();
        });

        if (tokenResponse.error) {
            console.log('❌ Token exchange failed:', tokenResponse.error_description || tokenResponse.error);

            if (tokenResponse.error.includes('expired') || tokenResponse.error.includes('invalid_grant')) {
                console.log('\n⚠️  The authorization code has expired.');
                console.log('   You need to re-authorize the application.');
                console.log('\n   Visit: https://login.microsoftonline.com/da8032b6-57f6-40fd-aa76-ed180c5db64b/oauth2/v2.0/authorize?client_id=d9a9dcd9-08a1-4c26-b96a-f03499f12f1e&response_type=code&redirect_uri=https://162-220-14-239.nip.io/api/outlook/callback&scope=https://graph.microsoft.com/.default');
            }

            rl.close();
            process.exit(1);
        }

        console.log('✅ Access token obtained!');

        // Save tokens to database
        const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

        await new Promise((resolve, reject) => {
            db.run(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_tokens', ?)",
                [JSON.stringify(tokenResponse)],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Save client secret for future use
        await new Promise((resolve, reject) => {
            db.run(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_client_secret', ?)",
                [clientSecret],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        console.log('✅ Tokens saved to database');

        // Now fetch emails
        console.log('\n📧 Fetching emails from contact@vigagency.com...\n');

        const emailsResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'graph.microsoft.com',
                port: 443,
                path: '/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + tokenResponse.access_token,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });

        if (emailsResponse.value) {
            const emails = emailsResponse.value;
            console.log(`✅ Fetched ${emails.length} emails`);

            // Format for frontend
            const formattedEmails = emails.map(email => ({
                id: email.id,
                subject: email.subject,
                from: email.from?.emailAddress?.address,
                fromName: email.from?.emailAddress?.name,
                date: email.receivedDateTime,
                preview: email.bodyPreview,
                isRead: email.isRead,
                hasTest2006: email.subject?.toLowerCase().includes('test2006')
            }));

            // Save to database
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_real_emails', ?)",
                    [JSON.stringify(formattedEmails)],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Check for test2006
            const test2006 = formattedEmails.find(email =>
                email.subject && email.subject.toLowerCase().includes('test2006')
            );

            if (test2006) {
                console.log('\n🎯🎯🎯 FOUND test2006 EMAIL! 🎯🎯🎯');
                console.log('━'.repeat(50));
                console.log('Subject:', test2006.subject);
                console.log('From:', test2006.from);
                console.log('Date:', test2006.date);
                console.log('━'.repeat(50));
            } else {
                console.log('\n⚠️  test2006 not found in recent emails');
                console.log('Showing first 5 subjects:');
                formattedEmails.slice(0, 5).forEach((email, i) => {
                    console.log(`${i+1}. ${email.subject}`);
                });
            }

            console.log('\n✅ Real emails saved to database!');
            console.log('🔄 Restarting backend...');

            const { exec } = require('child_process');
            exec('pm2 restart vanguard-backend', (err) => {
                if (!err) {
                    console.log('✅ Backend restarted');
                    console.log('\n🎉 SUCCESS! Real emails are now live!');
                    console.log('   Refresh your browser to see them.');
                }
                db.close();
                rl.close();
                process.exit(0);
            });

        } else {
            console.log('❌ Failed to fetch emails:', emailsResponse.error || 'Unknown error');
            db.close();
            rl.close();
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
});