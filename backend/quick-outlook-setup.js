#!/usr/bin/env node

/**
 * Quick Outlook Setup - Simplified version
 */

const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const qs = require('querystring');

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║     OUTLOOK EMAIL SETUP - QUICK GUIDE         ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('This will connect your Outlook/Office 365 email to the COI inbox.\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 WHAT YOU\'LL NEED:');
console.log('   • Your Outlook/Office 365 email address');
console.log('   • A Microsoft/Azure account (free)');
console.log('   • About 5 minutes\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('🚀 STEP 1: REGISTER YOUR APP IN AZURE\n');
    console.log('Open this link in your browser:');
    console.log('\x1b[36m%s\x1b[0m', 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade');
    console.log('\nIf you don\'t have an Azure account, you can create one for free.\n');

    await question('Press ENTER when you have the Azure portal open...');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 STEP 2: CREATE NEW APP REGISTRATION\n');
    console.log('1. Click the "➕ New registration" button at the top\n');
    console.log('2. Fill in these EXACT details:');
    console.log('   • Name: \x1b[33mVanguard COI Integration\x1b[0m');
    console.log('   • Supported account types: Select one of these:');
    console.log('     - "\x1b[32mAccounts in any organizational directory\x1b[0m" (for work/school accounts)');
    console.log('     - "\x1b[32mPersonal Microsoft accounts only\x1b[0m" (for personal Outlook.com)');
    console.log('   • Redirect URI: Select "\x1b[33mWeb\x1b[0m" from dropdown, then enter:');
    console.log('     \x1b[36mhttp://162-220-14-239.nip.io/api/outlook/callback\x1b[0m\n');
    console.log('3. Click "\x1b[32mRegister\x1b[0m" button\n');

    await question('Press ENTER after you\'ve registered the app...');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEP 3: COPY YOUR APP ID\n');
    console.log('You should now see your app\'s overview page.');
    console.log('Find and copy the "\x1b[33mApplication (client) ID\x1b[0m" - it looks like:');
    console.log('Example: \x1b[36m12345678-1234-1234-1234-123456789012\x1b[0m\n');

    const clientId = await question('Paste your Application (client) ID here: ');

    if (!clientId || clientId.length < 30) {
        console.log('\x1b[31m❌ That doesn\'t look like a valid client ID. Please try again.\x1b[0m');
        process.exit(1);
    }

    console.log('\n✅ Got your client ID!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔐 STEP 4: CREATE CLIENT SECRET\n');
    console.log('1. On the left menu, click "\x1b[33mCertificates & secrets\x1b[0m"');
    console.log('2. Click "\x1b[32m➕ New client secret\x1b[0m" button');
    console.log('3. Add a description like "Vanguard COI"');
    console.log('4. Choose expiration (recommend 24 months)');
    console.log('5. Click "\x1b[32mAdd\x1b[0m"');
    console.log('\n\x1b[31m⚠️  IMPORTANT: Copy the secret VALUE (not the ID) immediately!\x1b[0m');
    console.log('You won\'t be able to see it again!\n');

    const clientSecret = await question('Paste your Client Secret VALUE here: ');

    if (!clientSecret || clientSecret.length < 20) {
        console.log('\x1b[31m❌ That doesn\'t look like a valid secret. Please try again.\x1b[0m');
        process.exit(1);
    }

    console.log('\n✅ Got your client secret!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔑 STEP 5: ADD PERMISSIONS\n');
    console.log('1. On the left menu, click "\x1b[33mAPI permissions\x1b[0m"');
    console.log('2. Click "\x1b[32m➕ Add a permission\x1b[0m"');
    console.log('3. Select "\x1b[33mMicrosoft Graph\x1b[0m"');
    console.log('4. Select "\x1b[33mDelegated permissions\x1b[0m"');
    console.log('5. Search and check these permissions:');
    console.log('   ✓ Mail.Read');
    console.log('   ✓ Mail.Send');
    console.log('   ✓ User.Read');
    console.log('6. Click "\x1b[32mAdd permissions\x1b[0m" button\n');

    await question('Press ENTER after you\'ve added all permissions...');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 STEP 6: ENTER YOUR EMAIL\n');

    const email = await question('Enter your Outlook/Office 365 email address: ');

    if (!email || !email.includes('@')) {
        console.log('\x1b[31m❌ Please enter a valid email address.\x1b[0m');
        process.exit(1);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔗 STEP 7: AUTHORIZE ACCESS\n');

    // Generate authorization URL
    const redirectUri = 'http://162-220-14-239.nip.io/api/outlook/callback';
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        response_mode: 'query',
        scope: 'openid offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
        state: 'outlook_auth',
        prompt: 'consent'
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    console.log('Click this link to authorize (or copy and paste it):');
    console.log('\x1b[36m%s\x1b[0m\n', authUrl);

    console.log('After you authorize:');
    console.log('1. You\'ll be redirected to a page that might show an error');
    console.log('2. Look at the URL bar - it will contain: \x1b[33m?code=...\x1b[0m');
    console.log('3. Copy EVERYTHING after "code=" up to (but not including) any "&"\n');
    console.log('Example: The URL might look like:');
    console.log('http://162-220-14-239.nip.io/api/outlook/callback\x1b[33m?code=M.R3_BAY.12345...\x1b[0m&state=...\n');
    console.log('You would copy: \x1b[33mM.R3_BAY.12345...\x1b[0m\n');

    const code = await question('Paste the authorization code here: ');

    if (!code) {
        console.log('\x1b[31m❌ No code provided\x1b[0m');
        process.exit(1);
    }

    console.log('\n🔄 Exchanging code for access tokens...\n');

    try {
        // Exchange code for tokens
        const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const tokenParams = {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        };

        const response = await axios.post(tokenUrl, qs.stringify(tokenParams), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('✅ Successfully obtained access tokens!\n');

        // Prepare credentials
        const credentials = {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            refresh_token: response.data.refresh_token,
            access_token: response.data.access_token,
            token_type: response.data.token_type || 'Bearer',
            expiry_date: Date.now() + (response.data.expires_in * 1000),
            email: email
        };

        // Save to database
        console.log('💾 Saving credentials to database...\n');

        const db = new sqlite3.Database('./vanguard.db');

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
            ['outlook_tokens', JSON.stringify(credentials)],
            function(err) {
                if (err) {
                    console.error('\x1b[31m❌ Database error:\x1b[0m', err);
                    process.exit(1);
                }

                console.log('╔════════════════════════════════════════════════╗');
                console.log('║            🎉 SUCCESS! 🎉                     ║');
                console.log('╚════════════════════════════════════════════════╝\n');

                console.log('✅ Outlook is now connected to your COI inbox!\n');
                console.log('📧 Email account: \x1b[32m' + email + '\x1b[0m\n');

                console.log('🔄 Restarting backend server...\n');

                const { exec } = require('child_process');
                exec('pm2 restart vanguard-backend', (error, stdout) => {
                    if (error) {
                        console.log('⚠️  Please manually restart the backend:');
                        console.log('   \x1b[33mpm2 restart vanguard-backend\x1b[0m\n');
                    } else {
                        console.log('✅ Backend server restarted!\n');
                    }

                    console.log('📌 WHAT\'S NEXT:');
                    console.log('1. Go to the COI Management tab in your browser');
                    console.log('2. The inbox will now show emails from your Outlook account');
                    console.log('3. You can switch between Gmail and Outlook using the toggle button\n');

                    db.close();
                    rl.close();
                    process.exit(0);
                });
            }
        );
    } catch (error) {
        console.error('\n\x1b[31m❌ Error:\x1b[0m', error.response?.data?.error_description || error.message);

        if (error.response?.data?.error === 'invalid_grant') {
            console.log('\nThe authorization code has expired or was already used.');
            console.log('Please run this script again and use a fresh code.');
        } else if (error.response?.data?.error === 'invalid_client') {
            console.log('\nThe client ID or secret is incorrect.');
            console.log('Please verify your credentials in Azure.');
        } else {
            console.log('\nCommon issues:');
            console.log('• Make sure you copied the ENTIRE code');
            console.log('• The code expires quickly - try again with a fresh one');
            console.log('• Verify the redirect URI matches exactly in Azure');
        }

        rl.close();
        process.exit(1);
    }
}

main().catch(console.error);