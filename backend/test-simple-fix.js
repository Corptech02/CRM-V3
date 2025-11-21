#!/usr/bin/env node

/**
 * Test the SIMPLE FIX for Gmail PDF attachment corruption
 */

const fs = require('fs');
const GmailServiceFixed = require('./gmail-service-simple-fix');
const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Testing SIMPLE FIX for Gmail PDF corruption...\n');

async function testSimpleFixPDFSend() {
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

        // Initialize SIMPLE FIX Gmail service
        const gmailService = new GmailServiceFixed();
        await gmailService.initialize(credentials);

        console.log('✅ SIMPLE FIX Gmail service initialized');

        // Create test email data with PDF attachment
        const emailData = {
            to: 'corptech02@gmail.com',
            subject: '🔧 SIMPLE FIX PDF Test - ' + new Date().toISOString(),
            body: `
                <html><body>
                    <h2>🔧 SIMPLE FIX PDF Attachment Test</h2>
                    <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
                    <p>This email uses the SIMPLE FIX that removes arbitrary base64 line breaking.</p>
                    <p><strong>Expected Result:</strong> PDF should open without corruption</p>
                    <p><strong>Key Changes:</strong></p>
                    <ul>
                        <li>Removed arbitrary 76-char line splitting</li>
                        <li>Keep base64 data intact</li>
                        <li>Let email client handle line wrapping</li>
                        <li>Clean any existing whitespace from base64</li>
                    </ul>
                    <p style="color: green;"><strong>This should fix the "We can't open this file" error!</strong></p>
                </body></html>
            `,
            attachments: [{
                filename: 'ACORD_25_SIMPLE_FIX.pdf',
                mimeType: 'application/pdf',
                data: pdfBase64
            }]
        };

        console.log('\n📧 Sending SIMPLE FIX test email...');
        console.log(`   To: ${emailData.to}`);
        console.log(`   Subject: ${emailData.subject}`);
        console.log(`   Attachment: ${emailData.attachments[0].filename}`);
        console.log(`   Fix: No arbitrary line breaking of base64 data`);

        // Send the email
        const result = await gmailService.sendEmail(emailData);

        console.log('\n✅ SIMPLE FIX email sent successfully!');
        console.log('   Message ID:', result.id);
        console.log('   Thread ID:', result.threadId);

        console.log('\n' + '='.repeat(70));
        console.log('📝 TESTING INSTRUCTIONS:');
        console.log('1. Check corptech02@gmail.com inbox');
        console.log('2. Look for email with "🔧 SIMPLE FIX PDF Test" in subject');
        console.log('3. Download the "ACORD_25_SIMPLE_FIX.pdf" attachment');
        console.log('4. Try to open it - it should work without corruption!');
        console.log('5. If it opens successfully, the fix worked');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testSimpleFixPDFSend();