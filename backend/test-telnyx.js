#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const apiKey = process.env.TELNYX_API_KEY;

if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
    console.error('Telnyx API key not configured in .env file');
    process.exit(1);
}

async function getOutboundVoiceProfiles() {
    console.log('Fetching Outbound Voice Profiles...');
    try {
        const response = await fetch('https://api.telnyx.com/v2/outbound_voice_profiles', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error:', data);
            return null;
        }

        console.log('\n=== Outbound Voice Profiles ===');
        if (data.data && data.data.length > 0) {
            data.data.forEach(profile => {
                console.log(`\nProfile ID: ${profile.id}`);
                console.log(`Name: ${profile.name}`);
                console.log(`Enabled: ${profile.enabled}`);
                console.log(`Default: ${profile.is_default || false}`);
            });
            return data.data[0].id; // Return first profile ID
        } else {
            console.log('No outbound voice profiles found');
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch profiles:', error.message);
        return null;
    }
}

async function getCallControlApps() {
    console.log('\nFetching Call Control Applications...');
    try {
        const response = await fetch('https://api.telnyx.com/v2/call_control_applications', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error:', data);
            return null;
        }

        console.log('\n=== Call Control Applications ===');
        if (data.data && data.data.length > 0) {
            data.data.forEach(app => {
                console.log(`\nApp ID: ${app.id}`);
                console.log(`Name: ${app.application_name}`);
                console.log(`Webhook URL: ${app.webhook_event_url}`);
                console.log(`Active: ${app.active}`);
            });
            return data.data[0].id; // Return first app ID
        } else {
            console.log('No call control applications found');
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch applications:', error.message);
        return null;
    }
}

async function getPhoneNumbers() {
    console.log('\nFetching Phone Numbers...');
    try {
        const response = await fetch('https://api.telnyx.com/v2/phone_numbers', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error:', data);
            return null;
        }

        console.log('\n=== Phone Numbers ===');
        if (data.data && data.data.length > 0) {
            data.data.forEach(number => {
                console.log(`\nNumber: ${number.phone_number}`);
                console.log(`Status: ${number.status}`);
                console.log(`Connection ID: ${number.connection_id || 'None'}`);
            });
            return data.data[0].phone_number; // Return first phone number
        } else {
            console.log('No phone numbers found');
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch numbers:', error.message);
        return null;
    }
}

async function testCall(profileId, phoneNumber) {
    console.log('\n=== Testing Call API ===');
    console.log(`Using profile ID: ${profileId || 'None'}`);
    console.log(`From number: ${phoneNumber || '+12164282605'}`);

    const payload = {
        to: '+15551234567', // Test number
        from: phoneNumber || '+12164282605'
    };

    // Only add connection_id if we have a profile
    if (profileId) {
        payload.connection_id = profileId;
    }

    console.log('\nPayload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch('https://api.telnyx.com/v2/calls', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('\nCall API Error:', JSON.stringify(data, null, 2));
        } else {
            console.log('\nCall API Success:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Failed to test call:', error.message);
    }
}

async function main() {
    const profileId = await getOutboundVoiceProfiles();
    const appId = await getCallControlApps();
    const phoneNumber = await getPhoneNumbers();

    console.log('\n=== Summary ===');
    console.log(`Outbound Voice Profile ID: ${profileId || 'None found'}`);
    console.log(`Call Control App ID: ${appId || 'None found'}`);
    console.log(`Phone Number: ${phoneNumber || 'None found'}`);

    // Test with what we found
    await testCall(profileId || appId, phoneNumber);
}

main().catch(console.error);