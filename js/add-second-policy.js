// Add Second Test Policy to CRM - BLUE SKY LOGISTICS
console.log('🚛 Adding BLUE SKY LOGISTICS policy to CRM...');

function addBlueSkyPolicy() {
    // Generate unique policy ID
    const policyId = 'POL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

    const newPolicy = {
        id: policyId,
        policyNumber: '7405529876',
        clientName: 'BLUE SKY LOGISTICS INC',
        carrierName: 'STATE FARM',
        effectiveDate: '3/1/2025',
        expirationDate: '3/1/2026',
        premium: 8950.00,
        assignedTo: 'Grant',
        status: 'in-force',
        policyType: 'Commercial Auto',
        address: {
            street: '1425 Industrial Blvd',
            city: 'Columbus',
            state: 'OH',
            zip: '43228'
        },
        phone: '740-555-9876',
        email: 'contact@blueskylogistics.com',
        drivers: [
            {
                name: 'JAMES WILSON',
                dob: '**/**/1978'
            },
            {
                name: 'SARAH MARTINEZ',
                dob: '**/**/1985'
            },
            {
                name: 'DAVID CHEN',
                dob: '**/**/1990'
            }
        ],
        vehicles: [
            {
                year: '2021',
                make: 'FREIGHTLINER',
                model: 'CASCADIA',
                vin: '3AKJHHDR5MSLE9482',
                comprehensive: '1500',
                collision: '1500',
                premium: 3200.00
            },
            {
                year: '2019',
                make: 'UTILITY',
                model: 'Dry Van Trailer',
                vin: '1UYVS2536KL123456',
                comprehensive: '2000',
                collision: '2000',
                premium: 875.00
            },
            {
                year: '2022',
                make: 'VOLVO',
                model: 'VNL760',
                vin: '4V4NC9EH9NN123789',
                comprehensive: '1500',
                collision: '1500',
                premium: 3450.00
            },
            {
                year: '2020',
                make: 'UTILITY',
                model: 'Reefer Trailer',
                vin: '1UYVS2534LL987654',
                comprehensive: '2000',
                collision: '2000',
                premium: 1425.00
            }
        ],
        coverages: {
            motorTruckCargo: {
                limits: '100k',
                deductible: 1000,
                premium: 950.00
            },
            bodilyInjury: {
                limits: '1 million CSL'
            },
            uninsuredMotorist: {
                limits: '100k CSL'
            },
            medicalPayments: {
                limits: '10000 per person'
            }
        },
        business: {
            type: 'Corporation',
            name: 'BLUE SKY LOGISTICS INC',
            classification: 'Long Distance Freight',
            usdotNumber: '2468135'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        // Get current policies
        let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        console.log('📊 Current policies count:', policies.length);

        // Check if policy already exists (by client name)
        const existingPolicy = policies.find(p => p.clientName === newPolicy.clientName);
        if (existingPolicy) {
            console.log('⚠️ BLUE SKY LOGISTICS policy already exists:', existingPolicy.id);
            return false;
        }

        // Add new policy
        policies.push(newPolicy);

        // Save back to localStorage
        localStorage.setItem('insurance_policies', JSON.stringify(policies));

        console.log('✅ Successfully added BLUE SKY LOGISTICS policy');
        console.log('   Policy ID:', policyId);
        console.log('   Policy Number:', newPolicy.policyNumber);
        console.log('   Premium: $' + newPolicy.premium.toLocaleString());
        console.log('   Total policies now:', policies.length);

        // Trigger policy list refresh if function exists
        if (typeof window.loadPoliciesView === 'function') {
            console.log('🔄 Refreshing policies view...');
            window.loadPoliciesView();
        } else if (typeof window.refreshPolicyTable === 'function') {
            console.log('🔄 Refreshing policy table...');
            window.refreshPolicyTable();
        }

        return true;

    } catch (error) {
        console.error('❌ Error adding BLUE SKY LOGISTICS policy:', error);
        return false;
    }
}

// Add the policy when this script loads (with delay to avoid conflicts)
setTimeout(() => {
    if (addBlueSkyPolicy()) {
        console.log('🎉 BLUE SKY LOGISTICS policy has been successfully added to the CRM!');
    }
}, 2000);

// Make function available globally for manual execution
window.addBlueSkyPolicy = addBlueSkyPolicy;

console.log('✅ BLUE SKY LOGISTICS policy script loaded');