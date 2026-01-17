// Test creating multiple policies to ensure they don't replace each other
console.log('Testing multiple policy creation...');

const API_URL = 'http://162-220-14-239.nip.io:3001';

const testPolicies = [
    {
        policyNumber: 'TEST-001',
        carrier: 'GEICO',
        policyType: 'commercial-auto',
        premium: '5000',
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        vehicles: [
            {
                vehicleNumber: 1,
                year: '2020',
                make: 'FORD',
                model: 'F150',
                vin: 'ABC123'
            }
        ],
        drivers: [
            {
                driverNumber: 1,
                name: 'JOHN DOE',
                age: '35'
            }
        ],
        coverages: {
            liability: '$1,000,000'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        policyNumber: 'TEST-002',
        carrier: 'Progressive',
        policyType: 'commercial-auto',
        premium: '7500',
        effectiveDate: '2025-01-15',
        expirationDate: '2026-01-15',
        vehicles: [
            {
                vehicleNumber: 1,
                year: '2022',
                make: 'PETERBILT',
                model: '579',
                vin: 'DEF456'
            }
        ],
        drivers: [
            {
                driverNumber: 1,
                name: 'JANE SMITH',
                age: '42'
            }
        ],
        coverages: {
            liability: '$2,000,000'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        policyNumber: 'TEST-003',
        carrier: 'State Farm',
        policyType: 'commercial-auto',
        premium: '12000',
        effectiveDate: '2025-02-01',
        expirationDate: '2026-02-01',
        vehicles: [
            {
                vehicleNumber: 1,
                year: '2023',
                make: 'FREIGHTLINER',
                model: 'CASCADIA',
                vin: 'GHI789'
            }
        ],
        drivers: [
            {
                driverNumber: 1,
                name: 'MIKE JOHNSON',
                age: '50'
            }
        ],
        coverages: {
            liability: '$1,000,000',
            generalAggregate: '$2,000,000'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

async function testMultiplePolicies() {
    console.log('\n🧪 Starting multiple policy creation test...');

    const createdPolicies = [];

    // Create each policy
    for (let i = 0; i < testPolicies.length; i++) {
        const policy = testPolicies[i];
        console.log(`\n📋 Creating policy ${i + 1}: ${policy.policyNumber}`);

        try {
            const response = await fetch(`${API_URL}/api/policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(policy)
            });

            console.log(`Response status: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Policy ${policy.policyNumber} created successfully:`, result.id);
                createdPolicies.push(result);
            } else {
                const errorText = await response.text();
                console.error(`❌ Failed to create policy ${policy.policyNumber}:`, errorText);
            }
        } catch (error) {
            console.error(`❌ Error creating policy ${policy.policyNumber}:`, error);
        }
    }

    // Wait a moment then check what's in the database
    console.log('\n🔍 Checking database contents...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const response = await fetch(`${API_URL}/api/policies`);
        const allPolicies = await response.json();

        console.log(`\n📊 Total policies in database: ${allPolicies.length}`);

        allPolicies.forEach((policy, index) => {
            console.log(`Policy ${index + 1}:`);
            console.log(`  ID: ${policy.id}`);
            console.log(`  Policy Number: ${policy.policyNumber}`);
            console.log(`  Carrier: ${policy.carrier}`);
            console.log(`  Premium: ${policy.premium}`);
            console.log(`  Vehicles: ${policy.vehicles ? policy.vehicles.length : 0}`);
            console.log(`  Drivers: ${policy.drivers ? policy.drivers.length : 0}`);
        });

        // Check if all our test policies are present
        const testPolicyNumbers = testPolicies.map(p => p.policyNumber);
        const foundPolicyNumbers = allPolicies.map(p => p.policyNumber);

        console.log('\n✅ Test Results:');
        testPolicyNumbers.forEach(policyNumber => {
            if (foundPolicyNumbers.includes(policyNumber)) {
                console.log(`✅ ${policyNumber} found in database`);
            } else {
                console.log(`❌ ${policyNumber} NOT found in database`);
            }
        });

        if (allPolicies.length >= 3) {
            console.log('\n🎉 SUCCESS: Multiple policies created successfully!');
            console.log('✅ Policies are not replacing each other');
        } else {
            console.log('\n⚠️ WARNING: Expected at least 3 policies, but found:', allPolicies.length);
        }

    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
}

// Run the test
testMultiplePolicies();