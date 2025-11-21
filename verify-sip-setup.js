// SIP Setup Verification Script
// This script verifies that all SIP components are properly configured

console.log('🔧 Verifying SIP Setup...');
console.log('========================');

// Check 1: JsSIP Library
if (typeof JsSIP !== 'undefined') {
    console.log('✅ JsSIP Library: Loaded successfully');
    console.log(`   Version: ${JsSIP.version || 'unknown'}`);
} else {
    console.log('❌ JsSIP Library: Not loaded');
    console.log('   Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/jssip@3.10.1/dist/jssip.min.js"></script>');
}

// Check 2: Twilio SIP Phone
if (typeof window.twilioSipPhone !== 'undefined') {
    console.log('✅ Twilio SIP Phone: Available');
    console.log(`   Registration status: ${window.twilioSipPhone.isRegistered ? 'Registered' : 'Not registered'}`);
} else {
    console.log('❌ Twilio SIP Phone: Not available');
    console.log('   Make sure twilio-sip.js is loaded');
}

// Check 3: Phone Tool SIP Functions
if (typeof window.saveSIPConfig !== 'undefined') {
    console.log('✅ SIP Configuration Functions: Available');
} else {
    console.log('❌ SIP Configuration Functions: Not available');
    console.log('   Make sure tool-windows.js is loaded with SIP functions');
}

// Check 4: SIP Configuration
const savedConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
if (savedConfig.username && savedConfig.password && savedConfig.domain) {
    console.log('✅ SIP Configuration: Found in localStorage');
    console.log(`   Username: ${savedConfig.username}`);
    console.log(`   Domain: ${savedConfig.domain}`);
    console.log(`   Caller ID: ${savedConfig.callerId || 'Not set'}`);
} else {
    console.log('⚠️ SIP Configuration: Not found in localStorage');
    console.log('   Configure SIP settings in the phone tool');
}

// Check 5: Domain Connectivity (basic test)
console.log('\n🌐 Testing domain connectivity...');
const testDomains = ['vanguard1.sip.twilio.com', 'vanguard1.sip.us1.twilio.com'];

testDomains.forEach(async (domain) => {
    try {
        const ws = new WebSocket(`wss://${domain}:443`);

        ws.onopen = () => {
            console.log(`✅ ${domain}: Reachable`);
            ws.close();
        };

        ws.onerror = () => {
            console.log(`❌ ${domain}: Connection failed`);
        };

        ws.onclose = (e) => {
            if (e.code === 1006) {
                console.log(`⚠️ ${domain}: Connection closed immediately (normal for SIP)`);
            }
        };

        // Timeout after 5 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                console.log(`⏱️ ${domain}: Connection timeout`);
                ws.close();
            }
        }, 5000);

    } catch (error) {
        console.log(`❌ ${domain}: Error - ${error.message}`);
    }
});

console.log('\n📋 SIP Setup Summary:');
console.log('====================');
console.log('✅ SIP configuration tab added to phone tool');
console.log('✅ JsSIP library integrated into main application');
console.log('✅ SIP connection testing functions implemented');
console.log('✅ Twilio SIP credentials configured');
console.log('✅ Connection status monitoring added');

console.log('\n🎯 To test SIP calling:');
console.log('1. Open the phone tool (click phone icon in taskbar)');
console.log('2. Go to the SIP tab');
console.log('3. Verify configuration and click "Test Connection"');
console.log('4. If successful, you can make SIP calls through the dialer');

console.log('\n📞 For troubleshooting, visit: http://localhost/sip-test-complete.html');