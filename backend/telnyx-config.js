const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

console.log('🔧 Telnyx-config.js loaded - SMS routes should be available');

// Global SSE clients storage
global.sseClients = global.sseClients || {};

// Global active calls storage
global.activeCalls = global.activeCalls || new Map();

// Helper function to broadcast call status to all connected clients
function broadcastCallStatus(callControlId, status) {
    console.log('Broadcasting status:', status, 'for call:', callControlId);

    if (global.sseClients) {
        const message = JSON.stringify({
            type: 'call_status',
            callControlId: callControlId,
            status: status,
            timestamp: new Date().toISOString()
        });

        Object.values(global.sseClients).forEach(client => {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (error) {
                console.error('Error broadcasting to client:', error);
            }
        });
    }
}

// Broadcast incoming call to all clients
function broadcastIncomingCall(callInfo) {
    console.log('Broadcasting incoming call:', callInfo);

    if (global.sseClients) {
        const message = JSON.stringify({
            type: 'incoming_call',
            ...callInfo,
            timestamp: new Date().toISOString()
        });

        Object.values(global.sseClients).forEach(client => {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (error) {
                console.error('Error broadcasting incoming call:', error);
            }
        });
    }
}

// Endpoint to get Telnyx configuration (protected)
router.get('/api/telnyx/config', (req, res) => {
    // Only return config if API key is properly configured
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx API not configured',
            message: 'Please configure your Telnyx API key in the .env file'
        });
    }

    // Return configuration
    res.json({
        configured: true,
        apiUrl: 'https://api.telnyx.com/v2',
        // Don't send the actual API key to frontend, just confirmation it exists
        hasApiKey: true
    });
});

// Endpoint to make calls (server-side)
router.post('/api/telnyx/call', async (req, res) => {
    const { to, from, webhookUrl } = req.body;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Failed to initiate call: Could not find any usable credentials in the request.',
            message: 'Telnyx API key not configured. Please add your Telnyx API key to the .env file.'
        });
    }

    try {
        const response = await axios.post('https://api.telnyx.com/v2/calls', {
            connection_id: '2780188277137737142', // Your Call Control App ID
            to: to,
            from: from,
            webhook_url: webhookUrl || 'http://162.220.14.239:3001/webhook/telnyx'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        res.json(data);
    } catch (error) {
        console.error('Telnyx call error:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Call failed';
        res.status(error.response?.status || 500).json({
            error: 'Failed to initiate call',
            message: errorMessage
        });
    }
});

// Endpoint to hangup calls (server-side)
router.post('/api/telnyx/hangup', async (req, res) => {
    const { callControlId } = req.body;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Failed to hangup call: Could not find any usable credentials in the request.',
            message: 'Telnyx API key not configured.'
        });
    }

    try {
        const response = await axios.post(`https://api.telnyx.com/v2/calls/${callControlId}/actions/hangup`, {}, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        res.json(data);
    } catch (error) {
        console.error('Telnyx hangup error:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Hangup failed';
        res.status(error.response?.status || 500).json({
            error: 'Failed to hangup call',
            message: errorMessage
        });
    }
});

