// Fixed SIP Configuration Test
console.log('🔧 Testing SIP with correct configuration...');

const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
console.log('Current config:', sipConfig);

if (!sipConfig.username) {
    console.error('❌ No SIP config found');
} else {
    // Create socket interface properly
    const socket = new JsSIP.WebSocketInterface(`wss://${sipConfig.domain}:443`);

    const testConfig = {
        sockets: [socket],  // This was missing!
        uri: `sip:${sipConfig.username}@${sipConfig.domain}`,
        password: sipConfig.password,
        display_name: sipConfig.username,
        register: true,
        register_expires: 600,
        authorization_user: sipConfig.username,
        session_timers: false,
        use_preloaded_route: false
    };

    console.log('✅ Creating SIP client with correct config...');
    const testClient = new JsSIP.UA(testConfig);

    testClient.on('connecting', () => console.log('🔗 SIP connecting...'));
    testClient.on('connected', () => console.log('✅ WebSocket connected'));
    testClient.on('registered', () => {
        console.log('🎉 SIP REGISTERED SUCCESSFULLY!');
        console.log(`📋 Ready to make calls as ${sipConfig.username}@${sipConfig.domain}`);
    });
    testClient.on('registrationFailed', (e) => {
        console.error('❌ Registration failed:', e.cause);
        console.error('   Status code:', e.response?.status_code);
        console.error('   Reason:', e.response?.reason_phrase);
    });

    console.log('🚀 Starting SIP client...');
    testClient.start();
}