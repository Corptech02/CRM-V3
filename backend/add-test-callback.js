#!/usr/bin/env node

/**
 * Manual Test Callback Creator
 * Creates a callback scheduled for 30 minutes from now to test notifications and emails
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../vanguard.db');
const db = new sqlite3.Database(dbPath);

// Get command line arguments
const args = process.argv.slice(2);
const leadId = args[0] || '1770232268749'; // Default to BEAR SCHWARTZ TRANSPORT LLC
const minutesFromNow = args[1] || 30; // Default to 30 minutes
const notes = args[2] || 'Manual test callback - 30 minute notification and email test';

// Calculate the callback time
const callbackTime = new Date(Date.now() + (minutesFromNow * 60 * 1000));
const callbackId = `manual_test_${Date.now()}`;

console.log('🧪 Creating Manual Test Callback');
console.log('================================');
console.log(`📋 Lead ID: ${leadId}`);
console.log(`⏰ Callback Time: ${callbackTime.toLocaleString()}`);
console.log(`📝 Notes: ${notes}`);
console.log(`🆔 Callback ID: ${callbackId}`);
console.log(`⏱️  Minutes from now: ${minutesFromNow}`);

// Insert the callback into the database
const insertQuery = `
    INSERT INTO scheduled_callbacks (callback_id, lead_id, date_time, notes, completed)
    VALUES (?, ?, ?, ?, 0)
`;

db.run(insertQuery, [callbackId, leadId, callbackTime.toISOString(), notes], function(err) {
    if (err) {
        console.error('❌ Error creating callback:', err);
        process.exit(1);
    }

    console.log('\n✅ Callback Created Successfully!');
    console.log(`📊 Database Row ID: ${this.lastID}`);

    // Show what should happen
    console.log('\n🔮 Expected Results:');
    console.log(`📧 Email reminder will be sent in ${minutesFromNow} minutes to the assigned agent`);
    console.log('🔔 Notification will appear in your notification system');
    console.log('🚨 Critical "DUE NOW" notification will appear when time arrives');

    // Show how to verify
    console.log('\n🔍 How to Verify:');
    console.log('1. Check notification logs: pm2 logs vanguard-notifications');
    console.log('2. Check notifications API: curl http://localhost:3001/api/notifications');
    console.log('3. Check your email for the 30-minute reminder');
    console.log('4. Watch for critical notifications when the time arrives');

    // Show cleanup command
    console.log('\n🧹 To Clean Up (after testing):');
    console.log(`sqlite3 /var/www/vanguard/vanguard.db "DELETE FROM scheduled_callbacks WHERE callback_id = '${callbackId}'"`);

    db.close();
});

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n👋 Exiting...');
    db.close();
    process.exit(0);
});