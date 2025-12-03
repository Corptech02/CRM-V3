// Load Vicidial SALE leads into Vanguard Insurance Software
console.log('Loading Vicidial leads into system...');

(function() {
    // The 3 actual SALE leads from Vicidial with full transcripts
    const vicidialLeads = [
        {
            // Lead 1: HOGGIN DA LANES LLC
            id: '43554',
            name: 'HOGGIN DA LANES LLC',
            contact: 'DAMIEN ROBERTS',
            phone: '(216) 633-9985',
            email: 'DROBERTS@HOGGINDALANES.COM',
            product: 'Commercial Auto',
            stage: 'qualified',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: '09/17/2025',
            premium: 20400, // $1700/month x 12
            
            // Company Information
            dotNumber: '3766606',
            mcNumber: '',
            yearsInBusiness: '3-6',
            fleetSize: '1',
            
            // Address
            address: '',
            city: 'GARFIELD HTS',
            state: 'OH',
            zip: '44105',
            
            // Operations
            radiusOfOperation: '300-500 miles',
            commodityHauled: 'Refrigerated/Reefer - Groceries, Frozen Food',
            operatingStates: ['OH', 'GA'],
            annualRevenue: '',
            safetyRating: 'Satisfactory',
            
            // Insurance Info
            currentCarrier: 'PROGRESSIVE PREFERRED INSURANCE CO.',
            currentPremium: '$1,700/month ($20,400/year)',
            quotedPremium: '$1,500/month ($18,000/year)',
            coverageTypes: [
                'Liability: $1,000,000',
                'Aggregate: $2,000,000', 
                'Cargo: $100,000',
                'Trailer Interchange: $50,000',
                'Reefer Breakdown Coverage'
            ],
            
            // Vehicles
            vehicles: [
                {
                    unit: 'Truck 1',
                    year: '2000',
                    make: 'Freightliner',
                    model: 'Century',
                    vin: '',
                    value: '',
                    type: 'Reefer Truck'
                }
            ],
            trailers: [
                {
                    unit: 'Trailer 1',
                    year: '',
                    make: '',
                    model: 'Refrigerated',
                    value: '$50,000',
                    type: 'Reefer'
                }
            ],
            drivers: [
                {
                    name: 'Damien Roberts',
                    cdl: 'Yes - 10+ years',
                    experience: '10+ years',
                    violations: 'None recent'
                }
            ],
            
            // Lead Scoring
            leadScore: 95,
            priority: 'high',
            status: 'hot_lead',
            
            // Source
            source: 'Vicidial List 1005',
            listId: '1005',
            vicidialLeadId: '43554',
            
            // Notes from conversation
            notes: 'SALE from Vicidial. Current Progressive customer paying $1,700/month for 1 reefer truck. Quoted $1,500/month. 10+ years CDL experience. Operates within 300 miles 80% of time. No violations. Parks on Lee Road in Cleveland. Interested in switching due to high Progressive rates.',
            
            // Transcript available
            hasTranscript: true,
            hasRecording: true,
            recordingUrl: 'http://204.13.233.29/RECORDINGS/MP3/20250902-173215_2166339985-all.mp3',
            
            insuranceHistory: 'Continuous coverage with Progressive 3-6 years',
            previousClaims: 'None mentioned'
        },
        {
            // Lead 2: CHARLES V MUMFORD JR
            id: '43635',
            name: 'CHARLES V MUMFORD JR / MUMFORD FARMS',
            contact: 'CHARLES MUMFORD',
            phone: '(937) 308-0727',
            email: 'MUMFORDFARMS@AOL.COM',
            product: 'Commercial Auto',
            stage: 'qualified',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: '09/26/2025',
            premium: 0,
            
            // Company Information
            dotNumber: '2070567',
            mcNumber: '',
            yearsInBusiness: 'Since 1957 (67+ years family business)',
            fleetSize: '1',
            
            // Address
            address: '',
            city: 'CASSTOWN',
            state: 'OH',
            zip: '',
            
            // Operations
            radiusOfOperation: '300-400 miles (80% of time), up to 600 miles',
            commodityHauled: 'Livestock',
            operatingStates: ['OH', 'IN', 'MI', 'KY'],
            annualRevenue: '70,000-100,000 miles/year',
            safetyRating: 'Satisfactory',
            
            // Insurance Info
            currentCarrier: 'PROGRESSIVE PREFERRED INSURANCE CO.',
            currentPremium: 'Not disclosed',
            coverageTypes: ['Commercial Auto', 'General Liability', 'Cargo'],
            
            // Vehicles
            vehicles: [
                {
                    unit: 'Truck 1',
                    year: '2018',
                    make: 'Peterbilt',
                    model: '579',
                    vin: '',
                    value: '',
                    type: 'Semi Truck'
                }
            ],
            trailers: [
                {
                    unit: 'Trailer 1',
                    year: '2014',
                    make: 'Wilson',
                    model: 'Livestock Trailer',
                    value: '',
                    type: 'Livestock Semi Trailer'
                }
            ],
            drivers: [
                {
                    name: 'Charles Mumford',
                    cdl: 'Yes - Since 1981 (43+ years)',
                    experience: '4-5 million miles, 45-60 years trucking',
                    violations: 'None mentioned'
                }
            ],
            
            // Lead Scoring
            leadScore: 90,
            priority: 'high',
            status: 'hot_lead',
            
            // Source
            source: 'Vicidial List 1005',
            listId: '1005',
            vicidialLeadId: '43635',
            
            // Notes
            notes: 'SALE from Vicidial. Family trucking business since 1957. Livestock hauling specialist. CDL since 1981. Farms and trucks. Been with Progressive long-term but concerned about rates. Mentioned deer strikes covered well by Progressive. Interested in comparing rates.',
            
            // Transcript available
            hasTranscript: true,
            hasRecording: true,
            recordingUrl: 'http://204.13.233.29/RECORDINGS/MP3/20250902-172131_9373080727-all.mp3',
            
            insuranceHistory: 'Long-term Progressive customer, good claims experience with deer strikes',
            previousClaims: 'Deer strikes (covered by Progressive)'
        },
        {
            // Lead 3: KENN TRANSPORT LLC
            id: '43923',
            name: 'KENN TRANSPORT LLC',
            contact: 'MELVIN KENNEDY',
            phone: '(817) 542-8635',
            email: 'dispatch@kenntransport.com',
            product: 'Commercial Auto',
            stage: 'qualified',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: '09/19/2025',
            premium: 10000,
            
            // Company Information
            dotNumber: '4105341',
            mcNumber: '',
            yearsInBusiness: '',
            fleetSize: '4',
            
            // Address
            address: '',
            city: 'FORNEY',
            state: 'TX',
            zip: '',
            
            // Operations
            radiusOfOperation: '500 miles',
            commodityHauled: 'General Freight',
            operatingStates: ['TX', 'OK', 'LA', 'AR', 'NM'],
            annualRevenue: '',
            safetyRating: 'Satisfactory',
            
            // Insurance Info
            currentCarrier: 'PROGRESSIVE COUNTY MUTUAL',
            currentPremium: '$10,000',
            coverageTypes: ['Commercial Auto', 'General Liability', 'Cargo: $100,000'],
            
            // Vehicles
            vehicles: [
                {
                    unit: 'Truck 1',
                    year: '',
                    make: 'Unknown',
                    model: 'Semi',
                    vin: '',
                    value: ''
                },
                {
                    unit: 'Truck 2',
                    year: '',
                    make: 'Unknown',
                    model: 'Semi',
                    vin: '',
                    value: ''
                },
                {
                    unit: 'Truck 3',
                    year: '',
                    make: 'Unknown',
                    model: 'Semi',
                    vin: '',
                    value: ''
                },
                {
                    unit: 'Truck 4',
                    year: '',
                    make: 'Unknown',
                    model: 'Semi',
                    vin: '',
                    value: ''
                }
            ],
            trailers: [
                {
                    unit: 'Trailer 1',
                    year: '',
                    make: 'Unknown',
                    model: '53\' Dry Van',
                    value: ''
                },
                {
                    unit: 'Trailer 2',
                    year: '',
                    make: 'Unknown',
                    model: '53\' Dry Van',
                    value: ''
                },
                {
                    unit: 'Trailer 3',
                    year: '',
                    make: 'Unknown',
                    model: '53\' Dry Van',
                    value: ''
                },
                {
                    unit: 'Trailer 4',
                    year: '',
                    make: 'Unknown',
                    model: '53\' Dry Van',
                    value: ''
                }
            ],
            drivers: [],
            
            // Lead Scoring
            leadScore: 92,
            priority: 'high',
            status: 'hot_lead',
            
            // Source
            source: 'Vicidial List 1006',
            listId: '1006',
            vicidialLeadId: '43923',
            
            // Notes
            notes: 'SALE from Vicidial List 1006. Comments: 10k premium, 4 trucks, 4 trailers. 100k cargo coverage.',
            
            // Transcript available
            hasTranscript: true,
            hasRecording: true,
            recordingUrl: 'http://204.13.233.29/RECORDINGS/MP3/20250902-193540_8175428635-all.mp3',
            
            insuranceHistory: 'Current Progressive County Mutual customer',
            previousClaims: ''
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(vicidialLeads));
    
    console.log('✅ Loaded 3 Vicidial SALE leads:');
    console.log('1. HOGGIN DA LANES LLC - Ohio - 1 reefer truck');
    console.log('2. CHARLES V MUMFORD JR - Ohio - 1 livestock truck');
    console.log('3. KENN TRANSPORT LLC - Texas - 4 trucks, 4 trailers');
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
    `;
    notification.innerHTML = '✅ Loaded 3 Vicidial SALE leads with full transcripts';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        // Refresh the view if on leads page - DISABLED to prevent duplicate tables
        // if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //     if (window.loadLeadsView) {
        //         window.loadLeadsView();
        //     }
        // }
    }, 3000);
})();