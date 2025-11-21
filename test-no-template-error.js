const axios = require('axios');

async function testNoTemplateError() {
    console.log('🧪 Testing: Valid Policy Number but NO Saved Template');
    console.log('='.repeat(60));

    // Use a valid token with a policy number that has no template
    const token = Buffer.from('user-1:999999999:123').toString('base64');

    const request = {
        "certificate_holder": {
            "name": "Test Company",
            "address_line1": "123 Main St",
            "city": "Columbus",
            "state": "OH",
            "zip": "43215"
        },
        "recipient_email": "test@example.com"
    };

    console.log('Request Details:');
    console.log('  Token (decoded):', Buffer.from(token, 'base64').toString());
    console.log('  Policy Number: 999999999 (no saved template)');
    console.log();

    try {
        const response = await axios.post('http://localhost:3003/api/coi/generate', request, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('❌ Unexpected success:', response.data);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('✅ CORRECT ERROR RESPONSE:');
            console.log('  Status:', error.response.status);
            console.log('  Error:', error.response.data.error);
            console.log();
            console.log('🎯 This is what the website will show:');
            console.log('  "' + error.response.data.error + '"');
        } else {
            console.log('❌ Wrong error:', error.response?.data || error.message);
        }
    }
}

testNoTemplateError().catch(console.error);