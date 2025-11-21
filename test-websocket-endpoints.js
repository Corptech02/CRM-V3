// WebSocket Connection Test
// This tests different Twilio SIP WebSocket endpoints

console.log('🧪 Testing WebSocket Endpoints...');
console.log('================================');

const domains = [
    'vanguard1.sip.twilio.com',
    'vanguard1.sip.us1.twilio.com',
    'vanguard1.sip.us-east-1.twilio.com'
];

const paths = ['', '/ws', '/websocket', '/sip'];
const ports = [443, 80];

let testCount = 0;
let totalTests = domains.length * paths.length * ports.length;

domains.forEach(domain => {
    paths.forEach(path => {
        ports.forEach(port => {
            testCount++;
            const protocol = port === 443 ? 'wss' : 'ws';
            const url = `${protocol}://${domain}:${port}${path}`;

            console.log(`[${testCount}/${totalTests}] Testing: ${url}`);

            const ws = new WebSocket(url);

            const timeout = setTimeout(() => {
                ws.close();
                console.log(`   ⏱️ Timeout: ${url}`);
            }, 5000);

            ws.onopen = () => {
                clearTimeout(timeout);
                console.log(`   ✅ SUCCESS: ${url}`);
                ws.close();

                // If we find a working endpoint, test SIP with it
                testSIPWithWorkingEndpoint(url, domain);
            };

            ws.onerror = (error) => {
                clearTimeout(timeout);
                console.log(`   ❌ FAILED: ${url}`);
            };

            ws.onclose = (e) => {
                clearTimeout(timeout);
                if (e.code === 1006) {
                    console.log(`   ⚠️ Connection closed immediately: ${url} (might be normal)`);
                }
            };
        });
    });
});

async function testSIPWithWorkingEndpoint(wsUrl, domain) {
    console.log(`\n🎯 Found working endpoint: ${wsUrl}`);
    console.log('🔧 Testing SIP registration with this endpoint...');

    const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    try {
        // Extract the working WebSocket URL format
        const socket = new JsSIP.WebSocketInterface(wsUrl);

        const testConfig = {
            sockets: [socket],
            uri: `sip:${sipConfig.username}@${domain}`,
            password: sipConfig.password,
            display_name: sipConfig.username,
            register: true,
            register_expires: 600,
            authorization_user: sipConfig.username,
            session_timers: false
        };

        const testClient = new JsSIP.UA(testConfig);

        testClient.on('connected', () => {
            console.log('✅ SIP WebSocket connected with working endpoint!');
        });

        testClient.on('registered', () => {
            console.log('🎉 SIP REGISTRATION SUCCESSFUL!');
            console.log(`📋 Working configuration found:`);
            console.log(`   WebSocket URL: ${wsUrl}`);
            console.log(`   SIP Domain: ${domain}`);
            console.log('');
            console.log('💡 Update your SIP configuration to use this endpoint!');

            // Stop the test client
            testClient.stop();
        });

        testClient.on('registrationFailed', (e) => {
            console.error(`❌ SIP registration failed with ${wsUrl}:`, e.cause);
        });

        testClient.start();

    } catch (error) {
        console.error('❌ Error testing SIP with working endpoint:', error);
    }
}

console.log('\n⏳ Running tests... This may take up to 30 seconds...');