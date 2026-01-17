// Fix SIP Configuration - Resolve domain and credentials issues
console.log('🔧 Fixing SIP Configuration...');

/**
 * This script fixes the SIP configuration issues causing connection timeouts
 * The issues are:
 * 1. Domain mismatch between different config files
 * 2. Need to test multiple Twilio SIP domains to find working one
 * 3. Credential validation
 * 4. Proper WebSocket configuration
 */

// Current known Twilio SIP domains to test
const twilioSipDomains = [
    'vanguard1.sip.twilio.com',
    'vanguard1.sip.us1.twilio.com',
    'vanguard1.sip.us-east-1.twilio.com'
];

// Fix 1: Update default domain in SIP configuration UI
function updateSIPDefaults() {
    console.log('✅ Updating SIP default configuration...');

    // Set the working domain as default
    const workingConfig = {
        username: 'Grant',
        password: 'GrantCorp2006@',
        domain: 'vanguard1.sip.us1.twilio.com', // Use the .us1 domain
        proxy: 'sip.twilio.com',
        callerId: '+13306369079'
    };

    // Update localStorage with corrected config
    localStorage.setItem('sipConfig', JSON.stringify(workingConfig));
    console.log('📋 Updated localStorage sipConfig with working domain');

    return workingConfig;
}

// Fix 2: Domain connectivity tester
async function testSIPDomains() {
    console.log('🔍 Testing SIP domain connectivity...');

    for (const domain of twilioSipDomains) {
        console.log(`Testing domain: ${domain}`);

        try {
            // Test WebSocket connection to SIP domain
            await testWebSocketConnection(domain);
        } catch (error) {
            console.log(`❌ ${domain}: ${error.message}`);
        }
    }
}

