#!/bin/bash

# Gmail Re-authentication Script for corptech06@gmail.com
# This script will guide you through re-authenticating Gmail API access

echo "======================================"
echo "Gmail API Re-authentication"
echo "Account: corptech06@gmail.com"
echo "======================================"
echo ""

# Change to backend directory
cd /var/www/vanguard/backend

# Create a simple Node.js script to handle the OAuth flow
cat > temp-gmail-auth.js << 'EOF'
const { google } = require('googleapis');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = new sqlite3.Database('./vanguard.db');

// Gmail OAuth2 credentials from .env
const CLIENT_ID = '794453705883-6b32cpfctd77t5ls5kktu2s9ub27p19q.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // For manual copy-paste flow

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

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

async function authenticate() {
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });

    console.log('\n1. Open this URL in your browser:');
    console.log('\n' + authUrl + '\n');
    console.log('2. Sign in with: corptech06@gmail.com');
    console.log('   Password: corp2006\n');
    console.log('3. After authorizing, you will see an authorization code.');
    console.log('4. Copy that code and paste it below:\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter authorization code: ', async (code) => {
        try {
            // Exchange code for tokens
            const { tokens } = await oauth2Client.getToken(code);

            console.log('\n✅ Successfully got tokens!');

            // Prepare credentials object
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

            // Save to database
            db.run(
                `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
                ['gmail_tokens', JSON.stringify(credentials)],
                (err) => {
                    if (err) {
                        console.error('❌ Error saving tokens:', err.message);
                        process.exit(1);
                    }

                    console.log('✅ Tokens saved to database!');
                    console.log('\nGmail API re-authenticated successfully!');
                    console.log('The COI inbox should now work properly.');

                    db.close();
                    rl.close();

                    // Restart the backend
                    console.log('\nRestarting backend server...');
                    const { exec } = require('child_process');
                    exec('pm2 restart vanguard-backend', (err, stdout) => {
                        if (err) {
                            console.log('Please manually restart: pm2 restart vanguard-backend');
                        } else {
                            console.log('✅ Backend restarted!');
                        }
                        process.exit(0);
                    });
                }
            );
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            console.error('\nPlease try again and make sure to:');
            console.error('1. Use corptech06@gmail.com account');
            console.error('2. Copy the complete authorization code');
            rl.close();
            process.exit(1);
        }
    });
}

authenticate();
EOF

# Run the authentication
echo "Starting Gmail authentication process..."
echo ""
node temp-gmail-auth.js

# Clean up
rm -f temp-gmail-auth.js

echo ""
echo "Done!"