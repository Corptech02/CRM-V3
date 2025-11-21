#!/usr/bin/env node

/**
 * Test the PRODUCTION Gmail service after applying the PDF fix
 */

const fs = require('fs');
const GmailService = require('./gmail-service'); // Using the now-fixed production service
const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Testing PRODUCTION Gmail service after PDF fix...\n');

async function testProductionFixPDFSend() {
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

        // Initialize PRODUCTION Gmail service (now fixed)
        const gmailService = new GmailService();
        await gmailService.initialize(credentials);

        console.log('✅ PRODUCTION Gmail service initialized');

        // Create test email data with PDF attachment
        const emailData = {
            to: 'corptech02@gmail.com',
            subject: '✅ PRODUCTION FIXED - PDF Test - ' + new Date().toISOString(),
            body: `
                <html><body>
                    <h2>✅ PRODUCTION GMAIL SERVICE - PDF ATTACHMENT FIXED!</h2>
                    <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
                    <p>This email uses the PRODUCTION Gmail service with the PDF corruption fix applied.</p>
                    <p><strong>Fix Applied:</strong></p>
                    <ul>
                        <li>✅ Removed arbitrary 76-character line splitting</li>
                        <li>✅ Keep base64 data intact</li>
                        <li>✅ Clean existing whitespace from base64</li>
                        <li>✅ Let email client handle MIME line wrapping</li>
                    </ul>
                    <p><strong>Expected Result:</strong> PDF opens without "We can't open this file" error</p>
                    <p style="color: green; font-weight: bold;">The COI PDF corruption issue should now be FIXED!</p>
                </body></html>
            `,
            attachments: [{
                filename: 'ACORD_25_PRODUCTION_FIXED.pdf',
                mimeType: 'application/pdf',
                data: pdfBase64
            }]
        };

        console.log('\n📧 Sending PRODUCTION FIXED test email...');
        console.log(`   To: ${emailData.to}`);
        console.log(`   Subject: ${emailData.subject}`);
        console.log(`   Attachment: ${emailData.attachments[0].filename}`);
        console.log(`   Using: PRODUCTION Gmail service with PDF fix`);

        // Send the email using the now-fixed production service
        const result = await gmailService.sendEmail(emailData);

        console.log('\n✅ PRODUCTION FIXED email sent successfully!');
        console.log('   Message ID:', result.id);
        console.log('   Thread ID:', result.threadId);

        console.log('\n' + '='.repeat(70));
        console.log('🎉 PDF CORRUPTION FIX APPLIED TO PRODUCTION!');
        console.log('='.repeat(70));
        console.log('📝 VERIFICATION STEPS:');
        console.log('1. Check corptech02@gmail.com inbox');
        console.log('2. Find email: "✅ PRODUCTION FIXED - PDF Test"');
        console.log('3. Download: "ACORD_25_PRODUCTION_FIXED.pdf"');
        console.log('4. Open the PDF - it should work without errors!');
        console.log('5. All future COI emails should now work correctly');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testProductionFixPDFSend();