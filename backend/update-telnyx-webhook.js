#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const apiKey = process.env.TELNYX_API_KEY;
const appId = '2780188277137737142'; // Your Call Control App ID
const webhookUrl = 'http://162.220.14.239:3001/webhook/telnyx';

async function updateCallControlApp() {
    console.log('Updating Call Control App webhook URL...');
    console.log('App ID:', appId);
    console.log('New webhook URL:', webhookUrl);

    try {
        // Get current app config
        const getResponse = await fetch(`https://api.telnyx.com/v2/call_control_applications/${appId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!getResponse.ok) {
            const error = await getResponse.text();
            console.error('Failed to get app config:', error);
            return;
        }

        const currentConfig = await getResponse.json();
        console.log('\nCurrent webhook URL:', currentConfig.data.webhook_event_url);

        // Update the app
        const updateResponse = await fetch(`https://api.telnyx.com/v2/call_control_applications/${appId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                webhook_event_url: webhookUrl,
                webhook_event_failover_url: '',
                active: true
            })
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.error('Failed to update app:', error);
            return;
        }

        const updatedConfig = await updateResponse.json();
        console.log('\n✓ Webhook URL updated successfully!');
        console.log('New webhook URL:', updatedConfig.data.webhook_event_url);
        console.log('\nIncoming calls will now be sent to your server.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Also update outbound voice profile to support inbound
async function updateOutboundProfile() {
    console.log('\n=== Updating Outbound Voice Profile ===');

    try {
        // Get profiles
        const response = await fetch('https://api.telnyx.com/v2/outbound_voice_profiles', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const profileId = data.data[0].id;
            console.log('Profile ID:', profileId);

            // Update profile
            const updateResponse = await fetch(`https://api.telnyx.com/v2/outbound_voice_profiles/${profileId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: true,
                    webhook_event_url: webhookUrl,
                    webhook_timeout_secs: 30
                })
            });

            if (updateResponse.ok) {
                console.log('✓ Outbound profile updated');
            }
        }

    } catch (error) {
        console.error('Profile update error:', error.message);
    }
}

// Run updates
updateCallControlApp().then(() => {
    updateOutboundProfile();
});