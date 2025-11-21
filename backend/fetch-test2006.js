#!/usr/bin/env node

/**
 * Direct fetch of test2006 email from contact@vigagency.com
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');

console.log('\n🔍 Looking for test2006 email in contact@vigagency.com...\n');

// You need to set the app password here
const APP_PASSWORD = process.argv[2] || process.env.OUTLOOK_APP_PASSWORD || '';

if (!APP_PASSWORD) {
    console.log('❌ App password required!');
    console.log('\nTo get app password:');
    console.log('1. Go to: https://account.microsoft.com/security');
    console.log('2. Sign in with contact@vigagency.com');
    console.log('3. Under "Security basics" → "More security options"');
    console.log('4. Create app password');
    console.log('\nThen run: node fetch-test2006.js YOUR_APP_PASSWORD');
    process.exit(1);
}

const imap = new Imap({
    user: 'contact@vigagency.com',
    password: APP_PASSWORD,
    host: 'outlook.office365.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

const emails = [];

imap.once('ready', () => {
    console.log('✅ Connected to Outlook successfully!');

    imap.openBox('INBOX', true, (err, box) => {
        if (err) {
            console.error('❌ Error opening inbox:', err);
            return;
        }

        console.log(`📧 Total emails in inbox: ${box.messages.total}`);
        console.log('🔍 Searching for test2006...\n');

        // Fetch recent emails
        const fetchRange = Math.max(1, box.messages.total - 50) + ':*';

        const f = imap.seq.fetch(fetchRange, {
            bodies: '',
            struct: true
        });

        f.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                    if (!err) {
                        const email = {
                            subject: parsed.subject || '(no subject)',
                            from: parsed.from?.text || 'unknown',
                            date: parsed.date,
                            text: parsed.text?.substring(0, 200)
                        };

                        // Check if this is the test2006 email
                        if (email.subject.toLowerCase().includes('test2006')) {
                            console.log('🎯 FOUND test2006 EMAIL!');
                            console.log('━'.repeat(50));
                            console.log('Subject:', email.subject);
                            console.log('From:', email.from);
                            console.log('Date:', email.date);
                            console.log('Preview:', email.text);
                            console.log('━'.repeat(50));
                        }

                        emails.push(email);
                    }
                });
            });
        });

        f.once('end', () => {
            console.log(`\n✅ Scanned ${emails.length} emails`);

            // Show all subjects to help find test2006
            console.log('\n📋 All email subjects:');
            emails.forEach((email, i) => {
                const marker = email.subject.toLowerCase().includes('test2006') ? '🎯 ' : '   ';
                console.log(`${marker}${i+1}. ${email.subject}`);
            });

            // Save emails for frontend
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const db = new sqlite3.Database(path.join(__dirname, '..', 'vanguard.db'));

            db.run(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('outlook_emails', ?)",
                [JSON.stringify(emails)],
                (err) => {
                    if (!err) {
                        console.log('\n✅ Emails saved to database');
                        console.log('The COI inbox will now show real emails!');
                    }
                    db.close();
                    imap.end();
                }
            );
        });

        f.once('error', (err) => {
            console.error('Fetch error:', err);
            imap.end();
        });
    });
});

imap.once('error', (err) => {
    console.error('❌ IMAP Error:', err);
    console.log('\nPossible issues:');
    console.log('1. Wrong app password');
    console.log('2. 2FA not enabled for app passwords');
    console.log('3. Account security blocking IMAP');
});

console.log('🔄 Connecting to Outlook...');
imap.connect();