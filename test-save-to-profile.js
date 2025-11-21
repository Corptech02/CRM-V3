// Test Save to Profile functionality
const testSaveToProfile = async () => {
    console.log('🧪 Testing Save to Profile functionality');

    // Create test policy data
    const testPolicy = {
        policyNumber: 'a-vino',
        clientName: 'Test Client',
        carrier: 'Test Carrier',
        policyType: 'general-liability',
        effectiveDate: '2024-01-01',
        expirationDate: '2025-01-01',
        coverageLimit: '1000000',
        address: '123 Test St, Test City, TX 12345'
    };

    // Create test PDF content
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test COI for policy a-vino) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000203 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
344
%%EOF`;

    // Convert to base64
    const base64PDF = btoa(pdfContent);

    // Prepare upload payload
    const uploadPayload = {
        policy_number: 'a-vino',
        pdf_base64: base64PDF,
        filename: `COI_a-vino_${Date.now()}.pdf`,
        uploaded_by: "CRM System"
    };

    console.log('📡 Uploading test COI to website backend...');
    console.log('Payload:', {
        policy_number: uploadPayload.policy_number,
        filename: uploadPayload.filename,
        pdf_size: base64PDF.length
    });

    try {
        const response = await fetch('http://162.220.14.239:8888/api/coi/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadPayload)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Test COI saved successfully!');
            console.log('Response:', result);
            console.log('\n📋 Next steps:');
            console.log('1. Log into website: http://162.220.14.239:8888/pages/login.html');
            console.log('2. Credentials: a-vino / 1111');
            console.log('3. Click "Email COI" button on dashboard');
            console.log('4. Fill in certificate holder info');
            console.log('5. Submit - it should use the saved COI + add overlay + email it!');
        } else {
            console.error('❌ Failed to save test COI:', result);
        }
    } catch (error) {
        console.error('❌ Error uploading test COI:', error);
    }
};

// Run the test
testSaveToProfile();
