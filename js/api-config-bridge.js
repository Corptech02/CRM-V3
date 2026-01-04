// API Configuration Bridge
// This module provides API keys from CRM localStorage to server-side scripts

/**
 * Get OpenAI API key from CRM integration settings
 * @returns {string|null} API key or null if not found
 */
function getOpenAIKey() {
    try {
        return localStorage.getItem('integration_openai_key') || null;
    } catch (error) {
        console.warn('Could not access localStorage for OpenAI key:', error);
        return null;
    }
}

/**
 * Get all API keys from integration settings
 * @returns {object} Object containing all configured API keys
 */
function getAllAPIKeys() {
    const keys = {};

    try {
        // Get OpenAI key
        const openaiKey = localStorage.getItem('integration_openai_key');
        if (openaiKey) {
            keys.openai = openaiKey;
        }

        // Get Google Maps key
        const googleMapsKey = localStorage.getItem('integration_google_maps_key');
        if (googleMapsKey) {
            keys.googleMaps = googleMapsKey;
        }

        // Get SendGrid key
        const sendgridKey = localStorage.getItem('integration_sendgrid_key');
        if (sendgridKey) {
            keys.sendgrid = sendgridKey;
        }

        // Get VoIP credentials
        const voipAccountSid = localStorage.getItem('integration_voip_account_sid');
        const voipAuthToken = localStorage.getItem('integration_voip_auth_token');
        if (voipAccountSid && voipAuthToken) {
            keys.voip = {
                accountSid: voipAccountSid,
                authToken: voipAuthToken,
                phoneNumber: localStorage.getItem('integration_voip_phone_number'),
                provider: localStorage.getItem('integration_voip_provider') || 'twilio'
            };
        }

        return keys;
    } catch (error) {
        console.warn('Could not access localStorage for API keys:', error);
        return {};
    }
}

/**
 * Export API keys to environment file for server-side use
 * This creates a temporary .env file that server scripts can source
 */
function exportToEnvironment() {
    const keys = getAllAPIKeys();

    if (Object.keys(keys).length === 0) {
        console.warn('No API keys found to export');
        return false;
    }

    let envContent = '# Auto-generated API keys from CRM integration settings\n';
    envContent += `# Generated at: ${new Date().toISOString()}\n\n`;

    if (keys.openai) {
        envContent += `OPENAI_API_KEY="${keys.openai}"\n`;
        envContent += `VANGUARD_OPENAI_KEY="${keys.openai}"\n`;
    }

    if (keys.googleMaps) {
        envContent += `GOOGLE_MAPS_API_KEY="${keys.googleMaps}"\n`;
    }

    if (keys.sendgrid) {
        envContent += `SENDGRID_API_KEY="${keys.sendgrid}"\n`;
    }

    if (keys.voip) {
        envContent += `VOIP_PROVIDER="${keys.voip.provider}"\n`;
        envContent += `VOIP_ACCOUNT_SID="${keys.voip.accountSid}"\n`;
        envContent += `VOIP_AUTH_TOKEN="${keys.voip.authToken}"\n`;
        if (keys.voip.phoneNumber) {
            envContent += `VOIP_PHONE_NUMBER="${keys.voip.phoneNumber}"\n`;
        }
    }

    // Send to backend endpoint to write .env file
    fetch('/api/update-environment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ envContent })
    })
    .then(response => {
        if (response.ok) {
            console.log('✅ Environment variables updated successfully');
            return true;
        } else {
            console.error('Failed to update environment variables');
            return false;
        }
    })
    .catch(error => {
        console.error('Error updating environment:', error);
        return false;
    });
}

/**
 * Initialize API key synchronization
 * Call this when API keys are saved in the CRM
 */
function syncAPIKeys() {
    console.log('🔄 Syncing API keys from CRM to environment...');
    exportToEnvironment();
}

// Auto-sync when localStorage changes
if (typeof window !== 'undefined') {
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('integration_')) {
            console.log('API key changed, syncing...');
            syncAPIKeys();
        }
    });
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.getOpenAIKey = getOpenAIKey;
    window.getAllAPIKeys = getAllAPIKeys;
    window.exportToEnvironment = exportToEnvironment;
    window.syncAPIKeys = syncAPIKeys;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getOpenAIKey,
        getAllAPIKeys,
        exportToEnvironment,
        syncAPIKeys
    };
}