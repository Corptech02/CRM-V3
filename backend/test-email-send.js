#!/usr/bin/env node

/**
 * Test Email Sending - Verify email functionality
 */

const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

console.log('📧 Testing Email Send Functionality\n');

async function testEmailSend() {
    try {
        // Test Gmail status
        console.log('1. Checking Gmail status...');
        const statusResponse = await axios.get('http://localhost:3001/api/gmail/status');
        console.log('   Gmail authenticated:', statusResponse.data.authenticated);

        if (!statusResponse.data.authenticated) {
            console.log('\n⚠️  Gmail is not authenticated!');
            console.log('\nTo fix this:');
            console.log('1. Run: node add-gmail-token-web.js');
            console.log('2. Login with corptech06@gmail.com / corp2006');
            console.log('3. Copy the authorization code');
            console.log('\nOr set up Outlook instead:');
            console.log('1. Run: node quick-outlook-setup.js');
            return;
        }

        // Test sending
        console.log('\n2. Sending test email...');

        const emailData = {
            to: 'test@example.com',
            subject: 'Test COI Email',
            body: '<p>This is a test email from the COI system.</p>',
            cc: '',
            bcc: ''
        };

        const sendResponse = await axios.post('http://localhost:3001/api/gmail/send', emailData);

        if (sendResponse.data.success || sendResponse.data.messageId) {
            console.log('✅ Email sent successfully!');
            console.log('   Message ID:', sendResponse.data.messageId);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n📌 Gmail needs authentication.');
            console.log('Run: node add-gmail-token-web.js');
        }
    }
}

// Test without authentication for now (simulated success)
async function simulateEmailSend() {
    console.log('\n📬 Simulating email send (for testing UI)...\n');

    const db = new sqlite3.Database('./vanguard.db');

    // Create a mock success response
    const mockEmail = {
        id: 'msg_' + Date.now(),
        to: 'recipient@example.com',
        subject: 'Certificate of Insurance - Test Policy',
        sent_at: new Date().toISOString(),
        status: 'sent'
    };

    console.log('Mock email details:');
    console.log('  To:', mockEmail.to);
    console.log('  Subject:', mockEmail.subject);
    console.log('  Status:', mockEmail.status);
    console.log('\n✅ Mock email "sent" successfully!');

    db.close();
}

// Run test
console.log('Testing email system...\n');
testEmailSend().then(() => {
    console.log('\n---\n');
    simulateEmailSend();
});