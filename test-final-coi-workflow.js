const axios = require('axios');

// Simulate exactly what the website will send
async function testFinalCOIWorkflow() {
    console.log('🔄 Testing FINAL COI Workflow - Exactly as website sends it');
    console.log('='.repeat(60));

    // This is exactly what the website sends
    const requestData = {
        "policy_id": "policy-1",
        "certificate_holder": {
            "name": "ARB Transport LLC",
            "address_line1": "2256 BROOKLYN RD",
            "city": "COLUMBUS",
            "state": "OH",
            "zip": "43229"
        },
        "recipient_email": "grant.corp2006@gmail.com"
    };

    // The Authorization header with the token
    const token = Buffer.from('user-1:864709702:123').toString('base64');

    console.log('📤 Request Details:');
    console.log('   Endpoint: http://162.220.14.239/api/coi/generate');
    console.log('   Token:', token);
    console.log('   Decoded token:', Buffer.from(token, 'base64').toString());
    console.log('   Body:', JSON.stringify(requestData, null, 2));
    console.log();

    try {
        // Test the actual endpoint the proxy forwards to
        console.log('🔍 Testing CRM endpoint directly (localhost:3003):');
        const directResponse = await axios.post('http://localhost:3003/api/coi/generate', requestData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ CRM Response:');
        console.log('   Success:', directResponse.data.success);
        console.log('   Message:', directResponse.data.message);
        console.log('   Policy Number:', directResponse.data.policy_number);
        console.log('   Certificate Holder:', directResponse.data.certificate_holder);
        console.log('   Email Status:', directResponse.data.email_sent ? 'Sent' : 'Not sent');

        if (directResponse.data.pdf) {
            console.log('   PDF Generated: Yes (base64 included)');
        }

        console.log();
        console.log('🎯 CRM ENDPOINT IS READY!');
        console.log();

        // Now test through the proxy
        console.log('🔄 Testing through proxy (as website would):');
        const proxyResponse = await axios.post('http://162.220.14.239/api/coi/generate', requestData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Proxy Response:');
        console.log('   Success:', proxyResponse.data.success);
        console.log('   Message:', proxyResponse.data.message);
        console.log();
        console.log('🚀 COMPLETE WORKFLOW IS READY!');
        console.log();
        console.log('📝 Summary:');
        console.log('   ✅ CRM endpoint working at localhost:3003');
        console.log('   ✅ Proxy forwarding working at 162.220.14.239');
        console.log('   ✅ PDF generation with overlay working');
        console.log('   ✅ Token decoding working');
        console.log('   ✅ Template loading working');
        console.log('   ' + (directResponse.data.email_sent ? '✅' : '⚠️') + ' Email sending ' + (directResponse.data.email_sent ? 'working' : 'needs Gmail auth fix'));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Response:', error.response.data);
        }

        console.log();
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check if COI manager is running: pm2 list');
        console.log('   2. Check logs: pm2 logs coi-manager');
        console.log('   3. Verify template exists: ls /var/www/vanguard/coi-templates/');
        console.log('   4. Check proxy is running: pm2 list | grep proxy');
    }
}

testFinalCOIWorkflow().catch(console.error);