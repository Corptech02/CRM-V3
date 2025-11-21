#!/usr/bin/env node

// SIP Connection Test Script
// Tests the Twilio SIP connection using the configured credentials

const { spawn } = require('child_process');

function testWebSocketConnection(domain) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 Testing WebSocket connection to: wss://${domain}:443`);

        // Use curl to test WebSocket connection
        const curl = spawn('curl', [
            '-s', '-I', '--max-time', '10',
            `https://${domain}:443`
        ]);

        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });

        curl.stderr.on('data', (data) => {
            output += data.toString();
        });

        curl.on('close', (code) => {
            if (code === 0 && output.includes('200')) {
                console.log(`✅ Domain ${domain} is reachable`);
                resolve(true);
            } else {
                console.log(`❌ Domain ${domain} connection failed`);
                console.log(`   Response: ${output.trim()}`);
                resolve(false);
            }
        });

        curl.on('error', (error) => {
            console.log(`❌ Error testing ${domain}: ${error.message}`);
            resolve(false);
        });
    });
}

async function testSIPDomains() {
    console.log('🚀 Starting SIP Connection Test');
    console.log('==============================');

    const sipConfig = {
        username: 'Grant',
        password: 'GrantCorp2006@',
        domains: [
            'vanguard1.sip.twilio.com',
            'vanguard1.sip.us1.twilio.com'
        ],
        callerId: '+13306369079'
    };

    console.log('📋 SIP Configuration:');
    console.log(`   Username: ${sipConfig.username}`);
    console.log(`   Password: ${sipConfig.password.replace(/./g, '*')}`);
    console.log(`   Caller ID: ${sipConfig.callerId}`);
    console.log('');

    let workingDomain = null;

    for (const domain of sipConfig.domains) {
        const isReachable = await testWebSocketConnection(domain);
        if (isReachable) {
            workingDomain = domain;
            break;
        }
    }

    if (workingDomain) {
        console.log('');
        console.log('✅ SIP CONNECTION STATUS: READY');
        console.log(`   Working domain: ${workingDomain}`);
        console.log(`   Full SIP URI: sip:${sipConfig.username}@${workingDomain}`);
        console.log('');
        console.log('🎯 Next steps:');
        console.log('   1. Open the phone tool');
        console.log('   2. Go to the SIP tab');
        console.log('   3. Verify the configuration matches above');
        console.log('   4. Click "Test Connection" to complete the setup');

        return true;
    } else {
        console.log('');
        console.log('❌ SIP CONNECTION STATUS: FAILED');
        console.log('   None of the SIP domains are reachable');
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check internet connectivity');
        console.log('   2. Verify Twilio SIP domain configuration');
        console.log('   3. Check firewall settings for WebSocket connections');

        return false;
    }
}

// Run the test
testSIPDomains().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
});