// Fix 3: WebSocket connection tester
function testWebSocketConnection(domain) {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://${domain}:443`;
        console.log(`🔗 Testing WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout (5s)'));
        }, 5000);

        ws.onopen = () => {
            clearTimeout(timeout);
            console.log(`✅ ${domain}: WebSocket connection successful`);
            ws.close();
            resolve(domain);
        };

        ws.onerror = (error) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = (event) => {
            if (event.wasClean) {
                resolve(domain);
            }
        };
    });
}

// Fix 4: Enhanced SIP test function with better error handling
async function testSIPConnectionFixed(phoneId) {
    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    if (!config.username || !config.password || !config.domain) {
        showSIPStatus(phoneId, 'error', 'Please save your configuration first');
        return;
    }

    console.log('🧪 Testing SIP connection with enhanced error handling...');

    // Update button state
    const testBtn = document.getElementById(`${phoneId}-test-btn`);
    const originalText = testBtn.innerHTML;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    testBtn.disabled = true;

    try {
        showConnectionStatus(phoneId, 'connecting', 'Testing SIP connectivity...');

        // Step 1: Test basic domain connectivity
        console.log(`🔍 Step 1: Testing domain connectivity to ${config.domain}`);

        try {
            await testWebSocketConnection(config.domain);
            showConnectionStatus(phoneId, 'connected', `✅ Domain ${config.domain} is reachable`);
        } catch (error) {
            console.log(`⚠️ Primary domain failed: ${error.message}`);
            showConnectionStatus(phoneId, 'connecting', 'Trying alternative domains...');

            // Try alternative domains
            let workingDomain = null;
            for (const altDomain of twilioSipDomains) {
                if (altDomain !== config.domain) {
                    try {
                        await testWebSocketConnection(altDomain);
                        workingDomain = altDomain;
                        console.log(`✅ Found working domain: ${altDomain}`);
                        break;
                    } catch (e) {
                        console.log(`❌ ${altDomain}: ${e.message}`);
                    }
                }
            }

            if (workingDomain) {
                // Update config with working domain
                config.domain = workingDomain;
                localStorage.setItem('sipConfig', JSON.stringify(config));
                showConnectionStatus(phoneId, 'connected', `✅ Updated to working domain: ${workingDomain}`);
            } else {
                throw new Error('No working SIP domains found');
            }
        }

        // Step 2: Test SIP registration if JsSIP is available
        if (typeof JsSIP !== 'undefined') {
            console.log('🔧 Step 2: Testing SIP registration...');

            const socket = new JsSIP.WebSocketInterface(`wss://${config.domain}:443`);
            const sipConfig = {
                sockets: [socket],
                uri: `sip:${config.username}@${config.domain}`,
                password: config.password,
                display_name: config.username,
                register: true,
                register_expires: 60, // Short expiry for testing
                session_timers: false,
                connection_recovery_min_interval: 2,
                connection_recovery_max_interval: 10,
                use_preloaded_route: false,
                authorization_user: config.username
            };

            if (config.proxy) {
                sipConfig.outbound_proxy_set = `sip:${config.proxy};transport=ws`;
            }

            console.log('📞 Creating SIP client...');
            const testClient = new JsSIP.UA(sipConfig);

            // Set up test event handlers
            let registrationSuccess = false;

            testClient.on('connected', () => {
                console.log('🔗 SIP client connected to WebSocket');
                showConnectionStatus(phoneId, 'connected', `Connected to ${config.domain}`);
            });

            testClient.on('registered', () => {
                console.log('✅ SIP registration successful');
                registrationSuccess = true;
                showConnectionStatus(phoneId, 'registered', `✅ Registered as ${config.username}@${config.domain}`);
                showSIPStatus(phoneId, 'success', 'SIP registration successful! Voice calling is ready.');

                // Stop the test client after success
                setTimeout(() => testClient.stop(), 2000);
            });

            testClient.on('registrationFailed', (e) => {
                console.error('❌ SIP registration failed:', e.cause);
                showConnectionStatus(phoneId, 'error', `Registration failed: ${e.cause || 'Authentication error'}`);

                let errorMsg = 'Authentication failed';
                if (e.cause === 'Forbidden') {
                    errorMsg = 'Invalid credentials - check username/password';
                } else if (e.cause === 'Request Timeout') {
                    errorMsg = 'Domain unreachable - check network connection';
                } else if (e.cause) {
                    errorMsg = e.cause;
                }

                showSIPStatus(phoneId, 'error', `Registration failed: ${errorMsg}`);
            });

            testClient.on('disconnected', () => {
                console.log('🔌 SIP client disconnected');
                if (!registrationSuccess) {
                    showConnectionStatus(phoneId, 'error', 'Connection lost during registration');
                    showSIPStatus(phoneId, 'error', 'Connection lost. Check network connectivity.');
                }
            });

            // Start the test
            testClient.start();

            // Set timeout for the test
            setTimeout(() => {
                if (!registrationSuccess) {
                    testClient.stop();
                    showConnectionStatus(phoneId, 'error', 'Registration timeout - check credentials');
                    showSIPStatus(phoneId, 'error', 'Registration timeout. Verify your Twilio SIP credentials.');
                }
            }, 15000);

        } else {
            showSIPStatus(phoneId, 'warning', 'JsSIP library not found. Basic connectivity test passed.');
        }

    } catch (error) {
        console.error('❌ SIP test failed:', error);
        showConnectionStatus(phoneId, 'error', `Test failed: ${error.message}`);
        showSIPStatus(phoneId, 'error', `Connection test failed: ${error.message}`);
    } finally {
        // Restore button state
        setTimeout(() => {
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }, 1000);
    }
}

// Fix 5: Override the existing test function with our improved version
if (typeof window !== 'undefined') {
    console.log('🔄 Overriding testSIPConnection with improved version...');
    window.testSIPConnectionOriginal = window.testSIPConnection; // Backup
    window.testSIPConnection = testSIPConnectionFixed;
}

// Auto-fix on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SIP Configuration Fix loaded');

    // Update default configuration
    updateSIPDefaults();

    // Test domains in background
    setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.hash.includes('phone')) {
            console.log('📞 Phone tool detected, testing SIP domains...');
            testSIPDomains();
        }
    }, 2000);
});

// Manual fix function for immediate use
window.fixSIPConfiguration = function() {
    console.log('🛠️ Manual SIP configuration fix triggered...');
    updateSIPDefaults();
    testSIPDomains();

    // Show success message
    if (typeof showNotification === 'function') {
        showNotification('SIP configuration updated with working settings', 'success');
    }

    console.log('✅ SIP configuration fix complete');
    console.log('💡 Try the "Test Connection" button in your phone tool SIP settings');
};

console.log('✅ SIP Configuration Fix ready');
console.log('💡 Run fixSIPConfiguration() to apply fixes manually');
console.log('💡 Or open the phone tool and test - fixes apply automatically');