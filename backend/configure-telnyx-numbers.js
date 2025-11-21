#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const apiKey = process.env.TELNYX_API_KEY;
const callControlAppId = '2780188277137737142';

async function getPhoneNumbers() {
    console.log('Fetching phone numbers...');
    try {
        const response = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=100', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to fetch numbers:', error);
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching numbers:', error);
        return [];
    }
}

async function updatePhoneNumber(phoneNumber) {
    console.log(`\nUpdating ${phoneNumber.phone_number}...`);

    try {
        // Update the number to use the Call Control App
        const response = await fetch(`https://api.telnyx.com/v2/phone_numbers/${phoneNumber.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                connection_id: callControlAppId,  // Connect to Call Control App
                tags: ['vanguard', 'active']
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`Failed to update ${phoneNumber.phone_number}:`, error);
            return false;
        }

        const data = await response.json();
        console.log(`✓ Updated ${phoneNumber.phone_number}`);
        console.log(`  Connection ID: ${data.data.connection_id}`);
        console.log(`  Status: ${data.data.status}`);
        return true;
    } catch (error) {
        console.error(`Error updating ${phoneNumber.phone_number}:`, error.message);
        return false;
    }
}

async function getCallControlApp() {
    console.log('\n=== Call Control App Status ===');
    try {
        const response = await fetch(`https://api.telnyx.com/v2/call_control_applications/${callControlAppId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to get app:', error);
            return null;
        }

        const data = await response.json();
        console.log('App Name:', data.data.application_name);
        console.log('Active:', data.data.active);
        console.log('Webhook URL:', data.data.webhook_event_url);
        console.log('Inbound Settings:', data.data.inbound || 'Not configured');
        return data.data;
    } catch (error) {
        console.error('Error getting app:', error);
        return null;
    }
}

async function updateCallControlApp() {
    console.log('\n=== Updating Call Control App for Inbound ===');
    try {
        const response = await fetch(`https://api.telnyx.com/v2/call_control_applications/${callControlAppId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                active: true,
                webhook_event_url: 'http://162.220.14.239:3001/webhook/telnyx',
                webhook_event_failover_url: '',
                webhook_api_version: '2',
                first_command_timeout: true,
                first_command_timeout_secs: 30,
                inbound: {
                    channel_limit: 10,
                    sip_subdomain: 'vanguard-insurance',
                    sip_subdomain_receive_settings: 'from_anyone'
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to update app:', error);
            return false;
        }

        const data = await response.json();
        console.log('✓ Call Control App updated for inbound calls');
        console.log('SIP Domain:', `${data.data.inbound?.sip_subdomain}.sip.telnyx.com`);
        return true;
    } catch (error) {
        console.error('Error updating app:', error);
        return false;
    }
}

async function main() {
    console.log('=== Configuring Telnyx Numbers for Incoming Calls ===\n');

    // First update the Call Control App
    await updateCallControlApp();

    // Get current app status
    const app = await getCallControlApp();
    if (!app) {
        console.error('Could not get Call Control App');
        return;
    }

    // Get all phone numbers
    const numbers = await getPhoneNumbers();
    console.log(`\nFound ${numbers.length} phone numbers`);

    // Update each number
    let successCount = 0;
    for (const number of numbers) {
        const success = await updatePhoneNumber(number);
        if (success) successCount++;
    }

    console.log(`\n=== Configuration Complete ===`);
    console.log(`Successfully updated ${successCount}/${numbers.length} numbers`);
    console.log(`\nAll numbers are now configured to:`);
    console.log(`- Receive incoming calls`);
    console.log(`- Send webhooks to: http://162.220.14.239:3001/webhook/telnyx`);
    console.log(`- Use Call Control App: ${callControlAppId}`);
    console.log(`\nYou should now be able to receive calls on all your numbers!`);
}

main().catch(console.error);