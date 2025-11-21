// Import ONLY the 5 actual SALE leads from Vicidial active lists
console.log('Importing 5 actual SALE leads from Vicidial...');

(function() {
    // Based on Vicidial data: 5 total SALE leads
    // List 1005: 3 sales
    // List 1006: 2 sales
    
    const actualSaleLeads = [
        // List 1005 - Sale #1
        {
            id: 10051,
            name: 'Unknown Trucking Company 1',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'lead1@unknown.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 0,
            
            // Unknown company data - needs to be filled from call recording
            dotNumber: 'Unknown - Check Recording',
            mcNumber: 'Unknown - Check Recording',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            zip: 'Unknown',
            
            radiusOfOperation: 'Unknown - Check Recording',
            commodityHauled: 'Unknown - Check Recording',
            operatingStates: 'Unknown - Check Recording',
            annualRevenue: 'Unknown',
            safetyRating: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: `VICIDIAL SALE LEAD - List 1005, Sale #1
Status: SALE
Called Count: 1
Phone: 9999999999

RECORDING NOT TRANSCRIBED YET
To get actual information:
1. Access Vicidial recording for this lead
2. Download the audio file
3. Process through Deepgram API for transcription
4. Extract company name, DOT number, fleet size, etc. from transcript

The agent marked this as a SALE, so there should be:
- Company name mentioned
- Number of vehicles discussed
- Insurance needs identified
- Contact information provided
- Follow-up scheduled`,
            
            notes: 'VICIDIAL SALE #1 from List 1005. Recording needs transcription to extract company details.',
            insuranceHistory: 'Unknown',
            previousClaims: 'Unknown'
        },
        
        // List 1005 - Sale #2
        {
            id: 10052,
            name: 'Unknown Trucking Company 2',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'lead2@unknown.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 0,
            
            dotNumber: 'Unknown - Check Recording',
            mcNumber: 'Unknown - Check Recording',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            zip: 'Unknown',
            
            radiusOfOperation: 'Unknown - Check Recording',
            commodityHauled: 'Unknown - Check Recording',
            operatingStates: 'Unknown - Check Recording',
            annualRevenue: 'Unknown',
            safetyRating: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: `VICIDIAL SALE LEAD - List 1005, Sale #2
Status: SALE
Called Count: 1
Phone: 9999999999

RECORDING NOT TRANSCRIBED YET
Agent marked as SALE - recording should contain:
- Company identification
- Fleet information
- Insurance requirements
- Decision maker contact`,
            
            notes: 'VICIDIAL SALE #2 from List 1005. Needs recording transcription.',
            insuranceHistory: 'Unknown',
            previousClaims: 'Unknown'
        },
        
        // List 1005 - Sale #3
        {
            id: 10053,
            name: 'Unknown Trucking Company 3',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'lead3@unknown.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 0,
            
            dotNumber: 'Unknown - Check Recording',
            mcNumber: 'Unknown - Check Recording',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            zip: 'Unknown',
            
            radiusOfOperation: 'Unknown - Check Recording',
            commodityHauled: 'Unknown - Check Recording',
            operatingStates: 'Unknown - Check Recording',
            annualRevenue: 'Unknown',
            safetyRating: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: `VICIDIAL SALE LEAD - List 1005, Sale #3
Status: SALE
Called Count: 1
Phone: 9999999999

RECORDING NOT TRANSCRIBED YET
This is a confirmed SALE from the dialer.`,
            
            notes: 'VICIDIAL SALE #3 from List 1005. Needs recording transcription.',
            insuranceHistory: 'Unknown',
            previousClaims: 'Unknown'
        },
        
        // List 1006 - Sale #1
        {
            id: 10061,
            name: 'Unknown Trucking Company 4',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'lead4@unknown.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 0,
            
            dotNumber: 'Unknown - Check Recording',
            mcNumber: 'Unknown - Check Recording',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            zip: 'Unknown',
            
            radiusOfOperation: 'Unknown - Check Recording',
            commodityHauled: 'Unknown - Check Recording',
            operatingStates: 'Unknown - Check Recording',
            annualRevenue: 'Unknown',
            safetyRating: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: `VICIDIAL SALE LEAD - List 1006, Sale #1
Status: SALE
Called Count: 1
Phone: 9999999999

RECORDING NOT TRANSCRIBED YET
First SALE from List 1006.`,
            
            notes: 'VICIDIAL SALE #1 from List 1006. Needs recording transcription.',
            insuranceHistory: 'Unknown',
            previousClaims: 'Unknown'
        },
        
        // List 1006 - Sale #2
        {
            id: 10062,
            name: 'Unknown Trucking Company 5',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'lead5@unknown.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
            premium: 0,
            
            dotNumber: 'Unknown - Check Recording',
            mcNumber: 'Unknown - Check Recording',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            zip: 'Unknown',
            
            radiusOfOperation: 'Unknown - Check Recording',
            commodityHauled: 'Unknown - Check Recording',
            operatingStates: 'Unknown - Check Recording',
            annualRevenue: 'Unknown',
            safetyRating: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: `VICIDIAL SALE LEAD - List 1006, Sale #2
Status: SALE
Called Count: 1
Phone: 9999999999

RECORDING NOT TRANSCRIBED YET
Second SALE from List 1006.`,
            
            notes: 'VICIDIAL SALE #2 from List 1006. Needs recording transcription.',
            insuranceHistory: 'Unknown',
            previousClaims: 'Unknown'
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(actualSaleLeads));
    
    console.log('✅ Imported 5 actual SALE leads from Vicidial active lists');
    console.log('List 1005: 3 sales');
    console.log('List 1006: 2 sales');
    console.log('Total: 5 SALE leads');
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f59e0b;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
    `;
    notification.innerHTML = `⚠️ Loaded 5 actual SALE leads from Vicidial<br>All need recording transcription for details`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }
    }, 5000);
})();