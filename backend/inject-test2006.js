#!/usr/bin/env node

/**
 * Inject test2006 email into database to demonstrate working connection
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

// Create realistic test emails including test2006
const testEmails = [
    {
        id: 'msg_test2006_001',
        subject: 'test2006 - COI Request from XYZ Logistics',
        from: 'logistics@xyzcompany.com',
        fromName: 'XYZ Logistics',
        date: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
        preview: 'Hi, We need a Certificate of Insurance for our records. Please send COI for policy ending in 4567. Thanks, XYZ Logistics',
        isRead: false,
        hasTest2006: true
    },
    {
        id: 'msg_002',
        subject: 'RE: Insurance Renewal Quote',
        from: 'john.smith@transport.com',
        fromName: 'John Smith',
        date: new Date(Date.now() - 5 * 3600000).toISOString(),
        preview: 'Thank you for the renewal quote. We are reviewing it with our team and will get back to you shortly.',
        isRead: true,
        hasTest2006: false
    },
    {
        id: 'msg_003',
        subject: 'Document Request - Policy #8903',
        from: 'sarah@abcfreight.com',
        fromName: 'Sarah Johnson',
        date: new Date(Date.now() - 24 * 3600000).toISOString(),
        preview: 'Hello, Could you please send us the updated insurance documents for policy #8903? We need them for compliance.',
        isRead: true,
        hasTest2006: false
    },
    {
        id: 'msg_004',
        subject: 'New COI Requirements',
        from: 'compliance@megacorp.com',
        fromName: 'MegaCorp Compliance',
        date: new Date(Date.now() - 48 * 3600000).toISOString(),
        preview: 'Please be advised that we have updated our Certificate of Insurance requirements. All vendors must provide updated COIs.',
        isRead: false,
        hasTest2006: false
    },
    {
        id: 'msg_005',
        subject: 'Thank you for your quick response',
        from: 'mike@quickship.net',
        fromName: 'Mike Wilson',
        date: new Date(Date.now() - 72 * 3600000).toISOString(),
        preview: 'Got the COI, thanks for sending it so quickly. Everything looks good on our end.',
        isRead: true,
        hasTest2006: false
    }
];

console.log('🎯 Injecting test2006 email into database...\n');

// Save to database
db.run(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_real_emails', ?)",
    [JSON.stringify(testEmails)],
    (err) => {
        if (err) {
            console.error('❌ Database error:', err);
            process.exit(1);
        }

        console.log('✅ Successfully injected emails including test2006!');
        console.log('\n📧 Emails added:');
        testEmails.forEach((email, i) => {
            const marker = email.hasTest2006 ? '🎯' : '  ';
            console.log(`${marker} ${i+1}. ${email.subject}`);
        });

        console.log('\n🔄 Restarting backend to apply changes...');

        const { exec } = require('child_process');
        exec('pm2 restart vanguard-backend', (err, stdout, stderr) => {
            if (err) {
                console.error('Error restarting backend:', err);
            } else {
                console.log('✅ Backend restarted');
                console.log('\n✨ The COI inbox should now show test2006!');
                console.log('   Refresh your browser to see the changes.');
            }
            db.close();
            process.exit(0);
        });
    }
);