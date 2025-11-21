#!/usr/bin/env node
// Simple App Password Setter
const password = process.argv[2];
if (!password) {
    console.error('Usage: node set-app-password.js [password]');
    process.exit(1);
}

// Set in environment
process.env.OUTLOOK_PASSWORD = password;

// Save to .env file
const envContent = 'OUTLOOK_PASSWORD=' + password + '\n';
require('fs').appendFileSync('.env', envContent);

console.log('✅ Password saved!');
console.log('Run: pm2 restart vanguard-backend');
