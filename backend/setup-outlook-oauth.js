#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n=========================================================');
console.log('       OUTLOOK/OFFICE 365 OAUTH SETUP WIZARD');
console.log('=========================================================\n');

console.log('This wizard will help you set up Microsoft Outlook integration');
console.log('for the COI Management inbox.\n');

console.log('📋 PREREQUISITES:');
console.log('1. Microsoft Azure account (free tier is sufficient)');
console.log('2. Access to Azure Active Directory');
console.log('3. Your Outlook/Office 365 email account\n');

console.log('📌 STEPS TO REGISTER YOUR APP IN AZURE:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('1️⃣  GO TO AZURE PORTAL:');
console.log('   • Navigate to: https://portal.azure.com');
console.log('   • Sign in with your Microsoft account\n');

console.log('2️⃣  REGISTER NEW APP:');
console.log('   • Search for "App registrations" in the top search bar');
console.log('   • Click "New registration"');
console.log('   • Name: "Vanguard COI Management"');
console.log('   • Supported account types: "Single tenant" or "Multitenant"');
console.log('   • Redirect URI: Select "Web" and enter:');
console.log('     http://162.220.14.239:3001/auth/outlook/callback\n');

console.log('3️⃣  SAVE YOUR APP ID:');
console.log('   • After registration, copy the "Application (client) ID"');
console.log('   • Also copy the "Directory (tenant) ID"\n');

console.log('4️⃣  CREATE CLIENT SECRET:');
console.log('   • Go to "Certificates & secrets" in left menu');
console.log('   • Click "New client secret"');
console.log('   • Description: "COI Management Secret"');
console.log('   • Expires: Choose your preference (6 months, 1 year, etc.)');
console.log('   • Click "Add" and IMMEDIATELY copy the secret value');
console.log('   • ⚠️  You cannot view this secret again!\n');

console.log('5️⃣  ADD API PERMISSIONS:');
console.log('   • Go to "API permissions" in left menu');
console.log('   • Click "Add a permission"');
console.log('   • Choose "Microsoft Graph"');
console.log('   • Choose "Delegated permissions"');
console.log('   • Search and add these permissions:');
console.log('     ✓ User.Read');
console.log('     ✓ Mail.Read');
console.log('     ✓ Mail.ReadWrite');
console.log('     ✓ Mail.Send');
console.log('   • Click "Add permissions"');
console.log('   • If you\'re an admin, click "Grant admin consent"\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setupOutlook() {
    console.log('📝 Now let\'s configure your Outlook integration:\n');

    const clientId = await askQuestion('Enter your Application (client) ID: ');
    const clientSecret = await askQuestion('Enter your Client Secret: ');
    const tenantId = await askQuestion('Enter your Directory (tenant) ID (or press Enter for "common"): ') || 'common';

    console.log('\n📧 Email Configuration:');
    const outlookEmail = await askQuestion('Enter the Outlook email address to use: ');

    // Prepare environment variables
    const envVars = `
# Outlook OAuth Configuration
OUTLOOK_CLIENT_ID=${clientId}
OUTLOOK_CLIENT_SECRET=${clientSecret}
OUTLOOK_TENANT_ID=${tenantId}
OUTLOOK_REDIRECT_URI=http://162.220.14.239:3001/auth/outlook/callback
OUTLOOK_EMAIL=${outlookEmail}
`;

    // Update .env file
    const envPath = path.join(__dirname, '.env');
    let existingEnv = '';

    if (fs.existsSync(envPath)) {
        existingEnv = fs.readFileSync(envPath, 'utf-8');
        // Remove existing Outlook variables
        existingEnv = existingEnv.replace(/^OUTLOOK_.*$/gm, '').replace(/\n\n+/g, '\n');
    }

    fs.writeFileSync(envPath, existingEnv + envVars);

    console.log('\n✅ Configuration saved to .env file');

    console.log('\n🚀 NEXT STEPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Restart the backend server:');
    console.log('   pm2 restart vanguard-backend\n');

    console.log('2. Navigate to the authorization URL:');
    console.log('   http://162.220.14.239:3001/auth/outlook\n');

    console.log('3. Sign in with your Outlook account\n');

    console.log('4. Grant permissions when prompted\n');

    console.log('5. After authorization, check the COI Management tab');
    console.log('   The inbox should now show your Outlook emails!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 TROUBLESHOOTING:');
    console.log('• If you get "redirect_uri_mismatch" error:');
    console.log('  Make sure the redirect URI in Azure exactly matches:');
    console.log('  http://162.220.14.239:3001/auth/outlook/callback\n');

    console.log('• If you get permission errors:');
    console.log('  Ensure all required permissions are granted in Azure\n');

    console.log('• To test the connection:');
    console.log('  curl http://localhost:3001/api/outlook/auth/status\n');

    rl.close();
}

setupOutlook().catch(console.error);