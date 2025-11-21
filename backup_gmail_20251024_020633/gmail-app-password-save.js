#!/usr/bin/env node

/**
 * Save Gmail App Password to database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const appPassword = process.argv[2];

if (!appPassword) {
    console.error('Usage: node gmail-app-password-save.js [APP_PASSWORD]');
    console.error('Example: node gmail-app-password-save.js "abcd efgh ijkl mnop"');
    process.exit(1);
}

// Clean the app password (remove spaces)
const cleanPassword = appPassword.replace(/\s+/g, '');

if (cleanPassword.length !== 16) {
    console.error('Error: App password should be 16 characters long (without spaces)');
    console.error('You provided:', cleanPassword.length, 'characters');
    process.exit(1);
}

const db = new sqlite3.Database('./vanguard.db');

// Create settings table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Save Gmail configuration
const gmailConfig = {
    type: 'app_password',
    email: 'corptech06@gmail.com',
    password: cleanPassword,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    created_at: new Date().toISOString()
};

db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
    ['gmail_config', JSON.stringify(gmailConfig), new Date().toISOString()],
    function(err) {
        if (err) {
            console.error('Error saving Gmail configuration:', err);
            process.exit(1);
        }

        console.log('✅ Gmail App Password saved successfully!');
        console.log('📧 Email: corptech06@gmail.com');
        console.log('🔐 Password: ' + cleanPassword.substring(0, 4) + '****' + cleanPassword.substring(12));
        console.log('📥 IMAP: imap.gmail.com:993 (SSL)');
        console.log('📤 SMTP: smtp.gmail.com:587 (TLS)');
        console.log('\nNext: Restart the backend server to use the new configuration.');
        console.log('Run: pm2 restart vanguard-backend');

        db.close();
    });