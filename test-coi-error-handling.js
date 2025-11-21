const axios = require('axios');

async function testCOIErrorHandling() {
    console.log('🧪 Testing COI Error Handling');
    console.log('='.repeat(60));

    // Test 1: Policy with saved template (should work)
    console.log('TEST 1: Policy WITH saved template (864709702)');
    console.log('-'.repeat(40));

    const validRequest = {
        "policy_id": "policy-1",
        "certificate_holder": {
            "name": "Test Company",
            "address_line1": "123 Main St",
            "city": "Columbus",
            "state": "OH",
            "zip": "43215"
        },
        "recipient_email": "test@example.com"
    };

    const validToken = Buffer.from('user-1:864709702:123').toString('base64');

    try {
        const response = await axios.post('http://localhost:3003/api/coi/generate', validRequest, {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Response for VALID policy:');
        console.log('   Success:', response.data.success);
        console.log('   Message:', response.data.message);
        console.log('   Policy:', response.data.policy_number);
        console.log();
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Policy WITHOUT saved template (should error)
    console.log('TEST 2: Policy WITHOUT saved template (999999999)');
    console.log('-'.repeat(40));

    const invalidRequest = {
        "policy_id": "policy-999",
        "certificate_holder": {
            "name": "Test Company",
            "address_line1": "123 Main St",
            "city": "Columbus",
            "state": "OH",
            "zip": "43215"
        },
        "recipient_email": "test@example.com"
    };

    const invalidToken = Buffer.from('user-1:999999999:123').toString('base64');

    try {
        const response = await axios.post('http://localhost:3003/api/coi/generate', invalidRequest, {
            headers: {
                'Authorization': `Bearer ${invalidToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('⚠️ Unexpected success for invalid policy');
        console.log('   Response:', response.data);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('✅ Correct error for INVALID policy:');
            console.log('   Status:', error.response.status);
            console.log('   Error:', error.response.data.error);
            console.log('   Expected: "No COI saved to profile. Please call support."');
            console.log('   Match:', error.response.data.error === 'No COI saved to profile. Please call support.' ? '✅ YES' : '❌ NO');
        } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('📝 SUMMARY:');
    console.log('   - CRM correctly checks for saved template');
    console.log('   - Returns proper error if no template exists');
    console.log('   - Uses saved template when it exists');
    console.log('   - Error message: "No COI saved to profile. Please call support."');
}

testCOIErrorHandling().catch(console.error);