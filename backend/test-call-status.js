#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const apiKey = process.env.TELNYX_API_KEY;
const callControlId = process.argv[2];

if (!callControlId) {
    console.log('Usage: node test-call-status.js <call-control-id>');
    console.log('Example: node test-call-status.js 123abc-456def');
    process.exit(1);
}

async function checkCallStatus() {
    try {
        const response = await fetch(`https://api.telnyx.com/v2/calls/${callControlId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Error response:', error);
            return;
        }

        const data = await response.json();

        console.log('\n=== Call Status ===');
        console.log('Call Control ID:', callControlId);
        console.log('State:', data.data?.state);
        console.log('Is Alive:', data.data?.is_alive);
        console.log('Direction:', data.data?.direction);
        console.log('From:', data.data?.from);
        console.log('To:', data.data?.to);
        console.log('Start Time:', data.data?.start_time);
        console.log('Answer Time:', data.data?.answer_time);
        console.log('End Time:', data.data?.end_time);
        console.log('\nFull Data:');
        console.log(JSON.stringify(data.data, null, 2));

    } catch (error) {
        console.error('Failed to check status:', error.message);
    }
}

// Check status immediately
checkCallStatus();

// Then check every 2 seconds for 30 seconds
let count = 0;
const interval = setInterval(() => {
    if (++count > 15) {
        clearInterval(interval);
        console.log('\nStopped checking after 30 seconds');
        return;
    }
    console.log('\n--- Update', count, '---');
    checkCallStatus();
}, 2000);