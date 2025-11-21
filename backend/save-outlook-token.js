#!/usr/bin/env node

const code = process.argv[2];
if (!code) {
    console.error('Usage: node save-outlook-token.js [authorization-code]');
    process.exit(1);
}

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const config = {
    clientId: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
    clientSecret: process.env.OUTLOOK_SECRET || 'YOUR_CLIENT_SECRET',
    tenantId: 'da8032b6-57f6-40fd-aa76-ed180c5db64b',
    redirectUri: 'https://162-220-14-239.nip.io/api/outlook/callback'
};

console.log('Exchanging code for tokens...');

const tokenParams = querystring.stringify({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code'
});

const options = {
    hostname: 'login.microsoftonline.com',
    port: 443,
    path: '/' + config.tenantId + '/oauth2/v2.0/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': tokenParams.length
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const tokens = JSON.parse(data);

            if (tokens.access_token) {
                // Save tokens to database
                const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

                const tokenData = {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_in: tokens.expires_in,
                    token_type: tokens.token_type,
                    created_at: Date.now()
                };

                db.run(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_tokens', ?)",
                    [JSON.stringify(tokenData)],
                    (err) => {
                        if (err) {
                            console.error('Error saving tokens:', err);
                        } else {
                            console.log('✅ Tokens saved successfully!');
                            console.log('\nOutlook is now connected!');
                            console.log('Restart backend: pm2 restart vanguard-backend');
                        }
                        db.close();
                    }
                );
            } else {
                console.error('❌ Error:', data);
                console.log('\nMake sure you added the client secret to the script');
            }
        } catch (e) {
            console.error('Error parsing response:', e);
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(tokenParams);
req.end();
