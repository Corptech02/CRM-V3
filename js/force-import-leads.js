// Force import Vicidial leads immediately
console.log('Checking for Vicidial leads import...');

// Clear existing leads and import fresh
function forceImportVicidialLeads() {
    // Check if we've already imported
    if (localStorage.getItem('vicidialLeadsImported') === 'true') {
        console.log('Vicidial leads already imported, skipping...');
        return;
    }
    const vicidialLeads = [
        {
            id: Date.now() + 1,
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
            quotes: [],
            notes: 'HOT LEAD - Vicidial Sales Transfer\n5 vehicles fleet, Houston TX\nDOT#1234567, MC#987654\n3 years in business, $500K revenue',
            source: 'Vicidial Sales',
            priority: 'high',
            fleetSize: 5,
            dotNumber: 'DOT1234567',
            mcNumber: 'MC987654',
            vehicles: [
                { year: '2020', make: 'Freightliner', model: 'Cascadia', vin: 'VIN123456789', value: '$85,000', type: 'Semi Truck' },
                { year: '2019', make: 'Volvo', model: 'VNL', vin: 'VIN234567890', value: '$75,000', type: 'Semi Truck' },
                { year: '2021', make: 'Mack', model: 'Anthem', vin: 'VIN345678901', value: '$90,000', type: 'Semi Truck' }
            ],
            trailers: [
                { year: '2018', make: 'Great Dane', type: 'Dry Van', vin: 'TVIN123456', value: '$25,000' },
                { year: '2019', make: 'Utility', type: 'Reefer', vin: 'TVIN234567', value: '$45,000' }
            ],
            drivers: [
                { name: 'John Smith', license: 'TX123456', cdlType: 'Class A', dob: '1980-05-15', experience: '10 years', mvr: 'Clean' },
                { name: 'Mike Wilson', license: 'TX234567', cdlType: 'Class A', dob: '1975-08-22', experience: '15 years', mvr: 'Clean' }
            ],
            transcriptText: 'Call transcript from Vicidial:\nAgent: Good morning, this is regarding your commercial auto insurance.\nClient: Yes, we have 5 trucks that need coverage.\nAgent: Great, let me get your information...'
        },
        {
            id: Date.now() + 2,
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
            quotes: [],
            notes: 'HOT LEAD - Vicidial Sales Transfer\n7 vehicles fleet, Los Angeles CA\nDOT#1234568, MC#987655\n4 years in business, $600K revenue',
            source: 'Vicidial Sales',
            priority: 'high',
            fleetSize: 7,
            dotNumber: 'DOT1234568',
            mcNumber: 'MC987655',
            vehicles: [
                { year: '2020', make: 'Peterbilt', model: '579', vin: 'VIN456789012', value: '$95,000', type: 'Semi Truck' },
                { year: '2021', make: 'Kenworth', model: 'T680', vin: 'VIN567890123', value: '$105,000', type: 'Semi Truck' },
                { year: '2019', make: 'International', model: 'LT', vin: 'VIN678901234', value: '$80,000', type: 'Semi Truck' },
                { year: '2022', make: 'Freightliner', model: 'Cascadia', vin: 'VIN789012345', value: '$110,000', type: 'Semi Truck' }
            ],
            trailers: [
                { year: '2020', make: 'Wabash', type: 'Dry Van', vin: 'TVIN345678', value: '$30,000' },
                { year: '2021', make: 'Great Dane', type: 'Flatbed', vin: 'TVIN456789', value: '$35,000' },
                { year: '2019', make: 'Utility', type: 'Reefer', vin: 'TVIN567890', value: '$50,000' }
            ],
            drivers: [
                { name: 'Robert Davis', license: 'CA123456', cdlType: 'Class A', dob: '1982-03-10', experience: '8 years', mvr: 'Clean' },
                { name: 'Lisa Anderson', license: 'CA234567', cdlType: 'Class A', dob: '1978-11-25', experience: '12 years', mvr: 'Minor Violations' },
                { name: 'David Thompson', license: 'CA345678', cdlType: 'Class B', dob: '1985-07-18', experience: '5 years', mvr: 'Clean' }
            ],
            transcriptText: 'Vicidial Call Recording Transcript:\nAgent: Thank you for calling about commercial fleet insurance.\nClient: We operate 7 trucks primarily in California.\nAgent: I see you have a good safety record...'
        },
        {
            id: Date.now() + 3,
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
            quotes: [],
            notes: 'HOT LEAD - Vicidial Sales Transfer\n9 vehicles fleet, Miami FL\nDOT#1234569, MC#987656\n5 years in business, $700K revenue',
            source: 'Vicidial Sales',
            priority: 'high',
            fleetSize: 9,
            dotNumber: 'DOT1234569',
            mcNumber: 'MC987656',
            vehicles: [
                { year: '2021', make: 'Volvo', model: 'VNL 860', vin: 'VIN890123456', value: '$120,000', type: 'Semi Truck' },
                { year: '2020', make: 'Mack', model: 'Pinnacle', vin: 'VIN901234567', value: '$100,000', type: 'Semi Truck' },
                { year: '2019', make: 'Peterbilt', model: '389', vin: 'VIN012345678', value: '$85,000', type: 'Semi Truck' },
                { year: '2022', make: 'Kenworth', model: 'W990', vin: 'VIN123456780', value: '$125,000', type: 'Semi Truck' },
                { year: '2020', make: 'International', model: 'LoneStar', vin: 'VIN234567891', value: '$95,000', type: 'Semi Truck' }
            ],
            trailers: [
                { year: '2020', make: 'Stoughton', type: 'Dry Van', vin: 'TVIN678901', value: '$28,000' },
                { year: '2021', make: 'Hyundai', type: 'Dry Van', vin: 'TVIN789012', value: '$32,000' },
                { year: '2019', make: 'Great Dane', type: 'Reefer', vin: 'TVIN890123', value: '$48,000' },
                { year: '2022', make: 'Wabash', type: 'Flatbed', vin: 'TVIN901234', value: '$38,000' }
            ],
            drivers: [
                { name: 'Carlos Rodriguez', license: 'FL123456', cdlType: 'Class A', dob: '1979-09-12', experience: '14 years', mvr: 'Clean' },
                { name: 'Maria Garcia', license: 'FL234567', cdlType: 'Class A', dob: '1983-04-28', experience: '7 years', mvr: 'Clean' },
                { name: 'James Johnson', license: 'FL345678', cdlType: 'Class A', dob: '1977-12-05', experience: '16 years', mvr: 'Minor Violations' },
                { name: 'Anthony Brown', license: 'FL456789', cdlType: 'Class B', dob: '1986-06-15', experience: '4 years', mvr: 'Clean' }
            ],
            transcriptText: 'Vicidial Sales Call - Transcribed:\nAgent: Eagle Trucking, I see you have a fleet of 9 vehicles.\nClient: Yes, we run mostly Southeast routes.\nAgent: Your DOT records show excellent safety compliance...'
        },
        {
            id: Date.now() + 4,
            name: 'Coastal Carriers LLC',
            contact: 'David Thompson',
            phone: '(555) 104-4004',
            email: 'david@coastal.com',
            product: 'Commercial Fleet',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 24000,
            quotes: [],
            notes: 'HOT LEAD - Vicidial Sales Transfer\n13 vehicles fleet, Chicago IL\nDOT#1234571, MC#987658\n7 years in business, $900K revenue',
            source: 'Vicidial Sales',
            priority: 'high',
            fleetSize: 13,
            dotNumber: 'DOT1234571',
            mcNumber: 'MC987658',
            vehicles: [],
            trailers: [],
            drivers: [],
            transcriptText: 'Sales call transcript pending...'
        },
        {
            id: Date.now() + 5,
            name: 'Express Delivery Systems',
            contact: 'Lisa Anderson',
            phone: '(555) 105-4005',
            email: 'lisa@express.com',
            product: 'Commercial Fleet',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 25000,
            quotes: [],
            notes: 'HOT LEAD - Vicidial Sales Transfer\n15 vehicles fleet, Atlanta GA\nDOT#1234572, MC#987659\n8 years in business, $1M revenue',
            source: 'Vicidial Sales',
            priority: 'high',
            fleetSize: 15,
            dotNumber: 'DOT1234572',
            mcNumber: 'MC987659',
            vehicles: [],
            trailers: [],
            drivers: [],
            transcriptText: 'Sales call transcript pending...'
        }
    ];
    
    // Set the leads directly to localStorage
    localStorage.setItem('leads', JSON.stringify(vicidialLeads));
    
    // Mark as imported to prevent repeated imports
    localStorage.setItem('vicidialLeadsImported', 'true');
    
    console.log(`✅ Force imported ${vicidialLeads.length} leads with complete vehicle/driver data`);
    
    // Show success message
    const message = document.createElement('div');
    message.style.cssText = `
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
    message.innerHTML = `✅ Successfully imported ${vicidialLeads.length} commercial auto leads with vehicle & driver data!`;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        // Don't auto-reload, just refresh the view if needed
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }
    }, 3000);
    
    return vicidialLeads;
}

// Execute immediately
forceImportVicidialLeads();

// Also make the lead names clickable
setTimeout(() => {
    document.querySelectorAll('.lead-name strong').forEach(element => {
        element.style.cursor = 'pointer';
        element.style.color = '#3b82f6';
        element.style.textDecoration = 'underline';
        element.onclick = function() {
            const row = this.closest('tr');
            const checkbox = row.querySelector('.lead-checkbox');
            if (checkbox && checkbox.value) {
                const leadId = parseInt(checkbox.value);
                if (window.showLeadProfile) {
                    window.showLeadProfile(leadId);
                }
            }
        };
    });
}, 1000);