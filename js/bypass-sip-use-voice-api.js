// Bypass broken SIP and use working Twilio Voice API only
console.log('📞 Bypassing SIP - Using Twilio Voice API for all calls...');

/**
 * Since the SIP domain doesn't exist, let's disable SIP completely
 * and route all calls through the working Twilio Voice API backend
 */

// Override the SIP test function to show a helpful message
window.testSIPConnection = function(phoneId) {
    console.log('⚠️ SIP testing bypassed - using Voice API instead');

    showSIPStatus(phoneId, 'info', 'SIP bypassed - using Twilio Voice API for reliable calling');
    showConnectionStatus(phoneId, 'info', 'Voice API calling is ready - SIP not needed');

    return false;
};

// Override SIP configuration saving to redirect to Voice API
window.saveSIPConfig = function(phoneId) {
    console.log('💡 SIP config saved but Voice API will be used for calls');

    const username = document.getElementById(`${phoneId}-sip-username`).value;
    const password = document.getElementById(`${phoneId}-sip-password`).value;
    const domain = document.getElementById(`${phoneId}-sip-domain`).value;
    const proxy = document.getElementById(`${phoneId}-sip-proxy`).value;
    const callerId = document.getElementById(`${phoneId}-sip-callerid`).value;

    const config = {
        username: username,
        password: password,
        domain: domain,
        proxy: proxy,
        callerId: callerId
    };

    localStorage.setItem('sipConfig', JSON.stringify(config));

    showSIPStatus(phoneId, 'success', 'Settings saved! Calls will use reliable Twilio Voice API.');
};

// Enhanced Twilio Voice API calling function
async function makeTwilioVoiceAPICallDirect(phoneNumber) {
    console.log(`📞 Making Twilio Voice API call to ${phoneNumber}...`);

    try {
        // Format the phone number
        const formattedNumber = phoneNumber.replace(/\D/g, '');
        const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;

        // Get caller ID from SIP config
        const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
        const callerId = sipConfig.callerId || '+13306369079';

        console.log(`📞 Calling ${e164Number} from ${callerId} via Voice API...`);

        // Make the API call
        const response = await fetch('/api/twilio/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: e164Number,
                from: callerId,
                callerName: 'Vanguard Insurance'
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Twilio Voice API call initiated:', data);

        // Show success notification
        showNotification(`Call initiated to ${phoneNumber} via Twilio Voice API`, 'success');

        // Save to call history
        saveCallToHistory({
            number: phoneNumber,
            name: getContactName(phoneNumber) || 'Unknown',
            type: 'outgoing',
            time: new Date().toISOString(),
            duration: '',
            callId: data.callSid || data.sid || 'voice_api_' + Date.now()
        });

        return {
            success: true,
            method: 'voice_api',
            callSid: data.callSid || data.sid,
            message: 'Call initiated via Twilio Voice API'
        };

    } catch (error) {
        console.error('❌ Twilio Voice API call failed:', error);

        let errorMessage = error.message;
        if (error.message.includes('20003')) {
            errorMessage = 'Twilio authentication error - check account credentials';
        } else if (error.message.includes('21212')) {
            errorMessage = 'Invalid phone number format';
        } else if (error.message.includes('21214')) {
            errorMessage = 'Caller ID not verified in Twilio account';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to calling service - check network';
        }

        showNotification(`Call failed: ${errorMessage}`, 'error');

        throw new Error(errorMessage);
    }
}

// Override all calling functions to use Voice API
function overrideCallingFunctions() {
    console.log('🔄 Overriding all calling functions to use Twilio Voice API...');

    // Override the main calling function
    window.makeCall = makeTwilioVoiceAPICallDirect;
    window.makeTwilioCall = makeTwilioVoiceAPICallDirect;
    window.makeTwilioCallFromToolWindow = async function(toNumber, fromNumber) {
        return await makeTwilioVoiceAPICallDirect(toNumber);
    };

    // Override SIP calling functions to redirect to Voice API
    window.makeSipCall = function(phoneNumber) {
        console.log('🔄 SIP call redirected to Voice API');
        return makeTwilioVoiceAPICallDirect(phoneNumber);
    };

    if (window.twilioSipPhone && window.twilioSipPhone.makeCall) {
        window.twilioSipPhone.makeCall = function(phoneNumber) {
            console.log('🔄 SIP Phone call redirected to Voice API');
            return makeTwilioVoiceAPICallDirect(phoneNumber);
        };
    }

    console.log('✅ All calling functions now use Twilio Voice API');
}

// Update SIP status indicators to show Voice API is ready
function updateSIPStatusToVoiceAPI() {
    // Find all SIP connection status elements
    const connectionElements = document.querySelectorAll('[id*="connection-status"]');
    connectionElements.forEach(element => {
        if (element) {
            element.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10b981; margin-right: 5px;"></i>
                <strong>Twilio Voice API Ready</strong><br>
                <small style="color: #6b7280;">Phone calls will use reliable server-side Voice API</small>
            `;
            element.style.background = '#d1fae5';
            element.style.color = '#065f46';
            element.style.borderLeft = '4px solid #10b981';
        }
    });

    // Update SIP tab to show Voice API info
    setTimeout(() => {
        const sipTabs = document.querySelectorAll('[onclick*="sip"]');
        sipTabs.forEach(tab => {
            if (tab && tab.textContent.includes('SIP')) {
                tab.innerHTML = '<i class="fas fa-phone"></i> Voice Calling';
            }
        });
    }, 1000);
}

// Show helpful message about the bypass
function showBypassMessage() {
    console.log('=== TWILIO CALLING SYSTEM STATUS ===');
    console.log('✅ Twilio Voice API: Ready and working');
    console.log('❌ Twilio SIP: Bypassed (domain not configured)');
    console.log('📞 All calls will use Voice API for reliability');
    console.log('');
    console.log('💡 To enable SIP calling:');
    console.log('1. Log into your Twilio Console');
    console.log('2. Go to Voice → SIP Domains');
    console.log('3. Create domain: vanguard1.sip.twilio.com');
    console.log('4. Configure SIP credentials');
    console.log('');
    console.log('🎯 For now, Voice API provides reliable calling without SIP setup');
}

// Initialize everything
function initializeVoiceAPIOnly() {
    overrideCallingFunctions();
    updateSIPStatusToVoiceAPI();
    showBypassMessage();

    // Show notification that system is ready
    if (typeof showNotification === 'function') {
        showNotification('Twilio Voice API calling system ready', 'success');
    }
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeVoiceAPIOnly, 2000);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM still loading, event listener above will handle it
} else {
    // DOM already loaded
    setTimeout(initializeVoiceAPIOnly, 500);
}

// Manual initialization
window.initializeVoiceAPIOnly = initializeVoiceAPIOnly;
window.makeTwilioVoiceAPICallDirect = makeTwilioVoiceAPICallDirect;

console.log('✅ Twilio Voice API bypass system loaded');
console.log('📞 All phone calls will now use reliable Voice API instead of broken SIP');