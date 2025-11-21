const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

console.log('🔧 Twilio-config.js loaded - Voice and SMS routes available');

// Global SSE clients storage
global.sseClients = global.sseClients || {};

// Global active calls storage
global.activeCalls = global.activeCalls || new Map();

// Twilio Client Setup
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Helper function to broadcast call status to all connected clients
function broadcastCallStatus(callSid, status) {
    console.log('Broadcasting status:', status, 'for call:', callSid);

    if (global.sseClients) {
        const message = JSON.stringify({
            type: 'call_status',
            callSid: callSid,
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

// Endpoint to generate access token for Twilio Voice SDK (SIP calling)
router.post('/api/twilio/token', (req, res) => {
    const { identity } = req.body;

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Twilio credentials not configured'
        });
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create access token
    const accessToken = new AccessToken(
        accountSid,
        process.env.TWILIO_API_KEY || accountSid,
        process.env.TWILIO_API_SECRET || authToken,
        { identity: identity || 'vanguard-user' }
    );

    // Create voice grant
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
        incomingAllow: true
    });

    accessToken.addGrant(voiceGrant);

    res.json({
        identity: identity || 'vanguard-user',
        token: accessToken.toJwt()
    });
});

// Endpoint to get Twilio configuration (protected)
router.get('/api/twilio/config', (req, res) => {
    // Only return config if credentials are properly configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || accountSid === 'YOUR_TWILIO_ACCOUNT_SID_HERE') {
        return res.status(503).json({
            error: 'Twilio API not configured',
            message: 'Please configure your Twilio credentials in the .env file'
        });
    }

    // Return configuration
    res.json({
        configured: true,
        apiUrl: 'https://api.twilio.com/2010-04-01',
        hasCredentials: true,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        supportsSip: true
    });
});

// Endpoint to make calls (server-side)
router.post('/api/twilio/call', async (req, res) => {
    const { to, from } = req.body;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || accountSid === 'YOUR_TWILIO_ACCOUNT_SID_HERE') {
        return res.status(503).json({
            error: 'Failed to initiate call: Twilio credentials not configured.',
            message: 'Twilio credentials not configured. Please add your Twilio credentials to the .env file.'
        });
    }

    try {
        // Conference-based call: Create a conference room and invite both parties
        const conferenceName = `crm-call-${Date.now()}`;

        // First call: Call the CRM user (you)
        const call1 = await client.calls.create({
            to: from,  // Your phone number
            from: twilioNumber,
            twiml: `<Response><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceName}</Conference></Dial></Response>`
        });

        // Wait a moment, then call the target
        setTimeout(async () => {
            try {
                await client.calls.create({
                    to: to,  // Target phone number
                    from: twilioNumber,
                    twiml: `<Response><Dial><Conference startConferenceOnEnter="false" endConferenceOnExit="false">${conferenceName}</Conference></Dial></Response>`
                });
            } catch (error) {
                console.error('Error calling target:', error);
            }
        }, 3000); // Wait 3 seconds for you to answer first

        const call = call1; // Return the first call for tracking

        console.log('Twilio call created:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            to: call.to,
            from: call.from
        });

    } catch (error) {
        console.error('Twilio call error:', error);
        const errorMessage = error.message || 'Call failed';
        res.status(500).json({
            error: 'Failed to initiate call',
            message: errorMessage
        });
    }
});

// Endpoint to hangup calls (server-side)
router.post('/api/twilio/hangup', async (req, res) => {
    const { callSid } = req.body;

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Failed to hangup call: Twilio credentials not configured.',
            message: 'Twilio credentials not configured.'
        });
    }

    try {
        const call = await client.calls(callSid).update({
            status: 'completed'
        });

        console.log('Call hung up:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: 'completed'
        });

    } catch (error) {
        console.error('Twilio hangup error:', error);
        const errorMessage = error.message || 'Hangup failed';
        res.status(500).json({
            error: 'Failed to hangup call',
            message: errorMessage
        });
    }
});

