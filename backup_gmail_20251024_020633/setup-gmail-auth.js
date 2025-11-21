#!/usr/bin/env node

/**
 * Setup Gmail Authentication Script
 * Run this to re-authenticate Gmail API access
 */

const { google } = require('googleapis');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = new sqlite3.Database('./vanguard.db');

// Gmail OAuth2 credentials
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '794453705883-6b32cpfctd77t5ls5kktu2s9ub27p19q.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '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';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://162-220-14-239.nip.io/api/gmail/callback';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Gmail scopes
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
];

// Initialize database table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

async function main() {
    console.log('Gmail Authentication Setup');
    console.log('==========================');
    console.log('Email: corptech06@gmail.com');
    console.log('');

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });

    console.log('1. Open this URL in your browser to authorize Gmail access:');
    console.log('');
    console.log(authUrl);
    console.log('');

    // Create readline interface for input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('2. After authorizing, you will be redirected to a page.');
    console.log('   Copy the authorization code from the URL (after ?code=)');
    console.log('');

    rl.question('3. Enter the authorization code here: ', async (code) => {
        try {
            console.log('');
            console.log('Getting access token...');

            // Exchange authorization code for tokens
            const { tokens } = await oauth2Client.getToken(code);

            console.log('Access token received!');

            // Store tokens
            const credentials = {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                refresh_token: tokens.refresh_token,
                access_token: tokens.access_token,
                token_type: tokens.token_type,
                expiry_date: tokens.expiry_date,
                email: 'corptech06@gmail.com'
            };

            // Save to database
            db.run(
                `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
                ['gmail_tokens', JSON.stringify(credentials)],
                (err) => {
                    if (err) {
                        console.error('Error saving tokens to database:', err);
                        process.exit(1);
                    }

                    console.log('');
                    console.log('✅ Gmail authentication successful!');
                    console.log('Tokens saved to database.');
                    console.log('');
                    console.log('You may need to restart the backend server:');
                    console.log('  pm2 restart vanguard-backend');
                    console.log('');

                    db.close();
                    rl.close();
                    process.exit(0);
                }
            );
        } catch (error) {
            console.error('');
            console.error('❌ Error getting access token:', error.message);
            console.error('');
            console.error('Please try again. Make sure you:');
            console.error('1. Used the correct Google account (corptech06@gmail.com)');
            console.error('2. Copied the complete authorization code');
            console.error('3. Have a working internet connection');

            db.close();
            rl.close();
            process.exit(1);
        }
    });
}

// Run the script
main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});