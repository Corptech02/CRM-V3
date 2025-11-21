const express = require('express');
const router = express.Router();
const OutlookIMAPService = require('./outlook-imap-service');

// Initialize service lazily to ensure environment variables are loaded
let outlookService = null;

function getOutlookService() {
    if (!outlookService) {
        console.log('🔄 Initializing Outlook service with environment variables...');
        outlookService = new OutlookIMAPService();
    }
    return outlookService;
}

// Test connection
router.get('/api/outlook/test', async (req, res) => {
    try {
        const result = await getOutlookService().testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get authentication status
router.get('/api/outlook/auth/status', (req, res) => {
    res.json({
        authenticated: getOutlookService().isConfigured(),
        provider: 'outlook-imap',
        email: getOutlookService().email,
        configured: getOutlookService().isConfigured()
    });
});

// Get emails
router.get('/api/outlook/emails', async (req, res) => {
    try {
        if (!getOutlookService().isConfigured()) {
            return res.status(401).json({
                error: 'Outlook not configured',
                message: 'Please configure Outlook credentials first'
            });
        }

        const filter = req.query.filter || 'ALL'; // Default to ALL emails for COI system
        const emails = await getOutlookService().getEmails(filter);

        res.json({
            success: true,
            count: emails.length,
            emails: emails
        });

    } catch (error) {
        console.error('Error fetching Outlook emails:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            help: error.help || null
        });
    }
});

// Get single email
router.get('/api/outlook/emails/:id', async (req, res) => {
    try {
        if (!getOutlookService().isConfigured()) {
            return res.status(401).json({
                error: 'Outlook not configured'
            });
        }

        const email = await getOutlookService().getEmail(req.params.id);
        res.json(email);

    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Send email
router.post('/api/outlook/send', async (req, res) => {
    try {
        if (!getOutlookService().isConfigured()) {
            return res.status(401).json({
                error: 'Outlook not configured'
            });
        }

        const { to, subject, body, attachments } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({
                error: 'Missing required fields: to, subject, body'
            });
        }

        const result = await getOutlookService().sendEmail(to, subject, body, attachments);
        res.json(result);

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Mark as read
router.post('/api/outlook/emails/:id/read', async (req, res) => {
    try {
        if (!getOutlookService().isConfigured()) {
            return res.status(401).json({
                error: 'Outlook not configured'
            });
        }

        const result = await getOutlookService().markAsRead(req.params.id);
        res.json(result);

    } catch (error) {
        console.error('Error marking email as read:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;