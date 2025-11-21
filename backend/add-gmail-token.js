#!/usr/bin/env node

/**
 * Simple script to add Gmail token
 */

const readline = require('readline');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('=====================================');
console.log('Gmail Token Setup for corptech06@gmail.com');
console.log('=====================================\n');

// OAuth2 credentials
const CLIENT_ID = '794453705883-6b32cpfctd77t5ls5kktu2s9ub27p19q.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
];

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
});

console.log('STEP 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n' + '='.repeat(50) + '\n');

console.log('STEP 2: Sign in with Gmail account:');
console.log('  Email: corptech06@gmail.com');
console.log('  Pass:  corp2006\n');

console.log('STEP 3: Click "Allow" on all permissions\n');

console.log('STEP 4: You will see a code like this:');
console.log('  4/1AfJohXn5V1o...[long string]\n');

console.log('STEP 5: Copy that ENTIRE code\n');
console.log('='.repeat(50) + '\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Paste the authorization code here: ', async (code) => {
    if (!code || code.trim().length === 0) {
        console.error('\n❌ No code provided');
        process.exit(1);
    }

    console.log('\nProcessing code...');

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code.trim());

        console.log('✅ Got tokens from Google!');

        // Open database
        const db = new sqlite3.Database('./vanguard.db');

        // Create settings table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Prepare the credentials object
        const credentials = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: 'http://162-220-14-239.nip.io/api/gmail/callback',
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
            token_type: tokens.token_type || 'Bearer',
            expiry_date: tokens.expiry_date,
            email: 'corptech06@gmail.com'
        };

        console.log('Saving to database...');

        // Save to database
        db.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
            ['gmail_tokens', JSON.stringify(credentials)],
            function(err) {
                if (err) {
                    console.error('❌ Database error:', err.message);
                    db.close();
                    rl.close();
                    process.exit(1);
                }

                console.log('✅ Tokens saved successfully!');

                // Close database
                db.close();

                console.log('\n' + '='.repeat(50));
                console.log('SUCCESS! Gmail is now connected.');
                console.log('='.repeat(50) + '\n');

                console.log('Restarting backend server...');

                const { exec } = require('child_process');
                exec('pm2 restart vanguard-backend', (error, stdout) => {
                    if (error) {
                        console.log('\n⚠️  Please manually restart the backend:');
                        console.log('   pm2 restart vanguard-backend\n');
                    } else {
                        console.log('✅ Backend restarted successfully!\n');
                    }

                    console.log('The COI Request Inbox should now work properly.');
                    console.log('Go to COI Management and check the inbox.\n');

                    rl.close();
                    process.exit(0);
                });
            }
        );
    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('invalid_grant')) {
            console.error('\nThe code was invalid or expired. Please try again with a fresh code.');
        } else if (error.message.includes('redirect_uri_mismatch')) {
            console.error('\nRedirect URI mismatch. Using manual flow instead.');
        } else {
            console.error('\nMake sure you copied the ENTIRE code including any "/" or "-" characters.');
        }

        rl.close();
        process.exit(1);
    }
});