// TwiML webhook endpoint for voice calls (including SIP calls)
router.post('/webhook/twilio/voice', (req, res) => {
    console.log('Voice webhook received:', req.body);

    const twiml = new twilio.twiml.VoiceResponse();

    // Check if this is a SIP call (from Twilio Voice SDK)
    if (req.body.From && req.body.From.includes('client:')) {
        // This is a SIP call from the browser client
        const phoneNumber = req.body.To;

        console.log('=== SIP OUTBOUND CALL ===');
        console.log('From client to:', phoneNumber);

        // Dial the phone number directly
        twiml.dial({
            callerId: process.env.TWILIO_PHONE_NUMBER
        }, phoneNumber);

        res.type('text/xml');
        res.send(twiml.toString());
        return;
    }

    // Regular PSTN call handling
    const callDirection = req.body.Direction;
    const callSid = req.body.CallSid;
    const from = req.body.From;
    const to = req.body.To;

    if (callDirection === 'inbound') {
        console.log('=== INCOMING CALL ===');
        console.log('From:', from);
        console.log('To:', to);
        console.log('Call SID:', callSid);

        // Store incoming call info
        global.incomingCalls = global.incomingCalls || {};
        global.incomingCalls[callSid] = {
            from: from,
            to: to,
            callSid: callSid,
            timestamp: new Date().toISOString(),
            status: 'ringing'
        };

        // Broadcast incoming call to all connected clients
        broadcastIncomingCall({
            callSid: callSid,
            from: from,
            to: to
        });

        // Ring for 30 seconds, then go to voicemail
        twiml.dial({
            timeout: 30,
            action: '/webhook/twilio/dial-status'
        }, from);

        // If no answer, play voicemail message
        twiml.say('Please leave a message after the tone.');
        twiml.record({
            timeout: 10,
            transcribe: true,
            transcribeCallback: '/webhook/twilio/transcription'
        });

    } else {
        // Outbound call - just connect
        twiml.dial(req.body.To);
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// Status callback webhook
router.post('/webhook/twilio/status', (req, res) => {
    // Send immediate 200 OK response
    res.status(200).json({ received: true });

    console.log('Status webhook received:', req.body);

    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus;
    const direction = req.body.Direction;

    console.log('Twilio status update:', callStatus, 'for call:', callSid);

    // Handle different call statuses
    switch(callStatus) {
        case 'queued':
        case 'initiated':
            console.log('Call initiated:', callSid);
            broadcastCallStatus(callSid, 'initiated');
            break;
        case 'ringing':
            console.log('Call ringing:', callSid);
            broadcastCallStatus(callSid, 'ringing');
            break;
        case 'in-progress':
            console.log('Call answered:', callSid);
            broadcastCallStatus(callSid, 'connected');

            // Track as active call
            global.activeCalls.set(callSid, {
                status: 'connected',
                answeredAt: new Date().toISOString(),
                lastChecked: new Date().toISOString()
            });

            // Update stored call info
            if (global.incomingCalls && global.incomingCalls[callSid]) {
                global.incomingCalls[callSid].status = 'connected';
                global.incomingCalls[callSid].answeredAt = new Date().toISOString();
            }
            break;
        case 'completed':
        case 'busy':
        case 'no-answer':
        case 'canceled':
        case 'failed':
            console.log('Call ended:', callSid, 'Status:', callStatus);
            broadcastCallStatus(callSid, 'ended');

            // Clean up stored call info
            if (global.incomingCalls && global.incomingCalls[callSid]) {
                delete global.incomingCalls[callSid];
            }

            // Remove from active calls
            global.activeCalls.delete(callSid);
            break;
    }
});

// Endpoint to get current call status
router.get('/api/twilio/call/:callSid/status', async (req, res) => {
    const { callSid } = req.params;

    console.log('Status check for call:', callSid);

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Twilio not configured'
        });
    }

    try {
        const call = await client.calls(callSid).fetch();

        console.log('Twilio call status:', call.status);

        // Map Twilio statuses to our simplified statuses
        let status = 'unknown';
        switch(call.status) {
            case 'queued':
            case 'initiated':
                status = 'calling';
                break;
            case 'ringing':
                status = 'ringing';
                break;
            case 'in-progress':
                status = 'connected';
                break;
            case 'completed':
            case 'busy':
            case 'no-answer':
            case 'canceled':
            case 'failed':
                status = 'ended';
                break;
        }

        res.json({
            status: status,
            twilioStatus: call.status,
            callSid: callSid,
            duration: call.duration,
            price: call.price
        });

    } catch (error) {
        console.error('Error getting call status:', error);
        res.status(500).json({
            error: 'Failed to get call status',
            message: error.message
        });
    }
});

