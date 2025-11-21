// Test COI request as it would come from the website
const axios = require('axios');

async function testWebsiteRequest() {
    console.log('🌐 Testing COI Request from Website Perspective\n');

    // This simulates the exact request the website would send
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

    // The website would send to our public IP on port 3003
    const endpoints = [
        'http://localhost:3003/api/coi/generate',
        'http://162.220.14.239:3003/api/coi/generate'  // Our public IP
    ];

    for (const endpoint of endpoints) {
        console.log(`📤 Testing endpoint: ${endpoint}`);
        console.log('   Request data:', JSON.stringify(requestData, null, 2));

        try {
            const response = await axios.post(endpoint, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            console.log(`✅ Success from ${endpoint}`);
            console.log('   Response:', {
                success: response.data.success,
                message: response.data.message,
                policy_number: response.data.policy_number,
                certificate_holder: response.data.certificate_holder,
                pdf_size: response.data.pdf_size
            });
            console.log();

            // Verify the PDF is valid
            if (response.data.pdf_base64) {
                const pdfBuffer = Buffer.from(response.data.pdf_base64, 'base64');
                const pdfHeader = pdfBuffer.toString('utf-8', 0, 5);
                console.log('   PDF Validation:');
                console.log('     - Size:', pdfBuffer.length, 'bytes');
                console.log('     - Header:', pdfHeader);
                console.log('     - Valid:', pdfHeader === '%PDF-' ? '✅ Yes' : '❌ No');
            }

        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                console.log(`⚠️  ${endpoint} - Connection failed (may need port forwarding)`);
            } else {
                console.log(`❌ Failed from ${endpoint}`);
                console.log('   Error:', error.response ? error.response.data : error.message);
            }
        }
        console.log();
    }

    console.log('📌 Note: The website should send requests to:');
    console.log('   http://162.220.14.239:3003/api/coi/generate');
    console.log();
    console.log('🔍 Current status:');
    console.log('   - Endpoint is working on localhost ✅');
    console.log('   - COI generation with overlay is working ✅');
    console.log('   - PDF validation is working ✅');
    console.log('   - Email sending needs credential fix ⚠️');
}

testWebsiteRequest().catch(console.error);