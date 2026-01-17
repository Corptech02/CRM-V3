// Test the policy save fix
console.log('Testing policy save fix...');

const API_URL = 'http://162-220-14-239.nip.io:3001';

const testPolicy = {
    id: 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), // Generated ID format
    policyNumber: 'FIX-TEST-001',
    carrier: 'Test Carrier',
    policyType: 'commercial-auto',
    premium: '8500',
    effectiveDate: '2025-01-10',
    expirationDate: '2026-01-10',
    vehicles: [
        {
            vehicleNumber: 1,
            year: '2021',
            make: 'TEST',
            model: 'VEHICLE',
            vin: 'TEST123'
        }
    ],
    drivers: [
        {
            driverNumber: 1,
            name: 'TEST DRIVER',
            age: '40'
        }
    ],
    coverages: {
        liability: '$1,500,000'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

async function testPolicySaveFix() {
    console.log('\n🧪 Testing policy save fix...');
    console.log('Test policy ID:', testPolicy.id);
    console.log('Expected behavior: Should use POST method (not PUT)');

    try {
        const response = await fetch(`${API_URL}/api/policies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPolicy)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Policy save successful:', result);

            // Verify it's in the database
            const checkResponse = await fetch(`${API_URL}/api/policies`);
            const allPolicies = await checkResponse.json();
            const foundPolicy = allPolicies.find(p => p.policyNumber === 'FIX-TEST-001');

            if (foundPolicy) {
                console.log('✅ Policy found in database');
                console.log('Database ID:', foundPolicy.id);
                console.log('Vehicles count:', foundPolicy.vehicles ? foundPolicy.vehicles.length : 0);
                console.log('Drivers count:', foundPolicy.drivers ? foundPolicy.drivers.length : 0);
            } else {
                console.log('❌ Policy not found in database');
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Policy save failed:', errorText);
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testPolicySaveFix();