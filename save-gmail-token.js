#!/usr/bin/env node

/**
 * Save Gmail token to backend database
 */

const readline = require('readline');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// OAuth2 credentials
const CLIENT_ID = '794453705883-6b32cpfctd77t5ls5kktu2s9ub27p19q.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://162-220-14-239.nip.io/api/gmail/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=====================================');
console.log('Gmail Token Manual Save');
console.log('=====================================\n');

console.log('After signing in with Gmail, you were redirected to a URL like:');
console.log('http://162-220-14-239.nip.io/api/gmail/callback?code=XXXXX&scope=...\n');

console.log('Copy the authorization code from that URL.');
console.log('The code is everything between "code=" and "&scope"\n');

rl.question('Paste the authorization code here: ', async (code) => {
    try {
        console.log('\nExchanging code for token...');

        const { tokens } = await oauth2Client.getToken(code);

        console.log('✅ Token obtained successfully!');
        console.log('Access Token expires in:', Math.round(tokens.expiry_date - Date.now()) / 1000 / 60, 'minutes');

        // Save to backend database
        const dbPath = path.join(__dirname, 'backend/data/vanguard.db');
        const db = new sqlite3.Database(dbPath);

        // Create table if not exists
        db.run(`
            CREATE TABLE IF NOT EXISTS gmail_tokens (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                expiry_date INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Save token
        db.run(`
            INSERT OR REPLACE INTO gmail_tokens (id, email, access_token, refresh_token, expiry_date)
            VALUES (1, 'corptech06@gmail.com', ?, ?, ?)
        `, [tokens.access_token, tokens.refresh_token, tokens.expiry_date], (err) => {
            if (err) {
                console.error('❌ Error saving token:', err);
            } else {
                console.log('✅ Token saved to database!');

                // Also save to file for API use
                const fs = require('fs');
                fs.writeFileSync('/var/www/vanguard/gmail_token.json', JSON.stringify(tokens, null, 2));
                console.log('✅ Token also saved to /var/www/vanguard/gmail_token.json');

                console.log('\n✅ Gmail is now fully configured!');
                console.log('The COI request inbox should now work properly.');
            }

            db.close();
            rl.close();
        });

    } catch (error) {
        console.error('❌ Error exchanging code:', error.message);
        console.error('\nMake sure you copied the code correctly.');
        console.error('The code is only valid for a few minutes after authorization.');
        rl.close();
    }
});