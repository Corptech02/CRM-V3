// Simple test to verify the policy save functionality works
console.log('Testing policy save API...');

const testPolicyData = {
    id: 'test-policy-' + Date.now(),
    policyNumber: 'TEST-POL-123',
    carrier: 'GEICO',
    policyType: 'commercial-auto',
    premium: '16937',
    effectiveDate: '2025-01-07',
    expirationDate: '2026-01-07',
    vehicles: [
        {
            vehicleNumber: 1,
            year: '2022',
            make: 'DODGE',
            model: 'RAM 3500',
            vin: '15774'
        },
        {
            vehicleNumber: 2,
            year: '2024',
            make: 'Utility',
            model: 'Gooseneck Trailer',
            vin: '49190'
        }
    ],
    drivers: [
        {
            driverNumber: 1,
            name: 'STANLEY CYRIL ONONOGBO',
            age: '52',
            licenseNumber: 'OH123456'
        }
    ],
    coverages: {
        liability: '$1,000,000',
        generalAggregate: '$2,000,000',
        cargoDeductible: '2500'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

async function testApiSave() {
    const API_URL = 'http://162-220-14-239.nip.io:3001';

    try {
        console.log('Sending test policy data:', testPolicyData);

        const response = await fetch(`${API_URL}/api/policies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPolicyData)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Policy saved successfully:', result);

            // Now test fetching it back
            const fetchResponse = await fetch(`${API_URL}/api/policies`);
            const policies = await fetchResponse.json();
            console.log('📋 All policies:', policies);

            // Find our test policy
            const ourPolicy = policies.find(p => p.policyNumber === 'TEST-POL-123');
            if (ourPolicy) {
                console.log('✅ Test policy found in database:', ourPolicy);
                console.log('🚗 Vehicles saved:', ourPolicy.vehicles?.length || 0);
                console.log('👥 Drivers saved:', ourPolicy.drivers?.length || 0);
                console.log('🛡️ Coverages saved:', Object.keys(ourPolicy.coverages || {}).length);
            } else {
                console.log('❌ Test policy not found in database');
            }

        } else {
            const errorText = await response.text();
            console.error('❌ API save failed:', response.status, errorText);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testApiSave();