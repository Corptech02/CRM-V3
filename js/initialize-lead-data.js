// Initialize lead data with complete vehicle, trailer, and driver information
// This script ensures all commercial auto leads have the proper data structure

(function() {
    console.log('Initializing comprehensive lead data...');
    
    // Define the complete lead data with all required fields
    const comprehensiveLeads = [
        {
            id: 1001,
            name: 'Swift Transport LLC',
            contact: 'Michael Johnson',
            phone: '(555) 100-4000',
            email: 'michael@swift.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 18000,
            
            // Company Information
            dotNumber: 'DOT1234567',
            mcNumber: 'MC987654',
            yearsInBusiness: 3,
            fleetSize: 5,
            
            // Operation Details
            radiusOfOperation: '500 miles',
            commodityHauled: 'General Freight, Refrigerated Goods',
            operatingStates: 'TX, LA, OK, NM, AR',
            
            // Vehicles
            vehicles: [
                { 
                    year: '2020', 
                    make: 'Freightliner', 
                    model: 'Cascadia', 
                    vin: 'VIN123456789', 
                    value: '$85,000', 
                    type: 'Semi Truck',
                    gvwr: '80,000 lbs'
                },
                { 
                    year: '2019', 
                    make: 'Volvo', 
                    model: 'VNL 760', 
                    vin: 'VIN234567890', 
                    value: '$75,000', 
                    type: 'Semi Truck',
                    gvwr: '80,000 lbs'
                },
                { 
                    year: '2021', 
                    make: 'Mack', 
                    model: 'Anthem', 
                    vin: 'VIN345678901', 
                    value: '$90,000', 
                    type: 'Semi Truck',
                    gvwr: '80,000 lbs'
                },
                { 
                    year: '2018', 
                    make: 'International', 
                    model: '4300', 
                    vin: 'VIN456789012', 
                    value: '$45,000', 
                    type: 'Box Truck',
                    gvwr: '26,000 lbs'
                },
                { 
                    year: '2020', 
                    make: 'Peterbilt', 
                    model: '579', 
                    vin: 'VIN567890123', 
                    value: '$95,000', 
                    type: 'Semi Truck',
                    gvwr: '80,000 lbs'
                }
            ],
            
            // Trailers
            trailers: [
                { 
                    year: '2018', 
                    make: 'Great Dane', 
                    type: 'Dry Van 53ft', 
                    vin: 'TVIN123456', 
                    value: '$25,000',
                    length: '53 feet'
                },
                { 
                    year: '2019', 
                    make: 'Utility', 
                    type: 'Refrigerated', 
                    vin: 'TVIN234567', 
                    value: '$45,000',
                    length: '48 feet'
                },
                { 
                    year: '2020', 
                    make: 'Wabash', 
                    type: 'Flatbed', 
                    vin: 'TVIN345678', 
                    value: '$30,000',
                    length: '48 feet'
                }
            ],
            
            // Drivers
            drivers: [
                { 
                    name: 'John Smith', 
                    license: 'TX123456789', 
                    cdlType: 'Class A', 
                    dob: '1980-05-15', 
                    experience: '10 years',
                    mvr: 'Clean',
                    endorsements: 'Hazmat, Tanker, Doubles/Triples',
                    violations: 'None in past 3 years'
                },
                { 
                    name: 'Mike Wilson', 
                    license: 'TX234567890', 
                    cdlType: 'Class A', 
                    dob: '1975-08-22', 
                    experience: '15 years',
                    mvr: 'Clean',
                    endorsements: 'Hazmat, Tanker',
                    violations: '1 minor speeding (2021)'
                },
                { 
                    name: 'Robert Davis', 
                    license: 'TX345678901', 
                    cdlType: 'Class A', 
                    dob: '1982-03-10', 
                    experience: '8 years',
                    mvr: 'Minor Violations',
                    endorsements: 'None',
                    violations: '2 minor violations (2022)'
                }
            ],
            
            // Call Transcript
            transcriptText: `Vicidial Call Transcript - Date: ${new Date().toLocaleDateString()}
Agent: Good morning, this is regarding your commercial auto insurance inquiry.
Client: Yes, we're Swift Transport. We have 5 trucks that need coverage.
Agent: I see. Can you tell me about your operation?
Client: We run regional routes, mostly Texas and surrounding states. We haul general freight and some refrigerated goods.
Agent: What's your typical radius of operation?
Client: About 500 miles from our home base in Houston.
Agent: And your safety record?
Client: We've had a clean record for the past 2 years. All our drivers have CDL Class A with various endorsements.
Agent: Great. What kind of coverage limits are you looking for?
Client: We need at least $1 million liability, cargo coverage, and physical damage for all vehicles.
Agent: I can definitely help with that. Let me gather some more information about your fleet...`,
            
            notes: 'HOT LEAD - Regional trucking company with good safety record. 5 trucks, 3 trailers, 3 drivers. Looking for comprehensive coverage.'
        },
        {
            id: 1002,
            name: 'Premier Logistics Inc',
            contact: 'Sarah Williams',
            phone: '(555) 101-4001',
            email: 'sarah@premier.com',
            product: 'Commercial Fleet',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 20000,
            
            dotNumber: 'DOT1234568',
            mcNumber: 'MC987655',
            yearsInBusiness: 4,
            fleetSize: 7,
            
            radiusOfOperation: '750 miles',
            commodityHauled: 'Electronics, Household Goods, General Freight',
            operatingStates: 'CA, NV, AZ, OR, WA',
            
            vehicles: [
                { year: '2020', make: 'Peterbilt', model: '579', vin: 'VIN456789012', value: '$95,000', type: 'Semi Truck', gvwr: '80,000 lbs' },
                { year: '2021', make: 'Kenworth', model: 'T680', vin: 'VIN567890123', value: '$105,000', type: 'Semi Truck', gvwr: '80,000 lbs' },
                { year: '2019', make: 'International', model: 'LT', vin: 'VIN678901234', value: '$80,000', type: 'Semi Truck', gvwr: '80,000 lbs' },
                { year: '2022', make: 'Freightliner', model: 'Cascadia', vin: 'VIN789012345', value: '$110,000', type: 'Semi Truck', gvwr: '80,000 lbs' }
            ],
            
            trailers: [
                { year: '2020', make: 'Wabash', type: 'Dry Van 53ft', vin: 'TVIN345678', value: '$30,000', length: '53 feet' },
                { year: '2021', make: 'Great Dane', type: 'Flatbed', vin: 'TVIN456789', value: '$35,000', length: '48 feet' },
                { year: '2019', make: 'Utility', type: 'Refrigerated', vin: 'TVIN567890', value: '$50,000', length: '53 feet' }
            ],
            
            drivers: [
                { name: 'Carlos Rodriguez', license: 'CA123456789', cdlType: 'Class A', dob: '1979-09-12', experience: '14 years', mvr: 'Clean', endorsements: 'Hazmat, Tanker', violations: 'None' },
                { name: 'Lisa Anderson', license: 'CA234567890', cdlType: 'Class A', dob: '1983-04-28', experience: '7 years', mvr: 'Clean', endorsements: 'Doubles/Triples', violations: 'None' },
                { name: 'David Thompson', license: 'CA345678901', cdlType: 'Class B', dob: '1985-07-18', experience: '5 years', mvr: 'Clean', endorsements: 'None', violations: 'None' }
            ],
            
            transcriptText: 'West Coast operations, excellent safety record, looking for fleet coverage with cargo insurance.',
            
            notes: 'Growing logistics company, West Coast operations, strong safety culture'
        },
        {
            id: 1003,
            name: 'Eagle Trucking Co',
            contact: 'Robert Davis',
            phone: '(555) 102-4002',
            email: 'robert@eagle.com',
            product: 'Commercial Fleet',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 22000,
            
            dotNumber: 'DOT1234569',
            mcNumber: 'MC987656',
            yearsInBusiness: 5,
            fleetSize: 9,
            
            radiusOfOperation: '1000 miles',
            commodityHauled: 'Steel, Construction Materials, Heavy Equipment',
            operatingStates: 'FL, GA, AL, SC, NC, TN',
            
            vehicles: [
                { year: '2021', make: 'Volvo', model: 'VNL 860', vin: 'VIN890123456', value: '$120,000', type: 'Semi Truck', gvwr: '80,000 lbs' },
                { year: '2020', make: 'Mack', model: 'Pinnacle', vin: 'VIN901234567', value: '$100,000', type: 'Semi Truck', gvwr: '80,000 lbs' },
                { year: '2019', make: 'Peterbilt', model: '389', vin: 'VIN012345678', value: '$85,000', type: 'Semi Truck', gvwr: '80,000 lbs' }
            ],
            
            trailers: [
                { year: '2020', make: 'Stoughton', type: 'Flatbed', vin: 'TVIN678901', value: '$28,000', length: '48 feet' },
                { year: '2021', make: 'Hyundai', type: 'Dry Van 53ft', vin: 'TVIN789012', value: '$32,000', length: '53 feet' }
            ],
            
            drivers: [
                { name: 'James Johnson', license: 'FL123456789', cdlType: 'Class A', dob: '1977-12-05', experience: '16 years', mvr: 'Clean', endorsements: 'All', violations: 'None' },
                { name: 'Maria Garcia', license: 'FL234567890', cdlType: 'Class A', dob: '1983-04-28', experience: '7 years', mvr: 'Clean', endorsements: 'Hazmat', violations: 'None' }
            ],
            
            transcriptText: 'Southeast regional carrier specializing in construction materials and heavy equipment transport.',
            
            notes: 'Specialized in heavy haul, excellent safety record, Southeast operations'
        }
    ];
    
    // Get existing leads
    let existingLeads = [];
    try {
        existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    } catch (e) {
        console.error('Error parsing existing leads:', e);
    }
    
    // Update or add comprehensive leads
    comprehensiveLeads.forEach(newLead => {
        const existingIndex = existingLeads.findIndex(l => 
            l.name === newLead.name || l.phone === newLead.phone
        );
        
        if (existingIndex >= 0) {
            // Update existing lead with comprehensive data
            existingLeads[existingIndex] = {
                ...existingLeads[existingIndex],
                ...newLead,
                id: existingLeads[existingIndex].id // Keep original ID
            };
        } else {
            // Add new lead
            existingLeads.push(newLead);
        }
    });
    
    // Save updated leads
    localStorage.setItem('leads', JSON.stringify(existingLeads));
    
    console.log('✅ Lead data initialized with comprehensive vehicle, trailer, and driver information');
    
    // If we're on the leads page, refresh the view
    if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        if (window.loadLeadsView) {
            setTimeout(() => window.loadLeadsView(), 500);
        }
    }
})();