// Twilio Voice API Call Endpoint
// This creates a simple backend API for making Twilio Voice calls

const express = require('express');
const twilio = require('twilio');

// Twilio configuration (you'll need to set these)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid_here';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

module.exports = async (req, res) => {
    console.log('📞 Twilio Voice API call request:', req.body);

    try {
        const { to, from, callerName } = req.body;

        if (!to || !from) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: to, from'
            });
        }

        // Make the call using Twilio Voice API
        const call = await client.calls.create({
            to: to,
            from: from,
            url: 'http://demo.twilio.com/docs/voice.xml', // Simple TwiML for testing
            statusCallback: `${req.protocol}://${req.get('host')}/api/twilio/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST'
        });

        console.log('✅ Twilio call created:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            to: call.to,
            from: call.from
        });

    } catch (error) {
        console.error('❌ Twilio call failed:', error);

        let errorMessage = error.message;
        let statusCode = 500;

        if (error.code === 20003) {
            errorMessage = 'Authentication Error - check Twilio credentials';
            statusCode = 401;
        } else if (error.code === 21212) {
            errorMessage = 'Invalid phone number format';
            statusCode = 400;
        } else if (error.code === 21214) {
            errorMessage = 'Caller ID not verified in Twilio';
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code
        });
    }
};