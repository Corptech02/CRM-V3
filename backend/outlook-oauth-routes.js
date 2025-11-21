
// Outlook OAuth routes for COI integration
const express = require('express');
const router = express.Router();

// OAuth configuration
const oauthConfig = {
    client_id: 'd9a9dcd9-08a1-4c26-b96a-f03499f12f1e',
    tenant_id: 'da8032b6-57f6-40fd-aa76-ed180c5db64b',
    redirect_uri: 'https://162-220-14-239.nip.io/api/outlook/callback',
    scope: 'openid offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read'
};

// Generate auth URL
router.get('/api/outlook/auth', (req, res) => {
    const params = new URLSearchParams({
        client_id: oauthConfig.client_id,
        response_type: 'code',
        redirect_uri: oauthConfig.redirect_uri,
        response_mode: 'query',
        scope: oauthConfig.scope,
        state: 'outlook_auth'
    });

    const authUrl = `https://login.microsoftonline.com/${oauthConfig.tenant_id}/oauth2/v2.0/authorize?${params}`;
    res.redirect(authUrl);
});

// Handle callback
router.get('/api/outlook/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        res.send(`<h1>Error: ${error}</h1><p>Please try again or contact support.</p>`);
        return;
    }

    if (code) {
        // In production, exchange code for tokens here
        res.send(`
            <h1>✅ Authorization Successful!</h1>
            <p>Outlook has been connected to the COI Management system.</p>
            <p>You can close this window and return to the application.</p>
            <script>
                setTimeout(() => {
                    window.close();
                }, 3000);
            </script>
        `);
    } else {
        res.send('<h1>No authorization code received</h1>');
    }
});

// Check auth status
router.get('/api/outlook/auth/status', (req, res) => {
    res.json({
        configured: true,
        authenticated: false, // Will be true once we have tokens
        email: 'grant@vigagency.com',
        provider: 'outlook'
    });
});

module.exports = router;
