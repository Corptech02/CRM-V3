#!/usr/bin/env node

const fs = require('fs');
const http = require('http');

async function sendEmailWithAttachment() {
    const pdfPath = '/var/www/vanguard/ACORD_25_fillable.pdf';

    console.log('📄 Reading PDF file...');

    // Read and encode the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`✅ PDF read successfully (${pdfBuffer.length} bytes)`);
    console.log(`📦 Base64 encoded length: ${pdfBase64.length} characters`);
    console.log(`📊 First 100 chars of base64: ${pdfBase64.substring(0, 100)}...`);

    // Prepare email with attachment
    const emailData = {
        to: 'corptech02@gmail.com',
        subject: 'Test COI with Attachment - Direct Node.js Test',
        body: '<html><body><h2>Certificate of Insurance Test</h2><p>This email is testing PDF attachment functionality.</p><p><strong>If you see an attachment, it\'s working!</strong></p><p>Time: ' + new Date().toISOString() + '</p></body></html>',
        attachments: [{
            filename: 'ACORD_25_test.pdf',
            mimeType: 'application/pdf',
            data: pdfBase64
        }]
    };

    console.log('\n📧 Sending email via API...');
    console.log(`   To: ${emailData.to}`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log(`   Attachments: 1 PDF (${emailData.attachments[0].filename})`);

    const payload = JSON.stringify(emailData);

    const options = {
        hostname: '162-220-14-239.nip.io',
        port: 80,
        path: '/api/gmail/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('\nResponse Status:', res.statusCode);
            console.log('Response:', data);

            if (res.statusCode === 200) {
                console.log('\n✅ Email sent successfully!');
            } else {
                console.log('\n❌ Failed to send email');
            }
        });
    });

    req.on('error', (error) => {
        console.error('\n❌ Error:', error);
    });

    req.write(payload);
    req.end();
}

// Run the test
console.log('================================');
console.log('Testing Email Attachment System');
console.log('================================\n');

sendEmailWithAttachment().catch(console.error);