// Endpoint to send DTMF tones
router.post('/api/telnyx/dtmf', async (req, res) => {
    const { callControlId, digits } = req.body;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Failed to send DTMF',
            message: 'Telnyx API key not configured.'
        });
    }

    try {
        const response = await axios.post(`https://api.telnyx.com/v2/calls/${callControlId}/actions/send_dtmf`, {
            digits: digits
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        res.json(data);
    } catch (error) {
        console.error('Telnyx DTMF error:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'DTMF send failed';
        res.status(error.response?.status || 500).json({
            error: 'Failed to send DTMF',
            message: errorMessage
        });
    }
});

// Webhook endpoint to receive Telnyx call events
router.post('/webhook/telnyx', async (req, res) => {
    // Send immediate 200 OK response for webhook
    res.status(200).json({ received: true });

    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    const event = req.body.data;

    if (!event) {
        console.log('No event data in webhook');
        return;
    }

    console.log('Telnyx webhook event:', event.event_type, 'Call ID:', event.payload?.call_control_id);

    const callControlId = event.payload?.call_control_id;
    const direction = event.payload?.direction;

    // Handle incoming calls
    if (event.event_type === 'call.initiated' && direction === 'incoming') {
        console.log('=== INCOMING CALL ===');
        console.log('From:', event.payload.from);
        console.log('To:', event.payload.to);
        console.log('Call Control ID:', callControlId);

        // Store incoming call info
        global.incomingCalls = global.incomingCalls || {};
        global.incomingCalls[callControlId] = {
            from: event.payload.from,
            to: event.payload.to,
            callControlId: callControlId,
            timestamp: new Date().toISOString(),
            status: 'ringing'
        };

        // Broadcast incoming call to all connected clients
        broadcastIncomingCall({
            callControlId: callControlId,
            from: event.payload.from,
            to: event.payload.to
        });

        // Don't auto-answer - wait for user action
        console.log('Waiting for user to answer or reject call...');

        return; // Already sent 200 OK response
    }

    // Handle other events
    switch(event.event_type) {
        case 'call.initiated':
            console.log('Call initiated to:', event.payload.to);
            broadcastCallStatus(callControlId, 'initiated');
            break;
        case 'call.ringing':
            console.log('Call ringing');
            broadcastCallStatus(callControlId, 'ringing');
            break;
        case 'call.answered':
            console.log('Call answered!');
            broadcastCallStatus(callControlId, 'connected');

            // Update stored call info to keep track of active calls
            if (global.incomingCalls && global.incomingCalls[callControlId]) {
                global.incomingCalls[callControlId].status = 'connected';
                global.incomingCalls[callControlId].answeredAt = new Date().toISOString();
            }

            // Track as active call
            global.activeCalls.set(callControlId, {
                status: 'connected',
                answeredAt: new Date().toISOString(),
                lastChecked: new Date().toISOString()
            });
            break;
        case 'call.bridged':
            console.log('Call bridged - fully connected');
            broadcastCallStatus(callControlId, 'connected');

            // Update stored call info
            if (global.incomingCalls && global.incomingCalls[callControlId]) {
                global.incomingCalls[callControlId].status = 'bridged';
            }
            break;
        case 'call.hangup':
            console.log('Call ended');
            broadcastCallStatus(callControlId, 'ended');

            // Clean up stored call info
            if (global.incomingCalls && global.incomingCalls[callControlId]) {
                delete global.incomingCalls[callControlId];
            }

            // Remove from active calls
            global.activeCalls.delete(callControlId);
            console.log('Removed call from active calls:', callControlId);
            break;
        case 'call.machine.detection.ended':
            if (event.payload.result === 'human') {
                console.log('Human detected - call connected');
                broadcastCallStatus(callControlId, 'connected');
            }
            break;
    }

    // Response already sent at the beginning of the webhook handler
});

// SSE endpoint for real-time call status updates
router.get('/api/telnyx/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Store this connection
    const clientId = Date.now();
    global.sseClients = global.sseClients || {};
    global.sseClients[clientId] = res;

    // Send initial connection message
    res.write(`data: {"type": "connected", "clientId": "${clientId}"}\n\n`);

    // Clean up on disconnect
    req.on('close', () => {
        delete global.sseClients[clientId];
    });
});

// Endpoint to get current call status
router.get('/api/telnyx/call/:callControlId/status', async (req, res) => {
    const { callControlId } = req.params;
    const apiKey = process.env.TELNYX_API_KEY;

    console.log('Status check for call:', callControlId);

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx not configured'
        });
    }

    try {
        let response;
        let data;

        // Try with the call control ID first
        try {
            response = await axios.get(`https://api.telnyx.com/v2/calls/${callControlId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            });
            data = response.data;
        } catch (error) {
            // If not found, try as a call_leg_id
            if (error.response?.status === 404) {
                console.log('Trying as call_leg_id...');
                response = await axios.get(`https://api.telnyx.com/v2/calls?filter[call_leg_id]=${callControlId}`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    }
                });
                data = response.data;
            } else {
                throw error;
            }
        }

        // Handle both single call and array response
        const callData = data.data?.length ? data.data[0] : data.data;

        // Log the full response for debugging
        console.log('Telnyx call data:', JSON.stringify(callData, null, 2));

        // Map Telnyx states to our simplified states
        let status = 'unknown';
        const telnyxState = callData?.state;
        const isAlive = callData?.is_alive;

        // Check multiple fields to determine if call is connected
        // Telnyx states: https://developers.telnyx.com/docs/v2/call-control
        // The main state when a call is answered is "active"

        // Force connected if we have answer_time
        if (callData?.answer_time) {
            status = 'connected';
            console.log('Call has answer_time, marking as connected');
        }
        // Check all possible connected states
        else if (telnyxState === 'active' ||
            telnyxState === 'answered' ||
            telnyxState === 'bridging' ||
            telnyxState === 'bridged' ||
            telnyxState === 'connected' ||
            telnyxState === 'established') {
            status = 'connected';
        }
        // If call is alive but not in early/ringing state, assume connected
        else if (isAlive && telnyxState !== 'parked' && telnyxState !== 'initiated' && telnyxState !== 'ringing' && telnyxState !== 'early') {
            status = 'connected';
            console.log(`Call is alive with state ${telnyxState}, assuming connected`);
        }
        else if (telnyxState === 'ringing' || telnyxState === 'early') {
            status = 'ringing';
        }
        else if (telnyxState === 'hangup' || telnyxState === 'destroyed' || !isAlive) {
            status = 'ended';
        }
        else {
            status = 'calling';
        }

        console.log(`Call state mapping: Telnyx state="${telnyxState}", is_alive=${isAlive} => status="${status}"`);

        res.json({
            status: status,
            telnyxState: telnyxState,
            callControlId: callControlId
        });

        // Also broadcast via SSE
        if (status === 'connected' || status === 'answered') {
            broadcastCallStatus(callControlId, 'connected');
        }

    } catch (error) {
        console.error('Error getting call status:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Failed to get call status';
        res.status(error.response?.status || 500).json({
            error: 'Failed to get call status',
            message: errorMessage
        });
    }
});

