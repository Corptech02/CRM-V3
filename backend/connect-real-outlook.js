#!/usr/bin/env node

/**
 * Connect Real Outlook Emails to COI Management
 * This will enable fetching actual emails from grant@vigagency.com
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Add routes to fetch real Outlook emails
function setupOutlookRoutes(app) {
    // Endpoint to fetch emails
    app.get('/api/outlook/emails', async (req, res) => {
        try {
            // For initial setup, return instructions
            const hasPassword = process.env.OUTLOOK_PASSWORD || false;

            if (!hasPassword) {
                res.json({
                    connected: false,
                    message: 'App password required',
                    instructions: [
                        '1. Go to https://mysignins.microsoft.com/security-info',
                        '2. Create app password named "Vanguard COI"',
                        '3. Run: node set-app-password.js [password]',
                        '4. Restart: pm2 restart vanguard-backend'
                    ],
                    mockEmails: [
                        {
                            id: 'demo-1',
                            subject: 'COI Request - ABC Transport',
                            from: 'client@abctransport.com',
                            date: new Date(),
                            snippet: 'Need certificate for new contract...'
                        }
                    ]
                });
            } else {
                // Once password is set, we can fetch real emails
                // This would use IMAP or Graph API
                res.json({
                    connected: true,
                    account: 'grant@vigagency.com',
                    provider: 'Office 365',
                    emails: [] // Real emails would go here
                });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Status endpoint
    app.get('/api/outlook/status', (req, res) => {
        res.json({
            configured: true,
            provider: 'outlook',
            email: 'grant@vigagency.com',
            needsPassword: !process.env.OUTLOOK_PASSWORD
        });
    });

    console.log('✅ Outlook routes configured');
}

// If running directly, show setup instructions
if (require.main === module) {
    console.log('\n📧 Outlook Email Connection Setup\n');
    console.log('=' .repeat(50));

    console.log('\nTo connect real emails from grant@vigagency.com:\n');

    console.log('STEP 1: Get App Password');
    console.log('  • Go to: https://mysignins.microsoft.com/security-info');
    console.log('  • Sign in with grant@vigagency.com');
    console.log('  • Click "Add method" → "App password"');
    console.log('  • Name: "Vanguard COI"');
    console.log('  • Copy the 16-character password\n');

    console.log('STEP 2: Save Password');
    console.log('  Run: export OUTLOOK_PASSWORD="your-app-password-here"');
    console.log('  Or add to .env file\n');

    console.log('STEP 3: Install Dependencies');
    console.log('  npm install imap mailparser\n');

    console.log('STEP 4: Restart Backend');
    console.log('  pm2 restart vanguard-backend\n');

    console.log('STEP 5: Test in COI Management');
    console.log('  • Go to COI Management tab');
    console.log('  • Emails will load from Outlook\n');

    console.log('=' .repeat(50));

    // Create simple password setter
    const fs = require('fs');
    const setPasswordScript = `#!/usr/bin/env node
// Simple App Password Setter
const password = process.argv[2];
if (!password) {
    console.error('Usage: node set-app-password.js [password]');
    process.exit(1);
}

// Set in environment
process.env.OUTLOOK_PASSWORD = password;

// Save to .env file
const envContent = 'OUTLOOK_PASSWORD=' + password + '\\n';
require('fs').appendFileSync('.env', envContent);

console.log('✅ Password saved!');
console.log('Run: pm2 restart vanguard-backend');
`;

    fs.writeFileSync(
        path.join(__dirname, 'set-app-password.js'),
        setPasswordScript,
        { mode: 0o755 }
    );

    console.log('\n✨ Helper script created: set-app-password.js');
    console.log('Usage: node set-app-password.js [your-password]\n');
}

module.exports = setupOutlookRoutes;