// SSE endpoint for real-time call status updates
router.get('/api/twilio/events', (req, res) => {
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

// SMS ENDPOINTS

// Endpoint to send single SMS
router.post('/api/twilio/sms/send', async (req, res) => {
    const { to, message, from } = req.body;
    const twilioNumber = from || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Twilio API not configured',
            message: 'Please configure your Twilio credentials'
        });
    }

    try {
        const smsMessage = await client.messages.create({
            body: message,
            from: twilioNumber,
            to: to,
            statusCallback: 'http://162-220-14-239.nip.io:3001/webhook/twilio/sms'
        });

        console.log('SMS sent successfully:', { to, from: twilioNumber, messageSid: smsMessage.sid });

        res.json({
            success: true,
            messageSid: smsMessage.sid,
            to: to,
            from: twilioNumber,
            status: 'sent'
        });

    } catch (error) {
        console.error('SMS send error:', error);
        res.status(500).json({
            error: 'Failed to send SMS',
            message: error.message
        });
    }
});

// Endpoint to send bulk SMS
router.post('/api/twilio/sms/bulk', async (req, res) => {
    const { recipients, message, from } = req.body;
    const twilioNumber = from || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Twilio API not configured',
            message: 'Please configure your Twilio credentials'
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

        console.log(`Starting bulk SMS to ${recipients.length} recipients`);

        // Send messages with rate limiting (1 per second for Twilio free tier)
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            try {
                const smsMessage = await client.messages.create({
                    body: message.replace(/\{name\}/g, recipient.name || 'Customer'),
                    from: twilioNumber,
                    to: recipient.phone || recipient,
                    statusCallback: 'http://162-220-14-239.nip.io:3001/webhook/twilio/sms'
                });

                results.push({
                    phone: recipient.phone || recipient,
                    name: recipient.name || 'Unknown',
                    status: 'sent',
                    messageSid: smsMessage.sid
                });

                // Rate limiting: wait 1 second between messages
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                results.push({
                    phone: recipient.phone || recipient,
                    name: recipient.name || 'Unknown',
                    status: 'failed',
                    error: error.message
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
        res.status(500).json({
            error: 'Failed to send bulk SMS',
            message: error.message
        });
    }
});

// SMS webhook endpoint
router.post('/webhook/twilio/sms', (req, res) => {
    // Send immediate 200 OK response
    res.status(200).json({ received: true });

    console.log('SMS webhook received:', req.body);

    const messageSid = req.body.MessageSid;
    const messageStatus = req.body.MessageStatus;
    const to = req.body.To;
    const from = req.body.From;
    const body = req.body.Body;

    console.log('SMS status update:', messageStatus, 'for message:', messageSid);

    // Handle different SMS statuses
    switch(messageStatus) {
        case 'sent':
            console.log('SMS sent successfully to:', to);
            break;
        case 'delivered':
            console.log('SMS delivered to:', to);
            break;
        case 'failed':
        case 'undelivered':
            console.log('SMS delivery failed to:', to);
            break;
    }

    // Handle incoming SMS
    if (req.body.Direction === 'inbound' && body) {
        console.log('SMS received from:', from, 'Message:', body);
        // Here you could handle incoming SMS responses
    }
});

// DTMF endpoint for sending tones during calls
router.post('/api/twilio/dtmf', async (req, res) => {
    const { callSid, digit } = req.body;

    if (!accountSid || !authToken) {
        return res.status(503).json({
            error: 'Twilio API not configured',
            message: 'Please configure your Twilio credentials'
        });
    }

    try {
        // Update the call to play DTMF tone
        const call = await client.calls(callSid).update({
            twiml: `<Response><Play digits="${digit}"/></Response>`
        });

        console.log('DTMF sent:', digit, 'to call:', callSid);

        res.json({
            success: true,
            callSid: callSid,
            digit: digit
        });

    } catch (error) {
        console.error('DTMF error:', error);
        res.status(500).json({
            error: 'Failed to send DTMF',
            message: error.message
        });
    }
});

module.exports = router;