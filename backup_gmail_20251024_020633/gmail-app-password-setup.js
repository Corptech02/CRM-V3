#!/usr/bin/env node

/**
 * Gmail App Password Setup - Alternative to OAuth for server applications
 * This is more reliable and doesn't require Google app verification
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('=====================================');
console.log('Gmail App Password Setup');
console.log('=====================================\n');

console.log('Gmail App Passwords are more reliable than OAuth for server applications.');
console.log('Follow these steps to set up Gmail with App Password:\n');

console.log('STEP 1: Enable 2-Factor Authentication');
console.log('  1. Go to https://myaccount.google.com/security');
console.log('  2. Sign in with: corptech06@gmail.com / corp2006');
console.log('  3. Enable "2-Step Verification" if not already enabled\n');

console.log('STEP 2: Generate App Password');
console.log('  1. Go to https://myaccount.google.com/apppasswords');
console.log('  2. Select "Mail" as the app');
console.log('  3. Select "Other (custom name)" as device');
console.log('  4. Enter "COI Automation Server" as the name');
console.log('  5. Click "Generate"');
console.log('  6. Copy the 16-character app password\n');

console.log('STEP 3: Update the configuration');
console.log('  Run: node gmail-app-password-save.js [YOUR_APP_PASSWORD]');
console.log('  Example: node gmail-app-password-save.js abcd efgh ijkl mnop\n');

console.log('Benefits of App Passwords:');
console.log('  ✅ No OAuth verification required');
console.log('  ✅ No redirect URI configuration needed');
console.log('  ✅ Works reliably with server applications');
console.log('  ✅ No token expiration issues');
console.log('  ✅ Simple SMTP/IMAP authentication\n');

console.log('Note: App passwords work with SMTP/IMAP but not Gmail API.');
console.log('We\'ll update the system to use IMAP for reading emails.');