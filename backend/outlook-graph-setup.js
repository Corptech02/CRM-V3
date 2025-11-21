#!/usr/bin/env node

/**
 * Microsoft Graph API Setup for Outlook
 * Works with 2FA/MFA enabled accounts
 */

const https = require('https');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('\n📧 Microsoft Graph API Setup for Outlook\n');
console.log('=' .repeat(60));

console.log('\nThis method works with 2FA/MFA enabled accounts!\n');

// Your Azure app details
const config = {
    clientId: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
    tenantId: 'da8032b6-57f6-40fd-aa76-ed180c5db64b',
    redirectUri: 'https://162-220-14-239.nip.io/api/outlook/callback'
};

console.log('📋 Your Azure App is already configured:');
console.log(`   Client ID: ${config.clientId}`);
console.log(`   Tenant: vigagency.com\n`);

console.log('🔐 Since you have 2FA enabled, we\'ll use delegated permissions.\n');

console.log('STEP 1: Click this link to authorize:');
console.log('=' .repeat(60));

const authParams = querystring.stringify({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    response_mode: 'query',
    scope: 'openid offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send',
    state: 'coi_setup',
    prompt: 'consent'
});

const authUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${authParams}`;

console.log('\n' + authUrl + '\n');

console.log('=' .repeat(60));
console.log('\nSTEP 2: After signing in with grant@vigagency.com:');
console.log('   • Complete 2FA verification');
console.log('   • Approve permissions');
console.log('   • You\'ll be redirected');
console.log('   • Copy the CODE from the URL\n');

console.log('STEP 3: Run this command with your code:');
console.log('   node save-outlook-token.js YOUR_CODE_HERE\n');

// Create the token saver script
const tokenScript = `#!/usr/bin/env node

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
    clientId: '${config.clientId}',
    clientSecret: process.env.OUTLOOK_SECRET || 'YOUR_CLIENT_SECRET',
    tenantId: '${config.tenantId}',
    redirectUri: '${config.redirectUri}'
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
                            console.log('\\nOutlook is now connected!');
                            console.log('Restart backend: pm2 restart vanguard-backend');
                        }
                        db.close();
                    }
                );
            } else {
                console.error('❌ Error:', data);
                console.log('\\nMake sure you added the client secret to the script');
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
`;

require('fs').writeFileSync(
    path.join(__dirname, 'save-outlook-token.js'),
    tokenScript,
    { mode: 0o755 }
);

console.log('✅ Helper script created: save-outlook-token.js\n');

console.log('=' .repeat(60));
console.log('\n💡 Alternative: Use modern authentication library\n');
console.log('If manual auth is complex, we can set up MSAL:');
console.log('   npm install @microsoft/microsoft-graph-client');
console.log('   npm install @azure/msal-node\n');

console.log('This will handle 2FA automatically through browser auth.\n');