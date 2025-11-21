const express = require('express');
const router = express.Router();

/**
 * Send COI with canvas image attachment
 * POST /api/coi/send-with-canvas
 */
router.post('/send-with-canvas', async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, attachment, provider } = req.body;

        console.log('Sending email with canvas attachment...');
        console.log('Attachment filename:', attachment.filename);

        // Determine which email service to use
        const emailProvider = provider || 'gmail';
        const emailService = emailProvider === 'outlook' ?
            require('./outlook-service') :
            require('./gmail-service');

        // Send email with attachment
        const emailServiceInstance = new emailService();

        // Load credentials based on provider
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./vanguard.db');

        const credKey = emailProvider === 'outlook' ? 'outlook_tokens' : 'gmail_tokens';

        db.get('SELECT value FROM settings WHERE key = ?', [credKey], async (err, row) => {
            if (err || !row) {
                return res.status(500).json({
                    error: 'Email service not configured',
                    details: `${emailProvider} credentials not found`
                });
            }

            try {
                const credentials = JSON.parse(row.value);
                await emailServiceInstance.initialize(credentials);

                // Send email with the canvas image as attachment
                const result = await emailServiceInstance.sendEmail({
                    to,
                    cc,
                    bcc,
                    subject,
                    body,
                    attachments: [attachment]
                });

                console.log('Email sent successfully with canvas attachment');

                res.json({
                    success: true,
                    messageId: result.id,
                    message: 'Email sent with ACORD 25 form attachment'
                });
            } catch (sendError) {
                console.error('Email send error:', sendError);
                res.status(500).json({
                    error: 'Failed to send email',
                    details: sendError.message
                });
            } finally {
                db.close();
            }
        });

    } catch (error) {
        console.error('Error in send-with-canvas:', error);
        res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
});

module.exports = router;