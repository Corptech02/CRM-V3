#!/usr/bin/env node

// Configure Twilio phone number webhook for incoming calls
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function main() {
    console.log('🔧 Twilio Phone Number Webhook Configuration');
    console.log('==========================================');
    console.log('');
    console.log('This will configure your Twilio phone number to receive incoming calls');
    console.log('in your CRM system.');
    console.log('');

    const accountSid = await askQuestion('Enter your Twilio Account SID: ');
    const authToken = await askQuestion('Enter your Twilio Auth Token: ');
    const phoneNumber = await askQuestion('Enter your Twilio phone number (e.g., +13306369079): ');

    console.log('');
    console.log('Configuring webhook...');

    try {
        const twilio = require('twilio')(accountSid, authToken);

        const webhookUrl = 'http://162.220.14.239:3001/api/twilio/incoming-call';

        // Update the phone number configuration
        const phoneNumberSid = await twilio.incomingPhoneNumbers.list({
            phoneNumber: phoneNumber
        });

        if (phoneNumberSid.length === 0) {
            console.error('❌ Phone number not found in your Twilio account');
            console.error('   Make sure you entered the correct number with country code (e.g., +13306369079)');
            process.exit(1);
        }

        const phoneNumberRecord = phoneNumberSid[0];

        // Update the webhook URL
        await twilio.incomingPhoneNumbers(phoneNumberRecord.sid)
            .update({
                voiceUrl: webhookUrl,
                voiceMethod: 'POST',
                statusCallback: 'http://162.220.14.239:3001/api/twilio/call-status-callback',
                statusCallbackMethod: 'POST'
            });

        console.log('✅ Phone number webhook configured successfully!');
        console.log('');
        console.log('Configuration:');
        console.log(`   Phone Number: ${phoneNumber}`);
        console.log(`   Webhook URL: ${webhookUrl}`);
        console.log('');
        console.log('🎯 Test by calling your Twilio number - it should now ring in your CRM!');

        // Save credentials for future use
        const fs = require('fs');
        const envContent = `TWILIO_ACCOUNT_SID=${accountSid}
TWILIO_AUTH_TOKEN=${authToken}
TWILIO_PHONE_NUMBER=${phoneNumber}
`;

        fs.writeFileSync('/var/www/vanguard/.env', envContent);
        console.log('💾 Credentials saved to .env file');

    } catch (error) {
        console.error('❌ Error configuring webhook:', error.message);

        if (error.code === 20003) {
            console.error('   Check your Account SID and Auth Token');
        } else if (error.code === 20404) {
            console.error('   Phone number not found - check the number format');
        }

        process.exit(1);
    }

    rl.close();
}

main().catch(console.error);