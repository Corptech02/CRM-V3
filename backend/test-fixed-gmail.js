#!/usr/bin/env node

/**
 * Test the FIXED Gmail service for PDF attachment corruption
 */

const fs = require('fs');
const GmailServiceFixed = require('./gmail-service-fixed');
const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Testing FIXED Gmail PDF attachment system...\n');

async function testFixedPDFSend() {
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

        // Initialize FIXED Gmail service
        const gmailService = new GmailServiceFixed();
        await gmailService.initialize(credentials);

        console.log('✅ FIXED Gmail service initialized');

        // Create test email data with PDF attachment
        const emailData = {
            to: 'corptech02@gmail.com',
            subject: '✅ FIXED PDF Test - ' + new Date().toISOString(),
            body: `
                <html><body>
                    <h2>✅ FIXED PDF Attachment Test</h2>
                    <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
                    <p>This email uses the FIXED Gmail service with nodemailer MIME structure.</p>
                    <p><strong>Expected Result:</strong> PDF should open without corruption</p>
                    <p><strong>PDF Info:</strong></p>
                    <ul>
                        <li>Original size: ${pdfBuffer.length} bytes</li>
                        <li>Base64 size: ${pdfBase64.length} chars</li>
                        <li>Using nodemailer for MIME structure</li>
                        <li>Proper binary attachment handling</li>
                    </ul>
                    <p style="color: green;"><strong>This should work correctly!</strong></p>
                </body></html>
            `,
            attachments: [{
                filename: 'ACORD_25_FIXED_test.pdf',
                mimeType: 'application/pdf',
                data: pdfBase64
            }]
        };

        console.log('\n📧 Sending FIXED test email...');
        console.log(`   To: ${emailData.to}`);
        console.log(`   Subject: ${emailData.subject}`);
        console.log(`   Attachment: ${emailData.attachments[0].filename}`);
        console.log(`   Method: Using nodemailer MIME structure`);

        // Send the email
        const result = await gmailService.sendEmail(emailData);

        console.log('\n✅ FIXED email sent successfully!');
        console.log('   Message ID:', result.id);
        console.log('   Thread ID:', result.threadId);

        console.log('\n' + '='.repeat(60));
        console.log('📝 TESTING INSTRUCTIONS:');
        console.log('1. Check corptech02@gmail.com inbox');
        console.log('2. Look for email with subject "✅ FIXED PDF Test"');
        console.log('3. Download the "ACORD_25_FIXED_test.pdf" attachment');
        console.log('4. Try to open it');
        console.log('5. It should open WITHOUT "We can\'t open this file" error');
        console.log('6. Compare with previous test emails to confirm fix');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testFixedPDFSend();