// Add AL'S TOWING LLC Policy to CRM
console.log('🏢 Adding AL\'S TOWING LLC policy to CRM...');

function addAlsTowingPolicy() {
    // Generate unique policy ID
    const policyId = 'POL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

    const newPolicy = {
        id: policyId,
        policyNumber: '6146786114',
        clientName: 'AL\'S TOWING LLC',
        carrierName: 'PROGRESSIVE',
        effectiveDate: '2/15/2025',
        expirationDate: '2/15/2026',
        premium: 14725.00,
        assignedTo: 'Grant',
        status: 'in-force',
        policyType: 'Commercial Auto',
        address: {
            street: '701 Kintner Pkwy',
            city: 'Sunbury',
            state: 'OH',
            zip: '43074'
        },
        phone: '614-678-6114',
        email: 'rick@alstowingwesterville.com',
        drivers: [
            {
                id: 'driver1',
                name: 'RICK LANGLEY',
                dob: '**/**/1965',
                licenseNumber: 'OH123456789',
                experience: '25+ years',
                status: 'Active',
                relation: 'Owner/Operator'
            },
            {
                id: 'driver2',
                name: 'TRACEY LANGLEY',
                dob: '**/**/1967',
                licenseNumber: 'OH987654321',
                experience: '20+ years',
                status: 'Active',
                relation: 'Co-Owner'
            },
            {
                id: 'driver3',
                name: 'BRANT CAMPBELL',
                dob: '**/**/1997',
                licenseNumber: 'OH456789123',
                experience: '5 years',
                status: 'Active',
                relation: 'Employee'
            }
        ],
        vehicles: [
            {
                id: 'trailer1',
                year: '2020',
                make: 'MAXEY',
                model: 'Trailer',
                type: 'Trailer',
                vin: '5R8GF3425LM069847',
                comprehensive: {
                    deductible: 1000,
                    premium: 129.00
                },
                collision: {
                    deductible: 1000,
                    premium: 203.00
                },
                bodilyInjuryPD: {
                    limits: '$1 million CSL',
                    premium: 125.00
                },
                uninsuredMotorist: {
                    limits: 'Not applicable to trailers',
                    premium: 0.00
                },
                totalPremium: 457.00
            },
            {
                id: 'trailer2',
                year: '2020',
                make: 'SUNDOWNER',
                model: 'Trailer',
                type: 'Trailer',
                vin: '13SCG4839L1CA3845',
                comprehensive: {
                    deductible: 2500,
                    premium: 176.00
                },
                collision: {
                    deductible: 2500,
                    premium: 268.00
                },
                bodilyInjuryPD: {
                    limits: '$1 million CSL',
                    premium: 125.00
                },
                uninsuredMotorist: {
                    limits: 'Not applicable to trailers',
                    premium: 0.00
                },
                totalPremium: 569.00
            },
            {
                id: 'trailer3',
                year: '2022',
                make: 'BRAVO',
                model: 'Trailer',
                type: 'Trailer',
                vin: '542BE2422NB037715',
                comprehensive: {
                    deductible: 2500,
                    premium: 105.00
                },
                collision: {
                    deductible: 2500,
                    premium: 286.00
                },
                bodilyInjuryPD: {
                    limits: '$1 million CSL',
                    premium: 348.00
                },
                uninsuredMotorist: {
                    limits: 'Not applicable to trailers',
                    premium: 0.00
                },
                totalPremium: 739.00
            },
            {
                id: 'trailer4',
                year: '2018',
                make: 'SUNDOWNER',
                model: 'Trailer',
                type: 'Trailer',
                vin: '13SCG4833J1CA1778',
                comprehensive: {
                    deductible: 2500,
                    premium: 133.00
                },
                collision: {
                    deductible: 2500,
                    premium: 213.00
                },
                bodilyInjuryPD: {
                    limits: '$1 million CSL',
                    premium: 125.00
                },
                uninsuredMotorist: {
                    limits: 'Not applicable to trailers',
                    premium: 0.00
                },
                totalPremium: 471.00
            },
            {
                id: 'vehicle5',
                year: '2024',
                make: 'RAM',
                model: '3500',
                type: 'Power Unit',
                vin: '3C63RRKL9RG174079',
                comprehensive: {
                    deductible: 2500,
                    premium: 1228.00
                },
                collision: {
                    deductible: 2500,
                    premium: 2210.00
                },
                bodilyInjuryPD: {
                    limits: '$1 million CSL',
                    premium: 7036.00
                },
                uninsuredMotorist: {
                    limits: '$100k CSL',
                    premium: 194.00
                },
                medicalPayments: {
                    limits: '$5,000 per person',
                    premium: 112.00
                },
                roadsideAssistance: {
                    limits: 'Selected w/ $0 Deductible',
                    premium: 12.00
                },
                totalPremium: 10792.00
            }
        ],
        coverages: {
            motorTruckCargo: {
                limits: '$150k',
                deductible: 2500,
                premium: 1697.00,
                description: 'Motor Truck Cargo Coverage'
            },
            bodilyInjuryPD: {
                limits: '$1 million CSL',
                description: 'Bodily Injury and Property Damage Liability'
            },
            uninsuredMotorist: {
                limits: '$100k CSL',
                description: 'Uninsured/Underinsured Motorist Bodily Injury'
            },
            medicalPayments: {
                limits: '$5,000 per person',
                description: 'Medical Payments Coverage'
            },
            roadsideAssistance: {
                limits: 'Selected w/ $0 Deductible',
                description: 'Roadside Assistance Coverage'
            }
        },
        premiumBreakdown: {
            motorTruckCargo: 1697.00,
            trailer1: 457.00,
            trailer2: 569.00,
            trailer3: 739.00,
            trailer4: 471.00,
            vehicle5: 10792.00,
            fees: 0.00,
            totalPremium: 14725.00
        },
        financialInfo: {
            currentBalance: 10715.77,
            lastPayment: {
                date: '01/01/2026',
                amount: -1342.09
            },
            nextPayment: {
                date: '02/01/2026',
                amount: 1342.09
            },
            paymentSchedule: 'Monthly EFT'
        },
        documents: [
            {
                type: 'Policy Documents',
                description: 'Primary policy documentation'
            },
            {
                type: 'Federal Operating Authority',
                description: 'DOT Authority documentation'
            },
            {
                type: 'MCS90',
                description: 'Motor Carrier Safety filing'
            }
        ],
        filings: [
            'Federal Operating Authority',
            'MCS90'
        ],
        business: {
            type: 'Corporation or LLC / Non-Profit',
            name: 'AL\'S TOWING LLC',
            classification: 'Auto Hauler',
            usdotNumber: '1086431',
            operatingRadius: 'Local and Interstate',
            businessDescription: 'Towing and recovery services'
        },
        notes: [
            {
                date: '2025-02-15',
                author: 'Grant',
                type: 'Policy Setup',
                content: 'Initial policy setup completed. All vehicles and drivers added to coverage.'
            },
            {
                date: '2025-02-15',
                author: 'Grant',
                type: 'Coverage Note',
                content: 'Motor Truck Cargo coverage set at $150k with $2,500 deductible per client request.'
            },
            {
                date: '2025-02-15',
                author: 'Grant',
                type: 'Payment',
                content: 'Monthly EFT payment schedule established. Current balance: $10,715.77'
            }
        ],
        additionalInfo: {
            namedAdditionalInsureds: [],
            namedWaiversOfSubrogation: [],
            blanketEndorsements: 'As required by written contract',
            discounts: [
                'Electronic Funds Transfer (EFT) discount'
            ]
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
            console.log('⚠️ AL\'S TOWING LLC policy already exists:', existingPolicy.id);
            return false;
        }

        // Add new policy
        policies.push(newPolicy);

        // Save back to localStorage
        localStorage.setItem('insurance_policies', JSON.stringify(policies));

        console.log('✅ Successfully added AL\'S TOWING LLC policy');
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
        console.error('❌ Error adding AL\'S TOWING LLC policy:', error);
        return false;
    }
}

// Add the policy when this script loads
setTimeout(() => {
    if (addAlsTowingPolicy()) {
        console.log('🎉 AL\'S TOWING LLC policy has been successfully added to the CRM!');
    }
}, 1000);

// Make function available globally for manual execution
window.addAlsTowingPolicy = addAlsTowingPolicy;

console.log('✅ AL\'S TOWING policy script loaded - use window.addAlsTowingPolicy() to add manually');