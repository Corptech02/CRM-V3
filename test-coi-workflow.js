// Test the complete COI workflow
const axios = require('axios');

async function testCOIWorkflow() {
    console.log('🧪 Testing Complete COI Workflow\n');

    // Simulate the request from the website
    const requestData = {
        policy_id: 'policy-1',
        certificate_holder: {
            name: 'ARB Transport LLC',
            address_line1: '2256 BROOKLYN RD',
            city: 'COLUMBUS',
            state: 'OH',
            zip: '43229'
        },
        recipient_email: 'grant.corp2006@gmail.com'
    };

    console.log('📤 Sending COI generation request...');
    console.log('   Policy ID:', requestData.policy_id);
    console.log('   Certificate Holder:', requestData.certificate_holder.name);
    console.log('   Recipient Email:', requestData.recipient_email);
    console.log();

    try {
        // Call the /api/coi/generate endpoint
        const response = await axios.post('http://localhost:3003/api/coi/generate', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Response received:');
        console.log('   Success:', response.data.success);
        console.log('   Message:', response.data.message);
        console.log('   Policy Number:', response.data.policy_number);
        console.log('   Certificate Holder:', response.data.certificate_holder);
        console.log('   Email Sent:', response.data.email_sent);
        console.log('   PDF Size:', response.data.pdf_size, 'bytes');

        if (response.data.pdf_base64) {
            console.log('   PDF Base64 Length:', response.data.pdf_base64.length);

            // Validate the PDF
            const pdfHeader = Buffer.from(response.data.pdf_base64, 'base64').toString('utf-8', 0, 5);
            console.log('   PDF Header:', pdfHeader);

            if (pdfHeader === '%PDF-') {
                console.log('   ✅ PDF is valid');
            } else {
                console.log('   ❌ PDF validation failed');
            }
        }

        console.log('\n✅ Complete workflow test successful!');

    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Also test with token
async function testWithToken() {
    console.log('\n🧪 Testing with Token Authentication\n');

    // Create a token (format: base64(userId:policyNumber:123))
    const tokenData = 'user123:864709702:123';
    const token = Buffer.from(tokenData).toString('base64');

    const requestData = {
        token: token,
        policy_id: 'policy-1',
        certificate_holder: {
            name: 'Test Company Inc',
            address_line1: '123 Test Street',
            city: 'New York',
            state: 'NY',
            zip: '10001'
        },
        recipient_email: 'grant.corp2006@gmail.com'
    };

    console.log('📤 Sending COI generation request with token...');
    console.log('   Token (encoded):', token);
    console.log('   Token (decoded):', tokenData);
    console.log('   Certificate Holder:', requestData.certificate_holder.name);
    console.log();

    try {
        const response = await axios.post('http://localhost:3003/api/coi/generate', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Response received:');
        console.log('   Success:', response.data.success);
        console.log('   Policy Number (from token):', response.data.policy_number);
        console.log('   Certificate Holder:', response.data.certificate_holder);
        console.log('   Email Sent:', response.data.email_sent);

        console.log('\n✅ Token-based workflow test successful!');

    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    }
}

// Run tests
async function runTests() {
    await testCOIWorkflow();
    await testWithToken();
}

runTests().catch(console.error);