// Endpoint to answer incoming call
router.post('/api/telnyx/answer/:callControlId', async (req, res) => {
    const { callControlId } = req.params;
    const apiKey = process.env.TELNYX_API_KEY;

    console.log('Answering call:', callControlId);

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx not configured'
        });
    }

    try {
        // Answer the call without specifying webhook_url to avoid conflicts
        // The webhook URL should already be configured in the Call Control App
        const response = await axios.post(`https://api.telnyx.com/v2/calls/${callControlId}/actions/answer`, {
            // Don't override webhook URL - use the one configured in Call Control App
            client_state: Buffer.from(JSON.stringify({ answered: true })).toString('base64')
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        console.log('Answer API success:', data);

        // Update stored call info
        if (global.incomingCalls && global.incomingCalls[callControlId]) {
            global.incomingCalls[callControlId].status = 'answered';
            global.incomingCalls[callControlId].answeredAt = new Date().toISOString();
        }

        // Store as active call
        global.activeCalls.set(callControlId, {
            status: 'connected',
            answeredAt: new Date().toISOString(),
            lastChecked: new Date().toISOString()
        });

        // Join the call to a conference to establish proper media handling
        try {
            console.log('Joining call to conference for media handling...');
            const conferenceId = `conf_${callControlId.substring(0, 10)}`; // Create unique conference ID

            const conferenceResponse = await axios.post(`https://api.telnyx.com/v2/calls/${callControlId}/actions/join_conference`, {
                name: conferenceId,
                start_conference_on_enter: true,
                end_conference_on_exit: true,
                mute: false,
                hold: false,
                comfort_noise: true, // This provides comfort noise to keep RTP active
                call_control_id: callControlId
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const conferenceData = conferenceResponse.data;
            console.log('Conference response:', conferenceData);

            if (conferenceResponse.status >= 400) {
                console.warn('Could not join conference:', conferenceData);

                // Fallback: Try to play hold music to keep RTP active
                console.log('Fallback: Playing hold music...');
                const holdResponse = await axios.post(`https://api.telnyx.com/v2/calls/${callControlId}/actions/playback_start`, {
                    audio_url: 'https://www.telnyx.com/call_control/audio/hold_music.mp3',
                    loop: true
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                const holdData = holdResponse.data;
                console.log('Hold music response:', holdData);
            } else {
                console.log('Call successfully joined to conference');

                // Store conference ID for later use
                if (global.activeCalls.has(callControlId)) {
                    const callInfo = global.activeCalls.get(callControlId);
                    callInfo.conferenceId = conferenceId;
                    global.activeCalls.set(callControlId, callInfo);
                }
            }
        } catch (conferenceError) {
            console.error('Conference/media setup failed:', conferenceError.message);
            console.log('Call may drop after 20 seconds due to no media path');
        }

        console.log('Call answered - media handling configured');

        broadcastCallStatus(callControlId, 'connected');

        // Send immediate success response
        res.json({ success: true, data });

    } catch (error) {
        console.error('Failed to answer call:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Failed to answer call';
        res.status(error.response?.status || 500).json({
            error: 'Failed to answer call',
            message: errorMessage
        });
    }
});

// Endpoint to reject incoming call
router.post('/api/telnyx/reject/:callControlId', async (req, res) => {
    const { callControlId } = req.params;
    const apiKey = process.env.TELNYX_API_KEY;

    console.log('Rejecting call:', callControlId);

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx not configured'
        });
    }

    try {
        const response = await axios.post(`https://api.telnyx.com/v2/calls/${callControlId}/actions/reject`, {
            cause: 'USER_BUSY'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        // Update stored call info
        if (global.incomingCalls && global.incomingCalls[callControlId]) {
            global.incomingCalls[callControlId].status = 'rejected';
        }

        res.json({ success: true, data });

    } catch (error) {
        console.error('Failed to reject call:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Failed to reject call';
        res.status(error.response?.status || 500).json({
            error: 'Failed to reject call',
            message: errorMessage
        });
    }
});

// SMS ENDPOINTS

// Endpoint to send single SMS
router.post('/api/telnyx/sms/send', async (req, res) => {
    const { to, message, from } = req.body;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx API not configured',
            message: 'Please configure your Telnyx API key'
        });
    }

    try {
        const response = await axios.post('https://api.telnyx.com/v2/messages', {
            from: from || '+18882681541', // Default SMS number
            to: to,
            text: message,
            messaging_profile_id: '4001992b-8be8-4a0b-a14c-cd03f9c7d808', // Vanguard Insurance SMS profile
            webhook_url: 'http://162.220.14.239:3001/webhook/telnyx/sms'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        console.log('SMS sent successfully:', { to, from: from || '+18882681541', messageId: data.data?.id });

        res.json({
            success: true,
            messageId: data.data?.id,
            to: to,
            from: from || '+18882681541',
            status: 'sent'
        });

    } catch (error) {
        console.error('SMS send error:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'SMS send failed';
        res.status(error.response?.status || 500).json({
            error: 'Failed to send SMS',
            message: errorMessage
        });
    }
});

// Endpoint to send bulk SMS
router.post('/api/telnyx/sms/bulk', async (req, res) => {
    const { recipients, message, from } = req.body;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx API not configured',
            message: 'Please configure your Telnyx API key'
        });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
            error: 'Invalid recipients',
            message: 'Recipients must be a non-empty array'
        });
    }

    try {
        const results = [];
        const fromNumber = from || '+18882681541';

        console.log(`Starting bulk SMS to ${recipients.length} recipients`);

        // Send messages with rate limiting (3 per second to avoid Telnyx limits)
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            try {
                const response = await axios.post('https://api.telnyx.com/v2/messages', {
                    from: fromNumber,
                    to: recipient.phone || recipient,
                    text: message.replace(/\{name\}/g, recipient.name || 'Customer'),
                    webhook_url: 'http://162.220.14.239:3001/webhook/telnyx/sms'
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = response.data;

                results.push({
                    phone: recipient.phone || recipient,
                    name: recipient.name || 'Unknown',
                    status: 'sent',
                    messageId: data.data?.id
                });

                // Rate limiting: wait 350ms between messages (roughly 3/second)
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 350));
                }

            } catch (error) {
                results.push({
                    phone: recipient.phone || recipient,
                    name: recipient.name || 'Unknown',
                    status: 'failed',
                    error: error.response?.data?.errors?.[0]?.detail || error.message || 'Unknown error'
                });
            }
        }

        const successful = results.filter(r => r.status === 'sent').length;
        const failed = results.filter(r => r.status === 'failed').length;

        console.log(`Bulk SMS complete: ${successful} sent, ${failed} failed`);

        res.json({
            success: true,
            total: recipients.length,
            sent: successful,
            failed: failed,
            results: results
        });

    } catch (error) {
        console.error('Bulk SMS error:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Failed to send bulk SMS';
        res.status(error.response?.status || 500).json({
            error: 'Failed to send bulk SMS',
            message: errorMessage
        });
    }
});

