#!/usr/bin/env node

/**
 * Setup Outlook Email Connection
 */

const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('=====================================');
console.log('Outlook Email Setup for COI Inbox');
console.log('=====================================\n');

console.log('This will connect your Outlook/Office 365 email to the COI inbox.\n');

console.log('REQUIREMENTS:');
console.log('1. You need an Outlook.com or Office 365 email account');
console.log('2. You need to register an app in Azure AD (instructions below)\n');

console.log('=== STEP 1: Register App in Azure ===\n');
console.log('1. Go to: https://portal.azure.com');
console.log('2. Search for "App registrations" and click on it');
console.log('3. Click "New registration"');
console.log('4. Name: "Vanguard COI Integration"');
console.log('5. Supported account types: "Personal Microsoft accounts only" (for Outlook.com)');
console.log('   OR "Accounts in any organizational directory" (for Office 365)');
console.log('6. Redirect URI: Select "Web" and enter:');
console.log('   http://162-220-14-239.nip.io/api/outlook/callback\n');

console.log('7. After creating, go to "Certificates & secrets"');
console.log('8. Click "New client secret"');
console.log('9. Copy the secret value (you won\'t see it again!)\n');

console.log('10. Go to "API permissions"');
console.log('11. Add these Microsoft Graph permissions:');
console.log('    - Mail.Read');
console.log('    - Mail.Send');
console.log('    - User.Read\n');

console.log('=== STEP 2: Enter App Details ===\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const questions = [
    { key: 'client_id', prompt: 'Enter Application (client) ID: ' },
    { key: 'client_secret', prompt: 'Enter Client Secret: ' },
    { key: 'email', prompt: 'Enter your Outlook email address: ' }
];

const credentials = {
    redirect_uri: 'http://162-220-14-239.nip.io/api/outlook/callback'
};

let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion < questions.length) {
        const q = questions[currentQuestion];
        rl.question(q.prompt, (answer) => {
            credentials[q.key] = answer.trim();
            currentQuestion++;
            askQuestion();
        });
    } else {
        saveAndGenerateUrl();
    }
}

function saveAndGenerateUrl() {
    console.log('\n=== STEP 3: Authorize Access ===\n');

    // Generate auth URL
    const params = new URLSearchParams({
        client_id: credentials.client_id,
        response_type: 'code',
        redirect_uri: credentials.redirect_uri,
        response_mode: 'query',
        scope: 'openid offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
        state: 'outlook_auth'
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    console.log('Open this URL in your browser:\n');
    console.log(authUrl);
    console.log('\n');
    console.log('After authorizing, you\'ll be redirected to a page.');
    console.log('Copy the CODE from the URL (after ?code=)\n');

    rl.question('Paste the authorization code here: ', async (code) => {
        if (!code) {
            console.error('No code provided');
            process.exit(1);
        }

        console.log('\nExchanging code for tokens...');

        try {
            const axios = require('axios');
            const qs = require('querystring');

            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            const tokenParams = {
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                code: code.trim(),
                redirect_uri: credentials.redirect_uri,
                grant_type: 'authorization_code'
            };

            const response = await axios.post(tokenUrl, qs.stringify(tokenParams), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const tokens = {
                ...credentials,
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                token_type: response.data.token_type,
                expiry_date: Date.now() + (response.data.expires_in * 1000)
            };

            // Save to database
            const db = new sqlite3.Database('./vanguard.db');

            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(
                `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
                ['outlook_tokens', JSON.stringify(tokens)],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        process.exit(1);
                    }

                    console.log('\n✅ SUCCESS! Outlook is now connected!');
                    console.log('\n=== What\'s Next ===\n');
                    console.log('1. Restart the backend: pm2 restart vanguard-backend');
                    console.log('2. Update the frontend to use Outlook instead of Gmail');
                    console.log('3. The COI inbox will now fetch emails from:', credentials.email);

                    db.close();
                    rl.close();
                    process.exit(0);
                }
            );
        } catch (error) {
            console.error('\n❌ Error:', error.response?.data || error.message);
            console.error('\nMake sure:');
            console.error('1. The app is registered correctly in Azure');
            console.error('2. The client ID and secret are correct');
            console.error('3. The redirect URI matches exactly');
            rl.close();
            process.exit(1);
        }
    });
}

askQuestion();