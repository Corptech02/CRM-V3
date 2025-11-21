#!/usr/bin/env node

/**
 * Test the actual email sending to isolate the PDF corruption issue
 */

const fs = require('fs');
const GmailService = require('./gmail-service');
const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Testing actual PDF email sending...\n');

async function testPDFSend() {
    try {
        // Read and prepare PDF
        const pdfPath = '/var/www/vanguard/ACORD_25_fillable.pdf';
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log(`📄 PDF loaded: ${pdfBuffer.length} bytes → ${pdfBase64.length} chars base64`);

        // Get Gmail credentials from database
        const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

        const credentials = await new Promise((resolve, reject) => {
            db.get("SELECT value FROM settings WHERE key = 'gmail_tokens'", (err, row) => {
                if (err) reject(err);
                else if (row) resolve(JSON.parse(row.value));
                else reject(new Error('No Gmail credentials found'));
            });
        });

        db.close();

        console.log('✅ Gmail credentials loaded');

        // Initialize Gmail service
        const gmailService = new GmailService();
        await gmailService.initialize(credentials);

        console.log('✅ Gmail service initialized');

        // Create test email data with PDF attachment
        const emailData = {
            to: 'corptech02@gmail.com',
            subject: 'PDF Corruption Test - ' + new Date().toISOString(),
            body: `
                <html><body>
                    <h2>PDF Corruption Test</h2>
                    <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
                    <p>This email contains an ACORD 25 PDF attachment.</p>
                    <p><strong>Expected:</strong> PDF should open without "We can't open this file" error</p>
                    <p><strong>PDF Info:</strong></p>
                    <ul>
                        <li>Original size: ${pdfBuffer.length} bytes</li>
                        <li>Base64 size: ${pdfBase64.length} chars</li>
                        <li>First 50 chars: ${pdfBase64.substring(0, 50)}</li>
                    </ul>
                </body></html>
            `,
            attachments: [{
                filename: 'ACORD_25_corruption_test.pdf',
                mimeType: 'application/pdf',
                data: pdfBase64
            }]
        };

        console.log('\n📧 Sending test email...');
        console.log(`   To: ${emailData.to}`);
        console.log(`   Subject: ${emailData.subject}`);
        console.log(`   Attachment: ${emailData.attachments[0].filename} (${pdfBase64.length} chars)`);

        // Send the email
        const result = await gmailService.sendEmail(emailData);

        console.log('\n✅ Email sent successfully!');
        console.log('   Message ID:', result.id);
        console.log('   Thread ID:', result.threadId);

        console.log('\n' + '='.repeat(60));
        console.log('📝 INSTRUCTIONS:');
        console.log('1. Check corptech02@gmail.com inbox');
        console.log('2. Download the PDF attachment');
        console.log('3. Try to open it');
        console.log('4. Report if you get "We can\'t open this file" error');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testPDFSend();