// SMS webhook endpoint to receive delivery receipts
router.post('/webhook/telnyx/sms', async (req, res) => {
    // Send immediate 200 OK response
    res.status(200).json({ received: true });

    console.log('SMS webhook received:', JSON.stringify(req.body, null, 2));

    const event = req.body.data;

    if (!event) {
        console.log('No SMS event data in webhook');
        return;
    }

    console.log('SMS webhook event:', event.event_type, 'Message ID:', event.payload?.id);

    // Handle different SMS events
    switch(event.event_type) {
        case 'message.sent':
            console.log('SMS sent successfully:', event.payload?.to);
            break;
        case 'message.delivered':
            console.log('SMS delivered to:', event.payload?.to);
            break;
        case 'message.delivery_failed':
            console.log('SMS delivery failed to:', event.payload?.to, 'Reason:', event.payload?.errors);
            break;
        case 'message.received':
            console.log('SMS received from:', event.payload?.from, 'Message:', event.payload?.text);
            // Here you could handle incoming SMS responses
            break;
        default:
            console.log('Unknown SMS event type:', event.event_type);
    }
});

// Endpoint to get SMS delivery status
router.get('/api/telnyx/sms/:messageId/status', async (req, res) => {
    const { messageId } = req.params;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey || apiKey === 'YOUR_TELNYX_API_KEY_HERE') {
        return res.status(503).json({
            error: 'Telnyx not configured'
        });
    }

    try {
        const response = await axios.get(`https://api.telnyx.com/v2/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const data = response.data;

        res.json({
            messageId: messageId,
            status: data.data?.messaging_status || 'unknown',
            to: data.data?.to,
            from: data.data?.from,
            text: data.data?.text
        });

    } catch (error) {
        console.error('Error getting SMS status:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Failed to get SMS status';
        res.status(error.response?.status || 500).json({
            error: 'Failed to get SMS status',
            message: errorMessage
        });
    }
});

module.exports = router;