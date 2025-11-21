#!/usr/bin/env node

// Simple Twilio Voice API Server
// This provides a backend API for making Twilio Voice calls

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('⚠️ Twilio credentials not set in environment variables');
    console.log('Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
}

// Initialize Twilio client
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Make Call Endpoint
app.post('/api/twilio/make-call', async (req, res) => {
    console.log('📞 Received call request:', req.body);

    if (!twilioClient) {
        return res.status(500).json({
            success: false,
            error: 'Twilio client not initialized - check credentials'
        });
    }

    try {
        const { to, from, callerName } = req.body;

        if (!to || !from) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: to, from'
            });
        }

        console.log(`📞 Making call from ${from} to ${to}`);

        // Create TwiML for the call
        const twimlUrl = `${req.protocol}://${req.get('host')}/api/twilio/twiml`;

        // Make the call
        const call = await twilioClient.calls.create({
            to: to,
            from: from,
            url: twimlUrl,
            statusCallback: `${req.protocol}://${req.get('host')}/api/twilio/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST',
            record: false,
            timeout: 30
        });

        console.log('✅ Call created:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            to: call.to,
            from: call.from,
            message: 'Call initiated successfully'
        });

    } catch (error) {
        console.error('❌ Call failed:', error);

        let errorMessage = error.message;
        let statusCode = 500;

        // Handle specific Twilio errors
        if (error.code === 20003) {
            errorMessage = 'Authentication Error - check Twilio credentials';
            statusCode = 401;
        } else if (error.code === 21212) {
            errorMessage = 'Invalid phone number format';
            statusCode = 400;
        } else if (error.code === 21214) {
            errorMessage = 'Caller ID not verified in Twilio';
            statusCode = 400;
        } else if (error.code === 21215) {
            errorMessage = 'Account not authorized to call this number';
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code
        });
    }
});

// TwiML Endpoint - Returns instructions for the call
app.all('/api/twilio/twiml', (req, res) => {
    console.log('🎵 TwiML requested');

    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Hello! This call is from your Vanguard Insurance system. Please hold while we connect you.</Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna">Thank you for your patience. This is a test call from the Vanguard system.</Say>
</Response>`);
});

// Call Status Webhook
app.post('/api/twilio/call-status', (req, res) => {
    console.log('📊 Call status update:', req.body);
    res.status(200).send('OK');
});

// Health Check
app.get('/api/twilio/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Twilio Voice API Server',
        twilioConfigured: !!twilioClient,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Twilio Voice API Server running on port ${PORT}`);
    console.log(`📞 Make calls via: POST http://localhost:${PORT}/api/twilio/make-call`);
    console.log(`🏥 Health check: GET http://localhost:${PORT}/api/twilio/health`);

    if (!twilioClient) {
        console.log('⚠️ Set environment variables:');
        console.log('   export TWILIO_ACCOUNT_SID="your_account_sid"');
        console.log('   export TWILIO_AUTH_TOKEN="your_auth_token"');
    }
});

module.exports = app;