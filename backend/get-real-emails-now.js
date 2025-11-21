#!/usr/bin/env node

/**
 * Get REAL emails from contact@vigagency.com - Multiple methods
 */

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const CLIENT_ID = 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e';
const TENANT_ID = 'da8032b6-57f6-40fd-aa76-ed180c5db64b';
const REDIRECT_URI = 'https://162-220-14-239.nip.io/api/outlook/callback';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  GET REAL EMAILS FROM contact@vigagency.com');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Method 1: Generate fresh authorization URL
console.log('📋 METHOD 1: Fresh OAuth Authorization');
console.log('');
console.log('Visit this URL in your browser:');
console.log('');

// Generate PKCE challenge for public client flow
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
    querystring.stringify({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        response_mode: 'query',
        scope: 'https://graph.microsoft.com/Mail.Read offline_access',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'consent'
    });

console.log(authUrl);
console.log('');
console.log('After authorizing, you\'ll get a code in the URL.');
console.log('Save that code and run:');
console.log('node /var/www/vanguard/backend/exchange-fresh-code.js YOUR_CODE');
console.log('');

// Save PKCE verifier for later use
const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));
db.run(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('pkce_verifier', ?)",
    [codeVerifier],
    () => {
        console.log('✅ PKCE verifier saved for code exchange');
    }
);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Method 2: Try device code flow
console.log('📋 METHOD 2: Device Code Flow (No redirect needed)');
console.log('');
console.log('Initiating device code flow...');

const deviceCodeParams = querystring.stringify({
    client_id: CLIENT_ID,
    scope: 'https://graph.microsoft.com/Mail.Read offline_access'
});

const deviceCodeOptions = {
    hostname: 'login.microsoftonline.com',
    port: 443,
    path: `/${TENANT_ID}/oauth2/v2.0/devicecode`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': deviceCodeParams.length
    }
};

const req = https.request(deviceCodeOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);

            if (result.user_code) {
                console.log('');
                console.log('🔑 DEVICE CODE INSTRUCTIONS:');
                console.log('');
                console.log('1. Go to:', result.verification_uri);
                console.log('');
                console.log('2. Enter code:', result.user_code);
                console.log('');
                console.log('3. Sign in with: contact@vigagency.com');
                console.log('');
                console.log('4. After approval, run:');
                console.log('   node /var/www/vanguard/backend/poll-device-code.js');
                console.log('');

                // Save device code info
                db.run(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES ('device_code_info', ?)",
                    [JSON.stringify(result)],
                    () => {
                        console.log('✅ Device code saved');
                        console.log('');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        db.close();
                    }
                );
            } else {
                console.log('❌ Device code request failed:', result.error_description || result.error);
                db.close();
            }
        } catch (e) {
            console.error('Error:', e.message);
            db.close();
        }
    });
});

req.on('error', (err) => {
    console.error('Request error:', err);
    db.close();
});

req.write(deviceCodeParams);
req.end();