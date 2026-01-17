// Mock Twilio Voice API for testing until real credentials are configured
console.log('🧪 Loading mock Twilio Voice API for testing...');

// Override the Voice API calling function with a mock version
window.makeTwilioVoiceAPICallDirect = async function(phoneNumber) {
    console.log(`📞 MOCK: Making Twilio Voice API call to ${phoneNumber}...`);

    try {
        // Format the phone number
        const formattedNumber = phoneNumber.replace(/\D/g, '');
        const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;

        // Get caller ID from SIP config
        const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
        const callerId = sipConfig.callerId || '+13306369079';

        console.log(`📞 MOCK: Calling ${e164Number} from ${callerId}...`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if real Twilio endpoint exists first
        try {
            const testResponse = await fetch('/api/twilio/make-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: e164Number,
                    from: callerId,
                    test: true // Add test flag
                })
            });

            if (testResponse.ok) {
                const data = await testResponse.json();
                console.log('✅ Real Twilio API response:', data);

                if (data.success) {
                    showNotification(`Call initiated to ${phoneNumber} via Twilio Voice API`, 'success');
                    return {
                        success: true,
                        method: 'voice_api_real',
                        callSid: data.callSid || data.sid,
                        message: 'Call initiated via Twilio Voice API'
                    };
                } else {
                    throw new Error(data.error || 'Twilio API call failed');
                }
            }
        } catch (apiError) {
            console.log('⚠️ Real Twilio API not available, using mock response...');

            // Return mock successful response
            const mockCallSid = `MOCK_${Date.now()}`;

            showNotification(`MOCK: Call would be initiated to ${phoneNumber}`, 'info');
            console.log(`✅ MOCK: Call initiated with SID: ${mockCallSid}`);

            // Show additional mock info
            setTimeout(() => {
                showNotification('Configure real Twilio credentials to enable actual calling', 'warning');
            }, 2000);

            // Save to call history
            if (typeof saveCallToHistory === 'function') {
                saveCallToHistory({
                    number: phoneNumber,
                    name: (typeof getContactName === 'function' ? getContactName(phoneNumber) : null) || 'Unknown',
                    type: 'outgoing',
                    time: new Date().toISOString(),
                    duration: '',
                    callId: mockCallSid
                });
            }

            return {
                success: true,
                method: 'voice_api_mock',
                callSid: mockCallSid,
                message: 'Mock call - configure Twilio credentials for real calls'
            };
        }

    } catch (error) {
        console.error('❌ MOCK: Call simulation failed:', error);
        showNotification(`MOCK: Call failed - ${error.message}`, 'error');

        throw new Error(`Mock call failed: ${error.message}`);
    }
};

// Show helpful setup message
function showTwilioSetupReminder() {
    const setupMessage = `
🔧 Twilio Voice API Setup Required

Your phone system is ready, but needs Twilio credentials:

1. Get your Twilio Account SID and Auth Token from:
   https://console.twilio.com

2. Configure them by running:
   ./configure-twilio-credentials.sh

3. Restart the backend:
   pm2 restart vanguard-backend

Until then, calls will show as "MOCK" for testing.
    `.trim();

    console.log(setupMessage);

    // Show one-time notification
    if (!sessionStorage.getItem('twilio_setup_shown')) {
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('Phone calls ready - configure Twilio credentials for real calling', 'info');
            }
            sessionStorage.setItem('twilio_setup_shown', 'true');
        }, 3000);
    }
}

// Initialize mock system
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        showTwilioSetupReminder();
        console.log('📞 Mock Twilio Voice API ready for testing');
    }, 2000);
});

// Test function for manual testing
window.testMockCall = function() {
    console.log('🧪 Testing mock call function...');
    return makeTwilioVoiceAPICallDirect('+15551234567');
};

console.log('✅ Mock Twilio Voice API loaded for testing');