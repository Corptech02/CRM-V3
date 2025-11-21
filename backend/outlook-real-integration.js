#!/usr/bin/env node

/**
 * Real Outlook Integration for COI Management
 * This will actually fetch emails from grant@vigagency.com
 */

const express = require('express');
const router = express.Router();

// Add real email fetching endpoint
router.get('/api/outlook/real-emails', async (req, res) => {
    try {
        // Check if we have the authorization code from query params
        const { code } = req.query;

        if (code) {
            // Exchange code for access token
            const https = require('https');
            const querystring = require('querystring');

            const tokenParams = querystring.stringify({
                client_id: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
                client_secret: process.env.OUTLOOK_SECRET || req.query.secret || '',
                code: code,
                redirect_uri: 'https://162-220-14-239.nip.io/api/outlook/callback',
                grant_type: 'authorization_code'
            });

            // Get access token
            const tokenPromise = new Promise((resolve, reject) => {
                const options = {
                    hostname: 'login.microsoftonline.com',
                    port: 443,
                    path: '/da8032b6-57f6-40fd-aa76-ed180c5db64b/oauth2/v2.0/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': tokenParams.length
                    }
                };

                const tokenReq = https.request(options, (tokenRes) => {
                    let data = '';
                    tokenRes.on('data', chunk => data += chunk);
                    tokenRes.on('end', () => {
                        try {
                            const tokens = JSON.parse(data);
                            if (tokens.access_token) {
                                resolve(tokens.access_token);
                            } else {
                                reject(new Error('No access token received'));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                tokenReq.on('error', reject);
                tokenReq.write(tokenParams);
                tokenReq.end();
            });

            const accessToken = await tokenPromise;

            // Now fetch emails using Graph API
            const emailsPromise = new Promise((resolve, reject) => {
                const options = {
                    hostname: 'graph.microsoft.com',
                    port: 443,
                    path: '/v1.0/me/messages?$top=20&$orderby=receivedDateTime desc&$select=subject,from,receivedDateTime,bodyPreview,isRead',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                };

                const emailReq = https.request(options, (emailRes) => {
                    let data = '';
                    emailRes.on('data', chunk => data += chunk);
                    emailRes.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            resolve(result.value || []);
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                emailReq.on('error', reject);
                emailReq.end();
            });

            const emails = await emailsPromise;

            res.json({
                success: true,
                emails: emails.map(email => ({
                    id: email.id,
                    subject: email.subject,
                    from: email.from?.emailAddress?.address || 'unknown',
                    fromName: email.from?.emailAddress?.name || 'Unknown',
                    date: email.receivedDateTime,
                    snippet: email.bodyPreview,
                    isRead: email.isRead
                }))
            });

        } else {
            // No code provided, return auth URL
            const authUrl = 'https://login.microsoftonline.com/da8032b6-57f6-40fd-aa76-ed180c5db64b/oauth2/v2.0/authorize?' +
                'client_id=d9a9dcd9-08a1-4c26-b96a-f03499f12f1e&' +
                'response_type=code&' +
                'redirect_uri=https://162-220-14-239.nip.io/api/outlook/callback&' +
                'scope=https://graph.microsoft.com/Mail.Read&' +
                'state=coi_emails';

            res.json({
                success: false,
                authRequired: true,
                authUrl: authUrl,
                message: 'Authorization required to fetch emails'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Export for use in server.js
module.exports = router;

// If running standalone, provide instructions
if (require.main === module) {
    console.log('\n📧 Real Outlook Email Integration\n');
    console.log('This module provides endpoints to fetch real emails.\n');
    console.log('Add to your server.js:');
    console.log("  const outlookReal = require('./outlook-real-integration');");
    console.log('  app.use(outlookReal);\n');
    console.log('Then update the COI frontend to call:');
    console.log('  /api/outlook/real-emails\n');
}